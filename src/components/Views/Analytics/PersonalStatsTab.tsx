import React, { useState, useEffect } from 'react';
import { Trophy, Target, TrendingUp, Zap, Shield, Clock, Activity, ShieldCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

interface PersonalStats {
  totalMatches: number;
  totalWins: number;
  totalPoints: number;
  weightedWinRate: number;
  mvpCombo: string;
  avgPointsPerMatch: number;
  avgPointsPerFinish: number;
  riskReward: number;
}

interface BladeLineStats {
  line: string;
  matches: number;
  wins: number;
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

export function PersonalStatsTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PersonalStats>({
    totalMatches: 0,
    totalWins: 0,
    totalPoints: 0,
    weightedWinRate: 0,
    mvpCombo: 'N/A',
    avgPointsPerMatch: 0,
    avgPointsPerFinish: 0,
    riskReward: 0
  });
  const [finishDistribution, setFinishDistribution] = useState<any[]>([]);
  const [pointsPerFinish, setPointsPerFinish] = useState<any[]>([]);
  const [bladeLineStats, setBladeLineStats] = useState<BladeLineStats[]>([]);
  const [comboPerformance, setComboPerformance] = useState<any[]>([]);

  useEffect(() => {
    if (user && !user.id.startsWith('guest-')) {
      fetchPersonalStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  const calculateWeightedWinRate = (wins: number, totalMatches: number): number => {
    if (totalMatches === 0) return 0;
    return (wins / totalMatches) * (totalMatches / (totalMatches + 10));
  };

  const calculateComboScore = (weightedWinRate: number, pointsPerGame: number): number => {
    return weightedWinRate * (pointsPerGame / 3) * 100;
  };

  const calculateRiskReward = (finishCounts: { [key: string]: number }): number => {
    const total = Object.values(finishCounts).reduce((sum, count) => sum + count, 0);
    if (total === 0) return 0;
    
    // Calculate variance in finish types (higher = more risky/rewarding)
    const finishRates = Object.entries(finishCounts).map(([finish, count]) => ({
      finish,
      rate: count / total,
      points: FINISH_POINTS[finish as keyof typeof FINISH_POINTS] || 0
    }));
    
    const avgPoints = finishRates.reduce((sum, f) => sum + (f.rate * f.points), 0);
    const variance = finishRates.reduce((sum, f) => sum + (f.rate * Math.pow(f.points - avgPoints, 2)), 0);
    
    return Math.sqrt(variance) * 100; // Convert to percentage
  };

  const fetchPersonalStats = async () => {
    try {
      // Fetch user's matches
      const { data: matches, error } = await supabase
        .from('match_results')
        .select('*')
        .or(`player1_name.eq.${user.username},player2_name.eq.${user.username}`);

      if (error) throw error;

      const userMatches = matches || [];
      const totalMatches = userMatches.length;
      
      if (totalMatches === 0) {
        setLoading(false);
        return;
      }

      // Process matches
      const finishCounts: { [key: string]: number } = {};
      const pointsPerFinishType: { [key: string]: { total: number; count: number } } = {};
      const bladeLineData: { [key: string]: { wins: number; matches: number; points: number } } = {};
      const comboData: { [key: string]: { wins: number; matches: number; points: number } } = {};
      
      let totalWins = 0;
      let totalPoints = 0;

      userMatches.forEach(match => {
        const isPlayer1 = match.player1_name === user.username;
        const isWin = match.winner_name === user.username;
        const userBeyblade = isPlayer1 ? match.player1_beyblade : match.player2_beyblade;
        const userBladeLine = isPlayer1 ? match.player1_blade_line : match.player2_blade_line;
        const outcome = match.outcome?.split(' (')[0] || 'Unknown';
        const points = match.points_awarded || FINISH_POINTS[outcome as keyof typeof FINISH_POINTS] || 0;

        if (isWin) {
          totalWins++;
          totalPoints += points;
        }

        // Finish distribution
        finishCounts[outcome] = (finishCounts[outcome] || 0) + 1;
        
        // Points per finish type
        if (!pointsPerFinishType[outcome]) {
          pointsPerFinishType[outcome] = { total: 0, count: 0 };
        }
        if (isWin) {
          pointsPerFinishType[outcome].total += points;
          pointsPerFinishType[outcome].count++;
        }

        // Blade line stats
        if (userBladeLine) {
          if (!bladeLineData[userBladeLine]) {
            bladeLineData[userBladeLine] = { wins: 0, matches: 0, points: 0 };
          }
          bladeLineData[userBladeLine].matches++;
          if (isWin) {
            bladeLineData[userBladeLine].wins++;
            bladeLineData[userBladeLine].points += points;
          }
        }

        // Combo performance
        if (userBeyblade) {
          if (!comboData[userBeyblade]) {
            comboData[userBeyblade] = { wins: 0, matches: 0, points: 0 };
          }
          comboData[userBeyblade].matches++;
          if (isWin) {
            comboData[userBeyblade].wins++;
            comboData[userBeyblade].points += points;
          }
        }
      });

      // Calculate stats
      const weightedWinRate = calculateWeightedWinRate(totalWins, totalMatches);
      const avgPointsPerMatch = totalMatches > 0 ? totalPoints / totalMatches : 0;
      const avgPointsPerFinish = totalWins > 0 ? totalPoints / totalWins : 0;
      const riskReward = calculateRiskReward(finishCounts);

      // Find MVP combo
      const mvpCombo = Object.entries(comboData)
        .map(([combo, stats]) => {
          const winRate = stats.matches > 0 ? stats.wins / stats.matches : 0;
          const weightedWR = calculateWeightedWinRate(stats.wins, stats.matches);
          const pointsPerGame = stats.matches > 0 ? stats.points / stats.matches : 0;
          const score = calculateComboScore(weightedWR, pointsPerGame);
          return { combo, score };
        })
        .sort((a, b) => b.score - a.score)[0]?.combo || 'N/A';

      setStats({
        totalMatches,
        totalWins,
        totalPoints,
        weightedWinRate: weightedWinRate * 100,
        mvpCombo,
        avgPointsPerMatch,
        avgPointsPerFinish,
        riskReward
      });

      // Process finish distribution for chart
      const finishData = Object.entries(finishCounts).map(([finish, count]) => ({
        name: finish,
        value: count,
        percentage: ((count / totalMatches) * 100).toFixed(1)
      }));

      // Process points per finish
      const pointsData = Object.entries(pointsPerFinishType).map(([finish, data]) => ({
        finish,
        avgPoints: data.count > 0 ? data.total / data.count : 0,
        totalPoints: data.total
      }));

      // Process blade line stats
      const bladeLineArray: BladeLineStats[] = Object.entries(bladeLineData).map(([line, data]) => ({
        line,
        matches: data.matches,
        wins: data.wins,
        winRate: data.matches > 0 ? (data.wins / data.matches) * 100 : 0,
        avgPoints: data.matches > 0 ? data.points / data.matches : 0
      }));

      // Process combo performance
      const comboArray = Object.entries(comboData)
        .map(([combo, data]) => {
          const winRate = data.matches > 0 ? data.wins / data.matches : 0;
          const weightedWR = calculateWeightedWinRate(data.wins, data.matches);
          const pointsPerGame = data.matches > 0 ? data.points / data.matches : 0;
          const score = calculateComboScore(weightedWR, pointsPerGame);
          
          return {
            combo,
            matches: data.matches,
            wins: data.wins,
            winRate: winRate * 100,
            score,
            avgPoints: pointsPerGame
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      setFinishDistribution(finishData);
      setPointsPerFinish(pointsData);
      setBladeLineStats(bladeLineArray);
      setComboPerformance(comboArray);

    } catch (error) {
      console.error('Error fetching personal stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.id.startsWith('guest-')) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy size={32} className="text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Personal Analytics</h3>
        <p className="text-gray-600 mb-6">
          Login to view your detailed performance statistics, combo analysis, and personal metrics.
        </p>
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 max-w-md mx-auto">
          <h4 className="text-lg font-semibold text-blue-900 mb-3">What You'll See:</h4>
          <div className="space-y-2 text-sm text-blue-800 text-left">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Weighted win rates and combo scores
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              MVP Beyblade and performance trends
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Finish type analysis and risk/reward metrics
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Blade line performance comparison
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading personal statistics...</p>
      </div>
    );
  }

  if (stats.totalMatches === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target size={32} className="text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Match Data</h3>
        <p className="text-gray-600">
          You haven't participated in any recorded matches yet. Join a tournament to see your personal analytics!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Personal Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="metric-label">Weighted Win Rate</p>
              <p className="metric-value">{stats.weightedWinRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">{stats.totalWins}/{stats.totalMatches} matches</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="metric-label">MVP Combo</p>
              <p className="text-sm font-bold text-gray-900 truncate">{stats.mvpCombo}</p>
              <p className="text-xs text-gray-500">Highest combo score</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
              <Trophy size={24} />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="metric-label">Avg Points/Match</p>
              <p className="metric-value">{stats.avgPointsPerMatch.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Per finish: {stats.avgPointsPerFinish.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <Zap size={24} />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="metric-label">Risk/Reward</p>
              <p className="metric-value">{stats.riskReward.toFixed(1)}</p>
              <p className="text-xs text-gray-500">Finish volatility</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <Activity size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Finish Distribution */}
        <div className="chart-container">
          <h2 className="chart-title">Your Finish Distribution</h2>
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
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                >
                  {finishDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={FINISH_COLORS[entry.name as keyof typeof FINISH_COLORS] || '#6B7280'} />
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

        {/* Points Per Finish Type */}
        <div className="chart-container">
          <h2 className="chart-title">Average Points Per Finish Type</h2>
          {pointsPerFinish.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pointsPerFinish}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="finish" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgPoints" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No points data available
            </div>
          )}
        </div>
      </div>

      {/* Win Rate vs Blade Line */}
      {bladeLineStats.length > 0 && (
        <div className="chart-container">
          <h2 className="chart-title">Performance by Blade Line</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blade Line
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matches
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wins
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
                {bladeLineStats.map((line, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {line.line}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {line.matches}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-center font-medium">
                      {line.wins}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-medium">
                      {line.winRate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {line.avgPoints.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Combo Performance */}
      {comboPerformance.length > 0 && (
        <div className="chart-container">
          <h2 className="chart-title">Your Top Combo Performance</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Combo
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matches
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Win Rate
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Combo Score
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Points
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {comboPerformance.map((combo, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {combo.combo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {combo.matches}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {combo.winRate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600 text-center">
                      {combo.score.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {combo.avgPoints.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}