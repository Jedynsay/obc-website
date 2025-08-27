import React, { useState, useEffect } from 'react';
import { User, Trophy, Target, TrendingUp, Zap, Shield, Clock, Activity, ShieldCheck } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

interface DevPlayerSelectorProps {
  selectedPlayer: string;
  onPlayerChange: (player: string) => void;
  availablePlayers: string[];
}

function DevPlayerSelector({ selectedPlayer, onPlayerChange, availablePlayers }: DevPlayerSelectorProps) {
  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
      <div className="flex items-center mb-3">
        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-2">
          <span className="text-white text-xs font-bold">D</span>
        </div>
        <h3 className="text-lg font-bold text-red-900">Developer Mode</h3>
      </div>
      <div className="max-w-md">
        <label className="block text-sm font-medium text-red-800 mb-2">
          View Personal Stats for Player:
        </label>
        <select
          value={selectedPlayer}
          onChange={(e) => onPlayerChange(e.target.value)}
          className="w-full border border-red-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">-- Select Player --</option>
          {availablePlayers.map(player => (
            <option key={player} value={player}>{player}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

interface PersonalCombo {
  combo: string;
  wins: number;
  losses: number;
  totalMatches: number;
  winRate: number;
  weightedWinRate: number;
  totalPoints: number;
  avgPointsPerMatch: number;
  comboScore: number;
  bladeLine: string;
  finishDistribution: { [finish: string]: number };
  pointsPerFinish: { [finish: string]: number };
}

interface BladeLinePerformance {
  bladeLine: string;
  matches: number;
  wins: number;
  winRate: number;
  avgPoints: number;
  riskReward: number;
}

interface TournamentPerformance {
  tournamentName: string;
  matches: number;
  wins: number;
  winRate: number;
  points: number;
  avgPointsPerMatch: number;
  date: string;
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

export function PersonalStatsTab() {
  const { user } = useAuth();
  const [devSelectedPlayer, setDevSelectedPlayer] = useState<string>('');
  const [availablePlayers, setAvailablePlayers] = useState<string[]>([]);
  const [personalCombos, setPersonalCombos] = useState<PersonalCombo[]>([]);
  const [bladeLinePerformance, setBladeLinePerformance] = useState<BladeLinePerformance[]>([]);
  const [tournamentHistory, setTournamentHistory] = useState<TournamentPerformance[]>([]);
  const [finishDistribution, setFinishDistribution] = useState<any[]>([]);
  const [pointsPerFinish, setPointsPerFinish] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCombo, setSelectedCombo] = useState<string>('');

  const isDeveloper = user?.role === 'developer';
  const targetPlayer = isDeveloper && devSelectedPlayer ? devSelectedPlayer : user?.username;

  useEffect(() => {
    if (isDeveloper) {
      fetchAvailablePlayers();
    }
    if (targetPlayer) {
      fetchPersonalStats(targetPlayer);
    } else {
      setLoading(false);
    }
  }, [user, devSelectedPlayer]);

  const fetchAvailablePlayers = async () => {
    try {
      const { data: matches } = await supabase
        .from('match_results')
        .select('player1_name, player2_name');
      
      const playerSet = new Set<string>();
      matches?.forEach(match => {
        if (match.player1_name) playerSet.add(match.player1_name);
        if (match.player2_name) playerSet.add(match.player2_name);
      });
      
      setAvailablePlayers(Array.from(playerSet).sort());
    } catch (error) {
      console.error('Error fetching available players:', error);
    }
  };

  const fetchPersonalStats = async (playerName: string) => {
    if (!playerName) {
      setLoading(false);
      return;
    }

    try {
      // Fetch all user matches
      const { data: userMatches, error: matchError } = await supabase
        .from('match_results')
        .select('*')
        .or(`normalized_player1_name.eq.${playerName.toLowerCase()},normalized_player2_name.eq.${playerName.toLowerCase()}`);

      if (matchError) throw matchError;

      const matches = userMatches || [];
      
      if (matches.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch tournament names for history
      const tournamentIds = [...new Set(matches.map(m => m.tournament_id))];
      const { data: tournaments } = await supabase
        .from('tournaments')
        .select('id, name, tournament_date')
        .in('id', tournamentIds);

      const tournamentMap = (tournaments || []).reduce((acc, t) => {
        acc[t.id] = { name: t.name, date: t.tournament_date };
        return acc;
      }, {} as { [id: string]: { name: string; date: string } });

      // Process personal data
      const tournamentStats: { [id: string]: TournamentPerformance } = {};
      const comboStats: { [combo: string]: PersonalCombo } = {};
      const bladeLineStats: { [bladeLine: string]: BladeLinePerformance } = {};
      const finishCounts: { [finish: string]: number } = {};
      const pointsPerFinishMap: { [finish: string]: number } = {};

      matches.forEach(match => {
        if (!match.winner_name) return;

        const isPlayer1 = match.player1_name === playerName;
        const isWinner = match.winner_name === playerName;
        const userBeyblade = isPlayer1 ? match.player1_beyblade : match.player2_beyblade;
        const userBladeLine = isPlayer1 ? match.player1_blade_line : match.player2_blade_line;
        const outcome = match.outcome?.split(' (')[0] || 'Unknown';
        const points = match.points_awarded || FINISH_POINTS[outcome as keyof typeof FINISH_POINTS] || 0;

        // Track finishes and points
        if (isWinner) {
          finishCounts[outcome] = (finishCounts[outcome] || 0) + 1;
          pointsPerFinishMap[outcome] = (pointsPerFinishMap[outcome] || 0) + points;
        }

        // Process combo stats
        if (!comboStats[userBeyblade]) {
          comboStats[userBeyblade] = {
            combo: userBeyblade,
            wins: 0,
            losses: 0,
            totalMatches: 0,
            winRate: 0,
            weightedWinRate: 0,
            totalPoints: 0,
            avgPointsPerMatch: 0,
            comboScore: 0,
            bladeLine: userBladeLine || 'Unknown',
            finishDistribution: {},
            pointsPerFinish: {}
          };
        }

        const combo = comboStats[userBeyblade];
        combo.totalMatches++;
        
        if (isWinner) {
          combo.wins++;
          combo.totalPoints += points;
          combo.finishDistribution[outcome] = (combo.finishDistribution[outcome] || 0) + 1;
          combo.pointsPerFinish[outcome] = (combo.pointsPerFinish[outcome] || 0) + points;
        } else {
          combo.losses++;
        }

        // Process blade line stats
        const bladeLine = userBladeLine || 'Unknown';
        if (!bladeLineStats[bladeLine]) {
          bladeLineStats[bladeLine] = {
            bladeLine,
            matches: 0,
            wins: 0,
            winRate: 0,
            avgPoints: 0,
            riskReward: 0
          };
        }

        const bladeLineStat = bladeLineStats[bladeLine];
        bladeLineStat.matches++;
        if (isWinner) {
          bladeLineStat.wins++;
          bladeLineStat.avgPoints = ((bladeLineStat.avgPoints * (bladeLineStat.wins - 1)) + points) / bladeLineStat.wins;
        }

        // Process tournament stats
        const tournamentId = match.tournament_id;
        if (!tournamentStats[tournamentId]) {
          tournamentStats[tournamentId] = {
            tournamentName: tournamentMap[tournamentId]?.name || 'Unknown Tournament',
            matches: 0,
            wins: 0,
            winRate: 0,
            points: 0,
            avgPointsPerMatch: 0,
            date: tournamentMap[tournamentId]?.date || ''
          };
        }

        const tournamentStat = tournamentStats[tournamentId];
        tournamentStat.matches++;
        if (isWinner) {
          tournamentStat.wins++;
          tournamentStat.points += points;
        }
      });

      // Calculate final stats
      Object.values(comboStats).forEach(combo => {
        combo.winRate = combo.totalMatches > 0 ? (combo.wins / combo.totalMatches) * 100 : 0;
        combo.weightedWinRate = combo.totalMatches > 0 ? (combo.wins / combo.totalMatches) * (combo.totalMatches / (combo.totalMatches + 10)) : 0;
        combo.avgPointsPerMatch = combo.totalMatches > 0 ? combo.totalPoints / combo.totalMatches : 0;
        combo.comboScore = combo.weightedWinRate * (combo.avgPointsPerMatch / 3) * 100;
      });

      Object.values(bladeLineStats).forEach(bladeLine => {
        bladeLine.winRate = bladeLine.matches > 0 ? (bladeLine.wins / bladeLine.matches) * 100 : 0;
        // Calculate risk/reward as variance in finish types
        bladeLine.riskReward = Math.random() * 100; // Placeholder calculation
      });

      Object.values(tournamentStats).forEach(tournament => {
        tournament.winRate = tournament.matches > 0 ? (tournament.wins / tournament.matches) * 100 : 0;
        tournament.avgPointsPerMatch = tournament.matches > 0 ? tournament.points / tournament.matches : 0;
      });

      setPersonalCombos(Object.values(comboStats).sort((a, b) => b.comboScore - a.comboScore));
      setBladeLinePerformance(Object.values(bladeLineStats));
      setTournamentHistory(Object.values(tournamentStats).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

      // Prepare chart data
      const finishData = Object.entries(finishCounts).map(([finish, count]) => ({
        name: finish,
        value: count,
        color: FINISH_COLORS[finish as keyof typeof FINISH_COLORS] || '#6B7280'
      }));
      setFinishDistribution(finishData);

      const pointsData = Object.entries(pointsPerFinishMap).map(([finish, points]) => ({
        finish,
        points,
        avgPoints: finishCounts[finish] > 0 ? points / finishCounts[finish] : 0
      }));
      setPointsPerFinish(pointsData);

    } catch (error) {
      console.error('Error fetching personal stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.id.startsWith('guest-')) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User size={32} className="text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-blue-900 mb-2">Login Required</h3>
        <p className="text-blue-800">
          Please log in to view your personal tournament statistics and performance analytics.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading personal stats...</p>
      </div>
    );
  }

  if (!targetPlayer || personalCombos.length === 0) {
    return (
      <div className="space-y-6">
        {isDeveloper && (
          <DevPlayerSelector
            selectedPlayer={devSelectedPlayer}
            onPlayerChange={setDevSelectedPlayer}
            availablePlayers={availablePlayers}
          />
        )}
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Match History</h3>
          <p className="text-gray-600">
            {isDeveloper && devSelectedPlayer 
              ? `${devSelectedPlayer} hasn't participated in any recorded matches yet.`
              : "You haven't participated in any recorded matches yet. Join a tournament to start building your statistics!"
            }
          </p>
        </div>
      </div>
    );
  }

  const selectedComboData = selectedCombo ? personalCombos.find(c => c.combo === selectedCombo) : null;

  return (
    <div className="space-y-8">
      {/* Developer Player Selector */}
      {isDeveloper && (
        <DevPlayerSelector
          selectedPlayer={devSelectedPlayer}
          onPlayerChange={setDevSelectedPlayer}
          availablePlayers={availablePlayers}
        />
      )}
      
      {/* Personal Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="metric-value">{personalCombos.reduce((sum, combo) => sum + combo.totalMatches, 0)}</div>
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
              <div className="metric-value">
                {personalCombos.length > 0 ? 
                  ((personalCombos.reduce((sum, combo) => sum + combo.wins, 0) / 
                    personalCombos.reduce((sum, combo) => sum + combo.totalMatches, 0)) * 100).toFixed(1) : '0.0'}%
              </div>
              <div className="metric-label">Overall Win Rate</div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Trophy size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="metric-value">{personalCombos.reduce((sum, combo) => sum + combo.totalPoints, 0)}</div>
              <div className="metric-label">Total Points</div>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Zap size={24} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="metric-value">{tournamentHistory.length}</div>
              <div className="metric-label">Tournaments Played</div>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <User size={24} className="text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personal Finish Distribution */}
        <div className="chart-container">
          <h3 className="chart-title">Your Finish Distribution</h3>
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

        {/* Points Per Finish Type with Values */}
        <div className="chart-container">
          <h3 className="chart-title">Points Per Finish Type</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pointsPerFinish}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="finish" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="points" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-4">Points Breakdown</h4>
              <div className="space-y-3">
                {pointsPerFinish.map((finish) => (
                  <div key={finish.finish} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{finish.finish}:</span>
                    <span className="text-lg font-bold text-blue-600">{finish.points}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Combo Performance */}
      <div className="chart-container">
        <h3 className="chart-title">Your Combo Performance</h3>
        <div className="mb-4">
          <select
            value={selectedCombo}
            onChange={(e) => setSelectedCombo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select combo for detailed view</option>
            {personalCombos.map(combo => (
              <option key={combo.combo} value={combo.combo}>
                {combo.combo} ({combo.totalMatches} matches)
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  Combo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  Blade Line
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  Matches
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  Win Rate
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  Weighted Win Rate
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  Avg Points
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  Combo Score
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {personalCombos.map((combo, index) => (
                <tr 
                  key={index} 
                  className={`hover:bg-gray-50 cursor-pointer ${
                    selectedCombo === combo.combo ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedCombo(combo.combo === selectedCombo ? '' : combo.combo)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {combo.combo}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {combo.avgPointsPerMatch.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 text-center">
                    {combo.comboScore.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Selected Combo Details */}
        {selectedComboData && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="text-lg font-bold text-blue-900 mb-4">
              Detailed Analysis: {selectedComboData.combo}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-semibold text-gray-900 mb-3">Win Finishes</h5>
                <div className="space-y-2">
                  {Object.entries(selectedComboData.finishDistribution).map(([finish, count]) => (
                    <div key={finish} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{finish}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{count}</span>
                        <span className="text-xs text-gray-500">
                          ({selectedComboData.totalMatches > 0 ? ((count / selectedComboData.wins) * 100).toFixed(0) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h5 className="font-semibold text-gray-900 mb-3">Points Breakdown</h5>
                <div className="space-y-2">
                  {Object.entries(selectedComboData.pointsPerFinish).map(([finish, points]) => (
                    <div key={finish} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{finish}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{points} pts</span>
                        <span className="text-xs text-gray-500">
                          (avg: {selectedComboData.finishDistribution[finish] > 0 ? 
                            (points / selectedComboData.finishDistribution[finish]).toFixed(1) : '0.0'})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Tournament History */}
      <div className="chart-container">
        <h3 className="chart-title">Tournament History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  Tournament
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  Date
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  Matches
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  Wins
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  Win Rate
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  Total Points
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  Avg Points
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tournamentHistory.map((tournament, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {tournament.tournamentName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {tournament.date ? new Date(tournament.date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {tournament.matches}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-center font-medium">
                    {tournament.wins}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className={`font-medium ${
                      tournament.winRate >= 60 ? 'text-green-600' :
                      tournament.winRate >= 40 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {tournament.winRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-medium">
                    {tournament.points}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {tournament.avgPointsPerMatch.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MVP Combo Spotlight */}
      {personalCombos.length > 0 && (
        <div className="chart-container">
          <h3 className="chart-title">
            {isDeveloper && devSelectedPlayer ? `${devSelectedPlayer}'s MVP Combo` : 'Your MVP Combo'}
          </h3>
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy size={40} className="text-white" />
            </div>
            <h4 className="text-2xl font-bold text-gray-900 mb-2">{personalCombos[0].combo}</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{personalCombos[0].totalMatches}</div>
                <div className="text-sm text-gray-600">Matches</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">{personalCombos[0].winRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-600">{personalCombos[0].avgPointsPerMatch.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Avg Points</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-orange-600">{personalCombos[0].comboScore.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Combo Score</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}