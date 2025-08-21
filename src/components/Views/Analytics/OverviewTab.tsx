import React, { useState, useEffect } from 'react';
import { Trophy, Users, Target, TrendingUp, Zap, Shield, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

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
      const { data: allMatches, error: matchError } = await supabase
        .from('match_results')
        .select('*');

      if (matchError) throw matchError;

      const matches = allMatches || [];
      
      if (matches.length === 0) {
        setLoading(false);
        return;
      }

      // Calculate global stats
      const playerStats: { [name: string]: { wins: number; matches: number; points: number } } = {};
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
        [match.player1_name, match.player2_name].forEach(playerName => {
          if (!playerStats[playerName]) {
            playerStats[playerName] = { wins: 0, matches: 0, points: 0 };
          }
          playerStats[playerName].matches++;
          
          if (match.winner_name === playerName) {
            playerStats[playerName].wins++;
            playerStats[playerName].points += points;
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
      const topPlayerEntry = Object.entries(playerStats)
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
        totalPlayers: Object.keys(playerStats).length,
        totalTournaments: tournamentCount || 0,
        avgPointsPerMatch: matches.length > 0 ? totalPoints / matches.length : 0,
        mostCommonFinish,
        topPlayer: topPlayerEntry?.[0] || 'N/A',
        topPlayerWinRate: topPlayerEntry ? (topPlayerEntry[1].wins / topPlayerEntry[1].matches) * 100 : 0
      });

      setGlobalCombos(Object.values(comboStats).sort((a, b) => b.comboScore - a.comboScore));

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
      const { data: userMatches, error } = await supabase
        .from('match_results')
        .select('*')
        .or(`player1_name.eq.${user.username},player2_name.eq.${user.username}`);

      if (error) throw error;

      const matches = userMatches || [];
      
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
    <div className="space-y-8">
      {/* Global Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="metric-value">{globalStats.totalMatches.toLocaleString()}</div>
              <div className="metric-label">Total Matches</div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Target size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="metric-value">{globalStats.totalPlayers}</div>
              <div className="metric-label">Active Players</div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Users size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="metric-value">{globalStats.totalTournaments}</div>
              <div className="metric-label">Tournaments</div>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Trophy size={24} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="metric-value">{globalStats.avgPointsPerMatch.toFixed(2)}</div>
              <div className="metric-label">Avg Points/Match</div>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp size={24} className="text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Personal Overview (if logged in) */}
      {personalOverview && (
        <div className="chart-container">
          <h2 className="chart-title flex items-center">
            <Users size={24} className="mr-2 text-blue-600" />
            Your Performance Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{personalOverview.totalMatches}</div>
              <div className="text-sm text-gray-600">Total Matches</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{personalOverview.winRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Win Rate</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{personalOverview.weightedWinRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Weighted Win Rate</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{personalOverview.avgPointsPerMatch.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Avg Points/Match</div>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">MVP Combo</h4>
              <p className="text-lg font-bold text-blue-600">{personalOverview.mvpCombo}</p>
              <p className="text-sm text-gray-600">Score: {personalOverview.mvpComboScore.toFixed(1)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Favorite Finish</h4>
              <p className="text-lg font-bold text-green-600">{personalOverview.favoriteFinish}</p>
              <p className="text-sm text-gray-600">Tournaments: {personalOverview.tournamentsPlayed}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Global Finish Distribution */}
        <div className="chart-container">
          <h3 className="chart-title">Global Finish Distribution</h3>
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
        <div className="chart-container">
          <h3 className="chart-title">Top Global Combos by Score</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={globalCombos.slice(0, 8).map(combo => ({
              name: combo.combo.length > 15 ? combo.combo.substring(0, 15) + '...' : combo.combo,
              score: combo.comboScore,
              winRate: combo.winRate,
              matches: combo.totalMatches
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  typeof value === 'number' ? value.toFixed(2) : value,
                  name === 'score' ? 'Combo Score' : name === 'winRate' ? 'Win Rate (%)' : 'Matches'
                ]}
              />
              <Bar dataKey="score" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Global Combo Rankings Table */}
      <div className="chart-container">
        <h3 className="chart-title">Global Combo Rankings</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Combo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Blade Line
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Matches
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Win Rate
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weighted Win Rate
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Combo Score
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {globalCombos.slice(0, 20).map((combo, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {combo.combo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {combo.player}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      combo.bladeLine === 'Basic' ? 'bg-blue-100 text-blue-800' :
                      combo.bladeLine === 'Unique' ? 'bg-purple-100 text-purple-800' :
                      combo.bladeLine === 'Custom' ? 'bg-orange-100 text-orange-800' :
                      combo.bladeLine === 'X-Over' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {combo.bladeLine}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {combo.totalMatches}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className={`font-medium ${
                      combo.winRate >= 60 ? 'text-green-600' :
                      combo.winRate >= 40 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {combo.winRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 text-center">
                    {(combo.weightedWinRate * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 text-center">
                    {combo.comboScore.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Head-to-Head Records (Personal) */}
      {personalOverview && headToHeadRecords.length > 0 && (
        <div className="chart-container">
          <h3 className="chart-title">Your Head-to-Head Records</h3>
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
                    Points For
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points Against
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {headToHeadRecords.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.opponent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {record.totalMatches}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-center font-medium">
                      {record.wins}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-center font-medium">
                      {record.losses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`font-medium ${
                        record.winRate >= 60 ? 'text-green-600' :
                        record.winRate >= 40 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {record.winRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {record.pointsFor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
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
      <div className="chart-container">
        <h3 className="chart-title">Global Player Rankings</h3>
        <div className="text-center py-8">
          <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Top Player</h4>
          <p className="text-2xl font-bold text-blue-600">{globalStats.topPlayer}</p>
          <p className="text-gray-600">Win Rate: {globalStats.topPlayerWinRate.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}