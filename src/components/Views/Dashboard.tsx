import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

import { HeroSection } from './HeroSection';
import { QuickAccessCards } from './QuickAccessCards';
import { CommunityHighlights } from './CommunityHighlights';
import { SystemFooter } from './SystemFooter';
import { LoginModal } from './LoginModal';

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

  useEffect(() => {
    fetchDashboardData();
    if (user && !user.id.startsWith('guest-')) {
      fetchDeckPresets();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [tournamentsRes, usersRes, matchesRes] = await Promise.all([
        supabase.from('tournaments').select('*'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('match_results').select('*', { count: 'exact', head: true })
      ]);

      const tournaments = tournamentsRes.data || [];
      setAllTournaments(tournaments);

      const upcoming = tournaments.filter(t => t.status === 'upcoming').slice(0, 3);
      setUpcomingTournaments(upcoming);

      setStats({
        totalTournaments: tournaments.length,
        activePlayers: usersRes.count || 0,
        upcomingEvents: tournaments.filter(t => t.status === 'upcoming').length,
        completedMatches: matchesRes.count || 0
      });

      await fetchTopPlayers();
      await fetchRecentMatches();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopPlayers = async () => {
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
        tournaments: Math.ceil(stats.matches / 10),
        winRate: Math.round((stats.wins / stats.matches) * 100)
      }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 5);

    setTopPlayers(topPlayersData);
  };

  const fetchRecentMatches = async () => {
    let query = supabase
      .from('match_results')
      .select('player1_name, player2_name, player1_beyblade, player2_beyblade, winner_name, outcome, submitted_at, tournament_id')
      .order('submitted_at', { ascending: false })
      .limit(10);

    if (selectedTournamentFilter !== 'all') {
      query = query.eq('tournament_id', selectedTournamentFilter);
    }

    const { data: matches } = await query;
    setRecentMatches(matches || []);
  };

  const fetchDeckPresets = async () => {
    if (!user || user.id.startsWith('guest-')) return;

    const { data } = await supabase
      .from('deck_presets')
      .select('*')
      .eq('user_id', user.id);

    setDeckPresets(data || []);
  };

if (loading) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
      <div className="relative w-48 h-32 clash-container">
        {/* Left disc */}
        <div className="disc disc-left"></div>

        {/* Right disc */}
        <div className="disc disc-right"></div>

        {/* Sparks */}
        <div className="spark"></div>
      </div>

      <p className="mt-6 text-xl font-bold text-yellow-300 animate-pulse">
        Let it Rip! Loading Dashboard...
      </p>

      <style jsx>{`
        .clash-container {
          position: relative;
        }

        .disc {
          position: absolute;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 4px solid white;
          animation: spin 0.6s linear infinite;
        }

        .disc-left {
          background: radial-gradient(circle, #ff5555 40%, #aa0000 100%);
          left: 0;
          animation: spin 0.6s linear infinite, moveLeft 1s ease-in-out infinite;
        }

        .disc-right {
          background: radial-gradient(circle, #5599ff 40%, #0033aa 100%);
          right: 0;
          animation: spin 0.6s linear infinite, moveRight 1s ease-in-out infinite;
        }

        .spark {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 10px;
          height: 10px;
          background: yellow;
          border-radius: 50%;
          transform: translate(-50%, -50%) scale(0);
          animation: spark 1s ease-in-out infinite;
          box-shadow: 0 0 10px yellow, 0 0 20px orange;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes moveLeft {
          0%,
          100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(80px);
          }
        }

        @keyframes moveRight {
          0%,
          100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(-80px);
          }
        }

        @keyframes spark {
          0%,
          40%,
          100% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }
          45%,
          55% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 1;
          }
        }

        /* Fade-out animation when loading ends */
        .fade-out {
          animation: fadeOut 0.5s forwards;
        }

        @keyframes fadeOut {
          to {
            opacity: 0;
            transform: scale(0.8);
          }
        }
      `}</style>
    </div>
  );
}
 
  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-slate-900 flex items-center justify-center">
  //       <div className="text-center text-slate-300">
  //         <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
  //         Loading dashboard...
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <HeroSection user={user} onViewChange={onViewChange} onLoginClick={() => setShowLoginModal(true)} onLogout={logout} />
      <QuickAccessCards stats={stats} upcomingTournaments={upcomingTournaments} deckPresets={deckPresets} onViewChange={onViewChange} />
      <CommunityHighlights
        topPlayers={topPlayers}
        currentTournamentFilter={selectedTournamentFilter}
        setTournamentFilter={setSelectedTournamentFilter}
        tournaments={allTournaments}
        recentMatches={recentMatches}
      />
      <SystemFooter />
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </div>
  );
}
