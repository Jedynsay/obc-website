import React, { useState, useEffect } from 'react';
import { Trophy, Users, Target, TrendingUp, Zap, Shield, Clock, Crown, Search, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

interface ShowAllModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any[];
  columns: { key: string; label: string }[];
  onRowClick?: (row: any) => void;
}

function ShowAllModal({ isOpen, onClose, title, data, columns, onRowClick }: ShowAllModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(row => 
    columns.some(col => 
      String(row[col.key] || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-950 border border-cyan-500/30 rounded-2xl shadow-[0_0_40px_rgba(0,200,255,0.3)] max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-500 to-purple-500 px-6 py-4 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-cyan-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="overflow-auto max-h-[60vh]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-slate-900 sticky top-0">
                <tr>
                  {columns.map(col => (
                    <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-slate-950 divide-y divide-slate-800">
                {filteredData.map((row, index) => (
                  <tr 
                    key={index} 
                    className={`hover:bg-slate-800/50 ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map(col => (
                      <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {typeof row[col.key] === 'number' ? 
                          (col.key.includes('Rate') || col.key.includes('Score') ? 
                            row[col.key].toFixed(1) : row[col.key]) : 
                          String(row[col.key] || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

interface GlobalStats {
  totalMatches: number;
  totalPlayers: number;
  totalTournaments: number;
  avgPointsPerMatch: number;
  mostCommonFinish: string;
  topPlayer: string;
  topPlayerWinRate: number;
}

interface GlobalCombo {
  combo: string;
  player: string;
  wins: number;
  losses: number;
  totalMatches: number;
  winRate: number;
  weightedWinRate: number;
  totalPoints: number;
  avgPointsPerMatch: number;
  comboScore: number;
  bladeLine: string;
}

interface PersonalOverview {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  weightedWinRate: number;
  totalPoints: number;
  avgPointsPerMatch: number;
  mvpCombo: string;
  mvpComboScore: number;
  favoriteFinish: string;
  tournamentsPlayed: number;
}

interface HeadToHeadRecord {
  opponent: string;
  wins: number;
  losses: number;
  winRate: number;
  totalMatches: number;
  pointsFor: number;
  pointsAgainst: number;
}

const FINISH_POINTS = {
  'Spin Finish': 1,
  'Burst Finish': 2,
  'Over Finish': 2,
  'Extreme Finish': 3
};

const FINISH_COLORS = {
  'Spin Finish': '#10B981',
  'Burst Finish': '#F59E0B',
  'Over Finish': '#EF4444',
  'Extreme Finish': '#8B5CF6'
};

export function OverviewTab() {
  const { user } = useAuth();
  const [showAllModal, setShowAllModal] = useState<{
    isOpen: boolean;
    title: string;
    data: any[];
    columns: { key: string; label: string }[];
    onRowClick?: (row: any) => void;
  }>({
    isOpen: false,
    title: '',
    data: [],
    columns: []
  });
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalMatches: 0,
    totalPlayers: 0,
    totalTournaments: 0,
    avgPointsPerMatch: 0,
    mostCommonFinish: '',
    topPlayer: '',
    topPlayerWinRate: 0
  });
  
  const [globalCombos, setGlobalCombos] = useState<GlobalCombo[]>([]);
  const [personalOverview, setPersonalOverview] = useState<PersonalOverview | null>(null);
  const [headToHeadRecords, setHeadToHeadRecords] = useState<HeadToHeadRecord[]>([]);
  const [finishDistribution, setFinishDistribution] = useState<any[]>([]);
  const [playerStats, setPlayerStats] = useState<{ [name: string]: { wins: number; matches: number; points: number } }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGlobalData();
    if (user && !user.id.startsWith('guest-')) {
      fetchPersonalData();
    }
  }, [user]);

  const fetchGlobalData = async () => {
    try {
      // Fetch all matches across all tournaments
      let { data: allMatches, error: matchError } = await supabase
        .from('match_results')
        .select(`
          *,
          tournaments!inner(is_practice)
        `);

      if (matchError) throw matchError;

      // Filter out practice tournament matches
      const matches = (allMatches || []).filter(match => 
        !match.tournaments?.is_practice
      );
      
      if (matches.length === 0) {
        setLoading(false);
        return;
      }

      // Calculate global stats
      const playerStatsMap: { [name: string]: { wins: number; matches: number; points: number } } = {};
      const comboStats: { [key: string]: GlobalCombo } = {};
      const finishCounts: { [finish: string]: number } = {};
      let totalPoints = 0;

      matches.forEach(match => {
        if (!match.winner_name || !match.player1_name || !match.player2_name) return;

        const outcome = match.outcome?.split(' (')[0] || 'Unknown';
        const points = match.points_awarded || FINISH_POINTS[outcome as keyof typeof FINISH_POINTS] || 0;
        totalPoints += points;

        // Count finishes
        finishCounts[outcome] = (finishCounts[outcome] || 0) + 1;

        // Process both players
        const normalizedPlayer1 = match.normalized_player1_name || match.player1_name.toLowerCase();
        const normalizedPlayer2 = match.normalized_player2_name || match.player2_name.toLowerCase();
        const normalizedWinner = match.normalized_winner_name || match.winner_name.toLowerCase();
        
        [normalizedPlayer1, normalizedPlayer2].forEach((normalizedName, index) => {
          const displayName = index === 0 ? match.player1_name : match.player2_name;
          
          if (!playerStatsMap[displayName]) {
            playerStatsMap[displayName] = { wins: 0, matches: 0, points: 0 };
          }
          playerStatsMap[displayName].matches++;
          
          if (normalizedWinner === normalizedName) {
            playerStatsMap[displayName].wins++;
            playerStatsMap[displayName].points += points;
          }
        });

        // Process combos
        const processCombo = (player: string, beyblade: string, bladeLine: string, isWin: boolean) => {
          const comboKey = `${beyblade}_${player}`;
          
          if (!comboStats[comboKey]) {
            comboStats[comboKey] = {
              combo: beyblade,
              player,
              wins: 0,
              losses: 0,
              totalMatches: 0,
              winRate: 0,
              weightedWinRate: 0,
              totalPoints: 0,
              avgPointsPerMatch: 0,
              comboScore: 0,
              bladeLine: bladeLine || 'Unknown'
            };
          }

          const combo = comboStats[comboKey];
          combo.totalMatches++;
          
          if (isWin) {
            combo.wins++;
            combo.totalPoints += points;
          } else {
            combo.losses++;
          }
        };

        processCombo(match.player1_name, match.player1_beyblade, match.player1_blade_line || 'Unknown', match.winner_name === match.player1_name);
        processCombo(match.player2_name, match.player2_beyblade, match.player2_blade_line || 'Unknown', match.winner_name === match.player2_name);
      });

      // Calculate combo scores
      Object.values(comboStats).forEach(combo => {
        combo.winRate = combo.totalMatches > 0 ? (combo.wins / combo.totalMatches) * 100 : 0;
        combo.weightedWinRate = combo.totalMatches > 0 ? (combo.wins / combo.totalMatches) * (combo.totalMatches / (combo.totalMatches + 10)) : 0;
        combo.avgPointsPerMatch = combo.totalMatches > 0 ? combo.totalPoints / combo.totalMatches : 0;
        combo.comboScore = combo.weightedWinRate * (combo.avgPointsPerMatch / 3) * 100;
      });

      // Find top player
      const topPlayerEntry = Object.entries(playerStatsMap)
        .filter(([_, stats]) => stats.matches >= 5) // Minimum matches for consideration
        .sort((a, b) => {
          const aWinRate = a[1].wins / a[1].matches;
          const bWinRate = b[1].wins / b[1].matches;
          return bWinRate - aWinRate;
        })[0];

      const mostCommonFinish = Object.entries(finishCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

      // Get tournament count
      const { count: tournamentCount } = await supabase
        .from('tournaments')
        .select('*', { count: 'exact', head: true });

      setGlobalStats({
        totalMatches: matches.length,
        totalPlayers: Object.keys(playerStatsMap).length,
        totalTournaments: tournamentCount || 0,
        avgPointsPerMatch: matches.length > 0 ? totalPoints / matches.length : 0,
        mostCommonFinish,
        topPlayer: topPlayerEntry?.[0] || 'N/A',
        topPlayerWinRate: topPlayerEntry ? (topPlayerEntry[1].wins / topPlayerEntry[1].matches) * 100 : 0
      });

      setGlobalCombos(Object.values(comboStats).sort((a, b) => b.comboScore - a.comboScore));
      
      // Store player stats for global rankings
      setPlayerStats(playerStatsMap);

      // Prepare finish distribution for chart
      const finishData = Object.entries(finishCounts).map(([finish, count]) => ({
        name: finish,
        value: count,
        color: FINISH_COLORS[finish as keyof typeof FINISH_COLORS] || '#6B7280'
      }));
      setFinishDistribution(finishData);

    } catch (error) {
      console.error('Error fetching global data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonalData = async () => {
    if (!user || user.id.startsWith('guest-')) return;

    try {
      // Fetch user's matches across all tournaments
      let { data: userMatches, error } = await supabase
        .from('match_results')
        .select(`
          *,
          tournaments!inner(is_practice)
        `)
        .or(`normalized_player1_name.eq.${user.username.toLowerCase()},normalized_player2_name.eq.${user.username.toLowerCase()}`);

      if (error) throw error;

      // Filter out practice tournament matches
      const matches = (userMatches || []).filter(match => 
        !match.tournaments?.is_practice
      );
      
      if (matches.length === 0) {
        setPersonalOverview(null);
        return;
      }

      let wins = 0;
      let totalPoints = 0;
      const comboStats: { [combo: string]: { wins: number; matches: number; points: number } } = {};
      const finishCounts: { [finish: string]: number } = {};
      const opponentStats: { [opponent: string]: HeadToHeadRecord } = {};
      const tournamentsSet = new Set<string>();

      matches.forEach(match => {
        if (!match.winner_name) return;

        const isPlayer1 = match.player1_name === user.username;
        const isWinner = match.winner_name === user.username;
        const userBeyblade = isPlayer1 ? match.player1_beyblade : match.player2_beyblade;
        const opponent = isPlayer1 ? match.player2_name : match.player1_name;
        const outcome = match.outcome?.split(' (')[0] || 'Unknown';
        const points = match.points_awarded || FINISH_POINTS[outcome as keyof typeof FINISH_POINTS] || 0;

        tournamentsSet.add(match.tournament_id);

        if (isWinner) {
          wins++;
          totalPoints += points;
          finishCounts[outcome] = (finishCounts[outcome] || 0) + 1;
        }

        // Track combo performance
        if (!comboStats[userBeyblade]) {
          comboStats[userBeyblade] = { wins: 0, matches: 0, points: 0 };
        }
        comboStats[userBeyblade].matches++;
        if (isWinner) {
          comboStats[userBeyblade].wins++;
          comboStats[userBeyblade].points += points;
        }

        // Track head-to-head
        if (!opponentStats[opponent]) {
          opponentStats[opponent] = {
            opponent,
            wins: 0,
            losses: 0,
            winRate: 0,
            totalMatches: 0,
            pointsFor: 0,
            pointsAgainst: 0
          };
        }
        
        opponentStats[opponent].totalMatches++;
        if (isWinner) {
          opponentStats[opponent].wins++;
          opponentStats[opponent].pointsFor += points;
        } else {
          opponentStats[opponent].losses++;
          opponentStats[opponent].pointsAgainst += points;
        }
      });

      // Calculate head-to-head win rates
      Object.values(opponentStats).forEach(record => {
        record.winRate = record.totalMatches > 0 ? (record.wins / record.totalMatches) * 100 : 0;
      });

      // Find MVP combo
      const mvpComboEntry = Object.entries(comboStats)
        .map(([combo, stats]) => {
          const winRate = stats.matches > 0 ? stats.wins / stats.matches : 0;
          const weightedWinRate = stats.matches > 0 ? winRate * (stats.matches / (stats.matches + 10)) : 0;
          const avgPoints = stats.matches > 0 ? stats.points / stats.matches : 0;
          const comboScore = weightedWinRate * (avgPoints / 3) * 100;
          return { combo, comboScore };
        })
        .sort((a, b) => b.comboScore - a.comboScore)[0];

      const favoriteFinish = Object.entries(finishCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      const totalMatches = matches.length;
      const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
      const weightedWinRate = totalMatches > 0 ? (wins / totalMatches) * (totalMatches / (totalMatches + 10)) : 0;

      setPersonalOverview({
        totalMatches,
        wins,
        losses: totalMatches - wins,
        winRate,
        weightedWinRate: weightedWinRate * 100,
        totalPoints,
        avgPointsPerMatch: totalMatches > 0 ? totalPoints / totalMatches : 0,
        mvpCombo: mvpComboEntry?.combo || 'N/A',
        mvpComboScore: mvpComboEntry?.comboScore || 0,
        favoriteFinish,
        tournamentsPlayed: tournamentsSet.size
      });

      setHeadToHeadRecords(Object.values(opponentStats).sort((a, b) => b.winRate - a.winRate));

    } catch (error) {
      console.error('Error fetching personal data:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading overview data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Global Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="group relative border border-slate-700 bg-slate-900/40 p-6 rounded-none 
                       transition-all duration-300 hover:border-cyan-400/70 
                       hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] backdrop-blur-sm">
          {/* Animated bottom underline */}
          <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 
                           w-0 transition-all duration-500 group-hover:w-full" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-cyan-400 mb-1">{globalStats.totalMatches.toLocaleString()}</div>
              <div className="text-sm font-medium text-slate-400">Total Matches</div>
            </div>
            <div className="p-3 bg-cyan-500/20 rounded-lg">
              <Target size={24} className="text-cyan-400" />
            </div>
          </div>
        </div>

        <div className="group relative border border-slate-700 bg-slate-900/40 p-6 rounded-none 
                       transition-all duration-300 hover:border-cyan-400/70 
                       hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] backdrop-blur-sm">
          {/* Animated bottom underline */}
          <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 
                           w-0 transition-all duration-500 group-hover:w-full" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-green-400 mb-1">{globalStats.totalPlayers}</div>
              <div className="text-sm font-medium text-slate-400">Active Players</div>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <Users size={24} className="text-green-400" />
            </div>
          </div>
        </div>

        <div className="group relative border border-slate-700 bg-slate-900/40 p-6 rounded-none 
                       transition-all duration-300 hover:border-cyan-400/70 
                       hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] backdrop-blur-sm">
          {/* Animated bottom underline */}
          <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 
                           w-0 transition-all duration-500 group-hover:w-full" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-purple-400 mb-1">{globalStats.totalTournaments}</div>
              <div className="text-sm font-medium text-slate-400">Tournaments</div>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Trophy size={24} className="text-purple-400" />
            </div>
          </div>
        </div>

        <div className="group relative border border-slate-700 bg-slate-900/40 p-6 rounded-none 
                       transition-all duration-300 hover:border-cyan-400/70 
                       hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] backdrop-blur-sm">
          {/* Animated bottom underline */}
          <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 
                           w-0 transition-all duration-500 group-hover:w-full" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-orange-400 mb-1">{globalStats.avgPointsPerMatch.toFixed(2)}</div>
              <div className="text-sm font-medium text-slate-400">Avg Points/Match</div>
            </div>
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <TrendingUp size={24} className="text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Personal Overview (if logged in) */}
      {personalOverview && (
        <div className="group relative border border-slate-700 bg-slate-900/40 p-6 rounded-none 
                       transition-all duration-300 hover:border-cyan-400/70 
                       hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] backdrop-blur-sm">
          {/* Animated bottom underline */}
          <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 
                           w-0 transition-all duration-500 group-hover:w-full" />
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <Users size={24} className="mr-2 text-cyan-400" />
            Your Performance Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-none">
              <div className="text-2xl font-bold text-cyan-400">{personalOverview.totalMatches}</div>
              <div className="text-sm text-slate-400">Total Matches</div>
            </div>
            <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-none">
              <div className="text-2xl font-bold text-green-400">{personalOverview.winRate.toFixed(1)}%</div>
              <div className="text-sm text-slate-400">Win Rate</div>
            </div>
            <div className="text-center p-4 bg-purple-500/10 border border-purple-500/20 rounded-none">
              <div className="text-2xl font-bold text-purple-400">{personalOverview.weightedWinRate.toFixed(1)}%</div>
              <div className="text-sm text-slate-400">Weighted Win Rate</div>
            </div>
            <div className="text-center p-4 bg-orange-500/10 border border-orange-500/20 rounded-none">
              <div className="text-2xl font-bold text-orange-400">{personalOverview.avgPointsPerMatch.toFixed(2)}</div>
              <div className="text-sm text-slate-400">Avg Points/Match</div>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 border border-cyan-500/20 rounded-none p-4">
              <h4 className="font-semibold text-cyan-400 mb-2">MVP Combo</h4>
              <p className="text-lg font-bold text-white">{personalOverview.mvpCombo}</p>
              <p className="text-sm text-slate-400">Score: {personalOverview.mvpComboScore.toFixed(1)}</p>
            </div>
            <div className="bg-slate-800/50 border border-cyan-500/20 rounded-none p-4">
              <h4 className="font-semibold text-cyan-400 mb-2">Favorite Finish</h4>
              <p className="text-lg font-bold text-white">{personalOverview.favoriteFinish}</p>
              <p className="text-sm text-slate-400">Tournaments: {personalOverview.tournamentsPlayed}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Global Finish Distribution */}
        <div className="group relative border border-slate-700 bg-slate-900/40 p-6 rounded-none 
                       transition-all duration-300 hover:border-cyan-400/70 
                       hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] backdrop-blur-sm">
          {/* Animated bottom underline */}
          <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 
                           w-0 transition-all duration-500 group-hover:w-full" />
          <h3 className="text-lg font-bold text-white mb-4">Global Finish Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={finishDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {finishDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Global Combos */}
        <div className="group relative border border-slate-700 bg-slate-900/40 p-6 rounded-none 
                       transition-all duration-300 hover:border-cyan-400/70 
                       hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] backdrop-blur-sm">
          {/* Animated bottom underline */}
          <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 
                           w-0 transition-all duration-500 group-hover:w-full" />
          <h3 className="text-lg font-bold text-white mb-4">Top Global Combos by Score</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={globalCombos.slice(0, 8).map(combo => ({
                name: combo.combo,
                score: combo.comboScore,
                winRate: combo.winRate,
                matches: combo.totalMatches
              }))}
              margin={{ bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                fontSize={10}
                stroke="#94a3b8"
              />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                formatter={(value, name) => [
                  typeof value === 'number' ? value.toFixed(2) : value,
                  name === 'score' ? 'Combo Score' : name === 'winRate' ? 'Win Rate (%)' : 'Matches'
                ]}
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '8px' }}
                labelStyle={{ color: '#06b6d4' }}
              />
              <Bar dataKey="score" fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Global Combo Rankings Table */}
      <div className="group relative border border-slate-700 bg-slate-900/40 p-6 rounded-none 
                     transition-all duration-300 hover:border-cyan-400/70 
                     hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] backdrop-blur-sm">
        {/* Animated bottom underline */}
        <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 
                         w-0 transition-all duration-500 group-hover:w-full" />
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Global Combo Rankings</h3>
        </div>
        
        {/* Group combos by name and calculate aggregate stats */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50">
                  Combo
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50">
                  Users
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50">
                  Total Matches
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50">
                  Global Win Rate
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50">
                  Avg Points
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-950/50 divide-y divide-slate-800">
              {(() => {
                // Group combos by name and calculate aggregate stats
                const comboGroups: { [comboName: string]: {
                  combo: string;
                  players: string[];
                  totalMatches: number;
                  totalWins: number;
                  totalPoints: number;
                  winRate: number;
                  avgPoints: number;
                  playerData: any[];
                }} = {};
                
                globalCombos.forEach(combo => {
                  if (!comboGroups[combo.combo]) {
                    comboGroups[combo.combo] = {
                      combo: combo.combo,
                      players: [],
                      totalMatches: 0,
                      totalWins: 0,
                      totalPoints: 0,
                      winRate: 0,
                      avgPoints: 0,
                      playerData: []
                    };
                  }
                  
                  const group = comboGroups[combo.combo];
                  group.players.push(combo.player);
                  group.totalMatches += combo.totalMatches;
                  group.totalWins += combo.wins;
                  group.totalPoints += combo.totalPoints;
                  group.playerData.push(combo);
                });
                
                // Calculate final stats for each group
                Object.values(comboGroups).forEach(group => {
                  group.winRate = group.totalMatches > 0 ? (group.totalWins / group.totalMatches) * 100 : 0;
                  group.avgPoints = group.totalMatches > 0 ? group.totalPoints / group.totalMatches : 0;
                });
                
                return Object.values(comboGroups)
                  .sort((a, b) => b.winRate - a.winRate)
                  .slice(0, 20);
              })().map((comboGroup, index) => (
                <tr key={index} className="hover:bg-slate-800/50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {comboGroup.combo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white text-center">
                    {comboGroup.players.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white text-center">
                    {comboGroup.totalMatches}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className={`font-medium ${
                      comboGroup.winRate >= 60 ? 'text-green-400' :
                      comboGroup.winRate >= 40 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {comboGroup.winRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-white">
                    {comboGroup.avgPoints.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => {
                        // Show modal with players who used this combo
                        const modalData = comboGroup.playerData.map(playerCombo => ({
                          player: playerCombo.player,
                          matches: playerCombo.totalMatches,
                          wins: playerCombo.wins,
                          winRate: playerCombo.winRate,
                          avgPoints: playerCombo.avgPointsPerMatch,
                          bladeLine: playerCombo.bladeLine
                        }));
                        
                        setShowAllModal({
                          isOpen: true,
                          title: `Players using ${comboGroup.combo}`,
                          data: modalData,
                          columns: [
                            { key: 'player', label: 'Player' },
                            { key: 'matches', label: 'Matches' },
                            { key: 'wins', label: 'Wins' },
                            { key: 'winRate', label: 'Win Rate (%)' },
                            { key: 'avgPoints', label: 'Avg Points' },
                            { key: 'bladeLine', label: 'Blade Line' }
                          ]
                        });
                      }}
                      className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
                    >
                      View Players
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Head-to-Head Records (Personal) */}
      {personalOverview && headToHeadRecords.length > 0 && (
        <div className="group relative border border-slate-700 bg-slate-900/40 p-6 rounded-none 
                       transition-all duration-300 hover:border-cyan-400/70 
                       hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] backdrop-blur-sm">
          {/* Animated bottom underline */}
          <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 
                           w-0 transition-all duration-500 group-hover:w-full" />
          <h3 className="text-lg font-bold text-white mb-4">Your Head-to-Head Records</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    Opponent
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    Matches
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    Wins
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    Losses
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    Win Rate
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    Points For
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    Points Against
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-950/50 divide-y divide-slate-800">
                {headToHeadRecords.map((record, index) => (
                  <tr key={index} className="hover:bg-slate-800/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {record.opponent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white text-center">
                      {record.totalMatches}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400 text-center font-medium">
                      {record.wins}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-400 text-center font-medium">
                      {record.losses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`font-medium ${
                        record.winRate >= 60 ? 'text-green-400' :
                        record.winRate >= 40 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {record.winRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white text-center">
                      {record.pointsFor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white text-center">
                      {record.pointsAgainst}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Global Player Rankings */}
      <div className="group relative border border-slate-700 bg-slate-900/40 p-6 rounded-none 
                     transition-all duration-300 hover:border-cyan-400/70 
                     hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] backdrop-blur-sm">
        {/* Animated bottom underline */}
        <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 
                         w-0 transition-all duration-500 group-hover:w-full" />
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white">Global Player Rankings</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top 10 Table */}
          <div className="lg:col-span-2">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50">
                      Player
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50">
                      Matches
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50">
                      Wins
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50">
                      Win Rate
                    </th>
                    {/* <th className="px-6 py-3 text-center text-xs font-medium text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50">
                      Tournaments
                    </th> */}
                  </tr>
                </thead>
                <tbody className="bg-slate-950/50 divide-y divide-slate-800">
                  {Object.entries(playerStats || {})
                    .filter(([_, stats]) => stats.matches >= 3) // Minimum matches for ranking
                    .sort((a, b) => {
                      const aWinRate = a[1].wins / a[1].matches;
                      const bWinRate = b[1].wins / b[1].matches;
                      if (bWinRate !== aWinRate) return bWinRate - aWinRate;
                      return b[1].wins - a[1].wins; // Tiebreaker: total wins
                    })
                    .slice(0, 10)
                    .map(([playerName, stats], index) => (
                      <tr key={playerName} className="hover:bg-slate-800/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-black text-xs font-bold mr-3 shadow-lg ${
                              index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                              index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                              index === 2 ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-cyan-500 to-purple-500'
                            }`}>
                              {index + 1}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {playerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white text-center">
                          {stats.matches}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400 text-center font-medium">
                          {stats.wins}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className={`font-medium ${
                            (stats.wins / stats.matches) * 100 >= 60 ? 'text-green-400' :
                            (stats.wins / stats.matches) * 100 >= 40 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {((stats.wins / stats.matches) * 100).toFixed(1)}%
                          </span>
                        </td>
                        {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-white text-center">
                          {Math.ceil(stats.matches / 10)}
                        </td> */}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Top Player Spotlight Card */}
          <div className="lg:col-span-1">
            <div className="group relative border border-slate-700 bg-slate-900/40 p-6 rounded-none 
                           transition-all duration-300 hover:border-cyan-400/70 
                           hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] backdrop-blur-sm text-center">
              {/* Animated bottom underline */}
              <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 
                               w-0 transition-all duration-500 group-hover:w-full" />
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                <Trophy size={40} className="text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                <Crown size={16} className="text-black" />
              </div>
              <h4 className="text-xl font-bold text-yellow-400 mb-2">Global Champion</h4>
              <p className="text-2xl font-bold text-white mb-1">{globalStats.topPlayer}</p>
              <p className="text-yellow-300 text-sm mb-4">Win Rate: {globalStats.topPlayerWinRate.toFixed(1)}%</p>
              
              <div className="bg-slate-800/60 backdrop-blur-sm rounded-none p-4 border border-yellow-400/30">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-yellow-400">
                      {Object.entries(playerStats || {})
                        .find(([name]) => name === globalStats.topPlayer)?.[1]?.wins || 0}
                    </div>
                    <div className="text-xs text-yellow-300">Total Wins</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-yellow-400">
                      {Object.entries(playerStats || {})
                        .find(([name]) => name === globalStats.topPlayer)?.[1]?.matches || 0}
                    </div>
                    <div className="text-xs text-yellow-300">Total Matches</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ShowAllModal
        isOpen={showAllModal.isOpen}
        onClose={() => setShowAllModal(prev => ({ ...prev, isOpen: false }))}
        title={showAllModal.title}
        data={showAllModal.data}
        columns={showAllModal.columns}
        onRowClick={showAllModal.onRowClick}
      />
    </div>
  );
}