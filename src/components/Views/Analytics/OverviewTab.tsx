import React, { useState, useEffect } from 'react';
import { Trophy, Target, TrendingUp, Users, Zap, Shield, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

interface OverviewStats {
  totalMatches: number;
  totalPlayers: number;
  totalTournaments: number;
  weightedWinRate: number;
  mvpCombo: string;
  comboDiversity: number;
  avgPointsPerMatch: number;
}

interface FinishData {
  name: string;
  value: number;
  color: string;
}

interface ComboData {
  combo: string;
  score: number;
  matches: number;
  winRate: number;
}

interface HeadToHeadData {
  opponent: string;
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
  avgPoints: number;
}

const FINISH_COLORS = {
  'Spin Finish': '#3B82F6',
  'Burst Finish': '#EF4444', 
  'Over Finish': '#F59E0B',
  'Extreme Finish': '#8B5CF6'
};

const FINISH_POINTS = {
  'Spin Finish': 1,
  'Burst Finish': 2,
  'Over Finish': 2,
  'Extreme Finish': 3
};

export function OverviewTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OverviewStats>({
    totalMatches: 0,
    totalPlayers: 0,
    totalTournaments: 0,
    weightedWinRate: 0,
    mvpCombo: 'N/A',
    comboDiversity: 0,
    avgPointsPerMatch: 0
  });
  const [finishDistribution, setFinishDistribution] = useState<FinishData[]>([]);
  const [pointsContribution, setPointsContribution] = useState<any[]>([]);
  const [topCombos, setTopCombos] = useState<ComboData[]>([]);
  const [headToHead, setHeadToHead] = useState<HeadToHeadData[]>([]);

  useEffect(() => {
    fetchOverviewData();
  }, [user]);

  const calculateWeightedWinRate = (wins: number, totalMatches: number): number => {
    if (totalMatches === 0) return 0;
    return (wins / totalMatches) * (totalMatches / (totalMatches + 10));
  };

  const calculateComboScore = (weightedWinRate: number, pointsPerGame: number): number => {
    return weightedWinRate * (pointsPerGame / 3) * 100;
  };

  const fetchOverviewData = async () => {
    try {
      // Fetch all match results
      const { data: matches, error: matchError } = await supabase
        .from('match_results')
        .select('*');

      if (matchError) throw matchError;

      // Fetch tournament and player counts
      const [tournamentsRes, playersRes] = await Promise.all([
        supabase.from('tournaments').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
      ]);

      const allMatches = matches || [];
      const totalMatches = allMatches.length;
      const totalTournaments = tournamentsRes.count || 0;
      const totalPlayers = playersRes.count || 0;

      // Process matches for current user if logged in
      let userMatches = allMatches;
      if (user && !user.id.startsWith('guest-')) {
        userMatches = allMatches.filter(match => 
          match.player1_name === user.username || match.player2_name === user.username
        );
      }

      // Calculate finish distribution
      const finishCounts: { [key: string]: number } = {};
      const pointsPerFinish: { [key: string]: number } = {};
      const comboStats: { [key: string]: { wins: number; matches: number; points: number } } = {};
      const opponentStats: { [key: string]: { wins: number; matches: number; points: number } } = {};

      userMatches.forEach(match => {
        const isPlayer1 = user && match.player1_name === user.username;
        const isPlayer2 = user && match.player2_name === user.username;
        const isUserMatch = isPlayer1 || isPlayer2;
        
        if (!isUserMatch && user && !user.id.startsWith('guest-')) return;

        const outcome = match.outcome?.split(' (')[0] || 'Unknown';
        const points = match.points_awarded || FINISH_POINTS[outcome as keyof typeof FINISH_POINTS] || 0;
        
        // Finish distribution
        finishCounts[outcome] = (finishCounts[outcome] || 0) + 1;
        pointsPerFinish[outcome] = (pointsPerFinish[outcome] || 0) + points;

        if (isUserMatch) {
          const userBeyblade = isPlayer1 ? match.player1_beyblade : match.player2_beyblade;
          const opponent = isPlayer1 ? match.player2_name : match.player1_name;
          const isWin = match.winner_name === user.username;

          // Combo stats
          if (!comboStats[userBeyblade]) {
            comboStats[userBeyblade] = { wins: 0, matches: 0, points: 0 };
          }
          comboStats[userBeyblade].matches++;
          if (isWin) {
            comboStats[userBeyblade].wins++;
            comboStats[userBeyblade].points += points;
          }

          // Head-to-head stats
          if (!opponentStats[opponent]) {
            opponentStats[opponent] = { wins: 0, matches: 0, points: 0 };
          }
          opponentStats[opponent].matches++;
          if (isWin) {
            opponentStats[opponent].wins++;
            opponentStats[opponent].points += points;
          }
        }
      });

      // Process finish distribution
      const finishData: FinishData[] = Object.entries(finishCounts).map(([finish, count]) => ({
        name: finish,
        value: count,
        color: FINISH_COLORS[finish as keyof typeof FINISH_COLORS] || '#6B7280'
      }));

      // Process points contribution
      const pointsData = Object.entries(pointsPerFinish).map(([finish, points]) => ({
        finish,
        points,
        matches: finishCounts[finish] || 0
      }));

      // Process top combos
      const combosData: ComboData[] = Object.entries(comboStats)
        .map(([combo, stats]) => {
          const winRate = stats.matches > 0 ? stats.wins / stats.matches : 0;
          const weightedWinRate = calculateWeightedWinRate(stats.wins, stats.matches);
          const pointsPerGame = stats.matches > 0 ? stats.points / stats.matches : 0;
          const comboScore = calculateComboScore(weightedWinRate, pointsPerGame);
          
          return {
            combo,
            score: comboScore,
            matches: stats.matches,
            winRate: winRate * 100
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      // Process head-to-head
      const h2hData: HeadToHeadData[] = Object.entries(opponentStats)
        .map(([opponent, stats]) => ({
          opponent,
          matches: stats.matches,
          wins: stats.wins,
          losses: stats.matches - stats.wins,
          winRate: stats.matches > 0 ? (stats.wins / stats.matches) * 100 : 0,
          avgPoints: stats.matches > 0 ? stats.points / stats.matches : 0
        }))
        .sort((a, b) => b.winRate - a.winRate);

      // Calculate overview stats
      const userTotalMatches = Object.values(comboStats).reduce((sum, stats) => sum + stats.matches, 0);
      const userTotalWins = Object.values(comboStats).reduce((sum, stats) => sum + stats.wins, 0);
      const userTotalPoints = Object.values(comboStats).reduce((sum, stats) => sum + stats.points, 0);
      
      const weightedWinRate = calculateWeightedWinRate(userTotalWins, userTotalMatches);
      const mvpCombo = combosData.length > 0 ? combosData[0].combo : 'N/A';
      const comboDiversity = Object.keys(comboStats).length;
      const avgPointsPerMatch = userTotalMatches > 0 ? userTotalPoints / userTotalMatches : 0;

      setStats({
        totalMatches,
        totalPlayers,
        totalTournaments,
        weightedWinRate: weightedWinRate * 100,
        mvpCombo,
        comboDiversity,
        avgPointsPerMatch
      });

      setFinishDistribution(finishData);
      setPointsContribution(pointsData);
      setTopCombos(combosData);
      setHeadToHead(h2hData);

    } catch (error) {
      console.error('Error fetching overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="metric-label">Global Matches</p>
              <p className="metric-value">{stats.totalMatches}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <Target size={24} />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="metric-label">Active Players</p>
              <p className="metric-value">{stats.totalPlayers}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="metric-label">Tournaments</p>
              <p className="metric-value">{stats.totalTournaments}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <Trophy size={24} />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="metric-label">Weighted Win Rate</p>
              <p className="metric-value">{stats.weightedWinRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Personal Performance (if logged in) */}
      {user && !user.id.startsWith('guest-') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-label">MVP Combo</p>
                <p className="text-lg font-bold text-gray-900 truncate">{stats.mvpCombo}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                <Trophy size={24} />
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-label">Combo Diversity</p>
                <p className="metric-value">{stats.comboDiversity}</p>
              </div>
              <div className="p-3 rounded-lg bg-indigo-100 text-indigo-600">
                <Target size={24} />
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-label">Avg Points/Match</p>
                <p className="metric-value">{stats.avgPointsPerMatch.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600">
                <Zap size={24} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Finish Type Distribution */}
        <div className="chart-container">
          <h2 className="chart-title">Finish Type Distribution</h2>
          {finishDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={finishDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {finishDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No finish data available
            </div>
          )}
        </div>

        {/* Points Contribution */}
        <div className="chart-container">
          <h2 className="chart-title">Points Contribution by Finish Type</h2>
          {pointsContribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={pointsContribution}>
                <PolarGrid />
                <PolarAngleAxis dataKey="finish" />
                <PolarRadiusAxis />
                <Radar
                  name="Points"
                  dataKey="points"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No points data available
            </div>
          )}
        </div>
      </div>

      {/* Top Combos */}
      <div className="chart-container">
        <h2 className="chart-title">Top Combos by Score</h2>
        {topCombos.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topCombos} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="combo" 
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'score' ? `${Number(value).toFixed(2)}` : value,
                  name === 'score' ? 'Combo Score' : name
                ]}
                labelFormatter={(label) => `Combo: ${label}`}
              />
              <Legend />
              <Bar dataKey="score" fill="#3B82F6" name="Combo Score" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No combo data available
          </div>
        )}
      </div>

      {/* Head-to-Head Global */}
      {user && !user.id.startsWith('guest-') && headToHead.length > 0 && (
        <div className="chart-container">
          <h2 className="chart-title">Head-to-Head Performance</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opponent
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matches
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wins
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Losses
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Win Rate
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Points
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {headToHead.map((h2h, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {h2h.opponent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {h2h.matches}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-center font-medium">
                      {h2h.wins}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-center font-medium">
                      {h2h.losses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-medium">
                      {h2h.winRate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {h2h.avgPoints.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Guest User Message */}
      {(!user || user.id.startsWith('guest-')) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Personal Analytics Available</h3>
          <p className="text-blue-800 mb-4">
            Login to see your personal performance metrics, combo scores, and detailed head-to-head statistics.
          </p>
          <p className="text-sm text-blue-700">
            The overview shows global tournament data. Personal stats require an account to track your individual performance.
          </p>
        </div>
      )}
    </div>
  );
}