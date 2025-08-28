import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { LogIn, LogOut, Settings, X } from 'lucide-react';
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-white text-lg font-semibold animate-pulse">
          Loading Portal...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative">
      {/* Background tech layers */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(30,30,60,0.5),rgba(10,10,20,1))]" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:60px_60px] opacity-10" />
      </div>

      {/* User Menu */}
      <div className="fixed top-6 right-6 z-50">
        {user && !user.id.startsWith('guest-') ? (
          <div className="relative">
            <motion.button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 bg-slate-800/70 px-4 py-2 hover:bg-slate-700/70 transition"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="font-semibold text-sm">{user.username}</p>
                <p className="text-xs text-slate-300 capitalize">
                  {user.role.replace('_', ' ')}
                </p>
              </div>
            </motion.button>

            {showUserMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900 border border-slate-700">
                <button className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-300 flex items-center gap-2">
                  <Settings size={16} /> Settings
                </button>
                <button
                  onClick={async () => {
                    setShowUserMenu(false);
                    await logout();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-red-900/30 text-red-400 flex items-center gap-2"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowLoginModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold uppercase tracking-wide hover:shadow-[0_0_20px_rgba(0,200,255,0.6)] transition"
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
        className="relative h-screen flex items-center justify-center text-center"
      >
        <div className="relative z-10 px-6 max-w-5xl mx-auto">
          <h1 className="text-7xl md:text-8xl font-extrabold uppercase tracking-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Ormoc Beyblade Club
            </span>
          </h1>
          <p className="mt-6 text-xl text-slate-300">
            Welcome to the future of competitive Beyblade. Let it rip ⚡
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={() => onViewChange?.('tournaments')}
              className="relative px-10 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(0,200,255,0.7)] transition overflow-hidden group"
            >
              Join Tournament
              <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.2),transparent)] translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </button>
            <button
              onClick={() => onViewChange?.('analytics')}
              className="px-10 py-4 border border-slate-600 text-white font-bold uppercase tracking-wider hover:bg-slate-800 transition"
            >
              View Analytics
            </button>
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.div style={{ y: contentY }} className="relative z-20">
        <section className="border-y border-slate-800 bg-slate-950/80 backdrop-blur-sm">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-800">
            {[
              { label: 'Tournaments', value: stats.totalTournaments },
              { label: 'Active Players', value: stats.activePlayers },
              { label: 'Upcoming', value: stats.upcomingEvents },
              { label: 'Matches', value: stats.completedMatches },
            ].map((stat) => (
              <div key={stat.label} className="py-14 text-center">
                <div className="text-5xl font-extrabold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm uppercase tracking-wide text-slate-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Access Hub */}
        <section className="py-24 bg-slate-900/90 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                title: 'Tournament Hub',
                desc: 'Register and track upcoming tournaments.',
                color: 'from-cyan-500 to-purple-500',
                action: () => onViewChange?.('tournaments'),
              },
              {
                title: 'Analytics',
                desc: 'View stats and performance trends.',
                color: 'from-purple-500 to-pink-500',
                action: () => onViewChange?.('analytics'),
              },
              {
                title: 'Deck Builder',
                desc: 'Build and save your best Beyblade combinations.',
                color: 'from-orange-500 to-red-500',
                action: () => onViewChange?.('inventory'),
              },
            ].map((item) => (
              <div
                key={item.title}
                onClick={item.action}
                className="p-12 bg-slate-950 border border-slate-800 hover:shadow-[0_0_30px_rgba(0,200,255,0.2)] cursor-pointer transition relative group"
              >
                <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-slate-400 mb-6">{item.desc}</p>
                <span
                  className={`uppercase font-semibold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}
                >
                  Explore →
                </span>
                <div
                  className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r ${item.color} group-hover:w-full transition-all duration-500`}
                />
              </div>
            ))}
          </div>
        </section>
      </motion.div>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12 relative z-30">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h4 className="font-bold text-lg mb-2">Ormoc Beyblade Club</h4>
            <p className="text-slate-400">
              The future of competitive Beyblade in Ormoc
            </p>
          </div>
          <div className="text-slate-500 text-sm">Portal v0.7</div>
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
              className="fixed inset-0 bg-black/70 z-40"
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
