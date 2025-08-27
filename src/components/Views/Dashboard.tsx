import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  Calendar,
  ArrowRight,
  Play,
  Star,
  Target,
  BarChart3,
  Zap,
  LogIn,
  LogOut,
  Settings,
  X,
  Crown,
  Activity
} from 'lucide-react';
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
  const [allTournaments, setAllTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournamentFilter, setSelectedTournamentFilter] = useState<string>('all');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  // Parallax scroll refs (hero section only now)
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll(
    containerRef.current ? {
      target: containerRef,
      offset: ["start start", "end start"],
      layoutEffect: false
    } : undefined
  );

  // Parallax transforms
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const fetchTopPlayers = async () => {
    try {
      // Optimize performance by limiting to recent matches only
      // This prevents slow loading when there are thousands of match results
      const { data: matches } = await supabase
        .from('match_results')
        .select('player1_name, player2_name, winner_name')
        .order('submitted_at', { ascending: false })
        .limit(1000); // Limit to most recent 1000 matches for performance

      if (!matches) return;

      // Calculate player stats
      const playerStats: { [key: string]: { wins: number; total: number; tournaments: Set<string> } } = {};

      matches.forEach(match => {
        const { player1_name, player2_name, winner_name } = match;
        
        // Use normalized names for consistent tracking
        const normalizedPlayer1 = match.normalized_player1_name || match.player1_name.toLowerCase();
        const normalizedPlayer2 = match.normalized_player2_name || match.player2_name.toLowerCase();
        const normalizedWinner = match.normalized_winner_name || match.winner_name.toLowerCase();
        
        // Initialize players if not exists
        if (!playerStats[player1_name]) {
          playerStats[player1_name] = { wins: 0, total: 0, tournaments: new Set() };
        }
        if (!playerStats[player2_name]) {
          playerStats[player2_name] = { wins: 0, total: 0, tournaments: new Set() };
        }

        // Count total matches
        playerStats[player1_name].total++;
        playerStats[player2_name].total++;

        // Count wins
        if (winner_name === player1_name) {
          playerStats[player1_name].wins++;
        } else if (winner_name === player2_name) {
          playerStats[player2_name].wins++;
        }
      });

      // Convert to array and calculate win rates
      const playersArray = Object.entries(playerStats)
        .map(([name, stats]) => ({
          name,
          wins: stats.wins,
          tournaments: stats.tournaments.size,
          winRate: stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0
        }))
        .filter(player => player.wins > 0) // Only show players with at least 1 win
        .sort((a, b) => {
          // Sort by wins first, then by win rate
          if (b.wins !== a.wins) return b.wins - a.wins;
          return b.winRate - a.winRate;
        })
        .slice(0, 5); // Top 5 players

      setTopPlayers(playersArray);
    } catch (error) {
      console.error('Error fetching top players:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      // Fetch tournaments
      const { data: tournaments } = await supabase
        .from('tournaments')
        .select('*');

      // Fetch match results
      const { data: matches } = await supabase
        .from('match_results')
        .select('*');

      // Fetch unique players from matches
      const uniquePlayers = new Set();
      matches?.forEach(match => {
        if (match.player1_name) uniquePlayers.add(match.player1_name);
        if (match.player2_name) uniquePlayers.add(match.player2_name);
      });

      // Calculate upcoming events
      const now = new Date();
      const upcoming = tournaments?.filter(t => 
        new Date(t.tournament_date) > now && t.status !== 'completed'
      ) || [];

      setStats({
        totalTournaments: tournaments?.length || 0,
        activePlayers: uniquePlayers.size,
        upcomingEvents: upcoming.length,
        completedMatches: matches?.length || 0
      });

      setUpcomingTournaments(upcoming.slice(0, 3));
      setAllTournaments(tournaments || []);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
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

  const fetchRecentMatches = async () => {
    try {
      let query = supabase
        .from('match_results')
        .select(`
          *,
          tournaments!inner(name)
        `)
        .order('submitted_at', { ascending: false });

      if (selectedTournamentFilter !== 'all') {
        query = query.eq('tournament_id', selectedTournamentFilter);
      }

      const { data: matches } = await query.limit(20);
      setRecentMatches(matches || []);
    } catch (error) {
      console.error('Error fetching recent matches:', error);
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDashboardStats(),
        fetchTopPlayers(),
        fetchDeckPresets(),
        fetchRecentMatches()
      ]);
      setLoading(false);
    };

    loadDashboardData();
  }, [user]);

  useEffect(() => {
    fetchRecentMatches();
  }, [selectedTournamentFilter]);

  // Auto-rotate top players
  useEffect(() => {
    if (topPlayers.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentPlayerIndex(prev => (prev + 1) % topPlayers.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [topPlayers.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500/20 border-b-purple-500 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-slate-300 text-lg font-medium">Loading OBC Portal...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-hidden">
      {/* User Menu - Top Right */}
      <div className="fixed top-6 right-6 z-50">
        {user && !user.id.startsWith('guest-') ? (
          <div className="relative">
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 bg-slate-800/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg hover:bg-slate-700/90 transition-all duration-200"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="font-semibold text-sm text-white">{user.username}</p>
                <p className="text-xs text-slate-300 capitalize">{user.role.replace('_', ' ')}</p>
              </div>
            </motion.button>
            
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute top-full right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-2"
                >
                  <div className="px-4 py-3 border-b border-slate-700">
                    <p className="font-semibold text-white">{user.username}</p>
                    <p className="text-sm text-slate-400 capitalize">{user.role.replace('_', ' ')}</p>
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setShowLoginModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg"
          >
            <LogIn size={20} />
            <span>Login</span>
          </motion.button>
        )}
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}

      {/* Hero Section with Community Image */}
      <motion.section 
        ref={containerRef}
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src="/community.jpg" 
            alt="Ormoc Beyblade Community"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900/80"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                Ormoc Beyblade Club
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-200 mb-8 leading-relaxed">
              Welcome to the home of competitive Beyblade in Ormoc. Let it rip!
            </p>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button 
                onClick={() => onViewChange?.('tournaments')}
                className="group bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 flex items-center justify-center space-x-3"
              >
                <Trophy size={24} />
                <span>Join Tournament</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={() => onViewChange?.('analytics')}
                className="group bg-slate-800/80 hover:bg-slate-700/80 backdrop-blur-sm text-white border border-slate-600 hover:border-slate-500 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-3"
              >
                <BarChart3 size={24} />
                <span>View Analytics</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-bounce"></div>
          </div>
        </motion.div>
      </motion.section>
      {/* Main Content with Parallax */}
      <motion.div 
        style={{ y: contentY }}
        className="relative z-20 bg-slate-900"
      >
        {/* Community Stats Section */}
        <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-white mb-4">Community at a Glance</h2>
              <p className="text-slate-300 text-lg max-w-2xl mx-auto">
                Track the pulse of our competitive scene with real-time statistics and performance metrics
              </p>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  label: 'Total Tournaments', 
                  value: stats.totalTournaments, 
                  icon: Trophy, 
                  color: 'from-yellow-500 to-orange-500',
                  bgColor: 'bg-yellow-500/10'
                },
                { 
                  label: 'Active Bladers', 
                  value: stats.activePlayers, 
                  icon: Users, 
                  color: 'from-green-500 to-emerald-500',
                  bgColor: 'bg-green-500/10'
                },
                { 
                  label: 'Upcoming Events', 
                  value: stats.upcomingEvents, 
                  icon: Calendar, 
                  color: 'from-blue-500 to-cyan-500',
                  bgColor: 'bg-blue-500/10'
                },
                { 
                  label: 'Total Matches', 
                  value: stats.completedMatches, 
                  icon: Target, 
                  color: 'from-purple-500 to-pink-500',
                  bgColor: 'bg-purple-500/10'
                }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  viewport={{ once: true }}
                  className={`${stat.bgColor} backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:shadow-xl transition-all duration-300`}
                >
                  <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    <stat.icon className="text-white" size={24} />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-slate-300 text-sm font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Access Hub */}
        <section className="py-20 bg-slate-800">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-white mb-4">Quick Access Hub</h2>
              <p className="text-slate-300 text-lg">Jump into action with our most popular features</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Tournament Hub */}
              <motion.button 
                onClick={() => onViewChange?.('tournaments')}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                whileHover={{ scale: 1.02, y: -8 }}
                whileTap={{ scale: 0.98 }}
                viewport={{ once: true }}
                className="group bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-left w-full hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Trophy className="text-white" size={32} />
                  </div>
                  {stats.upcomingEvents > 0 && (
                    <span className="bg-green-400 text-slate-900 px-3 py-1 rounded-full text-xs font-bold">
                      {stats.upcomingEvents} LIVE
                    </span>
                  )}
                </div>
                
                <h3 className="text-white font-bold text-2xl mb-3">Tournament Hub</h3>
                <p className="text-blue-100 mb-6">Register for upcoming battles and view tournament brackets</p>
                
                {upcomingTournaments.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-white font-semibold">{upcomingTournaments[0].name}</div>
                    <div className="text-blue-200 text-sm">
                      {new Date(upcomingTournaments[0].tournament_date).toLocaleDateString()} • {upcomingTournaments[0].location}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-200 text-sm">
                        {upcomingTournaments[0].current_participants}/{upcomingTournaments[0].max_participants} registered
                      </span>
                      <div className="flex items-center text-white font-medium group-hover:translate-x-2 transition-transform">
                        <span>Register Now</span>
                        <ArrowRight size={16} className="ml-2" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-blue-200">No upcoming tournaments</div>
                )}
              </motion.button>

              {/* Analytics Dashboard */}
              <motion.button 
                onClick={() => onViewChange?.('analytics')}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                whileHover={{ scale: 1.02, y: -8 }}
                whileTap={{ scale: 0.98 }}
                viewport={{ once: true }}
                className="group bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-8 text-left w-full hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="text-white" size={32} />
                  </div>
                  <span className="bg-purple-300 text-purple-900 px-3 py-1 rounded-full text-xs font-bold">
                    LIVE DATA
                  </span>
                </div>
                
                <h3 className="text-white font-bold text-2xl mb-3">Performance Analytics</h3>
                <p className="text-purple-100 mb-6">Deep dive into meta trends and player performance metrics</p>
                
                <div className="space-y-3">
                  <div className="text-white font-semibold">Meta Analysis Available</div>
                  <div className="text-purple-200 text-sm">
                    {stats.completedMatches} matches analyzed • Real-time updates
                  </div>
                  <div className="flex items-center text-white font-medium group-hover:translate-x-2 transition-transform">
                    <span>View Analytics</span>
                    <ArrowRight size={16} className="ml-2" />
                  </div>
                </div>
              </motion.button>

              {/* Deck Builder */}
              <motion.button 
                onClick={() => onViewChange?.('inventory')}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                whileHover={{ scale: 1.02, y: -8 }}
                whileTap={{ scale: 0.98 }}
                viewport={{ once: true }}
                className="group bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl p-8 text-left w-full hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Zap className="text-white" size={32} />
                  </div>
                  <span className="bg-orange-300 text-orange-900 px-3 py-1 rounded-full text-xs font-bold">
                    {deckPresets.length} SAVED
                  </span>
                </div>
                
                <h3 className="text-white font-bold text-2xl mb-3">Deck Builder</h3>
                <p className="text-orange-100 mb-6">Create and optimize your Beyblade combinations</p>
                
                <div className="space-y-3">
                  <div className="text-white font-semibold">
                    {user && !user.id.startsWith('guest-') 
                      ? `${deckPresets.length} deck presets saved`
                      : 'Build custom combinations'
                    }
                  </div>
                  <div className="text-orange-200 text-sm">
                    Track inventory • Save presets • Optimize builds
                  </div>
                  <div className="flex items-center text-white font-medium group-hover:translate-x-2 transition-transform">
                    <span>Start Building</span>
                    <ArrowRight size={16} className="ml-2" />
                  </div>
                </div>
              </motion.button>
            </div>
          </div>
        </section>
        {/* Community Champions */}
        <section className="py-20 bg-gradient-to-b from-slate-800 to-slate-900">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-white mb-4">Community Champions</h2>
              <p className="text-slate-300 text-lg">Celebrating our top performers and rising stars</p>
            </motion.div>

            {topPlayers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="relative"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPlayerIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-12 text-center relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-center mb-8">
                        <div className="relative">
                          <div className="w-28 h-28 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-5xl font-bold text-black shadow-2xl">
                            {topPlayers[currentPlayerIndex]?.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="absolute -top-3 -right-3 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                            <Crown size={20} className="text-black" />
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-3xl font-bold text-white mb-3">
                        {topPlayers[currentPlayerIndex]?.name}
                      </h3>
                      <div className="flex items-center justify-center space-x-2 mb-8">
                        <Star className="text-yellow-400" size={20} />
                        <span className="text-yellow-400 font-semibold text-lg">Community Champion</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
                        <div>
                          <div className="text-4xl font-bold text-blue-400 mb-2">
                            {topPlayers[currentPlayerIndex]?.wins}
                          </div>
                          <div className="text-slate-400">Total Wins</div>
                        </div>
                        <div>
                          <div className="text-4xl font-bold text-purple-400 mb-2">
                            {topPlayers[currentPlayerIndex]?.tournaments}
                          </div>
                          <div className="text-slate-400">Tournaments</div>
                        </div>
                        <div>
                          <div className="text-4xl font-bold text-green-400 mb-2">
                            {topPlayers[currentPlayerIndex]?.winRate}%
                          </div>
                          <div className="text-slate-400">Win Rate</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {topPlayers.length > 1 && (
                  <div className="flex justify-center space-x-3 mt-8">
                    {topPlayers.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPlayerIndex(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          index === currentPlayerIndex 
                            ? 'bg-yellow-400 scale-125' 
                            : 'bg-slate-600 hover:bg-slate-500'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </section>

        {/* Live Activity Feed */}
        <section className="py-20 bg-slate-900">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8"
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
                <div>
                  <h3 className="text-2xl font-bold text-white flex items-center mb-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse mr-3"></div>
                    Live Match Results
                  </h3>
                  <p className="text-slate-400">Real-time updates from ongoing tournaments</p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <select
                    value={selectedTournamentFilter}
                    onChange={(e) => setSelectedTournamentFilter(e.target.value)}
                    className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Tournaments</option>
                    {allTournaments.map(tournament => (
                      <option key={tournament.id} value={tournament.id}>
                        {tournament.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center space-x-2 bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-sm font-medium">LIVE</span>
                  </div>
                </div>
              </div>
              
              <AnimatePresence mode="wait">
                {recentMatches.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-16"
                  >
                    <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Activity size={40} className="text-slate-400" />
                    </div>
                    <h4 className="text-xl font-semibold text-white mb-2">No Recent Activity</h4>
                    <p className="text-slate-400">
                      {selectedTournamentFilter === 'all' 
                        ? 'No matches recorded yet across all tournaments'
                        : `No matches found for ${allTournaments.find(t => t.id === selectedTournamentFilter)?.name || 'this tournament'}`}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-4"
                  >
                    {recentMatches.slice(0, 6).map((match, index) => (
                      <motion.div
                        key={`${match.tournament_id}-${match.submitted_at}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-6 hover:bg-slate-700/50 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                W
                              </div>
                              <div>
                                <div className="text-white font-semibold">{match.winner_name}</div>
                                <div className="text-slate-400 text-sm">
                                  defeated {match.winner_name === match.player1_name ? match.player2_name : match.player1_name}
                                </div>
                              </div>
                            </div>
                            
                            {(match.player1_beyblade || match.player2_beyblade) && (
                              <div className="text-xs text-slate-500 font-mono bg-slate-800/50 rounded px-2 py-1">
                                {match.winner_name === match.player1_name 
                                  ? `${match.player1_beyblade || 'Unknown'} vs ${match.player2_beyblade || 'Unknown'}`
                                  : `${match.player2_beyblade || 'Unknown'} vs ${match.player1_beyblade || 'Unknown'}`}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <div className="text-slate-300 text-sm font-medium">
                              {match.outcome?.split(' (')[0] || 'Victory'}
                            </div>
                            <div className="text-slate-500 text-xs mt-1">
                              {new Date(match.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </section>

        {/* Community Footer */}
        <motion.footer 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="border-t border-slate-800 bg-slate-950 py-12"
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
              <div className="text-center md:text-left">
                <h4 className="text-white font-bold text-lg mb-2">Ormoc Beyblade Club</h4>
                <p className="text-slate-400">Building the future of competitive Beyblade in Ormoc</p>
                <p className="text-slate-500 text-sm mt-1">Created by Jedynsay</p>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-medium text-sm">System Online</span>
                </div>
                <div className="text-slate-400 text-sm">Portal v0.0.5</div>
              </div>
            </div>
          </div>
        </motion.footer>
      </motion.div>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowLoginModal(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none z-50"
            >
              <div className="relative pointer-events-auto bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
                <LoginForm onLoginSuccess={() => setShowLoginModal(false)} />
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}