import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Target, Users, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { 
  parseBeybladeName, 
  calculateWilsonScore, 
  type AllPartsData, 
  type PartStats, 
  type BuildStats,
  type ParsedBeyblade 
} from '../../utils/beybladeParser';

interface Tournament {
  id: string;
  name: string;
  status: string;
  tournament_date: string;
}

interface MatchResult {
  player1_name: string;
  player2_name: string;
  player1_beyblade: string;
  player2_beyblade: string;
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
}

export function MetaAnalysis() {
  const { user } = useAuth();
  
  // State management
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [processingData, setProcessingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Parts data
  const [partsData, setPartsData] = useState<AllPartsData>({
    blades: [],
    ratchets: [],
    bits: [],
    lockchips: [],
    assistBlades: []
  });
  
  // Processed data
  const [partStats, setPartStats] = useState<{ [partType: string]: { [partName: string]: PartStats } }>({
    blade: {},
    ratchet: {},
    bit: {},
    lockchip: {},
    mainBlade: {},
    assistBlade: {}
  });
  
  const [processedMatches, setProcessedMatches] = useState<ProcessedMatch[]>([]);
  
  // Builds by Part feature
  const [selectedPartType, setSelectedPartType] = useState<string>('');
  const [selectedPartName, setSelectedPartName] = useState<string>('');
  const [buildsData, setBuildsData] = useState<BuildStats[]>([]);
  const [selectedBuild, setSelectedBuild] = useState<{ build: string; player: string } | null>(null);
  const [buildMatches, setBuildMatches] = useState<ProcessedMatch[]>([]);
  
  // Sorting
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ 
    key: 'wilson', 
    direction: 'desc' 
  });

  // Fetch tournaments on mount
  useEffect(() => {
    fetchTournaments();
    fetchAllPartsData();
  }, []);

  // Process tournament data when selected
  useEffect(() => {
    if (selectedTournament && Object.keys(partsData.blades).length > 0) {
      processTournamentData();
    }
  }, [selectedTournament, partsData]);

  // Generate builds data when part is selected
  useEffect(() => {
    if (selectedPartType && selectedPartName && processedMatches.length > 0) {
      generateBuildsData();
    }
  }, [selectedPartType, selectedPartName, processedMatches]);

  const fetchTournaments = async () => {
    try {
      console.log('🏆 META ANALYSIS: Fetching tournaments...');
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name, status, tournament_date')
        .order('tournament_date', { ascending: false });

      if (error) throw error;
      
      setTournaments(data || []);
      console.log(`✅ META ANALYSIS: Loaded ${data?.length || 0} tournaments`);
      
      // Auto-select first completed tournament
      const completedTournament = data?.find(t => t.status === 'completed');
      if (completedTournament) {
        setSelectedTournament(completedTournament.id);
        console.log(`🎯 META ANALYSIS: Auto-selected completed tournament: ${completedTournament.name}`);
      }
    } catch (error) {
      console.error('❌ META ANALYSIS: Error fetching tournaments:', error);
      setError('Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPartsData = async () => {
    try {
      console.log('🔧 META ANALYSIS: Fetching all parts data...');
      
      const [bladesRes, ratchetsRes, bitsRes, lockchipsRes, assistBladesRes] = await Promise.all([
        supabase.from('beypart_blade').select('*'),
        supabase.from('beypart_ratchet').select('*'),
        supabase.from('beypart_bit').select('*'),
        supabase.from('beypart_lockchip').select('*'),
        supabase.from('beypart_assistblade').select('*')
      ]);

      if (bladesRes.error) throw bladesRes.error;
      if (ratchetsRes.error) throw ratchetsRes.error;
      if (bitsRes.error) throw bitsRes.error;
      if (lockchipsRes.error) throw lockchipsRes.error;
      if (assistBladesRes.error) throw assistBladesRes.error;

      const newPartsData: AllPartsData = {
        blades: bladesRes.data || [],
        ratchets: ratchetsRes.data || [],
        bits: bitsRes.data || [],
        lockchips: lockchipsRes.data || [],
        assistBlades: assistBladesRes.data || []
      };

      setPartsData(newPartsData);
      console.log('✅ META ANALYSIS: Parts data loaded:', {
        blades: newPartsData.blades.length,
        ratchets: newPartsData.ratchets.length,
        bits: newPartsData.bits.length,
        lockchips: newPartsData.lockchips.length,
        assistBlades: newPartsData.assistBlades.length
      });
    } catch (error) {
      console.error('❌ META ANALYSIS: Error fetching parts data:', error);
      setError('Failed to load parts data');
    }
  };

  const processTournamentData = async () => {
    if (!selectedTournament) return;
    
    setProcessingData(true);
    setError(null);
    
    try {
      console.log(`🔄 META ANALYSIS: Processing data for tournament ${selectedTournament}`);
      
      // Fetch match results
      const { data: matches, error: matchError } = await supabase
        .from('match_results')
        .select('player1_name, player2_name, player1_beyblade, player2_beyblade, winner_name, outcome, points_awarded')
        .eq('tournament_id', selectedTournament);

      if (matchError) throw matchError;
      
      if (!matches || matches.length === 0) {
        console.log('⚠️ META ANALYSIS: No matches found for this tournament');
        setPartStats({
          blade: {},
          ratchet: {},
          bit: {},
          lockchip: {},
          mainBlade: {},
          assistBlade: {}
        });
        setProcessedMatches([]);
        setProcessingData(false);
        return;
      }

      console.log(`📊 META ANALYSIS: Processing ${matches.length} matches`);
      
      // Process matches and parse Beyblade names
      const processed: ProcessedMatch[] = [];
      const stats = {
        const bl1 = match.player1_blade_line;
        const bl2 = match.player2_blade_line;
        blade: {} as { [name: string]: PartStats },
        ratchet: {} as { [name: string]: PartStats },
        bit: {} as { [name: string]: PartStats },
        lockchip: {} as { [name: string]: PartStats },
        mainBlade: {} as { [name: string]: PartStats },
        assistBlade: {} as { [name: string]: PartStats }
      };

      // Initialize all parts with zero stats
      const initializePart = (partType: string, partName: string) => {
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
      };

      // Process each match
      matches.forEach((match: MatchResult) => {
        if (!match.winner_name || !match.player1_name || !match.player2_name) return;
        
        // Parse both Beyblades - we need to get blade line info from registrations
        // For now, we'll try to infer from the name structure, but ideally we'd get this from registration data
        const p1Parts = parseBeybladeName(match.player1_beyblade, match.player1_blade_line || 'Basic', partsData);
        const p2Parts = parseBeybladeName(match.player2_beyblade, match.player2_blade_line || 'Basic', partsData);
        
        // Create processed match entries
        const p1Match: ProcessedMatch = {
          player: match.player1_name,
          opponent: match.player2_name,
          beyblade: match.player1_beyblade,
          opponentBeyblade: match.player2_beyblade,
          isWin: match.winner_name === match.player1_name,
          outcome: match.outcome || 'Unknown',
          parsedParts: p1Parts
        };
        
        const p2Match: ProcessedMatch = {
          player: match.player2_name,
          opponent: match.player1_name,
          beyblade: match.player2_beyblade,
          opponentBeyblade: match.player1_beyblade,
        const winBladeLine = winner === p1 ? bl1 : bl2;
        const loseBladeLine = winner === p1 ? bl2 : bl1;
          isWin: match.winner_name === match.player2_name,
          outcome: match.outcome || 'Unknown',
          parsedParts: p2Parts
        };
        
        processed.push(p1Match, p2Match);
        
        // Update stats for each parsed part
        const updateStats = (parsedParts: ParsedBeyblade, isWin: boolean) => {
          Object.entries(parsedParts).forEach(([partType, partName]) => {
            if (partType === 'isCustom' || !partName) return;
            
            initializePart(partType, partName);
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

      // Calculate win rates and Wilson scores
      Object.keys(stats).forEach(partType => {
        Object.values(stats[partType as keyof typeof stats]).forEach(partStat => {
          const total = partStat.wins + partStat.losses;
          partStat.winRate = total > 0 ? (partStat.wins / total) * 100 : 0;
          partStat.wilson = calculateWilsonScore(partStat.wins, total);
        });
      });

      setPartStats(stats);
      setProcessedMatches(processed);
      
      console.log('✅ META ANALYSIS: Data processing complete');
      console.log('📈 META ANALYSIS: Stats summary:', {
        totalProcessedMatches: processed.length,
        uniqueBlades: Object.keys(stats.blade).length,
        uniqueRatchets: Object.keys(stats.ratchet).length,
        uniqueBits: Object.keys(stats.bit).length
      });
      
    } catch (error) {
      console.error('❌ META ANALYSIS: Error processing tournament data:', error);
      setError('Failed to process tournament data');
    } finally {
      setProcessingData(false);
    }
  };

  const generateBuildsData = () => {
    console.log(`🔨 META ANALYSIS: Generating builds data for ${selectedPartType}: ${selectedPartName}`);
    
    const builds: { [key: string]: BuildStats } = {};
    
    processedMatches.forEach(match => {
      const partValue = match.parsedParts[selectedPartType as keyof ParsedBeyblade];
      if (partValue !== selectedPartName) return;
      
      const buildKey = `${match.beyblade}_${match.player}`;
      
      if (!builds[buildKey]) {
        builds[buildKey] = {
          build: match.beyblade,
          player: match.player,
          wins: 0,
          losses: 0,
          winRate: 0,
          wilson: 0
        };
      }
      
      if (match.isWin) {
        builds[buildKey].wins++;
      } else {
        builds[buildKey].losses++;
      }
    });
    
    // Calculate stats and sort
    const buildsArray = Object.values(builds).map(build => {
      const total = build.wins + build.losses;
      build.winRate = total > 0 ? (build.wins / total) * 100 : 0;
      build.wilson = calculateWilsonScore(build.wins, total);
      return build;
    }).sort((a, b) => b.wilson - a.wilson);
    
    setBuildsData(buildsArray);
    console.log(`✅ META ANALYSIS: Generated ${buildsArray.length} builds for ${selectedPartName}`);
  };

  const handleBuildClick = (build: string, player: string) => {
    setSelectedBuild({ build, player });
    
    const matchesForBuild = processedMatches.filter(match => 
      match.beyblade === build && match.player === player
    );
    
    setBuildMatches(matchesForBuild);
    console.log(`👁️ META ANALYSIS: Showing ${matchesForBuild.length} matches for ${build} by ${player}`);
  };

  // Temporary function to infer blade line - ideally we'd get this from registration data
  const inferBladeLine = (beybladeName: string): string => {
    // Simple heuristic: if it starts with a single letter followed by a blade name, it's likely Custom
    // Otherwise, assume it's Basic/Unique
    const customPattern = /^[A-Z][a-z]*[A-Z]/; // Like "ValkyrieBlast" or "RhinoHorn"
    if (customPattern.test(beybladeName)) {
      return 'Custom';
    }
    return 'Basic'; // Default to Basic for now
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedPartsData = (partType: string) => {
    const data = Object.values(partStats[partType] || {}).filter(part => part.usage > 0);
    
    if (!sortConfig.key) return data.sort((a, b) => b.wilson - a.wilson);
    
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key as keyof PartStats];
      const bVal = b[sortConfig.key as keyof PartStats];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortConfig.direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  };

  const getPartTypeLabel = (type: string) => {
    switch (type) {
      case 'blade': return 'Blades';
      case 'ratchet': return 'Ratchets';
      case 'bit': return 'Bits';
      case 'lockchip': return 'Lockchips';
      case 'mainBlade': return 'Main Blades';
      case 'assistBlade': return 'Assist Blades';
      default: return type;
    }
  };

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

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meta Analysis</h1>
        <p className="text-gray-600">Analyze Beyblade part usage and performance statistics</p>
      </div>

      {/* Tournament Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Tournament Selection</h2>
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Tournament
          </label>
          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select Tournament --</option>
            {tournaments.map(tournament => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.name} ({tournament.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedTournament && (
        <>
          {/* Processing Indicator */}
          {processingData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                <div>
                  <h3 className="text-blue-800 font-medium">Processing Tournament Data</h3>
                  <p className="text-blue-700 text-sm mt-1">
                    Parsing Beyblade names and calculating statistics...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* No Data Message */}
          {!processingData && processedMatches.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <div className="flex items-center">
                <div className="text-yellow-600 mr-3">⚠️</div>
                <div>
                  <h3 className="text-yellow-800 font-medium">No Match Data Available</h3>
                  <p className="text-yellow-700 text-sm mt-1">
                    This tournament has no completed matches yet. Meta analysis requires match results to generate statistics.
                    {tournaments.find(t => t.id === selectedTournament)?.status === 'upcoming' && 
                      ' Try selecting a completed tournament instead.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Builds by Part */}
          {!processingData && processedMatches.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Target className="mr-2" size={24} />
                Builds by Part
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Part Type</label>
                  <select
                    value={selectedPartType}
                    onChange={(e) => {
                      setSelectedPartType(e.target.value);
                      setSelectedPartName('');
                      setBuildsData([]);
                      setSelectedBuild(null);
                      setBuildMatches([]);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Part Type</option>
                    <option value="blade">Blade</option>
                    <option value="ratchet">Ratchet</option>
                    <option value="bit">Bit</option>
                    <option value="lockchip">Lockchip</option>
                    <option value="mainBlade">Main Blade</option>
                    <option value="assistBlade">Assist Blade</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Part Name</label>
                  <select
                    value={selectedPartName}
                    onChange={(e) => setSelectedPartName(e.target.value)}
                    disabled={!selectedPartType}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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

              {/* Builds Table */}
              {buildsData.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Builds using {selectedPartName} ({getPartTypeLabel(selectedPartType)})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Build</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wins</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Losses</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Win Rate</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wilson Score</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {buildsData.map((build, index) => (
                          <tr 
                            key={index} 
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleBuildClick(build.build, build.player)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-800">
                              {build.build}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{build.player}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{build.wins}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{build.losses}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{build.winRate.toFixed(1)}%</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{build.wilson.toFixed(3)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Build Matches */}
              {selectedBuild && buildMatches.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Matches for <strong>{selectedBuild.build}</strong> by <strong>{selectedBuild.player}</strong>
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opponent</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opponent's Bey</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Finish Type</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {buildMatches.map((match, index) => (
                          <tr key={index} className={match.isWin ? 'bg-green-50' : 'bg-red-50'}>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                              match.isWin ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {match.isWin ? 'Win' : 'Loss'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{match.opponent}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{match.opponentBeyblade}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{match.outcome}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Part Statistics Tables */}
          {!processingData && processedMatches.length > 0 && (
            <div className="space-y-8">
              {(['blade', 'ratchet', 'bit', 'lockchip', 'mainBlade', 'assistBlade'] as const).map(partType => (
                <div key={partType} className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 capitalize flex items-center">
                    <BarChart3 className="mr-2" size={24} />
                    {getPartTypeLabel(partType)}
                  </h2>
                  
                  {Object.keys(partStats[partType] || {}).length === 0 ? (
                    <div className="text-center py-8">
                      <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No {getPartTypeLabel(partType).toLowerCase()} data available</p>
                      <p className="text-sm text-gray-400 mt-1">No matches used {getPartTypeLabel(partType).toLowerCase()} from this category</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <SortableHeader sortKey="name">Name</SortableHeader>
                            <SortableHeader sortKey="usage">Usage</SortableHeader>
                            <SortableHeader sortKey="wins">Wins</SortableHeader>
                            <SortableHeader sortKey="losses">Losses</SortableHeader>
                            <SortableHeader sortKey="winRate">Win Rate</SortableHeader>
                            <SortableHeader sortKey="wilson">Wilson Score</SortableHeader>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {sortedPartsData(partType).map((part, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {part.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{part.usage}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{part.wins}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{part.losses}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {part.winRate.toFixed(1)}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
          )}
        </>
      )}
    </div>
  );
}