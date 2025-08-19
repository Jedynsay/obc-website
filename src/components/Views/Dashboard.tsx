import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

import { HeroSection } from './HeroSection';
import { QuickAccessCards } from './QuickAccessCards';
import { CommunityHighlights } from './CommunityHighlights';
import { SystemFooter } from './SystemFooter';
import { LoginModal } from './LoginModal';
import { CommunityHeroSection } from './CommunityHeroSection';

export function Dashboard({ onViewChange }) {
  const { user, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [stats, setStats] = useState({
    totalTournaments: 0,
    activePlayers: 0,
    upcomingEvents: 0,
    completedMatches: 0
  });
  const [upcomingTournaments, setUpcomingTournaments] = useState([]);
  const [topPlayers, setTopPlayers] = useState([]);
  const [deckPresets, setDeckPresets] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [allTournaments, setAllTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournamentFilter, setSelectedTournamentFilter] = useState('all');

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

    const playerStats = {};

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

  const fetchRecentMatches = async () => {
    let query = supabase
      .from('match_results')
      .select('player1_name, player2_name, player1_beyblade, player2_beyblade, winner_name, outcome, submitted_at, tournament_id')
      .order('submitted_at', { ascending: false })
      .limit(10);

    if (selectedTournamentFilter !== 'all') query = query.eq('tournament_id', selectedTournamentFilter);

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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-slate-300">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          Letting it rip...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <CommunityHeroSection
        user={user}
        onLoginClick={() => setShowLoginModal(true)}
        onLogout={logout}
      >
        <div className="-mt-20">
          <HeroSection
            user={user}
            onViewChange={onViewChange}
            onLoginClick={() => setShowLoginModal(true)}
            onLogout={logout}
          />
          <QuickAccessCards
            stats={stats}
            upcomingTournaments={upcomingTournaments}
            deckPresets={deckPresets}
            onViewChange={onViewChange}
          />
          <CommunityHighlights
            topPlayers={topPlayers}
            currentTournamentFilter={selectedTournamentFilter}
            setTournamentFilter={setSelectedTournamentFilter}
            tournaments={allTournaments}
            recentMatches={recentMatches}
          />
        </div>
      </CommunityHeroSection>

      <SystemFooter />
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </div>
  );
}
