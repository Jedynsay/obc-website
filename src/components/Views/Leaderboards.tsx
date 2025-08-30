import React, { useState, useEffect } from 'react';
import { Crown, Trophy, Users, Target, RefreshCw, Medal, TrendingUp, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

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
    // placeholder: keep existing logic for fetching + computing standings
    setLeaderboard([]);
  };

  const fetchGlobalLeaderboard = async () => {
    // placeholder: keep existing logic for fetching + computing standings
    setLeaderboard([]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (currentTab === 'tournament' && selectedTournament) await fetchTournamentLeaderboard();
    else if (currentTab === 'global') await fetchGlobalLeaderboard();
    setRefreshing(false);
  };

  const handleTabChange = (tab: 'tournament' | 'global' | 'community') => {
    setCurrentTab(tab);
    setLeaderboard([]);
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-gray-300';
      case 3: return 'text-orange-400';
      default: return 'text-slate-300';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown size={20} className="text-yellow-400" />;
      case 2: return <Medal size={20} className="text-gray-400" />;
      case 3: return <Medal size={20} className="text-orange-400" />;
      default: return <span className="text-slate-400 font-semibold">#{rank}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mr-4" />
        Loading Leaderboards...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold flex items-center">
              <Crown size={40} className="mr-4 text-cyan-400" />
              <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Leaderboards
              </span>
            </h1>
            <p className="text-slate-400 mt-2">Tournament rankings and player standings</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold hover:from-cyan-400 hover:to-purple-500 transition shadow-[0_0_15px_rgba(0,200,255,0.4)] disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-slate-900/40 border border-slate-700 p-4 mb-8">
          <div className="flex gap-6">
            {['tournament','global','community'].map(tab => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab as any)}
                className={`relative pb-2 font-medium transition group ${
                  currentTab === tab ? 'text-cyan-400' : 'text-slate-400 hover:text-cyan-300'
                }`}
              >
                {tab === 'tournament' && <Trophy size={16} className="mr-1 inline" />} 
                {tab === 'global' && <Target size={16} className="mr-1 inline" />} 
                {tab === 'community' && <Users size={16} className="mr-1 inline" />} 
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-500 ${currentTab === tab ? 'w-full' : 'w-0 group-hover:w-full'}`} />
              </button>
            ))}
            {currentTab === 'tournament' && (
              <select
                value={selectedTournament}
                onChange={(e) => setSelectedTournament(e.target.value)}
                className="ml-auto bg-slate-950 border border-cyan-500/30 rounded-md px-2 py-1 text-sm text-white focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">-- Select Tournament --</option>
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Community Coming Soon */}
        {currentTab === 'community' && (
          <div className="border border-slate-700 bg-slate-900/40 p-12 text-center hover:border-cyan-400/70 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition">
            <div className="w-24 h-24 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_25px_rgba(0,200,255,0.5)]">
              <Users size={40} />
            </div>
            <h2 className="text-3xl font-bold text-cyan-400 mb-2">Community Leaderboards</h2>
            <div className="inline-block bg-gradient-to-r from-cyan-600 to-purple-600 px-6 py-2 font-bold shadow-[0_0_20px_rgba(0,200,255,0.3)] mb-6">COMING SOON</div>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Soon, every community will have their own leaderboards to track local champions and rising stars.
            </p>
          </div>
        )}

        {/* Leaderboard Table */}
        {(currentTab === 'tournament' || currentTab === 'global') && (
          <div className="border border-cyan-500/30 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-700 flex justify-between">
              <h2 className="text-xl font-bold flex items-center text-white">
                <TrendingUp size={20} className="mr-2 text-cyan-400" />
                {currentTab === 'tournament' ? 'Tournament Leaderboard' : 'Global Leaderboard'}
              </h2>
              <span className="text-sm text-slate-400">{leaderboard.length} participants</span>
            </div>

            {leaderboard.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <BarChart3 size={40} className="mx-auto mb-4" />
                No data available.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-800/50">
                    <tr>
                      {['Rank','Participant','Match W-L','Score','TB','Buchholz','Pts Diff'].map(col => (
                        <th key={col} className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-cyan-400 text-center">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <AnimatePresence component="tbody" className="divide-y divide-slate-800">
                    {leaderboard.map((entry) => (
                      <motion.tr
                        key={entry.participant}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="hover:bg-slate-900/60 transition"
                      >
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {getRankIcon(entry.rank)}
                            <span className={`font-bold ${getRankColor(entry.rank)}`}>{entry.rank <= 3 ? '' : `#${entry.rank}`}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(0,200,255,0.4)]">
                              {entry.participant.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-left">
                              <div className="font-medium text-white">{entry.participant}</div>
                              <div className="text-xs text-slate-400">{entry.winRate.toFixed(1)}% win rate</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-green-400 font-semibold">{entry.matchWins}</span>
                          <span className="text-slate-500 mx-1">-</span>
                          <span className="text-red-400 font-semibold">{entry.matchLosses}</span>
                        </td>
                        <td className="px-6 py-4 text-center text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                          {entry.score}
                        </td>
                        <td className="px-6 py-4 text-center">{entry.tb}</td>
                        <td className="px-6 py-4 text-center">{entry.buchholz}</td>
                        <td className={`px-6 py-4 text-center font-semibold ${entry.ptsDiff > 0 ? 'text-green-400' : entry.ptsDiff < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                          {entry.ptsDiff > 0 ? '+' : ''}{entry.ptsDiff}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
