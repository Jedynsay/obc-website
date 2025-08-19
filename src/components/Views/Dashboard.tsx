import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { CommunityHeroSection } from './CommunityHeroSection';
import { SystemFooter } from './SystemFooter';
import { LoginModal } from './LoginModal';
import { motion } from 'framer-motion';

interface Tournament {
  id: string;
  name: string;
  tournament_date: string;
  location: string;
  current_participants: number;
  max_participants: number;
  status: string;
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
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [upcomingTournaments, setUpcomingTournaments] = useState<Tournament[]>([]);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournamentFilter, setSelectedTournamentFilter] = useState<string>('all');

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [tournamentsRes, matchesRes] = await Promise.all([
        supabase.from('tournaments').select('*'),
        supabase.from('match_results').select('*')
      ]);

      const tournaments = tournamentsRes.data || [];
      setUpcomingTournaments(tournaments.filter(t => t.status === 'upcoming').slice(0, 3));

      const matches = matchesRes.data || [];
      await fetchTopPlayers(matches);
      setRecentMatches(matches.slice(0, 10));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopPlayers = async (matches: any[]) => {
    const playerStats: { [key: string]: { wins: number; matches: number } } = {};
    matches.forEach(match => {
      [match.player1_name, match.player2_name].forEach(player => {
        if (!player) return;
        if (!playerStats[player]) playerStats[player] = { wins: 0, matches: 0 };
        playerStats[player].matches++;
        if (match.winner_name === player) playerStats[player].wins++;
      });
    });

    const topPlayersData = Object.entries(playerStats)
      .map(([name, stats]) => ({
        name,
        wins: stats.wins,
        tournaments: Math.ceil(stats.matches / 10),
        winRate: Math.round((stats.wins / stats.matches) * 100)
      }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 5);

    setTopPlayers(topPlayersData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-slate-300">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          Letting it rip...
        </div>
      </div>
    );
  }

  const AnimatedCard = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="bg-slate-800/50 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:scale-105 transition-transform"
    >
      {children}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
      <CommunityHeroSection />

      {/* Main hub */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        <AnimatedCard delay={0.1}>
          <h2 className="text-2xl font-bold mb-4">Upcoming Tournaments</h2>
          <ul className="space-y-2">
            {upcomingTournaments.map(t => (
              <li key={t.id}>
                <div className="p-3 bg-slate-900/50 rounded-lg">
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm">{t.tournament_date} @ {t.location}</p>
                  <p className="text-sm">{t.current_participants}/{t.max_participants} participants</p>
                </div>
              </li>
            ))}
          </ul>
        </AnimatedCard>

        <AnimatedCard delay={0.3}>
          <h2 className="text-2xl font-bold mb-4">Top Players</h2>
          <ul className="space-y-2">
            {topPlayers.map(p => (
              <li key={p.name}>
                <div className="p-3 bg-slate-900/50 rounded-lg">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm">Wins: {p.wins} | Win Rate: {p.winRate}% | Tournaments: {p.tournaments}</p>
                </div>
              </li>
            ))}
          </ul>
        </AnimatedCard>
      </div>

      {/* Recent Matches */}
      <div className="p-6">
        <AnimatedCard delay={0.2}>
          <h2 className="text-2xl font-bold mb-4">Recent Matches</h2>
          <ul className="space-y-2">
            {recentMatches.map((m, idx) => (
              <li key={idx}>
                <div className="p-3 bg-slate-900/50 rounded-lg">
                  <p className="text-sm">{m.player1_name} vs {m.player2_name} - Winner: {m.winner_name}</p>
                  <p className="text-xs text-slate-300">{new Date(m.submitted_at).toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        </AnimatedCard>
      </div>

      <SystemFooter />
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </div>
  );
}
