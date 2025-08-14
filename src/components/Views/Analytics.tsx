import React from 'react';
import { BarChart3, TrendingUp, Trophy, Users, Calendar, Target } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { MetaAnalysis } from './MetaAnalysis';
import { PlayerAnalytics } from './PlayerAnalytics';

export function Analytics() {
  const [currentView, setCurrentView] = React.useState<'overview' | 'meta' | 'player'>('overview');
  
  // Listen for navigation events from child components
  React.useEffect(() => {
    const handleNavigateToMeta = () => setCurrentView('meta');
    const handleNavigateToPlayer = () => setCurrentView('player');
    
    window.addEventListener('navigateToMetaAnalysis', handleNavigateToMeta);
    window.addEventListener('navigateToPlayerAnalytics', handleNavigateToPlayer);
    
    return () => {
      window.removeEventListener('navigateToMetaAnalysis', handleNavigateToMeta);
      window.removeEventListener('navigateToPlayerAnalytics', handleNavigateToPlayer);
    };
  }, []);
  
  const [analytics, setAnalytics] = React.useState({
    totalTournaments: 0,
    activePlayers: 0,
    completedMatches: 0,
    upcomingEvents: 0,
    completedTournaments: [],
    activeTournaments: 0,
    upcomingTournaments: 0
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [tournamentsRes, usersRes, matchesRes, registrationsRes] = await Promise.all([
          supabase.from('tournaments').select('*'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('match_results').select('*'),
          supabase.from('tournament_registrations').select('*', { count: 'exact', head: true })
        ]);

        const tournaments = tournamentsRes.data || [];
        const matchResults = matchesRes.data || [];
        
        const completedTournaments = tournaments.filter(t => t.status === 'completed');
        const activeTournaments = tournaments.filter(t => t.status === 'active').length;
        const upcomingTournaments = tournaments.filter(t => t.status === 'upcoming').length;
        const completedMatches = matchResults.length;

        setAnalytics({
          totalTournaments: tournaments.length,
          activePlayers: usersRes.count || 0,
          completedMatches,
          upcomingEvents: upcomingTournaments,
          completedTournaments,
          activeTournaments,
          upcomingTournaments
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setAnalytics({
          totalTournaments: 0,
          activePlayers: 0,
          completedMatches: 0,
          upcomingEvents: 0,
          completedTournaments: [],
          activeTournaments: 0,
          upcomingTournaments: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);
  
  const [winRates, setWinRates] = React.useState([]);

  React.useEffect(() => {
    const calculateWinRates = async () => {
      try {
        const { data: matches } = await supabase
          .from('match_results')
          .select('player1_name, player2_name, winner_name');

        if (!matches) return;

        const playerStats = {};
        
        matches.forEach(match => {
          if (!match.player1_name || !match.player2_name || !match.winner_name) return;
          
          [match.player1_name, match.player2_name].forEach(player => {
            if (!playerStats[player]) {
              playerStats[player] = { wins: 0, matches: 0 };
            }
            playerStats[player].matches++;
            if (match.winner_name === player) {
              playerStats[player].wins++;
            }
          });
        });

        const rates = Object.entries(playerStats)
          .map(([player, stats]) => ({
            player,
            wins: stats.wins,
            matches: stats.matches,
            winRate: Math.round((stats.wins / stats.matches) * 100)
          }))
          .sort((a, b) => b.winRate - a.winRate)
          .slice(0, 4);

        setWinRates(rates);
      } catch (error) {
        console.error('Error calculating win rates:', error);
        setWinRates([]);
      }
    };

    calculateWinRates();
  }, []);


  const stats = [
    { icon: Trophy, label: 'Total Tournaments', value: analytics.totalTournaments, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { icon: Users, label: 'Active Players', value: analytics.activePlayers, color: 'text-green-600', bgColor: 'bg-green-100' },
    { icon: Target, label: 'Completed Matches', value: analytics.completedMatches, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { icon: Calendar, label: 'Upcoming Events', value: analytics.upcomingEvents, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  ];

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'meta') {
    return <MetaAnalysis onBack={() => setCurrentView('overview')} />;
  }

  if (currentView === 'player') {
    return <PlayerAnalytics onBack={() => setCurrentView('overview')} />;
  }

  return (
    <div className="page-container">
      <div className="content-wrapper">
        <div className="page-header">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="page-title">Tournament Analytics</h1>
              <p className="page-subtitle">Comprehensive tournament and player statistics</p>
            </div>
            <div className="filter-tabs">
              <button
                onClick={() => setCurrentView('overview')}
                className={`filter-tab ${
                  currentView === 'overview' ? 'filter-tab-active' : 'filter-tab-inactive'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setCurrentView('meta')}
                className={`filter-tab ${
                  currentView === 'meta' ? 'filter-tab-active' : 'filter-tab-inactive'
                }`}
              >
                Meta Analysis
              </button>
              <button
                onClick={() => setCurrentView('player')}
                className={`filter-tab ${
                  currentView === 'player' ? 'filter-tab-active' : 'filter-tab-inactive'
                }`}
              >
                Player Analytics
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="metric-label">{stat.label}</p>
                  <p className="metric-value">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor} ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="chart-container">
            <h2 className="chart-title">Tournament Status</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-inter font-medium">Completed</span>
                <div className="flex items-center space-x-2">
                  <div className="w-40 bg-gray-200 rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full" style={{ width: `${analytics.totalTournaments > 0 ? (analytics.completedTournaments.length / analytics.totalTournaments) * 100 : 0}%` }}></div>
                  </div>
                  <span className="text-lg font-space-grotesk font-bold text-gray-900">{analytics.completedTournaments.length}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-inter font-medium">Active</span>
                <div className="flex items-center space-x-2">
                  <div className="w-40 bg-gray-200 rounded-full h-3">
                    <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${analytics.totalTournaments > 0 ? (analytics.activeTournaments / analytics.totalTournaments) * 100 : 0}%` }}></div>
                  </div>
                  <span className="text-lg font-space-grotesk font-bold text-gray-900">{analytics.activeTournaments}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-inter font-medium">Upcoming</span>
                <div className="flex items-center space-x-2">
                  <div className="w-40 bg-gray-200 rounded-full h-3">
                    <div className="bg-orange-500 h-3 rounded-full" style={{ width: `${analytics.totalTournaments > 0 ? (analytics.upcomingTournaments / analytics.totalTournaments) * 100 : 0}%` }}></div>
                  </div>
                  <span className="text-lg font-space-grotesk font-bold text-gray-900">{analytics.upcomingTournaments}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="chart-container">
            <h2 className="chart-title">Top Player Win Rates</h2>
            <div className="space-y-4">
              {winRates.map((player, index) => (
                <div key={player.player} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-space-grotesk font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-space-grotesk font-bold text-gray-900">{player.player}</p>
                      <p className="text-gray-600 font-inter">{player.wins}/{player.matches} matches</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-space-grotesk font-bold text-xl text-gray-900">{player.winRate}%</p>
                    <div className="w-20 bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full" 
                        style={{ width: `${player.winRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-container mt-8">
          <h2 className="chart-title">Match Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="metric-value text-blue-600">
                {analytics.completedMatches}
              </div>
              <p className="metric-label">Completed Matches</p>
            </div>
            <div className="text-center">
              <div className="metric-value text-orange-600">
                0
              </div>
              <p className="metric-label">Ongoing Matches</p>
            </div>
            <div className="text-center">
              <div className="metric-value text-green-600">
                0
              </div>
              <p className="metric-label">Scheduled Matches</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}