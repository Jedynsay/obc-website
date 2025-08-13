import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Target, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PartStats {
  name: string;
  full: string;
  line: string;
  used: number;
  wins: number;
  losses: number;
  winRate: number;
  wilson: number;
}

interface BuildStats {
  build: string;
  player: string;
  wins: number;
  losses: number;
  winRate: number;
  wilson: number;
}

interface MatchData {
  p1: string;
  p2: string;
  bey1: string;
  bey2: string;
  winner: string;
  finish: string;
}

export function MetaAnalysis() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [partsData, setPartsData] = useState<{
    blade: { [key: string]: PartStats };
    ratchet: { [key: string]: PartStats };
    bit: { [key: string]: PartStats };
    lockchip: { [key: string]: PartStats };
    mainBlade: { [key: string]: PartStats };
    assistBlade: { [key: string]: PartStats };
  }>({
    blade: {},
    ratchet: {},
    bit: {},
    lockchip: {},
    mainBlade: {},
    assistBlade: {}
  });
  const [matchData, setMatchData] = useState<MatchData[]>([]);
  const [selectedPartType, setSelectedPartType] = useState<'blade' | 'ratchet' | 'bit' | 'lockchip' | 'mainBlade' | 'assistBlade' | ''>('');
  const [selectedPartName, setSelectedPartName] = useState<string>('');
  const [buildsData, setBuildsData] = useState<BuildStats[]>([]);
  const [selectedBuild, setSelectedBuild] = useState<{ build: string; player: string } | null>(null);
  const [buildMatches, setBuildMatches] = useState<any[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: '', direction: 'asc' });

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchTournamentData();
    }
  }, [selectedTournament]);

  useEffect(() => {
    if (selectedPartType && selectedPartName && matchData.length > 0) {
      generateBuildsData();
    }
  }, [selectedPartType, selectedPartName, matchData]);

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name, status, tournament_date')
        .order('tournament_date', { ascending: false });

      if (error) throw error;
      setTournaments(data || []);
      
      // Auto-select first completed tournament
      const completedTournament = data?.find(t => t.status === 'completed');
      if (completedTournament) {
        setSelectedTournament(completedTournament.id);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTournamentData = async () => {
    try {
      // Fetch Beyblade parts data from all tables
      console.log('🔍 Fetching tournament data for:', selectedTournament);
      
      const bladesRes = await supabase.from('beypart_blade').select('*');
      const ratchetsRes = await supabase.from('beypart_ratchet').select('*');
      const bitsRes = await supabase.from('beypart_bit').select('*');
      const lockchipsRes = await supabase.from('beypart_lockchip').select('*');
      const assistBladesRes = await supabase.from('beypart_assistblade').select('*');
      const matchesRes = await supabase.from('match_results').select('*').eq('tournament_id', selectedTournament);

      console.log('📊 Parts data loaded:', {
        blades: bladesRes.data?.length || 0,
        ratchets: ratchetsRes.data?.length || 0,
        bits: bitsRes.data?.length || 0,
        lockchips: lockchipsRes.data?.length || 0,
        assistBlades: assistBladesRes.data?.length || 0,
        matches: matchesRes.data?.length || 0
      });

      if (bladesRes.error) {
        console.error('❌ Blades error:', bladesRes.error);
        throw bladesRes.error;
      }
      if (ratchetsRes.error) {
        console.error('❌ Ratchets error:', ratchetsRes.error);
        throw ratchetsRes.error;
      }
      if (bitsRes.error) {
        console.error('❌ Bits error:', bitsRes.error);
        throw bitsRes.error;
      }
      if (lockchipsRes.error) {
        console.error('❌ Lockchips error:', lockchipsRes.error);
        throw lockchipsRes.error;
      }
      if (assistBladesRes.error) {
        console.error('❌ Assist blades error:', assistBladesRes.error);
        throw assistBladesRes.error;
      }
      if (matchesRes.error) {
        console.error('❌ Matches error:', matchesRes.error);
        throw matchesRes.error;
      }

      // Initialize parts data
      const newPartsData = { 
        blade: {}, 
        ratchet: {}, 
        bit: {}, 
        lockchip: {},
        mainBlade: {},
        assistBlade: {}
      };

      // Process blades (both regular and main blades for custom)
      bladesRes.data?.forEach(blade => {
        const bladeName = blade.Blades;
        if (bladeName) {
          // Regular blade
          newPartsData.blade[bladeName] = {
            name: bladeName,
            full: bladeName,
            line: blade.Line || '',
            used: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            wilson: 0
          };
          
          // Also add as main blade for custom builds
          newPartsData.mainBlade[bladeName] = {
            name: bladeName,
            full: bladeName,
            line: blade.Line || '',
            used: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            wilson: 0
          };
        }
      });

      // Process ratchets
      ratchetsRes.data?.forEach(ratchet => {
        const ratchetName = ratchet.Ratchet;
        if (ratchetName) {
          newPartsData.ratchet[ratchetName] = {
            name: ratchetName,
            full: ratchetName,
            line: '',
            used: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            wilson: 0
          };
        }
      });

      // Process bits
      bitsRes.data?.forEach(bit => {
        const bitName = bit.Shortcut || bit.Bit;
        if (bitName) {
          newPartsData.bit[bitName] = {
            name: bitName,
            full: bit.Bit || bitName,
            line: '',
            used: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            wilson: 0
          };
        }
      });

      // Process lockchips
      lockchipsRes.data?.forEach(lockchip => {
        const lockchipName = lockchip.Lockchip;
        if (lockchipName) {
          newPartsData.lockchip[lockchipName] = {
            name: lockchipName,
            full: lockchipName,
            line: '',
            used: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            wilson: 0
          };
        }
      });

      // Process assist blades
      assistBladesRes.data?.forEach(assistBlade => {
        const assistBladeName = assistBlade['Assist Blade'];
        if (assistBladeName) {
          newPartsData.assistBlade[assistBladeName] = {
            name: assistBladeName,
            full: assistBlade['Assist Blade Name'] || assistBladeName,
            line: '',
            used: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            wilson: 0
          };
        }
      });

      // Transform match data
      const transformedMatches: MatchData[] = (matchesRes.data || []).map(match => ({
        p1: match.player1_name || '',
        p2: match.player2_name || '',
        bey1: match.player1_beyblade || '',
        bey2: match.player2_beyblade || '',
        winner: match.winner_name || '',
        finish: match.outcome ? match.outcome.split(' (')[0].trim() : 'Unknown'
      }));

      setMatchData(transformedMatches);

      // Compute stats
      computeStats(newPartsData, transformedMatches);
      setPartsData(newPartsData);
      
      console.log('✅ Meta analysis data loaded successfully');

    } catch (error) {
      console.error('Error fetching tournament data:', error);
      // Set empty data on error
      setPartsData({ 
        blade: {}, 
        ratchet: {}, 
        bit: {}, 
        lockchip: {},
        mainBlade: {},
        assistBlade: {}
      });
      setMatchData([]);
      setBuildsData([]);
    }
  };

  const parseParts = (bey: string): { [key: string]: string } => {
    if (!bey || !bey.trim()) return {};

    // Check if it's a custom build (contains lockchip pattern)
    const isCustom = Object.keys(partsData.lockchip).some(lockchip => 
      lockchip && bey.startsWith(lockchip)
    );

    if (isCustom) {
      // Parse custom build: LockchipMainBlade AssistBladeRatchetBit
      // Find the lockchip
      let lockchip = '';
      let remainingBey = bey;
      
      for (const lc of Object.keys(partsData.lockchip).sort((a, b) => b.length - a.length)) {
        if (lc && bey.startsWith(lc)) {
          lockchip = lc;
          remainingBey = bey.slice(lc.length);
          break;
        }
      }

      if (!lockchip) return {};

      // Find main blade
      let mainBlade = '';
      for (const mb of Object.keys(partsData.mainBlade).sort((a, b) => b.length - a.length)) {
        if (mb && remainingBey.startsWith(mb)) {
          mainBlade = mb;
          remainingBey = remainingBey.slice(mb.length).trim();
          break;
        }
      }

      if (!mainBlade) return {};

      // Find bit (from the end)
      let bit = '';
      for (const b of Object.keys(partsData.bit).sort((a, b) => b.length - a.length)) {
        if (b && remainingBey.endsWith(b)) {
          bit = b;
          remainingBey = remainingBey.slice(0, remainingBey.length - b.length).trim();
          break;
        }
      }

      if (!bit) return {};

      // Find ratchet (from the end of remaining)
      let ratchet = '';
      for (const r of Object.keys(partsData.ratchet).sort((a, b) => b.length - a.length)) {
        if (r && remainingBey.endsWith(r)) {
          ratchet = r;
          remainingBey = remainingBey.slice(0, remainingBey.length - r.length).trim();
          break;
        }
      }

      if (!ratchet) return {};

      // Remaining should be assist blade
      const assistBlade = remainingBey;

      return {
        lockchip,
        mainBlade,
        assistBlade,
        ratchet,
        bit
      };
    } else {
      // Parse regular build: Blade RatchetBit
      // Find bit (from the end)
      let bit = '';
      let remainingBey = bey;
      
      for (const b of Object.keys(partsData.bit).sort((a, b) => b.length - a.length)) {
        if (b && bey.endsWith(b)) {
          bit = b;
          remainingBey = bey.slice(0, bey.length - b.length).trim();
          break;
        }
      }

      if (!bit) return {};

      // Find ratchet (from the end of remaining)
      let ratchet = '';
      for (const r of Object.keys(partsData.ratchet).sort((a, b) => b.length - a.length)) {
        if (r && remainingBey.endsWith(r)) {
          ratchet = r;
          remainingBey = remainingBey.slice(0, remainingBey.length - r.length).trim();
          break;
        }
      }

      if (!ratchet) return {};

      // Remaining should be blade
      const blade = remainingBey;

      return {
        blade,
        ratchet,
        bit
      };
    }
  };

  const isValidPart = (partName: string): boolean => {
    return partName && partName.trim() && partName !== 'undefined' && partName !== 'null';
  };

  const computeStats = (parts: typeof partsData, matches: MatchData[]) => {
    // Reset stats
    Object.keys(parts).forEach(partType => {
      Object.values(parts[partType as keyof typeof parts]).forEach(p => { 
        p.used = 0; 
        p.wins = 0; 
        p.losses = 0; 
      });
    });

    for (const match of matches) {
      const parts1 = parseParts(match.bey1);
      const parts2 = parseParts(match.bey2);
      
      // Skip matches with missing data
      if (!match.winner || !match.p1 || !match.p2) continue;

      // Count usage and wins/losses for each part type
      const countParts = (playerParts: { [key: string]: string }, isWin: boolean) => {
        Object.entries(playerParts).forEach(([partType, partName]) => {
          if (!isValidPart(partName) || !parts[partType as keyof typeof parts]) return;
          
          const partStats = parts[partType as keyof typeof parts][partName];
          if (!partStats) return;

          partStats.used++;
          if (isWin) {
            partStats.wins++;
          } else {
            partStats.losses++;
          }
        });
      };

      countParts(parts1, match.winner === match.p1);
      countParts(parts2, match.winner === match.p2);
    }

    // Calculate win rates and Wilson scores
    Object.keys(parts).forEach(partType => {
      Object.values(parts[partType as keyof typeof parts]).forEach(part => {
        const total = part.wins + part.losses;
        part.winRate = total ? (part.wins / total) * 100 : 0;
        part.wilson = wilson(part.wins, total);
      });
    });
  };

  const wilson = (wins: number, total: number, z: number = 1.96): number => {
    if (total === 0) return 0;
    const phat = wins / total;
    const denom = 1 + z * z / total;
    const center = phat + z * z / (2 * total);
    const spread = z * Math.sqrt((phat * (1 - phat) + z * z / (4 * total)) / total);
    return (center - spread) / denom;
  };

  const generateBuildsData = () => {
    const builds: { [key: string]: BuildStats } = {};

    for (const match of matchData) {
      const processBey = (player: string, bey: string, isWin: boolean) => {
        const parts = parseParts(bey);
        const matchKey = parts[selectedPartType] || '';
        
        // Skip if part doesn't match or is invalid
        if (!isValidPart(matchKey) || matchKey !== selectedPartName) return;

        const build = bey; // Use full beyblade name as build
        const id = `${build}_${player}`;
        
        if (!builds[id]) {
          builds[id] = { build, player, wins: 0, losses: 0, winRate: 0, wilson: 0 };
        }
        
        if (isWin) {
          builds[id].wins++;
        } else {
          builds[id].losses++;
        }
      };

      processBey(match.p1, match.bey1, match.winner === match.p1);
      processBey(match.p2, match.bey2, match.winner === match.p2);
    }

    const buildsArray = Object.values(builds).map(build => {
      const total = build.wins + build.losses;
      build.winRate = total ? (build.wins / total) * 100 : 0;
      build.wilson = wilson(build.wins, total);
      return build;
    }).sort((a, b) => b.wilson - a.wilson); // Sort by Wilson score

    setBuildsData(buildsArray);
  };

  const getFilteredPartsData = (type: keyof typeof partsData) => {
    return Object.values(partsData[type])
      .filter(p => p.used > 0 && isValidPart(p.name));
  };

  const handleBuildClick = (build: string, player: string) => {
    setSelectedBuild({ build, player });
    
    const matchRows = [];
    for (const match of matchData) {
      const addMatch = (p: string, bey: string, opponent: string, opponentBey: string, winner: string) => {
        if (bey === build && p === player) {
          // Clean up finish type
          const cleanFinish = match.finish && match.finish !== 'Unknown' 
            ? match.finish : 'Unknown Finish';
          const result = p === winner ? "Win" : "Loss";
          matchRows.push({
            result,
            opponent,
            opponentBey,
            finish: cleanFinish
          });
        }
      };

      addMatch(match.p1, match.bey1, match.p2, match.bey2, match.winner);
      addMatch(match.p2, match.bey2, match.p1, match.bey1, match.winner);
    }

    setBuildMatches(matchRows);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedPartsData = (type: keyof typeof partsData) => {    
    const data = getFilteredPartsData(type);
    
    if (!sortConfig.key) return data.sort((a, b) => b.wilson - a.wilson); // Default sort by Wilson score
    
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
  
  // Show loading state while fetching data
  if (selectedTournament && Object.keys(partsData.blade).length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tournament data...</p>
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
          {/* Builds by Part Section */}
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
                    setSelectedPartType(e.target.value as any);
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
                  {selectedPartType && getFilteredPartsData(selectedPartType)
                    .map(part => (
                      <option key={part.name} value={part.name}>{part.name}</option>
                    ))}
                </select>
              </div>
            </div>

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
                <p className="text-center text-sm text-gray-600 mt-4">
                  Click on a build to show all matches for that build
                </p>
              </div>
            )}

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
                        <tr key={index} className={match.result === 'Win' ? 'bg-green-50' : 'bg-red-50'}>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                            match.result === 'Win' ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {match.result}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{match.opponent}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{match.opponentBey}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{match.finish}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Parts Statistics Tables */}
          <div className="space-y-8">
            {(['blade', 'ratchet', 'bit', 'lockchip', 'mainBlade', 'assistBlade'] as const).map(partType => (
              <div key={partType} className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 capitalize flex items-center">
                  <BarChart3 className="mr-2" size={24} />
                  {getPartTypeLabel(partType)}
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <SortableHeader sortKey="name">Name</SortableHeader>
                        <SortableHeader sortKey="used">Usage</SortableHeader>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{part.used}</td>
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
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}