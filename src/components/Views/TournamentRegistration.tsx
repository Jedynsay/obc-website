import React, { useState, useEffect } from 'react';
import { Users, Trophy, Target, TrendingUp, Eye, Search, X } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
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

/* -------------------- ShowAllModal -------------------- */
function ShowAllModal({ isOpen, onClose, title, data, columns, onRowClick }: ShowAllModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredData = data.filter(row => 
    columns.some(col => String(row[col.key] || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-4 text-white flex justify-between items-center">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full">
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-4 relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="overflow-auto max-h-[60vh]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {columns.map(col => (
                    <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((row, index) => (
                  <tr key={index} className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`} onClick={() => onRowClick?.(row)}>
                    {columns.map(col => (
                      <td key={col.key} className="px-6 py-4 text-sm text-gray-900">
                        {typeof row[col.key] === 'number'
                          ? (col.key.includes('Rate') || col.key.includes('Score'))
                            ? row[col.key].toFixed(1)
                            : row[col.key]
                          : String(row[col.key] || '')}
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

/* -------------------- MatchDetailsModal -------------------- */
function MatchDetailsModal({ isOpen, onClose, title, matches }: MatchDetailsModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-blue-500 px-6 py-4 text-white flex justify-between items-center">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-auto max-h-[60vh]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Result</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Player 1</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Player 1 Beyblade</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Player 2</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Player 2 Beyblade</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Winner</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Finish Type</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {matches.map((match, index) => (
                <tr key={index} className={`hover:bg-gray-50 ${
                  match.winner_name === match.player1_name ? 'bg-blue-50' :
                  match.winner_name === match.player2_name ? 'bg-red-50' : ''
                }`}>
                  <td className="px-6 py-4 text-sm font-medium">Match {index + 1}</td>
                  <td className={`px-6 py-4 text-sm font-medium ${
                    match.winner_name === match.player1_name ? 'text-blue-700' : 'text-gray-600'
                  }`}>{match.player1_name}</td>
                  <td className="px-6 py-4 text-sm font-mono text-xs">{match.player1_beyblade}</td>
                  <td className={`px-6 py-4 text-sm font-medium ${
                    match.winner_name === match.player2_name ? 'text-red-700' : 'text-gray-600'
                  }`}>{match.player2_name}</td>
                  <td className="px-6 py-4 text-sm font-mono text-xs">{match.player2_beyblade}</td>
                  <td className="px-6 py-4 text-sm font-medium text-green-600">{match.winner_name}</td>
                  <td className="px-6 py-4 text-sm">{match.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Main Component -------------------- */
export function PlayerAnalyticsSubTab({ tournamentId, loading = false }: PlayerAnalyticsSubTabProps) {
  const [players, setPlayers] = useState<{ [name: string]: PlayerData }>({});
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [headToHead, setHeadToHead] = useState<HeadToHeadData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showAllModal, setShowAllModal] = useState({
    isOpen: false,
    title: '',
    data: [] as any[],
    columns: [] as { key: string; label: string }[],
    onRowClick: undefined as ((row: any) => void) | undefined,
  });
  const [matchDetailsModal, setMatchDetailsModal] = useState({
    isOpen: false,
    title: '',
    matches: [] as any[],
  });

  useEffect(() => {
    if (tournamentId) fetchPlayerAnalytics();
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

      const playersMap: { [name: string]: PlayerData } = {};
      const h2hMap: { [key: string]: HeadToHeadData } = {};

      /* ----- Process Matches ----- */
      allMatches.forEach(match => {
        if (!match.winner_name || !match.player1_name || !match.player2_name) return;
        const outcome = match.outcome?.split(' (')[0] || 'Unknown';
        const points = match.points_awarded || FINISH_POINTS[outcome as keyof typeof FINISH_POINTS] || 0;
        const phase = match.phase_number || 1;

        // Use normalized names for consistent player tracking
        const normalizedPlayer1 = match.normalized_player1_name || match.player1_name.toLowerCase();
        const normalizedPlayer2 = match.normalized_player2_name || match.player2_name.toLowerCase();
        const normalizedWinner = match.normalized_winner_name || match.winner_name.toLowerCase();
        
        [normalizedPlayer1, normalizedPlayer2].forEach((normalizedName, index) => {
          const displayName = index === 0 ? match.player1_name : match.player2_name;
          
          if (!playersMap[displayName]) {
            playersMap[displayName] = {
              name: displayName,
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

        // Store all matches
        if (playersMap[match.player1_name]) playersMap[match.player1_name].allMatches.push(match);
        if (playersMap[match.player2_name]) playersMap[match.player2_name].allMatches.push(match);

        const winner = playersMap[match.winner_name];
        const loserName = normalizedWinner === normalizedPlayer1 ? match.player2_name : match.player1_name;
        const loser = playersMap[loserName];
        const winnerBeyblade = match.winner_name === match.player1_name ? match.player1_beyblade : match.player2_beyblade;
        const loserBeyblade = match.winner_name === match.player1_name ? match.player2_beyblade : match.player1_beyblade;

        if (!winner || !loser) return; // Skip if players not found
        
        // Winner stats
        winner.matches++;
        winner.wins++;
        winner.totalPoints += points;
        winner.finishDistribution[outcome] = (winner.finishDistribution[outcome] || 0) + 1;
        if (!winner.winsByFinish[winnerBeyblade]) winner.winsByFinish[winnerBeyblade] = {};
        winner.winsByFinish[winnerBeyblade][outcome] = (winner.winsByFinish[winnerBeyblade][outcome] || 0) + 1;
        winner.pointsGainedByBey[winnerBeyblade] = (winner.pointsGainedByBey[winnerBeyblade] || 0) + points;
        if (!winner.phasePerformance[phase]) winner.phasePerformance[phase] = { wins: 0, matches: 0, points: 0 };
        winner.phasePerformance[phase].wins++;
        winner.phasePerformance[phase].matches++;
        winner.phasePerformance[phase].points += points;

        // Loser stats
        loser.matches++;
        loser.losses++;
        loser.finishDistribution[outcome] = (loser.finishDistribution[outcome] || 0) + 1;
        if (!loser.lossesByFinish[loserBeyblade]) loser.lossesByFinish[loserBeyblade] = {};
        loser.lossesByFinish[loserBeyblade][outcome] = (loser.lossesByFinish[loserBeyblade][outcome] || 0) + 1;
        loser.pointsGivenByBey[loserBeyblade] = (loser.pointsGivenByBey[loserBeyblade] || 0) + points;
        if (!loser.phasePerformance[phase]) loser.phasePerformance[phase] = { wins: 0, matches: 0, points: 0 };
        loser.phasePerformance[phase].matches++;

        // Head-to-head
        const h2hKey = [match.player1_name, match.player2_name].sort().join('_vs_');
        if (!h2hMap[h2hKey]) {
          h2hMap[h2hKey] = { player1: match.player1_name, player2: match.player2_name, p1Wins: 0, p2Wins: 0, totalMatches: 0, p1WinRate: 0 };
        }
        h2hMap[h2hKey].totalMatches++;
        if (match.winner_name === match.player1_name) h2hMap[h2hKey].p1Wins++;
        else h2hMap[h2hKey].p2Wins++;
      });

      /* ----- Finalize Player Stats ----- */
      Object.values(playersMap).forEach(player => {
        player.winRate = player.matches > 0 ? (player.wins / player.matches) * 100 : 0;
        player.weightedWinRate = calculateWeightedWinRate(player.wins, player.matches);
        player.avgPointsPerMatch = player.matches > 0 ? player.totalPoints / player.matches : 0;

        // MVP Beyblade
        if (Object.keys(player.pointsGainedByBey).length > 0) {
          const [bestBey, bestScore] = Object.entries(player.pointsGainedByBey).reduce((a, b) => (a[1] > b[1] ? a : b));
          player.mvpCombo = bestBey;
          player.mvpComboScore = bestScore;
        }

        // Most common finishes
        const winFinishes = Object.entries(player.finishDistribution);
        player.mostCommonWinFinish = winFinishes.length > 0 ? winFinishes.reduce((a, b) => (a[1] > b[1] ? a : b))[0] : 'N/A';
        player.mostCommonLoseFinish = player.mostCommonWinFinish; // simplified
      });

      // Head-to-head win rates
      Object.values(h2hMap).forEach(h2h => {
        h2h.p1WinRate = h2h.totalMatches > 0 ? (h2h.p1Wins / h2h.totalMatches) * 100 : 0;
      });

      setPlayers(playersMap);
      setHeadToHead(Object.values(h2hMap).filter(h2h => h2h.totalMatches > 0));

      const playerNames = Object.keys(playersMap);
      if (playerNames.length > 0 && !selectedPlayer) setSelectedPlayer(playerNames[0]);
    } catch (error) {
      console.error('Error fetching player analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };
  /* -------------------- UI Helpers -------------------- */
  const playerNames = Object.keys(players);
  const selectedPlayerData = selectedPlayer ? players[selectedPlayer] : undefined;

  const showAllPlayers = () => {
    const data = Object.values(players).map(p => ({
      Player: p.name,
      Matches: p.matches,
      Wins: p.wins,
      Losses: p.losses,
      'Win Rate (%)': Number(p.winRate.toFixed(1)),
      'Weighted Win Rate (%)': Number((p.weightedWinRate * 100).toFixed(1)),
      'Total Points': p.totalPoints,
      'Avg Pts/Match': Number(p.avgPointsPerMatch.toFixed(2)),
      'MVP Beyblade': p.mvpCombo || '—',
      'MVP Points': p.mvpComboScore || 0,
    }));

    setShowAllModal({
      isOpen: true,
      title: 'All Players (Sortable/Filterable)',
      data,
      columns: [
        { key: 'Player', label: 'Player' },
        { key: 'Matches', label: 'Matches' },
        { key: 'Wins', label: 'Wins' },
        { key: 'Losses', label: 'Losses' },
        { key: 'Win Rate (%)', label: 'Win Rate (%)' },
        { key: 'Weighted Win Rate (%)', label: 'Weighted Win Rate (%)' },
        { key: 'Total Points', label: 'Total Points' },
        { key: 'Avg Pts/Match', label: 'Avg Pts/Match' },
        { key: 'MVP Beyblade', label: 'MVP Beyblade' },
        { key: 'MVP Points', label: 'MVP Points' },
      ],
      onRowClick: (row) => {
        setSelectedPlayer(row.Player);
        setShowAllModal(m => ({ ...m, isOpen: false }));
      }
    });
  };

  const showAllHeadToHead = () => {
    const data = headToHead.map(h => ({
      Matchup: `${h.player1} vs ${h.player2}`,
      'Total Matches': h.totalMatches,
      'Player 1 Wins': h.p1Wins,
      'Player 2 Wins': h.p2Wins,
      'P1 Win Rate (%)': Number(h.p1WinRate.toFixed(1)),
    }));

    setShowAllModal({
      isOpen: true,
      title: 'All Head-to-Head Matchups',
      data,
      columns: [
        { key: 'Matchup', label: 'Matchup' },
        { key: 'Total Matches', label: 'Total Matches' },
        { key: 'Player 1 Wins', label: 'Player 1 Wins' },
        { key: 'Player 2 Wins', label: 'Player 2 Wins' },
        { key: 'P1 Win Rate (%)', label: 'P1 Win Rate (%)' },
      ],
    });
  };

  const openMatchDetailsForPlayer = (playerName: string) => {
    const p = players[playerName];
    if (!p) return;
    setMatchDetailsModal({
      isOpen: true,
      title: `${playerName} — Match Details`,
      matches: p.allMatches || [],
    });
  };

  /* -------------------- Render -------------------- */
  if (isLoading || loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded-lg" />
          <div className="h-40 bg-gray-200 rounded-lg" />
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (playerNames.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-600">No match data found for this tournament yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
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

      {/* Tournament Player Rankings moved above Player Selection */}

      {/* Player Detailed Performance (with MVP) */}
      {selectedPlayerData && (
        <>
          {/* Move Tournament Player Rankings above Player Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold flex items-center">
                <Trophy size={20} className="mr-2 text-yellow-600" />
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
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Match</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">Matches</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">Win Rate</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">Weighted Win Rate</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">Total Points</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">Avg Points/Match</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">Most Common Win</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.values(players)
                    .sort((a, b) => b.weightedWinRate - a.weightedWinRate)
                    .slice(0, 10)
                    .map((player, index) => (
                      <tr
                        key={player.name}
                        className={`hover:bg-gray-50 cursor-pointer ${selectedPlayer === player.name ? 'bg-blue-50' : ''}`}
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
                        <td className="px-6 py-4 text-sm text-center">{player.matches}</td>
                        <td className="px-6 py-4 text-sm text-center">
                          <span className={`font-medium ${
                            player.winRate >= 60 ? 'text-green-600' :
                            player.winRate >= 40 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {player.winRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-blue-600 text-center">
                          {(player.weightedWinRate * 100).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-center">{player.totalPoints}</td>
                        <td className="px-6 py-4 text-sm text-center">{player.avgPointsPerMatch.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm">{player.mostCommonWinFinish}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <Target size={24} className="mr-2 text-blue-600" />
              {selectedPlayerData.name} — Detailed Performance
            </h3>
            <button
              className="text-sm text-blue-600 hover:text-blue-700 underline"
              onClick={() => openMatchDetailsForPlayer(selectedPlayerData.name)}
            >
              View Match Details
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Total Matches */}
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{selectedPlayerData.matches}</div>
              <div className="text-sm text-gray-600">Total Matches</div>
            </div>

            {/* Win Rate */}
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{selectedPlayerData.winRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Win Rate</div>
            </div>

            {/* Total Points */}
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{selectedPlayerData.totalPoints}</div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>

            {/* Avg Points/Match */}
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{selectedPlayerData.avgPointsPerMatch.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Avg Points/Match</div>
            </div>

            {/* Most Valuable Beyblade */}
            <div className="text-center">
              <div className="text-xl font-bold text-indigo-600">{selectedPlayerData.mvpCombo || 'N/A'}</div>
              <div className="text-sm text-gray-600">Most Valuable Beyblade</div>
              {selectedPlayerData.mvpCombo && (
                <div className="text-lg font-bold text-indigo-700 mt-1">
                  {selectedPlayerData.mvpComboScore} pts
                </div>
              )}
            </div>
          </div>
        </div>
        </>
      )}

      {/* Wins & Losses per Finish (side-by-side) */}
      {selectedPlayerData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Wins per Finish */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Wins per Finish</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-green-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beyblade</th>
                    {FINISH_TYPES.map(finish => (
                      <th key={finish} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {finish.split(' ')[0]}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Points Gained</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.keys(selectedPlayerData.winsByFinish).map(beyblade => (
                    <tr key={beyblade} className="hover:bg-green-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{beyblade}</td>
                      {FINISH_TYPES.map(finish => (
                        <td key={finish} className="px-6 py-4 text-sm text-center font-medium text-green-600">
                          {selectedPlayerData.winsByFinish[beyblade]?.[finish] || 0}
                        </td>
                      ))}
                      <td className="px-6 py-4 text-sm text-center font-bold text-green-700">
                        {selectedPlayerData.pointsGainedByBey[beyblade] || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Losses per Finish */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Losses per Finish</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-red-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beyblade</th>
                    {FINISH_TYPES.map(finish => (
                      <th key={finish} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {finish.split(' ')[0]}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Points Given</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.keys(selectedPlayerData.lossesByFinish).map(beyblade => (
                    <tr key={beyblade} className="hover:bg-red-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{beyblade}</td>
                      {FINISH_TYPES.map(finish => (
                        <td key={finish} className="px-6 py-4 text-sm text-center font-medium text-red-600">
                          {selectedPlayerData.lossesByFinish[beyblade]?.[finish] || 0}
                        </td>
                      ))}
                      <td className="px-6 py-4 text-sm text-center font-bold text-red-700">
                        {selectedPlayerData.pointsGivenByBey[beyblade] || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Charts (Radar + Phase Performance) */}
      {selectedPlayerData && (
        <div className="space-y-6">
          {/* Finish Type Radar Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Points per Finish Type</h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart
                data={Object.entries(selectedPlayerData.finishDistribution).map(([finish, count]) => ({
                  finish,
                  points: count * (FINISH_POINTS[finish as keyof typeof FINISH_POINTS] || 0),
                  count,
                }))}
              >
                <PolarGrid />
                <PolarAngleAxis dataKey="finish" />
                <PolarRadiusAxis />
                <Radar name="Points" dataKey="points" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Phase Performance */}
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([phase, stats]) => (
                        <tr key={phase} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 text-center">Phase {phase}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-center">{stats.matches}</td>
                          <td className="px-6 py-4 text-sm text-green-600 text-center font-medium">{stats.wins}</td>
                          <td className="px-6 py-4 text-sm text-center">
                            <span className={`font-medium ${
                              stats.matches > 0 && (stats.wins / stats.matches) * 100 >= 50 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {stats.matches > 0 ? ((stats.wins / stats.matches) * 100).toFixed(1) : '0.0'}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-center">
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

      {/* Head-to-Head */}
      {headToHead.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold flex items-center">
              <TrendingUp size={20} className="mr-2 text-green-600" />
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matchup</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Matches</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Player 1 Wins</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Player 2 Wins</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Player 1 Win Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {headToHead
                  .sort((a, b) => b.totalMatches - a.totalMatches)
                  .slice(0, 10)
                  .map((h2h, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{h2h.player1} vs {h2h.player2}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-center">{h2h.totalMatches}</td>
                      <td className="px-6 py-4 text-sm text-green-600 text-center font-medium">{h2h.p1Wins}</td>
                      <td className="px-6 py-4 text-sm text-red-600 text-center font-medium">{h2h.p2Wins}</td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span className={`font-medium ${h2h.p1WinRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
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
        onClose={() => setShowAllModal(m => ({ ...m, isOpen: false }))}
        title={showAllModal.title}
        data={showAllModal.data}
        columns={showAllModal.columns}
        onRowClick={showAllModal.onRowClick}
      />

      <MatchDetailsModal
        isOpen={matchDetailsModal.isOpen}
        onClose={() => setMatchDetailsModal(m => ({ ...m, isOpen: false }))}
        title={matchDetailsModal.title}
        matches={matchDetailsModal.matches}
      />
    </div>
  );
}