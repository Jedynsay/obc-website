import React, { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, TrendingUp, Zap, Target, Layers, Newspaper, ChevronRight, Play, Star, Crown, Flame, ArrowRight, ExternalLink, Menu, X, Settings, LogOut } from 'lucide-react';
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
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [availableTournaments, setAvailableTournaments] = useState<Tournament[]>([]);
  const [selectedLiveTournament, setSelectedLiveTournament] = useState<string>('');

  useEffect(() => {
    fetchDashboardData();
    if (user && !user.id.startsWith('guest-')) {
      fetchDeckPresets();
    }
  }, [user]);

  useEffect(() => {
    if (selectedLiveTournament) {
      fetchRecentMatches(selectedLiveTournament);
    }
  }, [selectedLiveTournament]);
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
        supabase.from('match_results').select('*', { count: 'exact', head: true })
      ]);

      const tournaments = tournamentsRes.data || [];
      const upcoming = tournaments.filter(t => t.status === 'upcoming').slice(0, 3);
      
      setUpcomingTournaments(upcoming);
      setAvailableTournaments(tournaments);
      
      // Auto-select first active or completed tournament for live results
      const activeTournament = tournaments.find(t => t.status === 'active');
      const completedTournament = tournaments.find(t => t.status === 'completed');
      const defaultTournament = activeTournament || completedTournament;
      if (defaultTournament && !selectedLiveTournament) {
        setSelectedLiveTournament(defaultTournament.id);
      }
      
      setStats({
        totalTournaments: tournaments.length,
        activePlayers: usersRes.count || 0,
        upcomingEvents: tournaments.filter(t => t.status === 'upcoming').length,
        completedMatches: matchesRes.count || 0
      });

      // Fetch top players from match results
      await fetchTopPlayers();
      if (defaultTournament && !selectedLiveTournament) {
        await fetchRecentMatches(defaultTournament.id);
      }
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

  const fetchRecentMatches = async (tournamentId?: string) => {
    try {
      let query = supabase
        .from('match_results')
        .select('player1_name, player2_name, winner_name, outcome, submitted_at');
      
      if (tournamentId) {
        query = query.eq('tournament_id', tournamentId);
      }
      
      const { data: matches } = await query
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-blue-200 text-lg">Loading battle arena...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] animate-pulse"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          {/* User Profile in top right */}
          {user && !user.id.startsWith('guest-') && (
            <div className="absolute top-4 right-4">
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 bg-slate-800/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg hover:bg-slate-700/90 transition-all duration-200 cursor-pointer"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-white">
                    <p className="font-semibold text-sm">{user.username}</p>
                    <p className="text-xs text-blue-200 capitalize">{user.role}</p>
                  </div>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                    <div className="py-1">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="font-semibold text-gray-900">{user.username}</p>
                        <p className="text-sm text-gray-600 capitalize">{user.role}</p>
                      </div>
                      <button 
                        onClick={() => {
                          setShowUserMenu(false);
                          // Add settings navigation here if needed
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
                      >
                        <Settings size={16} />
                        <span>Settings</span>
                      </button>
                      <button
                        onClick={async () => {
                          setShowUserMenu(false);
                          await logout();
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Click outside to close user menu */}
          {showUserMenu && (
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowUserMenu(false)}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-yellow-400">
                  <Flame size={24} />
                  <span className="text-sm font-semibold uppercase tracking-wider">Battle Ready</span>
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                  Welcome back,{' '}
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {user ? user.username : 'Blader'}
                  </span>!
                </h1>
                <p className="text-xl text-blue-200 leading-relaxed">
                  Gear up and join the next battle. The arena awaits your ultimate Beyblade combination.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => onViewChange?.('tournaments')}
                  className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Trophy size={24} />
                  <span>Check Tournaments</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                 onClick={() => onViewChange?.('inventory')}
                  className="group bg-slate-800/50 hover:bg-slate-700/50 text-white border border-slate-600 hover:border-slate-500 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Layers size={24} />
                  <span>Deck Builder</span>
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {user && !user.id.startsWith('guest-') ? (
              <>
                {/* Beyblade Illustration */}
                <div className="relative">
                  <div className="relative w-80 h-80 mx-auto">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-spin-slow opacity-20"></div>
                    <div className="absolute inset-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                    <div className="absolute inset-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                      <Zap size={120} className="text-white animate-pulse" />
                    </div>
                    {/* Spark effects */}
                    <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full animate-ping"></div>
                    <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-blue-400 rounded-full animate-ping delay-1000"></div>
                    <div className="absolute top-1/2 -left-8 w-4 h-4 bg-purple-400 rounded-full animate-ping delay-500"></div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Login Button for logged out users */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2"
                  >
                    <span>Login</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Quick Access Cards */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Upcoming Tournament */}
          <button 
            onClick={() => onViewChange?.('tournaments')}
            className="group bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 hover:border-blue-500 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 cursor-pointer text-left w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-600 rounded-xl">
                <Trophy size={24} className="text-white" />
              </div>
              <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded-full font-semibold">
                {stats.upcomingEvents} LIVE
              </span>
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Next Tournament</h3>
            {upcomingTournaments.length > 0 ? (
              <div className="space-y-2">
                <p className="text-blue-300 font-semibold">{upcomingTournaments[0].name}</p>
                <p className="text-slate-400 text-sm">{new Date(upcomingTournaments[0].tournament_date).toLocaleDateString()}</p>
                <p className="text-slate-400 text-sm">{upcomingTournaments[0].location}</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs text-slate-500">
                    {upcomingTournaments[0].current_participants}/{upcomingTournaments[0].max_participants} spots
                  </span>
                  <span className="text-blue-400 hover:text-blue-300 text-sm font-semibold flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                    <span>Register</span>
                    <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-slate-400">No upcoming tournaments</p>
            )}
          </button>

          {/* Meta Analysis */}
          <button 
            onClick={() => onViewChange?.('analytics')}
            className="group bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 hover:border-purple-500 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 cursor-pointer text-left w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-600 rounded-xl">
                <TrendingUp size={24} className="text-white" />
              </div>
              <span className="text-xs bg-green-500 text-black px-2 py-1 rounded-full font-semibold">UPDATED</span>
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Meta Analysis</h3>
            <p className="text-purple-300 text-sm mb-2">Latest tier rankings</p>
            <p className="text-slate-400 text-xs mb-4">Updated 2 hours ago</p>
            <span className="text-purple-400 hover:text-purple-300 text-sm font-semibold flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
              <span>View Stats</span>
              <ArrowRight size={14} />
            </span>
          </button>

          {/* Latest News */}
          <button 
            onClick={() => {
              alert('News section is currently under construction. Stay tuned for updates!');
            }}
            className="group bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 hover:border-green-500 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-1 cursor-pointer text-left w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-600 rounded-xl">
                <Newspaper size={24} className="text-white" />
              </div>
              <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded-full font-semibold">SOON</span>
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Under Construction</h3>
            <p className="text-green-300 text-sm mb-2">News & Updates</p>
            <p className="text-slate-400 text-xs mb-4">Coming soon to keep you informed</p>
            <span className="text-green-400 hover:text-green-300 text-sm font-semibold flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
              <span>Coming Soon</span>
              <ArrowRight size={14} />
            </span>
          </button>

          {/* Deck Presets */}
          <button 
            onClick={() => onViewChange?.('inventory')}
            className="group bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 hover:border-orange-500 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1 cursor-pointer text-left w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-600 rounded-xl">
                <Layers size={24} className="text-white" />
              </div>
              <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-semibold">
                {deckPresets.length}
              </span>
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Your Decks</h3>
            <p className="text-orange-300 text-sm mb-2">Saved combinations</p>
            <p className="text-slate-400 text-xs mb-4">{deckPresets.length} presets ready</p>
            <span className="text-orange-400 hover:text-orange-300 text-sm font-semibold flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
              <span>Manage</span>
              <ArrowRight size={14} />
            </span>
          </button>
        </div>
      </section>

      {/* Community Highlights */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Community Champions</h2>
          <p className="text-blue-200 text-lg">Meet the top bladers dominating the arena</p>
        </div>

        {topPlayers.length > 0 && (
          <div className="relative">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-8 text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-4xl font-bold text-black">
                    {topPlayers[currentPlayerIndex]?.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2">
                    <Crown size={16} className="text-black" />
                  </div>
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">
                {topPlayers[currentPlayerIndex]?.name}
              </h3>
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Star className="text-yellow-400" size={20} />
                <span className="text-yellow-400 font-semibold">Top Player</span>
              </div>
              
              <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
                <div>
                  <div className="text-2xl font-bold text-blue-400">
                    {topPlayers[currentPlayerIndex]?.wins}
                  </div>
                  <div className="text-slate-400 text-sm">Wins</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">
                    {topPlayers[currentPlayerIndex]?.tournaments}
                  </div>
                  <div className="text-slate-400 text-sm">Tournaments</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {topPlayers[currentPlayerIndex]?.winRate}%
                  </div>
                  <div className="text-slate-400 text-sm">Win Rate</div>
                </div>
              </div>
            </div>

            {/* Player Navigation Dots */}
            <div className="flex justify-center space-x-2 mt-6">
              {topPlayers.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPlayerIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentPlayerIndex 
                      ? 'bg-blue-500 scale-125' 
                      : 'bg-slate-600 hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

      </section>

      {/* Live Results Section */}
      {recentMatches.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <h3 className="text-white font-bold text-lg flex items-center space-x-2">
                  <Play size={20} className="text-green-400" />
                  <span>Live Results</span>
                </h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedLiveTournament}
                    onChange={(e) => setSelectedLiveTournament(e.target.value)}
                    className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Tournaments</option>
                    {availableTournaments.map(tournament => (
                      <option key={tournament.id} value={tournament.id}>
                        {tournament.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <span className="text-xs bg-green-500 text-black px-2 py-1 rounded-full font-semibold animate-pulse">
                LIVE
              </span>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {recentMatches.slice(0, 5).map((match, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-white font-semibold">{match.winner_name}</span>
                    <span className="text-slate-400">defeated</span>
                    <span className="text-slate-300">
                      {match.winner_name === match.player1_name ? match.player2_name : match.player1_name}
                    </span>
                  </div>
                  <div className="text-slate-500 text-xs">
                    {match.outcome?.split(' (')[0] || 'Victory'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* System Status Footer */}
      {/* System Status Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="text-slate-400 text-sm">
              <p className="font-semibold text-white mb-1">Created by Jedynsay</p>
              <p>Powered by Supabase</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-semibold">99.9% Uptime</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span className="text-blue-400 font-semibold">&lt;50ms Response</span>
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
          {/* Modal Backdrop */}
          <div 
            className="modal-overlay"
            style={{ zIndex: 50 }}
            onClick={() => setShowLoginModal(false)}
          />
          
          {/* Modal Content */}
          <div 
            className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none z-50"
          >
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