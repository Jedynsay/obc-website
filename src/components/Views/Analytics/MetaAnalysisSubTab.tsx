import React, { useState, useEffect } from 'react';
import { BarChart3, Target, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
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
}

interface BladeLineMatchup {
  attacker: string;
  defender: string;
  wins: number;
  losses: number;
  winRate: number;
  totalMatches: number;
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
  const [bladeLineMatchups, setBladeLineMatchups] = useState<BladeLineMatchup[]>([]);
  const [processedMatches, setProcessedMatches] = useState<ProcessedMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ 
    key: 'comboScore', 
    direction: 'desc' 
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
      const bladeLineMatchupsMap: { [key: string]: BladeLineMatchup } = {};

      matches.forEach((match: MatchResult) => {
        if (!match.winner_name || !match.player1_name || !match.player2_name) return;
        
        const p1Parts = parseBeybladeName(match.player1_beyblade, match.player1_blade_line, partsData);
        const p2Parts = parseBeybladeName(match.player2_beyblade, match.player2_blade_line, partsData);
        
        const outcome = match.outcome?.split(' (')[0] || 'Unknown';
        const points = match.points_awarded || FINISH_POINTS[outcome as keyof typeof FINISH_POINTS] || 0;

        // Create processed matches
        const p1Match: ProcessedMatch = {
          player: match.player1_name,
          opponent: match.player2_name,
          beyblade: match.player1_beyblade,
          opponentBeyblade: match.player2_beyblade,
          isWin: match.winner_name === match.player1_name,
          outcome,
          parsedParts: p1Parts,
          bladeLine: match.player1_blade_line || 'Unknown'
        };
        
        const p2Match: ProcessedMatch = {
          player: match.player2_name,
          opponent: match.player1_name,
          beyblade: match.player2_beyblade,
          opponentBeyblade: match.player1_beyblade,
          isWin: match.winner_name === match.player2_name,
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
              bladeLine: processedMatch.bladeLine
            };
          }

          const combo = comboStatsMap[comboKey];
          combo.totalMatches++;
          combo.finishDistribution[outcome] = (combo.finishDistribution[outcome] || 0) + 1;

          if (processedMatch.isWin) {
            combo.wins++;
            combo.totalPoints += points;
          } else {
            combo.losses++;
          }
        });

        // Process blade line matchups
        const p1Line = match.player1_blade_line || 'Unknown';
        const p2Line = match.player2_blade_line || 'Unknown';
        
        const matchupKey1 = `${p1Line}_vs_${p2Line}`;
        const matchupKey2 = `${p2Line}_vs_${p1Line}`;
        
        if (!bladeLineMatchupsMap[matchupKey1]) {
          bladeLineMatchupsMap[matchupKey1] = {
            attacker: p1Line,
            defender: p2Line,
            wins: 0,
            losses: 0,
            winRate: 0,
            totalMatches: 0
          };
        }
        
        if (!bladeLineMatchupsMap[matchupKey2]) {
          bladeLineMatchupsMap[matchupKey2] = {
            attacker: p2Line,
            defender: p1Line,
            wins: 0,
            losses: 0,
            winRate: 0,
            totalMatches: 0
          };
        }

        bladeLineMatchupsMap[matchupKey1].totalMatches++;
        bladeLineMatchupsMap[matchupKey2].totalMatches++;

        if (match.winner_name === match.player1_name) {
          bladeLineMatchupsMap[matchupKey1].wins++;
          bladeLineMatchupsMap[matchupKey2].losses++;
        } else {
          bladeLineMatchupsMap[matchupKey1].losses++;
          bladeLineMatchupsMap[matchupKey2].wins++;
        }

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

      // Calculate blade line matchup win rates
      Object.values(bladeLineMatchupsMap).forEach(matchup => {
        matchup.winRate = matchup.totalMatches > 0 ? (matchup.wins / matchup.totalMatches) * 100 : 0;
      });

      setPartStats(stats);
      setComboStats(comboStatsArray);
      setBladeLineMatchups(Object.values(bladeLineMatchupsMap));
      setProcessedMatches(processed);

    } catch (error) {
      console.error('Error processing tournament data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
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
    name: `${combo.combo.substring(0, 15)}...`,
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
      {/* Top Combos Chart */}
      <div className="chart-container">
        <h3 className="chart-title flex items-center">
          <Target size={24} className="mr-2 text-blue-600" />
          Top Combos by Score
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={topCombosChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [
                typeof value === 'number' ? value.toFixed(2) : value,
                name === 'score' ? 'Combo Score' : name === 'winRate' ? 'Win Rate (%)' : 'Matches'
              ]}
            />
            <Legend />
            <Bar dataKey="score" fill="#3B82F6" name="Combo Score" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Finish Distribution */}
      <div className="chart-container">
        <h3 className="chart-title">Finish Type Distribution</h3>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={finishDistributionData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
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

      {/* Combo Statistics Table */}
      <div className="chart-container">
        <h3 className="chart-title">Combo Performance Rankings</h3>
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

      {/* Blade Line Matchups */}
      <div className="chart-container">
        <h3 className="chart-title">Blade Line Matchup Matrix</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attacker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Defender
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bladeLineMatchups
                .filter(matchup => matchup.totalMatches > 0)
                .sort((a, b) => b.winRate - a.winRate)
                .map((matchup, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        matchup.attacker === 'Basic' ? 'bg-blue-100 text-blue-800' :
                        matchup.attacker === 'Unique' ? 'bg-purple-100 text-purple-800' :
                        matchup.attacker === 'Custom' ? 'bg-orange-100 text-orange-800' :
                        matchup.attacker === 'X-Over' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {matchup.attacker}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        matchup.defender === 'Basic' ? 'bg-blue-100 text-blue-800' :
                        matchup.defender === 'Unique' ? 'bg-purple-100 text-purple-800' :
                        matchup.defender === 'Custom' ? 'bg-orange-100 text-orange-800' :
                        matchup.defender === 'X-Over' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {matchup.defender}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {matchup.totalMatches}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {matchup.wins}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`font-medium ${
                        matchup.winRate >= 60 ? 'text-green-600' :
                        matchup.winRate >= 40 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {matchup.winRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Part Statistics */}
      {(['blade', 'ratchet', 'bit', 'lockchip', 'mainBlade', 'assistBlade'] as const).map(partType => (
        <div key={partType} className="chart-container">
          <h3 className="chart-title capitalize">
            {partType === 'mainBlade' ? 'Main Blades' : 
             partType === 'assistBlade' ? 'Assist Blades' : 
             `${partType}s`} Performance
          </h3>
          
          {Object.keys(partStats[partType] || {}).length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No {partType} data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Wins
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Win Rate
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Wilson Score
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.values(partStats[partType] || {})
                    .filter(part => part.usage > 0)
                    .sort((a, b) => b.wilson - a.wilson)
                    .map((part, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {part.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                          {part.usage}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                          {part.wins}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className={`font-medium ${
                            part.winRate >= 60 ? 'text-green-600' :
                            part.winRate >= 40 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {part.winRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
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
  );
}