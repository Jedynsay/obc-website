import React from 'react';
import { BarChart3, TrendingUp, Trophy, Users, Calendar, Target } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { MetaAnalysis } from './MetaAnalysis';
import { PlayerAnalytics } from './PlayerAnalytics';

export function Analytics() {
  const [currentView, setCurrentView] = React.useState<'overview' | 'meta' | 'player'>('overview');
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
      <div className="page-header">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="page-title">Tournament Analytics</h1>
            <p className="page-subtitle">Comprehensive tournament and player statistics</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentView('overview')}
              className={`px-6 py-3 rounded-xl font-rajdhani font-bold transition-all duration-300 ${
                currentView === 'overview' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-glow scale-105' 
                  : 'bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-700/60 border border-slate-600/30'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setCurrentView('meta')}
              className={`px-6 py-3 rounded-xl font-rajdhani font-bold transition-all duration-300 ${
                currentView === 'meta' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-glow scale-105' 
                  : 'bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-700/60 border border-slate-600/30'
              }`}
            >
              Meta Analysis
            </button>
            <button
              onClick={() => setCurrentView('player')}
              className={`px-6 py-3 rounded-xl font-rajdhani font-bold transition-all duration-300 ${
                currentView === 'player' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-glow scale-105' 
                  : 'bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-700/60 border border-slate-600/30'
              }`}
            >
              Player Analytics
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="flex items-center">
              <div className={`p-4 rounded-xl ${stat.bgColor} ${stat.color} shadow-glow`}>
                <stat.icon size={24} />
              </div>
              <div className="ml-6">
                <p className="text-sm font-rajdhani font-semibold text-slate-300">{stat.label}</p>
                <p className="text-3xl font-orbitron font-bold text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="section-card">
          <h2 className="section-title">
            <BarChart3 className="mr-2" size={24} />
            Tournament Status
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-rajdhani font-semibold text-lg">Completed</span>
              <div className="flex items-center space-x-2">
                <div className="w-40 bg-slate-700/50 rounded-full h-3">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full shadow-glow" style={{ width: `${analytics.totalTournaments > 0 ? (analytics.completedTournaments.length / analytics.totalTournaments) * 100 : 0}%` }}></div>
                </div>
                <span className="text-lg font-orbitron font-bold text-white">{analytics.completedTournaments.length}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-rajdhani font-semibold text-lg">Active</span>
              <div className="flex items-center space-x-2">
                <div className="w-40 bg-slate-700/50 rounded-full h-3">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full shadow-glow" style={{ width: `${analytics.totalTournaments > 0 ? (analytics.activeTournaments / analytics.totalTournaments) * 100 : 0}%` }}></div>
                </div>
                <span className="text-lg font-orbitron font-bold text-white">{analytics.activeTournaments}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-rajdhani font-semibold text-lg">Upcoming</span>
              <div className="flex items-center space-x-2">
                <div className="w-40 bg-slate-700/50 rounded-full h-3">
                  <div className="bg-gradient-to-r from-orange-500 to-yellow-500 h-3 rounded-full shadow-glow" style={{ width: `${analytics.totalTournaments > 0 ? (analytics.upcomingTournaments / analytics.totalTournaments) * 100 : 0}%` }}></div>
                </div>
                <span className="text-lg font-orbitron font-bold text-white">{analytics.upcomingTournaments}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="section-card">
          <h2 className="section-title">
            <TrendingUp className="mr-2" size={24} />
            Top Player Win Rates
          </h2>
          <div className="space-y-4">
            {winRates.map((player, index) => (
              <div key={player.player} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-orbitron font-bold shadow-glow">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-orbitron font-bold text-white text-lg">{player.player}</p>
                    <p className="text-slate-300 font-rajdhani font-medium">{player.wins}/{player.matches} matches</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-orbitron font-bold text-xl text-white">{player.winRate}%</p>
                  <div className="w-20 bg-slate-700/50 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full shadow-glow" 
                      style={{ width: `${player.winRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section-card mt-12">
        <h2 className="section-title">Match Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl font-orbitron font-bold text-blue-400 mb-3">
              {analytics.completedMatches}
            </div>
            <p className="text-slate-300 font-rajdhani font-semibold text-lg">Completed Matches</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-orbitron font-bold text-orange-400 mb-3">
              0
            </div>
            <p className="text-slate-300 font-rajdhani font-semibold text-lg">Ongoing Matches</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-orbitron font-bold text-green-400 mb-3">
              0
            </div>
            <p className="text-slate-300 font-rajdhani font-semibold text-lg">Scheduled Matches</p>
          </div>
        </div>
      </div>
    </div>
  );
}