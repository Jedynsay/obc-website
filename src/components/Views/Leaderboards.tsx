import React, { useState, useEffect } from 'react';
import { Crown, Trophy, Users, Target, RefreshCw, Medal, TrendingUp, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Tournament {
  id: string;
  name: string;
  status: string;
  tournament_date: string;
}

interface LeaderboardEntry {
  rank: number;
  participant: string;
  matchWins: number;
  matchLosses: number;
  score: number;
  tb: number;
  buchholz: number;
  ptsDiff: number;
  totalMatches: number;
  winRate: number;
}

export function Leaderboards() {
  const [currentTab, setCurrentTab] = useState<'tournament' | 'global' | 'community'>('tournament');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament && currentTab === 'tournament') {
      fetchTournamentLeaderboard();
    } else if (currentTab === 'global') {
      fetchGlobalLeaderboard();
    }
  }, [selectedTournament, currentTab]);

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name, status, tournament_date')
        .order('tournament_date', { ascending: false });

      if (error) throw error;
      setTournaments(data || []);
      if (data && data.length > 0) setSelectedTournament(data[0].id);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTournamentLeaderboard = async () => {
    // … keep your existing leaderboard fetch logic …
  };

  const fetchGlobalLeaderboard = async () => {
    // … keep your existing global fetch logic …
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (currentTab === 'tournament' && selectedTournament) {
      await fetchTournamentLeaderboard();
    } else if (currentTab === 'global') {
      await fetchGlobalLeaderboard();
    }
    setRefreshing(false);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown size={20} className="text-yellow-400" />;
      case 2: return <Medal size={20} className="text-slate-400" />;
      case 3: return <Medal size={20} className="text-orange-500" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-slate-400">#{rank}</span>;
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-950 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading leaderboards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center mb-4">
            <Crown size={40} className="mr-4 text-cyan-400" />
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Leaderboards
            </span>
          </h1>
          <p className="text-slate-400 text-lg">Track rankings and player standings</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-700 pb-2 mb-8">
          {/* Tabs */}
          <div className="flex items-center space-x-6">
            {['tournament', 'global', 'community'].map((tab) => (
              <button
                key={tab}
                onClick={() => setCurrentTab(tab as any)}
                className={`relative pb-2 text-sm font-medium capitalize transition-colors group ${
                  currentTab === tab ? 'text-cyan-400' : 'text-slate-400 hover:text-cyan-300'
                }`}
              >
                {tab}
                <span
                  className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-500
                  ${currentTab === tab ? 'w-full' : 'w-0 group-hover:w-full'}`}
                />
              </button>
            ))}
          </div>

          {/* Tournament Selector + Refresh */}
          {currentTab === 'tournament' && (
            <div className="flex items-center gap-4">
              <select
                value={selectedTournament}
                onChange={(e) => setSelectedTournament(e.target.value)}
                className="bg-transparent border-b border-slate-700 text-sm focus:outline-none focus:border-cyan-500 transition text-slate-300"
              >
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                    {t.name} ({t.status})
                  </option>
                ))}
              </select>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-3 py-2 text-sm font-medium bg-gradient-to-r from-cyan-500 to-purple-500 text-white 
                           hover:shadow-[0_0_12px_rgba(34,211,238,0.6)] transition disabled:opacity-50"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          )}
        </div>

        {/* Community Coming Soon */}
        {currentTab === 'community' && (
          <div className="text-center py-16 text-slate-400">
            <Users size={48} className="mx-auto mb-4 text-cyan-400" />
            <p className="text-lg">Community Leaderboards coming soon…</p>
          </div>
        )}

        {/* Leaderboard Table */}
        {(currentTab === 'tournament' || currentTab === 'global') && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-slate-700">
              <thead className="bg-slate-900 text-slate-300 uppercase text-xs">
                <tr>
                  <th className="px-4 py-2 text-left">Rank</th>
                  <th className="px-4 py-2 text-left">Player</th>
                  <th className="px-4 py-2 text-center">W-L</th>
                  <th className="px-4 py-2 text-center">Score</th>
                  <th className="px-4 py-2 text-center">TB</th>
                  <th className="px-4 py-2 text-center">Buchholz</th>
                  <th className="px-4 py-2 text-center">Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      <BarChart3 size={24} className="mx-auto mb-2" />
                      No leaderboard data
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((entry) => (
                    <tr key={entry.participant} className="hover:bg-slate-900/50 transition">
                      <td className="px-4 py-3">{getRankIcon(entry.rank)}</td>
                      <td className="px-4 py-3 font-medium text-white">{entry.participant}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-green-400">{entry.matchWins}</span> /
                        <span className="text-red-400">{entry.matchLosses}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-cyan-400 font-bold">{entry.score}</td>
                      <td className="px-4 py-3 text-center">{entry.tb}</td>
                      <td className="px-4 py-3 text-center">{entry.buchholz}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={entry.ptsDiff > 0 ? 'text-green-400' : entry.ptsDiff < 0 ? 'text-red-400' : 'text-slate-400'}>
                          {entry.ptsDiff > 0 ? '+' : ''}{entry.ptsDiff}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
