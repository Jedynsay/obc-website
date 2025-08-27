import React, { useState, useEffect } from 'react';
import { BarChart3, Target, TrendingUp, ChevronDown, ChevronUp, Eye, Search, X, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../../../lib/supabase';
import { parseBeybladeName, calculateWilsonScore, type AllPartsData, type PartStats, type BuildStats, type ParsedBeyblade } from '../../../utils/beybladeParser';

interface MetaAnalysisSubTabProps {
  tournamentId: string;
  loading?: boolean;
}

interface MatchResult {
  player1_name: string;
  player2_name: string;
  player1_beyblade: string;
  player2_beyblade: string;
  player1_blade_line?: string;
  player2_blade_line?: string;
  winner_name: string;
  outcome: string;
  points_awarded: number;
}

interface ProcessedMatch {
  player: string;
  opponent: string;
  beyblade: string;
  opponentBeyblade: string;
  isWin: boolean;
  outcome: string;
  parsedParts: ParsedBeyblade;
  bladeLine: string;
}

interface ComboStats {
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
  finishDistribution: { [finish: string]: number };
  bladeLine: string;
  allMatches: any[];
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

const FINISH_COLORS = {
  'Spin Finish': '#10B981',
  'Burst Finish': '#F59E0B',
  'Over Finish': '#EF4444',
  'Extreme Finish': '#8B5CF6'
};

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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Combo Used</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opponent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opponent Beyblade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Winner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Finish Type</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {matches.map((match, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-xs">
                    {match.player1_beyblade}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{match.player1_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{match.player2_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-xs">{match.player2_beyblade}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{match.winner_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{match.outcome}</td>
                </tr>
              ))}
              {matches.map((match, index) => (
                <tr key={`p2-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-xs">
                    {match.player2_beyblade}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{match.player2_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{match.player1_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-xs">{match.player1_beyblade}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{match.winner_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{match.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PartMatchDetailsModal({ isOpen, onClose, title, matches, partName }: MatchDetailsModalProps & { partName: string }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-4 text-white">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Combo Used</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Combo Against</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player 1</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player 2</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Winner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Finish Type</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {matches.map((match, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-xs">{match.player1_beyblade}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-xs">{match.player2_beyblade}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{match.player1_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{match.player2_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{match.winner_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{match.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function MetaAnalysisSubTab({ tournamentId, loading = false }: MetaAnalysisSubTabProps) {
  const [partsData, setPartsData] = useState<AllPartsData>({
    blades: [],
    ratchets: [],
    bits: [],
    lockchips: [],
    assistBlades: []
  });
  
  const [partStats, setPartStats] = useState<{ [partType: string]: { [partName: string]: PartStats } }>({
    blade: {},
    ratchet: {},
    bit: {},
    lockchip: {},
    mainBlade: {},
    assistBlade: {}
  });
  
  const [comboStats, setComboStats] = useState<ComboStats[]>([]);
  const [processedMatches, setProcessedMatches] = useState<ProcessedMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Part search functionality
  const [selectedPartType, setSelectedPartType] = useState<string>('');
  const [selectedPartName, setSelectedPartName] = useState<string>('');
  const [partCombos, setPartCombos] = useState<ComboStats[]>([]);
  
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ 
    key: 'comboScore', 
    direction: 'desc' 
  });
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
      fetchPartsData();
    }
  }, [tournamentId]);

  useEffect(() => {
    if (tournamentId && partsData.blades.length > 0) {
      processTournamentData();
    }
  }, [tournamentId, partsData]);

  const fetchPartsData = async () => {
    try {
      const [bladesRes, ratchetsRes, bitsRes, lockchipsRes, assistBladesRes] = await Promise.all([
        supabase.from('beypart_blade').select('*'),
        supabase.from('beypart_ratchet').select('*'),
        supabase.from('beypart_bit').select('*'),
        supabase.from('beypart_lockchip').select('*'),
        supabase.from('beypart_assistblade').select('*')
      ]);

      setPartsData({
        blades: bladesRes.data || [],
        ratchets: ratchetsRes.data || [],
        bits: bitsRes.data || [],
        lockchips: lockchipsRes.data || [],
        assistBlades: assistBladesRes.data || []
      });
    } catch (error) {
      console.error('Error fetching parts data:', error);
    }
  };

  const processTournamentData = async () => {
    try {
      const { data: matches, error } = await supabase
        .from('match_results')
        .select('*')
        .eq('tournament_id', tournamentId);

      if (error) throw error;

      if (!matches || matches.length === 0) {
        setIsLoading(false);
        return;
      }

      // Process matches
      const processed: ProcessedMatch[] = [];
      const stats = {
        blade: {} as { [name: string]: PartStats },
        ratchet: {} as { [name: string]: PartStats },
        bit: {} as { [name: string]: PartStats },
        lockchip: {} as { [name: string]: PartStats },
        mainBlade: {} as { [name: string]: PartStats },
        assistBlade: {} as { [name: string]: PartStats }
      };

      const comboStatsMap: { [key: string]: ComboStats } = {};

      matches.forEach((match: MatchResult) => {
        if (!match.winner_name || !match.player1_name || !match.player2_name) return;
        
        const p1Parts = parseBeybladeName(match.player1_beyblade, match.player1_blade_line, partsData);
        const p2Parts = parseBeybladeName(match.player2_beyblade, match.player2_blade_line, partsData);
        
        const outcome = match.outcome?.split(' (')[0] || 'Unknown';
        const points = match.points_awarded || FINISH_POINTS[outcome as keyof typeof FINISH_POINTS] || 0;

        // Use normalized names for consistent player tracking
        const normalizedPlayer1 = match.normalized_player1_name || match.player1_name.toLowerCase();
        const normalizedPlayer2 = match.normalized_player2_name || match.player2_name.toLowerCase();
        const normalizedWinner = match.normalized_winner_name || match.winner_name.toLowerCase();
        
        // Create processed matches
        const p1Match: ProcessedMatch = {
          player: match.player1_name,
          opponent: match.player2_name,
          beyblade: match.player1_beyblade,
          opponentBeyblade: match.player2_beyblade,
          isWin: normalizedWinner === normalizedPlayer1,
          outcome,
          parsedParts: p1Parts,
          bladeLine: match.player1_blade_line || 'Unknown'
        };
        
        const p2Match: ProcessedMatch = {
          player: match.player2_name,
          opponent: match.player1_name,
          beyblade: match.player2_beyblade,
          opponentBeyblade: match.player1_beyblade,
          isWin: normalizedWinner === normalizedPlayer2,
          outcome,
          parsedParts: p2Parts,
          bladeLine: match.player2_blade_line || 'Unknown'
        };
        
        processed.push(p1Match, p2Match);

        // Process combo stats
        [p1Match, p2Match].forEach(processedMatch => {
          const comboKey = `${processedMatch.beyblade}_${processedMatch.player}`;
          
          if (!comboStatsMap[comboKey]) {
            comboStatsMap[comboKey] = {
              combo: processedMatch.beyblade,
              player: processedMatch.player,
              wins: 0,
              losses: 0,
              totalMatches: 0,
              winRate: 0,
              weightedWinRate: 0,
              totalPoints: 0,
              avgPointsPerMatch: 0,
              comboScore: 0,
              finishDistribution: {},
              bladeLine: processedMatch.bladeLine,
              allMatches: []
            };
          }

          const combo = comboStatsMap[comboKey];
          combo.totalMatches++;
          combo.finishDistribution[outcome] = (combo.finishDistribution[outcome] || 0) + 1;
          combo.allMatches.push(match);

          if (processedMatch.isWin) {
            combo.wins++;
            combo.totalPoints += points;
          } else {
            combo.losses++;
          }
        });

        // Update part stats
        const updateStats = (parsedParts: ParsedBeyblade, isWin: boolean) => {
          Object.entries(parsedParts).forEach(([partType, partName]) => {
            if (partType === 'isCustom' || !partName) return;
            
            if (!stats[partType as keyof typeof stats][partName]) {
              stats[partType as keyof typeof stats][partName] = {
                name: partName,
                usage: 0,
                wins: 0,
                losses: 0,
                winRate: 0,
                wilson: 0
              };
            }
            
            const partStat = stats[partType as keyof typeof stats][partName];
            partStat.usage++;
            if (isWin) {
              partStat.wins++;
            } else {
              partStat.losses++;
            }
          });
        };
        
        updateStats(p1Parts, p1Match.isWin);
        updateStats(p2Parts, p2Match.isWin);
      });

      // Calculate final stats
      Object.keys(stats).forEach(partType => {
        Object.values(stats[partType as keyof typeof stats]).forEach(partStat => {
          const total = partStat.wins + partStat.losses;
          partStat.winRate = total > 0 ? (partStat.wins / total) * 100 : 0;
          partStat.wilson = calculateWilsonScore(partStat.wins, total);
        });
      });

      // Calculate combo stats
      const comboStatsArray = Object.values(comboStatsMap).map(combo => {
        combo.winRate = combo.totalMatches > 0 ? (combo.wins / combo.totalMatches) * 100 : 0;
        combo.weightedWinRate = combo.totalMatches > 0 ? (combo.wins / combo.totalMatches) * (combo.totalMatches / (combo.totalMatches + 10)) : 0;
        combo.avgPointsPerMatch = combo.totalMatches > 0 ? combo.totalPoints / combo.totalMatches : 0;
        combo.comboScore = combo.weightedWinRate * (combo.avgPointsPerMatch / 3) * 100;
        return combo;
      });

      setPartStats(stats);
      setComboStats(comboStatsArray);
      setProcessedMatches(processed);
      
      // Generate part combos if part is selected
      if (selectedPartType && selectedPartName) {
        generatePartCombos();
      }

    } catch (error) {
      console.error('Error processing tournament data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePartCombos = () => {
    if (!selectedPartType || !selectedPartName) return;
    
    const combosWithPart = comboStats.filter(combo => {
      // Find matches for this combo to check if it uses the selected part
      const comboMatches = processedMatches.filter(match => 
        match.beyblade === combo.combo && match.player === combo.player
      );
      
      return comboMatches.some(match => {
        const partValue = match.parsedParts[selectedPartType as keyof ParsedBeyblade];
        return partValue === selectedPartName;
      });
    });
    
    setPartCombos(combosWithPart.sort((a, b) => b.comboScore - a.comboScore));
  };

  // Update part combos when selection changes
  React.useEffect(() => {
    if (selectedPartType && selectedPartName && comboStats.length > 0) {
      generatePartCombos();
    } else {
      setPartCombos([]);
    }
  }, [selectedPartType, selectedPartName, comboStats]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const showPartMatchDetails = (partName: string, partType: string) => {
    const partMatches = processedMatches.filter(match => 
      match.parsedParts[partType as keyof ParsedBeyblade] === partName
    );
    
    const enhancedMatches = partMatches.map(processedMatch => {
      // Find the original match data
      const originalMatch = processedMatch.allMatches?.[0] || {};
      return {
        combo_used: processedMatch.beyblade,
        combo_against: processedMatch.opponentBeyblade,
        player1_name: processedMatch.player,
        player2_name: processedMatch.opponent,
        winner_name: originalMatch.winner_name,
        outcome: processedMatch.outcome,
        player1_beyblade: processedMatch.beyblade,
        player2_beyblade: processedMatch.opponentBeyblade
      };
    });
    
    setMatchDetailsModal({
      isOpen: true,
      title: `All Matches using ${partName}`,
      matches: enhancedMatches
    });
  };

  const showAllParts = (partType: string) => {
    const partData = Object.values(partStats[partType] || {})
      .filter(part => part.usage > 0)
      .sort((a, b) => b.wilson - a.wilson)
      .map(part => ({
        ...part,
        allMatches: processedMatches.filter(match => 
          match.parsedParts[partType as keyof ParsedBeyblade] === part.name
        )
      }));

    setShowAllModal({
      isOpen: true,
      title: `All ${partType.charAt(0).toUpperCase() + partType.slice(1)} Performance`,
      data: partData,
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'usage', label: 'Usage' },
        { key: 'wins', label: 'Wins' },
        { key: 'losses', label: 'Losses' },
        { key: 'winRate', label: 'Win Rate (%)' },
        { key: 'wilson', label: 'Wilson Score' }
      ],
      onRowClick: (row) => {
        setShowAllModal(prev => ({ ...prev, isOpen: false }));
        setTimeout(() => {
          showPartMatchDetails(row.name, partType);
        }, 100);
      }
    });
  };

  const showAllCombos = () => {
    setShowAllModal({
      isOpen: true,
      title: 'All Combo Performance Rankings',
      data: sortedComboStats,
      columns: [
        { key: 'combo', label: 'Combo' },
        { key: 'player', label: 'Player' },
        { key: 'bladeLine', label: 'Blade Line' },
        { key: 'totalMatches', label: 'Matches' },
        { key: 'winRate', label: 'Win Rate (%)' },
        { key: 'weightedWinRate', label: 'Weighted Win Rate (%)' },
        { key: 'avgPointsPerMatch', label: 'Avg Points' },
        { key: 'comboScore', label: 'Combo Score' }
      ],
      onRowClick: (row) => {
        setMatchDetailsModal({
          isOpen: true,
          title: `All Matches for ${row.combo} by ${row.player}`,
          matches: row.allMatches || []
        });
        setShowAllModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const sortedComboStats = [...comboStats].sort((a, b) => {
    const aVal = a[sortConfig.key as keyof ComboStats];
    const bVal = b[sortConfig.key as keyof ComboStats];
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    const aStr = String(aVal);
    const bStr = String(bVal);
    return sortConfig.direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });

  const SortableHeader = ({ children, sortKey }: { children: React.ReactNode; sortKey: string }) => (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortConfig.key === sortKey && (
          sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
        )}
      </div>
    </th>
  );

  if (loading || isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Processing meta analysis...</p>
      </div>
    );
  }

  if (processedMatches.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="text-center">
          <BarChart3 size={48} className="mx-auto text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Meta Data Available</h3>
          <p className="text-yellow-700">
            This tournament has no completed matches yet. Meta analysis requires match results to generate statistics.
          </p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const topCombosChartData = sortedComboStats.slice(0, 10).map(combo => ({
    name: combo.combo,
    score: combo.comboScore,
    winRate: combo.winRate,
    matches: combo.totalMatches
  }));

  const finishDistributionData = Object.entries(
    processedMatches.reduce((acc, match) => {
      if (match.isWin) {
        acc[match.outcome] = (acc[match.outcome] || 0) + 1;
      }
      return acc;
    }, {} as { [key: string]: number })
  ).map(([finish, count]) => ({
    name: finish,
    value: count,
    color: FINISH_COLORS[finish as keyof typeof FINISH_COLORS] || '#6B7280'
  }));

  return (
    <div className="space-y-8">
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Combos Chart */}
        <div className="chart-container">
          <h3 className="chart-title flex items-center">
            <Target size={24} className="mr-2 text-blue-600" />
            Top Combos by Score
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topCombosChartData} margin={{ bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                fontSize={9}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  typeof value === 'number' ? value.toFixed(2) : value,
                  name === 'score' ? 'Combo Score' : name === 'winRate' ? 'Win Rate (%)' : 'Matches'
                ]}
              />
              <Bar dataKey="score" fill="#3B82F6" name="Combo Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Finish Distribution */}
        <div className="chart-container">
          <h3 className="chart-title">Finish Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={finishDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {finishDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Part Analysis Section */}
      <div className="chart-container">
        <h3 className="chart-title flex items-center">
          <Search size={24} className="mr-2 text-purple-600" />
          Analysis by Part
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Part Type</label>
            <select
              value={selectedPartType}
              onChange={(e) => {
                setSelectedPartType(e.target.value);
                setSelectedPartName('');
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select Part Type</option>
              <option value="blade">Blade</option>
              <option value="mainBlade">Main Blade</option>
              <option value="ratchet">Ratchet</option>
              <option value="bit">Bit</option>
              <option value="lockchip">Lockchip</option>
              <option value="assistBlade">Assist Blade</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Part Name</label>
            <select
              value={selectedPartName}
              onChange={(e) => setSelectedPartName(e.target.value)}
              disabled={!selectedPartType}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
            >
              <option value="">Select Part Name</option>
              {selectedPartType && Object.values(partStats[selectedPartType] || {})
                .filter(part => part.usage > 0)
                .sort((a, b) => b.wilson - a.wilson)
                .map(part => (
                  <option key={part.name} value={part.name}>{part.name}</option>
                ))}
            </select>
          </div>
        </div>
        
        {/* Part Combos Table */}
        {selectedPartType && selectedPartName && partCombos.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Combos using {selectedPartName} ({selectedPartType})
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-purple-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-purple-100">Combo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-purple-100">Player</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-purple-100">Blade Line</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-purple-100">Matches</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-purple-100">Win Rate</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-purple-100">Combo Score</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-purple-100">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {partCombos.map((combo, index) => (
                    <tr key={index} className="hover:bg-purple-50">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-600 text-center">
                        {combo.comboScore.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => {
                            setMatchDetailsModal({
                              isOpen: true,
                              title: `All Matches for ${combo.combo} by ${combo.player}`,
                              matches: combo.allMatches || []
                            });
                          }}
                          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                        >
                          View Matches
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Combo Statistics Table */}
      <div className="chart-container">
        <div className="flex justify-between items-center mb-4">
          <h3 className="chart-title">Combo Performance Rankings</h3>
          <button
            onClick={showAllCombos}
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
                <SortableHeader sortKey="combo">Combo</SortableHeader>
                <SortableHeader sortKey="player">Player</SortableHeader>
                <SortableHeader sortKey="bladeLine">Blade Line</SortableHeader>
                <SortableHeader sortKey="totalMatches">Matches</SortableHeader>
                <SortableHeader sortKey="winRate">Win Rate</SortableHeader>
                <SortableHeader sortKey="weightedWinRate">Weighted Win Rate</SortableHeader>
                <SortableHeader sortKey="avgPointsPerMatch">Avg Points</SortableHeader>
                <SortableHeader sortKey="comboScore">Combo Score</SortableHeader>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedComboStats.slice(0, 20).map((combo, index) => (
                <tr key={index} className="hover:bg-gray-50">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {combo.totalMatches}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {combo.winRate.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {(combo.weightedWinRate * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {combo.avgPointsPerMatch.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                    {combo.comboScore.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Part Statistics - Organized in Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Blades and Main Blades */}
        <div className="space-y-6">
          {(['blade', 'mainBlade'] as const).map(partType => (
            <div key={partType} className="chart-container">
              <div className="flex justify-between items-center mb-4">
                <h3 className="chart-title capitalize">
                  {partType === 'mainBlade' ? 'Main Blades' : 'Blades'} Performance
                </h3>
                <button
                  onClick={() => showAllParts(partType)}
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
                >
                  <Eye size={14} />
                  <span>Show All</span>
                </button>
              </div>
              
              {Object.keys(partStats[partType] || {}).length === 0 ? (
                <div className="text-center py-6">
                  <BarChart3 size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500 text-sm">No {partType} data available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                          Name
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                          Usage
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                          Win Rate
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                          Wilson
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.values(partStats[partType] || {})
                        .filter(part => part.usage > 0)
                        .sort((a, b) => b.wilson - a.wilson)
                        .slice(0, 8)
                        .map((part, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {part.name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                              {part.usage}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                              <span className={`font-medium ${
                                part.winRate >= 60 ? 'text-green-600' :
                                part.winRate >= 40 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {part.winRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                              {part.wilson.toFixed(3)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Other Parts */}
        <div className="space-y-6">
          {(['ratchet', 'bit', 'lockchip', 'assistBlade'] as const).map(partType => (
            <div key={partType} className="chart-container">
              <div className="flex justify-between items-center mb-4">
                <h3 className="chart-title capitalize">
                  {partType === 'assistBlade' ? 'Assist Blades' : `${partType}s`} Performance
                </h3>
                <button
                  onClick={() => showAllParts(partType)}
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
                >
                  <Eye size={14} />
                  <span>Show All</span>
                </button>
              </div>
              
              {Object.keys(partStats[partType] || {}).length === 0 ? (
                <div className="text-center py-6">
                  <BarChart3 size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500 text-sm">No {partType} data available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                          Name
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                          Usage
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                          Win Rate
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                          Wilson
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.values(partStats[partType] || {})
                        .filter(part => part.usage > 0)
                        .sort((a, b) => b.wilson - a.wilson)
                        .slice(0, 8)
                        .map((part, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {part.name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                              {part.usage}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                              <span className={`font-medium ${
                                part.winRate >= 60 ? 'text-green-600' :
                                part.winRate >= 40 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {part.winRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                              {part.wilson.toFixed(3)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
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

      <MatchDetailsModal
        isOpen={matchDetailsModal.isOpen}
        onClose={() => setMatchDetailsModal(prev => ({ ...prev, isOpen: false }))}
        title={matchDetailsModal.title}
        matches={matchDetailsModal.matches}
      />
    </div>
  );
}