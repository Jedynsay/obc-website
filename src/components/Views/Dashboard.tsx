import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { LogIn, LogOut, Settings, X, Trophy } from 'lucide-react';
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
    completedMatches: 0,
  });
  const [upcomingTournaments, setUpcomingTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  // Parallax scroll refs (hero section only now)
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll(
    containerRef.current
      ? {
          target: containerRef,
          offset: ['start start', 'end start'],
          layoutEffect: false,
        }
      : undefined
  );

  // Parallax transforms
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const fetchDashboardStats = async () => {
    try {
      const { data: tournaments } = await supabase.from('tournaments').select('*');
      const { data: matches } = await supabase.from('match_results').select('*');

      const uniquePlayers = new Set();
      matches?.forEach((match) => {
        if (match.player1_name) uniquePlayers.add(match.player1_name);
        if (match.player2_name) uniquePlayers.add(match.player2_name);
      });

      const now = new Date();
      const upcoming =
        tournaments?.filter(
          (t) => new Date(t.tournament_date) > now && t.status !== 'completed'
        ) || [];

      setStats({
        totalTournaments: tournaments?.length || 0,
        activePlayers: uniquePlayers.size,
        upcomingEvents: upcoming.length,
        completedMatches: matches?.length || 0,
      });

      setUpcomingTournaments(upcoming.slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchDashboardStats();
      setLoading(false);
    };
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white text-lg font-semibold">Loading...</p>
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
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 bg-slate-800 px-4 py-2 hover:bg-slate-700 transition"
            >
              <div className="w-10 h-10 bg-blue-600 flex items-center justify-center text-white font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="font-semibold text-sm text-white">{user.username}</p>
                <p className="text-xs text-slate-300 capitalize">
                  {user.role.replace('_', ' ')}
                </p>
              </div>
            </motion.button>

            {showUserMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 border border-slate-700 p-2">
                <button className="w-full text-left px-4 py-2 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-2">
                  <Settings size={16} /> Settings
                </button>
                <button
                  onClick={async () => {
                    setShowUserMenu(false);
                    await logout();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-red-900/20 text-red-400 flex items-center gap-2"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowLoginModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 font-semibold uppercase tracking-wide"
          >
            <LogIn size={18} className="inline-block mr-2" />
            Login
          </button>
        )}
      </div>

      {/* Hero Section */}
      <motion.section
        ref={containerRef}
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative h-screen flex items-center justify-center"
      >
        <div className="absolute inset-0">
          <img
            src="/community.jpg"
            alt="Ormoc Beyblade Community"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60"></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-extrabold uppercase tracking-tight text-white">
            Ormoc <span className="text-blue-500">Beyblade Club</span>
          </h1>
          <p className="mt-6 text-xl text-slate-300">
            Welcome to the home of competitive Beyblade in Ormoc. Let it rip!
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={() => onViewChange?.('tournaments')}
              className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wide"
            >
              Join Tournament
            </button>
            <button
              onClick={() => onViewChange?.('analytics')}
              className="px-10 py-4 border border-slate-600 hover:bg-slate-800 text-white font-bold uppercase tracking-wide"
            >
              View Analytics
            </button>
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.div style={{ y: contentY }} className="relative z-20 bg-slate-900">
        <section className="border-y border-slate-800">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-800">
            {[
              { label: 'Tournaments', value: stats.totalTournaments },
              { label: 'Active Players', value: stats.activePlayers },
              { label: 'Upcoming', value: stats.upcomingEvents },
              { label: 'Matches', value: stats.completedMatches },
            ].map((stat) => (
              <div key={stat.label} className="py-12 text-center">
                <div className="text-5xl font-extrabold">{stat.value}</div>
                <div className="mt-2 text-sm uppercase tracking-wide text-slate-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Access Hub */}
        <section className="py-20 bg-slate-800">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div
              onClick={() => onViewChange?.('tournaments')}
              className="p-12 bg-slate-900 hover:bg-slate-700 transition cursor-pointer"
            >
              <h3 className="text-2xl font-bold mb-3">Tournament Hub</h3>
              <p className="text-slate-400 mb-6">
                Register and track upcoming tournaments.
              </p>
              <span className="uppercase text-blue-500 font-semibold hover:underline">
                Explore →
              </span>
            </div>
            <div
              onClick={() => onViewChange?.('analytics')}
              className="p-12 bg-slate-900 hover:bg-slate-700 transition cursor-pointer"
            >
              <h3 className="text-2xl font-bold mb-3">Analytics</h3>
              <p className="text-slate-400 mb-6">
                View stats and performance trends.
              </p>
              <span className="uppercase text-purple-400 font-semibold hover:underline">
                Explore →
              </span>
            </div>
            <div
              onClick={() => onViewChange?.('inventory')}
              className="p-12 bg-slate-900 hover:bg-slate-700 transition cursor-pointer"
            >
              <h3 className="text-2xl font-bold mb-3">Deck Builder</h3>
              <p className="text-slate-400 mb-6">
                Build and save your best Beyblade combinations.
              </p>
              <span className="uppercase text-orange-400 font-semibold hover:underline">
                Explore →
              </span>
            </div>
          </div>
        </section>
      </motion.div>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h4 className="text-white font-bold text-lg mb-2">Ormoc Beyblade Club</h4>
            <p className="text-slate-400">Building the future of competitive Beyblade</p>
          </div>
          <div className="text-slate-500 text-sm">Portal v0.6</div>
        </div>
      </footer>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setShowLoginModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="relative bg-white max-w-md w-full p-6">
                <LoginForm onLoginSuccess={() => setShowLoginModal(false)} />
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="absolute top-4 right-4 text-gray-600 hover:text-black"
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
