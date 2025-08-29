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
    if (!selectedTournament) return;
    try {
      const { data: sessions, error } = await supabase
        .from('match_sessions')
        .select('*')
        .eq('tournament_id', selectedTournament);

      if (error) throw error;

      if (!sessions || sessions.length === 0) {
        setLeaderboard([]);
        return;
      }

      const playerStats: {
        [name: string]: {
          wins: number;
          losses: number;
          score: number;
          pointsFor: number;
          pointsAgainst: number;
          opponents: string[];
          winsAgainst: { [opponent: string]: number };
        };
      } = {};

      sessions.forEach(session => {
        const { player1_name, player2_name, winner_name, player1_final_score, player2_final_score } = session;

        if (!playerStats[player1_name]) {
          playerStats[player1_name] = { wins: 0, losses: 0, score: 0, pointsFor: 0, pointsAgainst: 0, opponents: [], winsAgainst: {} };
        }
        if (!playerStats[player2_name]) {
          playerStats[player2_name] = { wins: 0, losses: 0, score: 0, pointsFor: 0, pointsAgainst: 0, opponents: [], winsAgainst: {} };
        }

        if (winner_name === player1_name) {
          playerStats[player1_name].wins++;
          playerStats[player1_name].score++;
          playerStats[player2_name].losses++;
          playerStats[player1_name].winsAgainst[player2_name] = (playerStats[player1_name].winsAgainst[player2_name] || 0) + 1;
        } else if (winner_name === player2_name) {
          playerStats[player2_name].wins++;
          playerStats[player2_name].score++;
          playerStats[player1_name].losses++;
          playerStats[player2_name].winsAgainst[player1_name] = (playerStats[player2_name].winsAgainst[player1_name] || 0) + 1;
        }

        playerStats[player1_name].pointsFor += player1_final_score || 0;
        playerStats[player1_name].pointsAgainst += player2_final_score || 0;
        playerStats[player2_name].pointsFor += player2_final_score || 0;
        playerStats[player2_name].pointsAgainst += player1_final_score || 0;

        if (!playerStats[player1_name].opponents.includes(player2_name)) playerStats[player1_name].opponents.push(player2_name);
        if (!playerStats[player2_name].opponents.includes(player1_name)) playerStats[player2_name].opponents.push(player1_name);
      });

      Object.keys(playerStats).forEach(player => {
        const opponents = playerStats[player].opponents;
        const opponentScores: number[] = [];
        opponents.forEach(opponent => {
          if (playerStats[opponent]) opponentScores.push(playerStats[opponent].score);
        });

        if (opponentScores.length > 2) {
          opponentScores.sort((a, b) => a - b);
          opponentScores.shift();
          opponentScores.pop();
        }
        (playerStats[player] as any).buchholz = opponentScores.reduce((sum, s) => sum + s, 0);
      });

      const scoreGroups: { [score: number]: string[] } = {};
      Object.keys(playerStats).forEach(player => {
        const score = playerStats[player].score;
        if (!scoreGroups[score]) scoreGroups[score] = [];
        scoreGroups[score].push(player);
      });

      Object.values(scoreGroups).forEach(group => {
        if (group.length > 1) {
          group.forEach(player => {
            let tbWins = 0;
            group.forEach(opponent => {
              if (opponent !== player) tbWins += playerStats[player].winsAgainst[opponent] || 0;
            });
            (playerStats[player] as any).tb = tbWins;
          });
        } else {
          (playerStats[group[0]] as any).tb = 0;
        }
      });

      const leaderboardData = Object.entries(playerStats).map(([name, stats]) => {
        const totalMatches = stats.wins + stats.losses;
        const winRate = totalMatches > 0 ? (stats.wins / totalMatches) * 100 : 0;
        const ptsDiff = stats.pointsFor - stats.pointsAgainst;
        return {
          participant: name,
          matchWins: stats.wins,
          matchLosses: stats.losses,
          score: stats.score,
          tb: (stats as any).tb || 0,
          buchholz: (stats as any).buchholz || 0,
          ptsDiff,
          totalMatches,
          winRate,
          rank: 0,
        };
      });

      leaderboardData.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.tb !== a.tb) return b.tb - a.tb;
        if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;
        if (b.ptsDiff !== a.ptsDiff) return b.ptsDiff - a.ptsDiff;
        return 0;
      });

      leaderboardData.forEach((entry, idx) => (entry.rank = idx + 1));
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error fetching tournament leaderboard:', error);
      setLeaderboard([]);
    }
  };

  const fetchGlobalLeaderboard = async () => {
    try {
      const { data: matches, error } = await supabase
        .from('match_results')
        .select(`*, tournaments!inner(is_practice)`);

      if (error) throw error;

      const filteredMatches = (matches || []).filter(match => !match.tournaments?.is_practice);
      if (filteredMatches.length === 0) return setLeaderboard([]);

      const playerStats: {
        [name: string]: { wins: number; losses: number; totalPoints: number; pointsAgainst: number; tournaments: Set<string> };
      } = {};

      filteredMatches.forEach(match => {
        const { player1_name, player2_name, winner_name, points_awarded, tournament_id } = match;

        if (!playerStats[player1_name]) {
          playerStats[player1_name] = { wins: 0, losses: 0, totalPoints: 0, pointsAgainst: 0, tournaments: new Set() };
        }
        if (!playerStats[player2_name]) {
          playerStats[player2_name] = { wins: 0, losses: 0, totalPoints: 0, pointsAgainst: 0, tournaments: new Set() };
        }

        playerStats[player1_name].tournaments.add(tournament_id);
        playerStats[player2_name].tournaments.add(tournament_id);

        const points = points_awarded || 0;
        if (winner_name === player1_name) {
          playerStats[player1_name].wins++;
          playerStats[player1_name].totalPoints += points;
          playerStats[player2_name].losses++;
          playerStats[player2_name].pointsAgainst += points;
        } else if (winner_name === player2_name) {
          playerStats[player2_name].wins++;
          playerStats[player2_name].totalPoints += points;
          playerStats[player1_name].losses++;
          playerStats[player1_name].pointsAgainst += points;
        }
      });

      const globalLeaderboardData = Object.entries(playerStats).map(([name, stats]) => {
        const totalMatches = stats.wins + stats.losses;
        const winRate = totalMatches > 0 ? (stats.wins / totalMatches) * 100 : 0;
        const ptsDiff = stats.totalPoints - stats.pointsAgainst;
        return {
          participant: name,
          matchWins: stats.wins,
          matchLosses: stats.losses,
          score: stats.totalPoints,
          tb: stats.wins,
          buchholz: stats.tournaments.size,
          ptsDiff,
          totalMatches,
          winRate,
          rank: 0,
        };
      });

      globalLeaderboardData.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.tb !== a.tb) return b.tb - a.tb;
        if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;
        return b.ptsDiff - a.ptsDiff;
      });

      globalLeaderboardData.forEach((entry, index) => (entry.rank = index + 1));
      setLeaderboard(globalLeaderboardData);
    } catch (error) {
      console.error('Error fetching global leaderboard:', error);
      setLeaderboard([]);
    }
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

  const handleTabChange = (tab: 'tournament' | 'global' | 'community') => {
    setCurrentTab(tab);
    setLeaderboard([]);
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
    <div className="bg-slate-950 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold flex items-center text-white mb-2">
              <Crown size={40} className="mr-3 text-yellow-400" />
              Leaderboards
            </h1>
            <p className="text-slate-400 text-lg">Tournament rankings and player standings</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-cyan-600 text-white px-4 py-2 rounded-xl hover:bg-cyan-500 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Tabs + Tournament Selection */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleTabChange('tournament')}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                  currentTab === 'tournament'
                    ? 'bg-cyan-600 text-white shadow-lg'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Trophy size={16} /> Tournament
              </button>
              <button
                onClick={() => handleTabChange('global')}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                  currentTab === 'global'
                    ? 'bg-cyan-600 text-white shadow-lg'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Target size={16} /> Global
              </button>
              <button
                onClick={() => handleTabChange('community')}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                  currentTab === 'community'
                    ? 'bg-cyan-600 text-white shadow-lg'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Users size={16} /> Community
              </button>
            </div>

            {currentTab === 'tournament' && (
              <div className="flex items-center gap-2 w-full md:ml-auto">
                <label className="text-sm text-slate-400">Tournament:</label>
                <select
                  value={selectedTournament}
                  onChange={(e) => setSelectedTournament(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">-- Select --</option>
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.status}) - {new Date(t.tournament_date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Community Coming Soon */}
        {currentTab === 'community' && (
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12">
              <div className="w-24 h-24 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                <Users size={48} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Community Leaderboards</h2>
              <div className="inline-block bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-6 py-2 rounded-full font-bold text-lg mb-6 shadow-lg">
                COMING SOON
              </div>
              <p className="text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Soon, every community will have their own leaderboards to track local champions and rising stars.
              </p>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        {(currentTab === 'tournament' || currentTab === 'global') && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="bg-slate-900/80 border-b border-slate-800 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp size={22} className="text-cyan-400" />
                {currentTab === 'tournament'
                  ? `${tournaments.find(t => t.id === selectedTournament)?.name || 'Tournament'} Leaderboard`
                  : 'Global Leaderboard'}
              </h2>
              <span className="text-sm text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                {leaderboard.length} participants
              </span>
            </div>

            {leaderboard.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 size={32} className="text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No Data Available</h3>
                <p className="text-slate-400">
                  {currentTab === 'tournament' && !selectedTournament
                    ? 'Please select a tournament to view its leaderboard'
                    : 'No match results found'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800">
                  <thead className="bg-slate-900">
                    <tr>
                      {['Rank','Participant','Match W-L','Score','TB','Buchholz','Pts Diff'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {leaderboard.map((entry) => (
                      <tr key={entry.participant} className="hover:bg-slate-800/50">
                        <td className="px-6 py-4 whitespace-nowrap flex items-center gap-2">
                          {getRankIcon(entry.rank)}
                          <span className="text-white font-bold">{entry.rank <= 3 ? '' : `#${entry.rank}`}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {entry.participant.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{entry.participant}</div>
                            <div className="text-xs text-slate-400">{entry.winRate.toFixed(1)}% win rate</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          <span className="text-green-400 font-medium">{entry.matchWins}</span>
                          <span className="text-slate-500 mx-1">-</span>
                          <span className="text-red-400 font-medium">{entry.matchLosses}</span>
                          <div className="text-xs text-slate-400">{entry.totalMatches} total</div>
                        </td>
                        <td className="px-6 py-4 text-center text-cyan-400 font-bold">{entry.score}</td>
                        <td className="px-6 py-4 text-center text-white">{entry.tb}</td>
                        <td className="px-6 py-4 text-center text-white">{entry.buchholz}</td>
                        <td className="px-6 py-4 text-center font-medium">
                          <span className={entry.ptsDiff > 0 ? 'text-green-400' : entry.ptsDiff < 0 ? 'text-red-400' : 'text-slate-400'}>
                            {entry.ptsDiff > 0 ? '+' : ''}{entry.ptsDiff}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
