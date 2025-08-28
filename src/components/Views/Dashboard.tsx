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
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
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

  const fetchTopPlayers = async () => {
    try {
      const { data: matches } = await supabase
        .from('match_results')
        .select('player1_name, player2_name, winner_name')
        .order('submitted_at', { ascending: false })
        .limit(1000);

      if (!matches) return;

      const playerStats: { [key: string]: { wins: number; total: number; tournaments: Set<string> } } = {};

      matches.forEach((match) => {
        const { player1_name, player2_name, winner_name } = match;
        if (!playerStats[player1_name]) playerStats[player1_name] = { wins: 0, total: 0, tournaments: new Set() };
        if (!playerStats[player2_name]) playerStats[player2_name] = { wins: 0, total: 0, tournaments: new Set() };
        playerStats[player1_name].total++;
        playerStats[player2_name].total++;
        if (winner_name === player1_name) playerStats[player1_name].wins++;
        else if (winner_name === player2_name) playerStats[player2_name].wins++;
      });

      const playersArray = Object.entries(playerStats)
        .map(([name, stats]) => ({
          name,
          wins: stats.wins,
          tournaments: stats.tournaments.size,
          winRate: stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0,
        }))
        .filter((p) => p.wins > 0)
        .sort((a, b) => (b.wins !== a.wins ? b.wins - a.wins : b.winRate - a.winRate))
        .slice(0, 5);

      setTopPlayers(playersArray);
    } catch (err) {
      console.error('Error fetching top players:', err);
    }
  };

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
      const upcoming = tournaments?.filter((t) => new Date(t.tournament_date) > now && t.status !== 'completed') || [];

      setStats({
        totalTournaments: tournaments?.length || 0,
        activePlayers: uniquePlayers.size,
        upcomingEvents: upcoming.length,
        completedMatches: matches?.length || 0,
      });

      setUpcomingTournaments(upcoming.slice(0, 3));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchDashboardStats(), fetchTopPlayers()]);
      setLoading(false);
    };
    loadData();
  }, [user]);

  useEffect(() => {
    if (topPlayers.length > 1) {
      const interval = setInterval(() => {
        setCurrentPlayerIndex((prev) => (prev + 1) % topPlayers.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [topPlayers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-white text-lg font-semibold animate-pulse">Loading Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative">
      {/* Hero Section with Community Image */}
      <motion.section
        ref={containerRef}
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <img src="/community.jpg" alt="Ormoc Beyblade Community" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-black/70"></div>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:60px_60px] opacity-20" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <h1 className="text-7xl md:text-8xl font-extrabold uppercase tracking-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Ormoc Beyblade Club
            </span>
          </h1>
          <p className="mt-6 text-xl text-slate-300">Welcome to the future of competitive Beyblade. Let it rip ⚡</p>
        </div>
      </motion.section>

      {/* Stats + Quick Access here (same as before) */}

      {/* Champions Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <h2 className="text-5xl font-extrabold text-center mb-16 uppercase tracking-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Community Champions
            </span>
          </h2>

          {topPlayers.length > 0 && (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPlayerIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="text-center border border-cyan-500/30 bg-slate-950/70 backdrop-blur-xl rounded-md p-12 shadow-[0_0_40px_rgba(0,200,255,0.15)]"
              >
                {/* Glowing orb avatar */}
                <div className="flex items-center justify-center mb-10">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-6xl font-bold text-white shadow-[0_0_30px_rgba(0,200,255,0.6)] animate-pulse">
                      {topPlayers[currentPlayerIndex]?.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-cyan-400/40 animate-spin-slow"></div>
                  </div>
                </div>

                <h3 className="text-3xl font-bold mb-3 text-white">
                  {topPlayers[currentPlayerIndex]?.name}
                </h3>
                <p className="text-cyan-400 font-semibold uppercase tracking-wide mb-10">Champion Blader</p>

                <div className="grid grid-cols-3 gap-10 max-w-xl mx-auto">
                  <div>
                    <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      {topPlayers[currentPlayerIndex]?.wins}
                    </div>
                    <div className="text-slate-400 mt-2 text-sm uppercase">Wins</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {topPlayers[currentPlayerIndex]?.tournaments}
                    </div>
                    <div className="text-slate-400 mt-2 text-sm uppercase">Tournaments</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                      {topPlayers[currentPlayerIndex]?.winRate}%
                    </div>
                    <div className="text-slate-400 mt-2 text-sm uppercase">Win Rate</div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {topPlayers.length > 1 && (
            <div className="flex justify-center space-x-3 mt-10">
              {topPlayers.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPlayerIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentPlayerIndex
                      ? 'bg-cyan-400 scale-125 shadow-[0_0_10px_rgba(0,200,255,0.8)]'
                      : 'bg-slate-600 hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
