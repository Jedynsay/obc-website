import React, { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, TrendingUp, Zap, Target, Layers, Newspaper, ChevronRight, Play, Star, Crown, Flame, ArrowRight, ExternalLink, Menu, X, Settings, LogOut, Shield, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { LoginForm } from '../Auth/LoginForm';

interface Tournament {
  id: string;
  name: string;
  tournament_date: string;
  location: string;
  current_participants: number;
  max_participants: number;
  status: string;
}

interface DashboardStats {
  totalTournaments: number;
  activePlayers: number;
  upcomingEvents: number;
  completedMatches: number;
}

interface TopPlayer {
  name: string;
  wins: number;
  tournaments: number;
  winRate: number;
}

interface RecentMatch {
  id: string;
  player1_name: string;
  player2_name: string;
  player1_beyblade: string;
  player2_beyblade: string;
  winner_name: string;
  outcome: string;
  submitted_at: string;
  tournament_id: string;
}

interface DashboardProps {
  onViewChange?: (view: string) => void;
}

export function Dashboard({ onViewChange }: DashboardProps) {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalTournaments: 0,
    activePlayers: 0,
    upcomingEvents: 0,
    completedMatches: 0
  });
  const [upcomingTournaments, setUpcomingTournaments] = useState<Tournament[]>([]);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [deckPresets, setDeckPresets] = useState<any[]>([]);
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  useEffect(() => {
    fetchDashboardData();
    if (user && !user.id.startsWith('guest-')) {
      fetchDeckPresets();
    }
  }, [user]);

  // Auto-rotate community highlights every 5 seconds
  useEffect(() => {
    if (topPlayers.length > 1) {
      const interval = setInterval(() => {
        setCurrentPlayerIndex((prev) => (prev + 1) % topPlayers.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [topPlayers.length]);

  const fetchDashboardData = async () => {
    try {
      const [tournamentsRes, usersRes, matchesRes] = await Promise.all([
        supabase.from('tournaments').select('*'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('match_results').select('*')
      ]);

      const tournaments = tournamentsRes.data || [];
      const upcoming = tournaments.filter(t => t.status === 'upcoming').slice(0, 3);
      
      setTournaments(tournaments);
      setUpcomingTournaments(upcoming);
      setStats({
        totalTournaments: tournaments.length,
        activePlayers: usersRes.count || 0,
        upcomingEvents: tournaments.filter(t => t.status === 'upcoming').length,
        completedMatches: matchesRes.data?.length || 0
      });

      // Fetch top players from match results
      await fetchTopPlayers();
      await fetchRecentMatches();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopPlayers = async () => {
    try {
      const { data: matches } = await supabase
        .from('match_results')
        .select('player1_name, player2_name, winner_name');

      if (!matches) return;

      const playerStats: { [key: string]: { wins: number; matches: number } } = {};
      
      matches.forEach(match => {
        [match.player1_name, match.player2_name].forEach(player => {
          if (!player) return;
          if (!playerStats[player]) {
            playerStats[player] = { wins: 0, matches: 0 };
          }
          playerStats[player].matches++;
          if (match.winner_name === player) {
            playerStats[player].wins++;
          }
        });
      });

      const topPlayersData = Object.entries(playerStats)
        .map(([name, stats]) => ({
          name,
          wins: stats.wins,
          tournaments: Math.ceil(stats.matches / 10), // Estimate tournaments
          winRate: Math.round((stats.wins / stats.matches) * 100)
        }))
        .sort((a, b) => b.winRate - a.winRate)
        .slice(0, 5);

      setTopPlayers(topPlayersData);
    } catch (error) {
      console.error('Error fetching top players:', error);
    }
  };

  const fetchRecentMatches = async () => {
    try {
      const { data: matches } = await supabase
        .from('match_results')
        .select('id, player1_name, player2_name, player1_beyblade, player2_beyblade, winner_name, outcome, submitted_at, tournament_id')
        .order('submitted_at', { ascending: false })
        .limit(10);

      setRecentMatches(matches || []);
    } catch (error) {
      console.error('Error fetching recent matches:', error);
    }
  };

  const fetchDeckPresets = async () => {
    if (!user || user.id.startsWith('guest-')) return;

    try {
      const { data } = await supabase
        .from('deck_presets')
        .select('*')
        .eq('user_id', user.id);

      setDeckPresets(data || []);
    } catch (error) {
      console.error('Error fetching deck presets:', error);
    }
  };

  const getTournamentName = (tournamentId: string): string => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    return tournament?.name || 'Unknown Tournament';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Loading battle arena...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">OBC Portal</h1>
                <p className="text-slate-400 text-sm">Beyblade Community Dashboard</p>
              </div>
            </div>

            {/* User Profile */}
            {user && !user.id.startsWith('guest-') ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 bg-slate-700 hover:bg-slate-600 rounded-xl px-4 py-2 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-white text-left">
                    <p className="font-semibold text-sm">{user.username}</p>
                    <p className="text-xs text-slate-300 capitalize">{user.role}</p>
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-600 rounded-xl shadow-xl z-50">
                    <div className="py-1">
                      <div className="px-4 py-3 border-b border-slate-600">
                        <p className="font-semibold text-white">{user.username}</p>
                        <p className="text-sm text-slate-300 capitalize">{user.role}</p>
                      </div>
                      <button className="w-full text-left px-4 py-3 hover:bg-slate-700 flex items-center space-x-2 text-slate-300 hover:text-white transition-colors">
                        <Settings size={16} />
                        <span>Settings</span>
                      </button>
                      <button
                        onClick={async () => {
                          setShowUserMenu(false);
                          await logout();
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-red-900/20 flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-semibold transition-colors"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-blue-400 mb-2">
            <Flame size={20} />
            <span className="text-sm font-semibold uppercase tracking-wider">Battle Ready</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user ? user.username : 'Blader'}!
          </h2>
          <p className="text-slate-400">
            Gear up and join the next battle. The arena awaits your ultimate Beyblade combination.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Tournaments</p>
                <p className="text-3xl font-bold text-white">{stats.totalTournaments}</p>
              </div>
              <div className="p-3 bg-blue-600 rounded-xl">
                <Trophy size={24} className="text-white" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Active Players</p>
                <p className="text-3xl font-bold text-white">{stats.activePlayers}</p>
              </div>
              <div className="p-3 bg-green-600 rounded-xl">
                <Users size={24} className="text-white" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Completed Matches</p>
                <p className="text-3xl font-bold text-white">{stats.completedMatches}</p>
              </div>
              <div className="p-3 bg-purple-600 rounded-xl">
                <Target size={24} className="text-white" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Upcoming Events</p>
                <p className="text-3xl font-bold text-white">{stats.upcomingEvents}</p>
              </div>
              <div className="p-3 bg-orange-600 rounded-xl">
                <Calendar size={24} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Quick Actions */}
          <div className="space-y-6">
            {/* Next Tournament */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Next Tournament</h3>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-xs font-semibold">LIVE</span>
                </div>
              </div>
              
              {upcomingTournaments.length > 0 ? (
                <div className="space-y-3">
                  <div>
                    <h4 className="text-white font-semibold">{upcomingTournaments[0].name}</h4>
                    <p className="text-slate-400 text-sm">{upcomingTournaments[0].location}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">
                      {new Date(upcomingTournaments[0].tournament_date).toLocaleDateString()}
                    </span>
                    <span className="text-slate-400">
                      {upcomingTournaments[0].current_participants}/{upcomingTournaments[0].max_participants} spots
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(upcomingTournaments[0].current_participants / upcomingTournaments[0].max_participants) * 100}%` }}
                    ></div>
                  </div>
                  <button 
                    onClick={() => onViewChange?.('tournaments')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    <Trophy size={16} />
                    <span>Register Now</span>
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy size={32} className="mx-auto text-slate-600 mb-2" />
                  <p className="text-slate-400">No upcoming tournaments</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => onViewChange?.('analytics')}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-xl transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-600 rounded-lg">
                      <TrendingUp size={20} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Meta Analysis</p>
                      <p className="text-slate-400 text-sm">View tier rankings</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                </button>

                <button 
                  onClick={() => onViewChange?.('inventory')}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-xl transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-600 rounded-lg">
                      <Layers size={20} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Deck Builder</p>
                      <p className="text-slate-400 text-sm">{deckPresets.length} saved presets</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>
          </div>

          {/* Center Column - Community Champion */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">Community Champion</h3>
              <p className="text-slate-400 text-sm">Top performing blader</p>
            </div>

            {topPlayers.length > 0 ? (
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-3xl font-bold text-black mx-auto">
                    {topPlayers[currentPlayerIndex]?.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2">
                    <Crown size={16} className="text-black" />
                  </div>
                </div>
                
                <h4 className="text-xl font-bold text-white mb-2">
                  {topPlayers[currentPlayerIndex]?.name}
                </h4>
                <div className="flex items-center justify-center space-x-2 mb-6">
                  <Star className="text-yellow-400" size={16} />
                  <span className="text-yellow-400 font-semibold text-sm">Champion</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-700 rounded-xl p-4">
                    <div className="text-2xl font-bold text-blue-400">
                      {topPlayers[currentPlayerIndex]?.wins}
                    </div>
                    <div className="text-slate-400 text-xs">Wins</div>
                  </div>
                  <div className="bg-slate-700 rounded-xl p-4">
                    <div className="text-2xl font-bold text-purple-400">
                      {topPlayers[currentPlayerIndex]?.tournaments}
                    </div>
                    <div className="text-slate-400 text-xs">Events</div>
                  </div>
                  <div className="bg-slate-700 rounded-xl p-4">
                    <div className="text-2xl font-bold text-green-400">
                      {topPlayers[currentPlayerIndex]?.winRate}%
                    </div>
                    <div className="text-slate-400 text-xs">Win Rate</div>
                  </div>
                </div>

                {/* Player Navigation Dots */}
                <div className="flex justify-center space-x-2 mt-6">
                  {topPlayers.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPlayerIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentPlayerIndex 
                          ? 'bg-blue-500 scale-125' 
                          : 'bg-slate-600 hover:bg-slate-500'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Crown size={48} className="mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">No champions yet</p>
                <p className="text-slate-500 text-sm">Complete some matches to see top players</p>
              </div>
            )}
          </div>

          {/* Right Column - Live Activity */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Play size={20} className="text-green-400" />
                <span>Live Results</span>
              </h3>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-xs font-semibold">LIVE</span>
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recentMatches.length > 0 ? (
                recentMatches.slice(0, 8).map((match, index) => {
                  const loser = match.winner_name === match.player1_name ? match.player2_name : match.player1_name;
                  const winnerBey = match.winner_name === match.player1_name ? match.player1_beyblade : match.player2_beyblade;
                  const loserBey = match.winner_name === match.player1_name ? match.player2_beyblade : match.player1_beyblade;
                  const finishType = match.outcome?.split(' (')[0] || 'Victory';
                  const tournamentName = getTournamentName(match.tournament_id);
                  
                  return (
                    <div key={match.id} className="bg-slate-700 border border-slate-600 rounded-xl p-4 hover:bg-slate-600 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-white font-semibold text-sm">{match.winner_name}</span>
                          <span className="text-slate-400 text-sm">defeated</span>
                          <span className="text-slate-300 text-sm">{loser}</span>
                        </div>
                        <span className="text-slate-500 text-xs">
                          {new Date(match.submitted_at).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Winner's Bey:</span>
                          <span className="text-green-400 font-medium">{winnerBey}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Opponent's Bey:</span>
                          <span className="text-slate-300">{loserBey}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Tournament:</span>
                          <span className="text-blue-400 font-medium">{tournamentName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Finish:</span>
                          <span className="text-orange-400 font-medium">{finishType}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <Activity size={32} className="mx-auto text-slate-600 mb-2" />
                  <p className="text-slate-400">No recent matches</p>
                  <p className="text-slate-500 text-sm">Complete some matches to see live results</p>
                </div>
              )}
            </div>

            {recentMatches.length > 8 && (
              <div className="mt-4 pt-4 border-t border-slate-600">
                <button 
                  onClick={() => onViewChange?.('analytics')}
                  className="w-full text-blue-400 hover:text-blue-300 text-sm font-semibold flex items-center justify-center space-x-1 transition-colors"
                >
                  <span>View All Results</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <button 
            onClick={() => onViewChange?.('tournaments')}
            className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Trophy size={32} className="text-white" />
              </div>
              <ArrowRight size={24} className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Join Tournaments</h3>
            <p className="text-blue-100">Register for upcoming battles and compete with the best bladers</p>
          </button>

          <button 
            onClick={() => onViewChange?.('inventory')}
            className="group bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Layers size={32} className="text-white" />
              </div>
              <ArrowRight size={24} className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Build Your Deck</h3>
            <p className="text-purple-100">Create powerful combinations and save your favorite setups</p>
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="text-slate-400 text-sm">
              <p className="font-semibold text-white mb-1">Created by Jedynsay</p>
              <p>Powered by Supabase</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-semibold text-sm">99.9% Uptime</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-blue-400 font-semibold text-sm">&lt;50ms Response</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button className="text-slate-400 hover:text-white transition-colors">
                <ExternalLink size={20} />
              </button>
              <button className="text-slate-400 hover:text-white transition-colors">
                <Users size={20} />
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setShowLoginModal(false)}
          />
          
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none z-50">
            <div className="relative pointer-events-auto bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh]">
              <LoginForm onLoginSuccess={() => setShowLoginModal(false)} />
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}