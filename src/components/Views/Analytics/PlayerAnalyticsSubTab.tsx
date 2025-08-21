import React, { useState, useEffect } from 'react';
import { Users, Trophy, Target, TrendingUp, Eye, Search, X } from 'lucide-react';
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
  winsByFinish: { [beyblade: string]: { [finish: string]: number } };
  lossesByFinish: { [beyblade: string]: { [finish: string]: number } };
  pointsGainedByBey: { [beyblade: string]: number };
  pointsGivenByBey: { [beyblade: string]: number };
  allMatches: any[];
}

interface HeadToHeadData {
  player1: string;
  player2: string;
  p1Wins: number;
  p2Wins: number;
  totalMatches: number;
  p1WinRate: number;
}

interface ShowAllModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any[];
  columns: { key: string; label: string }[];
  onRowClick?: (row: any) => void;
}

interface MatchDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  matches: any[];
}

const FINISH_POINTS = {
  'Spin Finish': 1,
  'Burst Finish': 2,
  'Over Finish': 2,
  'Extreme Finish': 3
};

const FINISH_TYPES = ['Spin Finish', 'Burst Finish', 'Over Finish', 'Extreme Finish'];

function ShowAllModal({ isOpen, onClose, title, data, columns, onRowClick }: ShowAllModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(row => 
    columns.some(col => 
      String(row[col.key] || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-4 text-white">
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
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-auto max-h-[60vh]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {columns.map(col => (
                    <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((row, index) => (
                  <tr 
                    key={index} 
                    className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map(col => (
                      <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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

function MatchDetailsModal({ isOpen, onClose, title, matches }: MatchDetailsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-blue-500 px-6 py-4 text-white">
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

        <div className="p-6 overflow-auto max-h-[60vh]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player 1</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player 2</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Winner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Finish Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {matches.map((match, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Match {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{match.player1_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{match.player2_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{match.winner_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{match.outcome}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{match.points_awarded}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function PlayerAnalyticsSubTab({ tournamentId, loading = false }: PlayerAnalyticsSubTabProps) {
  const [players, setPlayers] = useState<{ [name: string]: PlayerData }>({});
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [headToHead, setHeadToHead] = useState<HeadToHeadData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
  const [matchDetailsModal, setMatchDetailsModal] = useState<{
    isOpen: boolean;
    title: string;
    matches: any[];
  }>({
    isOpen: false,
    title: '',
    matches: []
  });

  useEffect(() => {
    if (tournamentId) {
      fetchPlayerAnalytics();
    }
  }, [tournamentId]);

  const calculateWeightedWinRate = (wins: number, totalMatches: number): number => {
    if (totalMatches === 0) return 0;
    return (wins / totalMatches) * (totalMatches / (totalMatches + 10));
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
              phasePerformance: {},
              winsByFinish: {},
              lossesByFinish: {},
              pointsGainedByBey: {},
              pointsGivenByBey: {},
              allMatches: []
            };
          }
        });

        // Store all matches for each player
        playersMap[match.player1_name].allMatches.push(match);
        playersMap[match.player2_name].allMatches.push(match);

        // Update player stats
        const winner = playersMap[match.winner_name];
        const loser = playersMap[match.winner_name === match.player1_name ? match.player2_name : match.player1_name];
        const winnerBeyblade = match.winner_name === match.player1_name ? match.player1_beyblade : match.player2_beyblade;
        const loserBeyblade = match.winner_name === match.player1_name ? match.player2_beyblade : match.player1_beyblade;

        winner.matches++;
        winner.wins++;
        winner.totalPoints += points;
        winner.finishDistribution[outcome] = (winner.finishDistribution[outcome] || 0) + 1;
        
        // Track wins by finish for each beyblade
        if (!winner.winsByFinish[winnerBeyblade]) {
          winner.winsByFinish[winnerBeyblade] = {};
        }
        winner.winsByFinish[winnerBeyblade][outcome] = (winner.winsByFinish[winnerBeyblade][outcome] || 0) + 1;
        
        // Track points gained by beyblade
        winner.pointsGainedByBey[winnerBeyblade] = (winner.pointsGainedByBey[winnerBeyblade] || 0) + points;
        
        if (!winner.phasePerformance[phase]) {
          winner.phasePerformance[phase] = { wins: 0, matches: 0, points: 0 };
        }
        winner.phasePerformance[phase].wins++;
        winner.phasePerformance[phase].matches++;
        winner.phasePerformance[phase].points += points;

        loser.matches++;
        loser.losses++;
        loser.finishDistribution[outcome] = (loser.finishDistribution[outcome] || 0) + 1;
        
        // Track losses by finish for each beyblade
        if (!loser.lossesByFinish[loserBeyblade]) {
          loser.lossesByFinish[loserBeyblade] = {};
        }
        loser.lossesByFinish[loserBeyblade][outcome] = (loser.lossesByFinish[loserBeyblade][outcome] || 0) + 1;
        
        // Track points given by beyblade
        loser.pointsGivenByBey[loserBeyblade] = (loser.pointsGivenByBey[loserBeyblade] || 0) + points;
        
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

  const showAllPlayers = () => {
    const playerData = Object.values(players).map(player => ({
      name: player.name,
      matches: player.matches,
      winRate: player.winRate,
      weightedWinRate: player.weightedWinRate * 100,
      totalPoints: player.totalPoints,
      avgPointsPerMatch: player.avgPointsPerMatch,
      mostCommonWinFinish: player.mostCommonWinFinish
    }));

    setShowAllModal({
      isOpen: true,
      title: 'All Tournament Players',
      data: playerData,
      columns: [
        { key: 'name', label: 'Player' },
        { key: 'matches', label: 'Matches' },
        { key: 'winRate', label: 'Win Rate (%)' },
        { key: 'weightedWinRate', label: 'Weighted Win Rate (%)' },
        { key: 'totalPoints', label: 'Total Points' },
        { key: 'avgPointsPerMatch', label: 'Avg Points/Match' },
        { key: 'mostCommonWinFinish', label: 'Most Common Win' }
      ],
      onRowClick: (row) => {
        const playerMatches = players[row.name]?.allMatches || [];
        setMatchDetailsModal({
          isOpen: true,
          title: `All Matches for ${row.name}`,
          matches: playerMatches
        });
        setShowAllModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const showAllHeadToHead = () => {
    setShowAllModal({
      isOpen: true,
      title: 'All Head-to-Head Matchups',
      data: headToHead,
      columns: [
        { key: 'player1', label: 'Player 1' },
        { key: 'player2', label: 'Player 2' },
        { key: 'totalMatches', label: 'Total Matches' },
        { key: 'p1Wins', label: 'Player 1 Wins' },
        { key: 'p2Wins', label: 'Player 2 Wins' },
        { key: 'p1WinRate', label: 'Player 1 Win Rate (%)' }
      ],
      onRowClick: (row) => {
        const matchupMatches = Object.values(players).flatMap(player => 
          player.allMatches.filter(match => 
            (match.player1_name === row.player1 && match.player2_name === row.player2) ||
            (match.player1_name === row.player2 && match.player2_name === row.player1)
          )
        );
        setMatchDetailsModal({
          isOpen: true,
          title: `${row.player1} vs ${row.player2} Matches`,
          matches: matchupMatches
        });
        setShowAllModal(prev => ({ ...prev, isOpen: false }));
      }
    });
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="chart-title flex items-center">
            <Trophy size={24} className="mr-2 text-yellow-600" />
            Tournament Player Rankings
          </h2>
          <button
            onClick={showAllPlayers}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Eye size={16} />
            <span>Show All</span>
          </button>
        </div>
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
                .slice(0, 10)
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

          {/* Wins per Finish Table */}
          <div className="chart-container">
            <h3 className="chart-title">Wins per Finish</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-green-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Beyblade
                    </th>
                    {FINISH_TYPES.map(finish => (
                      <th key={finish} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {finish.split(' ')[0]}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Points Gained
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.keys(selectedPlayerData.winsByFinish).map(beyblade => (
                    <tr key={beyblade} className="hover:bg-green-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {beyblade}
                      </td>
                      {FINISH_TYPES.map(finish => (
                        <td key={finish} className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-green-600">
                          {selectedPlayerData.winsByFinish[beyblade]?.[finish] || 0}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-green-700">
                        {selectedPlayerData.pointsGainedByBey[beyblade] || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Losses per Finish Table */}
          <div className="chart-container">
            <h3 className="chart-title">Losses per Finish</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-red-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Beyblade
                    </th>
                    {FINISH_TYPES.map(finish => (
                      <th key={finish} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {finish.split(' ')[0]}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Points Given
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.keys(selectedPlayerData.lossesByFinish).map(beyblade => (
                    <tr key={beyblade} className="hover:bg-red-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {beyblade}
                      </td>
                      {FINISH_TYPES.map(finish => (
                        <td key={finish} className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-red-600">
                          {selectedPlayerData.lossesByFinish[beyblade]?.[finish] || 0}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-red-700">
                        {selectedPlayerData.pointsGivenByBey[beyblade] || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="chart-title flex items-center">
              <TrendingUp size={24} className="mr-2 text-green-600" />
              Head-to-Head Matchups
            </h2>
            <button
              onClick={showAllHeadToHead}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Eye size={16} />
              <span>Show All</span>
            </button>
          </div>
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
                  .slice(0, 10)
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

      {/* Modals */}
      <ShowAllModal
        isOpen={showAllModal.isOpen}
        onClose={() => setShowAllModal(prev => ({ ...prev, isOpen: false }))}
        title={showAllModal.title}
        data={showAllModal.data}
        columns={showAllModal.columns}
        onRowClick={showAllModal.onRowClick}
      />

      <MatchDetailsModal
        isOpen={matchDetailsModal.isOpen}
        onClose={() => setMatchDetailsModal(prev => ({ ...prev, isOpen: false }))}
        title={matchDetailsModal.title}
        matches={matchDetailsModal.matches}
      />
    </div>
  );
}