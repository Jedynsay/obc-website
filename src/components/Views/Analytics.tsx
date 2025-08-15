import React from 'react';
import { Trophy, Users, Calendar, Target } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { MetaAnalysis } from './MetaAnalysis';
import { PlayerAnalytics } from './PlayerAnalytics';

export function Analytics() {
  const [currentView, setCurrentView] = React.useState<'overview' | 'meta' | 'player'>('overview');
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  
  // Listen for navigation events from child components
  React.useEffect(() => {
    const handleNavigateToMeta = () => {
      setIsTransitioning(true);
      setCurrentView('meta');
      setTimeout(() => setIsTransitioning(false), 50);
    };
    const handleNavigateToPlayer = () => {
      setIsTransitioning(true);
      setCurrentView('player');
      setTimeout(() => setIsTransitioning(false), 50);
    };
    
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
        const [tournamentsRes, usersRes, matchesRes] = await Promise.all([
          supabase.from('tournaments').select('*'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('match_results').select('*'),
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
      <div className="p-4 max-w-full overflow-x-hidden">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'meta') {
    return <MetaAnalysis onBack={() => {
      setIsTransitioning(true);
      setCurrentView('overview');
      setTimeout(() => setIsTransitioning(false), 50);
    }} />;
  }

  if (currentView === 'player') {
    return <PlayerAnalytics onBack={() => {
      setIsTransitioning(true);
      setCurrentView('overview');
      setTimeout(() => setIsTransitioning(false), 50);
    }} />;
  }

  if (isTransitioning) {
    return (
      <div className="p-4 max-w-full overflow-x-hidden text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="page-container p-4 max-w-full overflow-x-hidden">
      <div className="content-wrapper max-w-full overflow-x-hidden">
        <div className="page-header mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="mb-4 sm:mb-0">
              <h1 className="page-title text-xl font-bold">Tournament Analytics</h1>
              <p className="page-subtitle text-gray-600">Comprehensive tournament and player statistics</p>
            </div>
            <div className="filter-tabs flex space-x-2">
              <button
                onClick={() => setCurrentView('overview')}
                className={`filter-tab ${currentView === 'overview' ? 'filter-tab-active' : 'filter-tab-inactive'}`}
              >
                Overview
              </button>
              <button
                onClick={() => setCurrentView('meta')}
                className={`filter-tab ${currentView === 'meta' ? 'filter-tab-active' : 'filter-tab-inactive'}`}
              >
                Meta Analysis
              </button>
              <button
                onClick={() => setCurrentView('player')}
                className={`filter-tab ${currentView === 'player' ? 'filter-tab-active' : 'filter-tab-inactive'}`}
              >
                Player Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="metric-card w-full flex justify-between items-center p-4 bg-white rounded-lg shadow">
              <div>
                <p className="metric-label text-sm font-medium">{stat.label}</p>
                <p className="metric-value text-xl font-bold">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
          ))}
        </div>

        {/* Tournament Status & Top Players */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tournament Status */}
          <div className="chart-container">
            <h2 className="chart-title text-lg font-bold mb-2">Tournament Status</h2>
            <div className="space-y-3">
              {[
                { label: 'Completed', value: analytics.completedTournaments.length, color: 'bg-green-500' },
                { label: 'Active', value: analytics.activeTournaments, color: 'bg-blue-500' },
                { label: 'Upcoming', value: analytics.upcomingTournaments, color: 'bg-orange-500' },
              ].map((status) => {
                const percent = analytics.totalTournaments
                  ? (status.value / analytics.totalTournaments) * 100
                  : 0;
                return (
                  <div key={status.label} className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <span className="text-gray-700 font-medium mb-1 sm:mb-0">{status.label}</span>
                    <div className="flex-1 sm:ml-4 flex items-center">
                      <div className="flex-1 bg-gray-200 h-3 rounded-full">
                        <div
                          className={`${status.color} h-3 rounded-full`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm font-bold text-gray-900">{status.value}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Player Win Rates */}
          <div className="chart-container">
            <h2 className="chart-title text-lg font-bold mb-2">Top Player Win Rates</h2>
            <div className="space-y-4">
              {winRates.map((player, index) => (
                <div
                  key={player.player}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                    <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-gray-900 truncate">{player.player}</p>
                      <p className="text-gray-600">{player.wins}/{player.matches} matches</p>
                    </div>
                  </div>
                  <div className="flex-1 sm:ml-4 flex items-center">
                    <div className="flex-1 bg-gray-200 h-3 rounded-full mr-2">
                      <div
                        className="bg-green-500 h-3 rounded-full"
                        style={{ width: `${player.winRate}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{player.winRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Match Stats */}
        <div className="chart-container mt-6">
          <h2 className="chart-title text-lg font-bold mb-3">Match Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <div className="metric-value text-blue-600 text-xl font-bold">{analytics.completedMatches}</div>
              <p className="metric-label">Completed Matches</p>
            </div>
            <div>
              <div className="metric-value text-orange-600 text-xl font-bold">0</div>
              <p className="metric-label">Ongoing Matches</p>
            </div>
            <div>
              <div className="metric-value text-green-600 text-xl font-bold">0</div>
              <p className="metric-label">Scheduled Matches</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
