import React, { useState, useEffect } from 'react';
import { Users, Trophy, Target, TrendingUp } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { supabase } from '../../../lib/supabase';

interface PlayerAnalyticsSubTabProps {
  tournamentId: string;
  loading?: boolean;
}

interface PlayerData {
  name: string;
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
  weightedWinRate: number;
  totalPoints: number;
  avgPointsPerMatch: number;
  mvpCombo: string;
  mvpComboScore: number;
  mostCommonWinFinish: string;
  mostCommonLoseFinish: string;
  finishDistribution: { [key: string]: number };
  phasePerformance: { [phase: number]: { wins: number; matches: number; points: number } };
}

interface HeadToHeadData {
  player1: string;
  player2: string;
  p1Wins: number;
  p2Wins: number;
  totalMatches: number;
  p1WinRate: number;
}

const FINISH_POINTS = {
  'Spin Finish': 1,
  'Burst Finish': 2,
  'Over Finish': 2,
  'Extreme Finish': 3
};

export function PlayerAnalyticsSubTab({ tournamentId, loading = false }: PlayerAnalyticsSubTabProps) {
  const [players, setPlayers] = useState<{ [name: string]: PlayerData }>({});
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [headToHead, setHeadToHead] = useState<HeadToHeadData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (tournamentId) {
      fetchPlayerAnalytics();
    }
  }, [tournamentId]);

  const calculateWeightedWinRate = (wins: number, totalMatches: number): number => {
    if (totalMatches === 0) return 0;
    return (wins / totalMatches) * (totalMatches / (totalMatches + 10));
  };

  const calculateComboScore = (weightedWinRate: number, pointsPerGame: number): number => {
    return weightedWinRate * (pointsPerGame / 3) * 100;
  };

  const fetchPlayerAnalytics = async () => {
    try {
      const { data: matches, error } = await supabase
        .from('match_results')
        .select('*')
        .eq('tournament_id', tournamentId);

      if (error) throw error;

      const allMatches = matches || [];
      
      if (allMatches.length === 0) {
        setIsLoading(false);
        return;
      }

      // Process player data
      const playersMap: { [name: string]: PlayerData } = {};
      const h2hMap: { [key: string]: HeadToHeadData } = {};

      allMatches.forEach(match => {
        if (!match.winner_name || !match.player1_name || !match.player2_name) return;

        const outcome = match.outcome?.split(' (')[0] || 'Unknown';
        const points = match.points_awarded || FINISH_POINTS[outcome as keyof typeof FINISH_POINTS] || 0;
        const phase = match.phase_number || 1;

        // Initialize players
        [match.player1_name, match.player2_name].forEach(playerName => {
          if (!playersMap[playerName]) {
            playersMap[playerName] = {
              name: playerName,
              matches: 0,
              wins: 0,
              losses: 0,
              winRate: 0,
              weightedWinRate: 0,
              totalPoints: 0,
              avgPointsPerMatch: 0,
              mvpCombo: '',
              mvpComboScore: 0,
              mostCommonWinFinish: '',
              mostCommonLoseFinish: '',
              finishDistribution: {},
              phasePerformance: {}
            };
          }
        });

        // Update player stats
        const winner = playersMap[match.winner_name];
        const loser = playersMap[match.winner_name === match.player1_name ? match.player2_name : match.player1_name];

        winner.matches++;
        winner.wins++;
        winner.totalPoints += points;
        winner.finishDistribution[outcome] = (winner.finishDistribution[outcome] || 0) + 1;
        
        if (!winner.phasePerformance[phase]) {
          winner.phasePerformance[phase] = { wins: 0, matches: 0, points: 0 };
        }
        winner.phasePerformance[phase].wins++;
        winner.phasePerformance[phase].matches++;
        winner.phasePerformance[phase].points += points;

        loser.matches++;
        loser.losses++;
        loser.finishDistribution[outcome] = (loser.finishDistribution[outcome] || 0) + 1;
        
        if (!loser.phasePerformance[phase]) {
          loser.phasePerformance[phase] = { wins: 0, matches: 0, points: 0 };
        }
        loser.phasePerformance[phase].matches++;

        // Head-to-head tracking
        const h2hKey = [match.player1_name, match.player2_name].sort().join('_vs_');
        if (!h2hMap[h2hKey]) {
          h2hMap[h2hKey] = {
            player1: match.player1_name,
            player2: match.player2_name,
            p1Wins: 0,
            p2Wins: 0,
            totalMatches: 0,
            p1WinRate: 0
          };
        }
        
        h2hMap[h2hKey].totalMatches++;
        if (match.winner_name === match.player1_name) {
          h2hMap[h2hKey].p1Wins++;
        } else {
          h2hMap[h2hKey].p2Wins++;
        }
      });

      // Calculate final stats for each player
      Object.values(playersMap).forEach(player => {
        player.winRate = player.matches > 0 ? (player.wins / player.matches) * 100 : 0;
        player.weightedWinRate = calculateWeightedWinRate(player.wins, player.matches);
        player.avgPointsPerMatch = player.matches > 0 ? player.totalPoints / player.matches : 0;
        
        // Find most common finishes
        const winFinishes = Object.entries(player.finishDistribution);
        player.mostCommonWinFinish = winFinishes.length > 0 
          ? winFinishes.reduce((a, b) => a[1] > b[1] ? a : b)[0] 
          : 'N/A';
        player.mostCommonLoseFinish = player.mostCommonWinFinish; // Simplified for now
      });

      // Calculate head-to-head win rates
      Object.values(h2hMap).forEach(h2h => {
        h2h.p1WinRate = h2h.totalMatches > 0 ? (h2h.p1Wins / h2h.totalMatches) * 100 : 0;
      });

      setPlayers(playersMap);
      setHeadToHead(Object.values(h2hMap).filter(h2h => h2h.totalMatches > 0));
      
      // Auto-select first player
      const playerNames = Object.keys(playersMap);
      if (playerNames.length > 0 && !selectedPlayer) {
        setSelectedPlayer(playerNames[0]);
      }

    } catch (error) {
      console.error('Error fetching player analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Processing player analytics...</p>
      </div>
    );
  }

  const playerNames = Object.keys(players);
  
  if (playerNames.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="text-center">
          <Users size={48} className="mx-auto text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Player Data Available</h3>
          <p className="text-yellow-700">
            This tournament has no completed matches yet. Player analytics require match results to generate statistics.
          </p>
        </div>
      </div>
    );
  }

  const selectedPlayerData = selectedPlayer ? players[selectedPlayer] : null;

  return (
    <div className="space-y-8">
      {/* Player Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Users size={24} className="mr-2 text-blue-600" />
          Player Selection
        </h2>
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Player for Detailed Analysis
          </label>
          <select
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select Player --</option>
            {playerNames.sort().map(playerName => (
              <option key={playerName} value={playerName}>
                {playerName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Player Overview Table */}
      <div className="chart-container">
        <h2 className="chart-title flex items-center">
          <Trophy size={24} className="mr-2 text-yellow-600" />
          Tournament Player Rankings
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
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
                  Total Points
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Points/Match
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Most Common Win
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.values(players)
                .sort((a, b) => b.weightedWinRate - a.weightedWinRate)
                .map((player, index) => (
                  <tr 
                    key={player.name} 
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedPlayer === player.name ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedPlayer(player.name)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
                          {index + 1}
                        </div>
                        {player.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {player.matches}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`font-medium ${
                        player.winRate >= 60 ? 'text-green-600' :
                        player.winRate >= 40 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {player.winRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600 text-center">
                      {(player.weightedWinRate * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-medium">
                      {player.totalPoints}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {player.avgPointsPerMatch.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {player.mostCommonWinFinish}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Player Detailed Analysis */}
      {selectedPlayerData && (
        <div className="space-y-6">
          {/* Player Performance Metrics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Target size={24} className="mr-2 text-blue-600" />
              {selectedPlayerData.name} - Detailed Performance
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{selectedPlayerData.matches}</div>
                <div className="text-sm text-gray-600">Total Matches</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{selectedPlayerData.winRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{selectedPlayerData.totalPoints}</div>
                <div className="text-sm text-gray-600">Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{selectedPlayerData.avgPointsPerMatch.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Avg Points/Match</div>
              </div>
            </div>
          </div>

          {/* Finish Type Radar Chart */}
          <div className="chart-container">
            <h3 className="chart-title">Points Per Finish Type</h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={Object.entries(selectedPlayerData.finishDistribution).map(([finish, count]) => ({
                finish,
                points: count * (FINISH_POINTS[finish as keyof typeof FINISH_POINTS] || 0),
                count
              }))}>
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
          </div>

          {/* Phase Performance */}
          {Object.keys(selectedPlayerData.phasePerformance).length > 0 && (
            <div className="chart-container">
              <h3 className="chart-title">Phase Performance</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phase
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
                    {Object.entries(selectedPlayerData.phasePerformance)
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([phase, stats]) => (
                        <tr key={phase} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                            Phase {phase}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                            {stats.matches}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-center font-medium">
                            {stats.wins}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <span className={`font-medium ${
                              stats.matches > 0 && (stats.wins / stats.matches) * 100 >= 50 
                                ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {stats.matches > 0 ? ((stats.wins / stats.matches) * 100).toFixed(1) : '0.0'}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                            {stats.matches > 0 ? (stats.points / stats.matches).toFixed(2) : '0.00'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Head-to-Head Statistics */}
      {headToHead.length > 0 && (
        <div className="chart-container">
          <h2 className="chart-title flex items-center">
            <TrendingUp size={24} className="mr-2 text-green-600" />
            Head-to-Head Matchups
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matchup
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Matches
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player 1 Wins
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player 2 Wins
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player 1 Win Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {headToHead
                  .sort((a, b) => b.totalMatches - a.totalMatches)
                  .map((h2h, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {h2h.player1} vs {h2h.player2}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {h2h.totalMatches}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-center font-medium">
                        {h2h.p1Wins}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-center font-medium">
                        {h2h.p2Wins}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <span className={`font-medium ${
                          h2h.p1WinRate >= 50 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {h2h.p1WinRate.toFixed(1)}%
                        </span>
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