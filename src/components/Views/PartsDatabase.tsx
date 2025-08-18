import React, { useState, useEffect } from 'react';
import { Database, Search, Filter, Grid, List, Zap, Shield, Clock, Activity, ShieldCheck, Eye, RotateCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Part {
  id: string;
  name: string;
  type: string;
  line?: string;
  stats: {
    attack: number;
    defense: number;
    stamina: number;
    dash: number;
    burstRes: number;
  };
  data: any;
}

export function PartsDatabase() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'attack' | 'defense' | 'stamina' | 'dash' | 'burstRes'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);

  useEffect(() => {
    fetchAllParts();
  }, []);

  const fetchAllParts = async () => {
    setLoading(true);
    try {
      const [bladesRes, ratchetsRes, bitsRes, lockchipsRes, assistBladesRes] = await Promise.all([
        supabase.from('beypart_blade').select('*'),
        supabase.from('beypart_ratchet').select('*'),
        supabase.from('beypart_bit').select('*'),
        supabase.from('beypart_lockchip').select('*'),
        supabase.from('beypart_assistblade').select('*')
      ]);

      const allParts: Part[] = [];

      // Process blades
      (bladesRes.data || []).forEach((blade: any) => {
        allParts.push({
          id: `blade-${blade.Blades}`,
          name: blade.Blades,
          type: 'Blade',
          line: blade.Line,
          stats: {
            attack: blade.Attack || 0,
            defense: blade.Defense || 0,
            stamina: blade.Stamina || 0,
            dash: 0,
            burstRes: 0
          },
          data: blade
        });
      });

      // Process ratchets
      (ratchetsRes.data || []).forEach((ratchet: any) => {
        allParts.push({
          id: `ratchet-${ratchet.Ratchet}`,
          name: ratchet.Ratchet,
          type: 'Ratchet',
          stats: {
            attack: ratchet.Attack || 0,
            defense: ratchet.Defense || 0,
            stamina: ratchet.Stamina || 0,
            dash: 0,
            burstRes: 0
          },
          data: ratchet
        });
      });

      // Process bits
      (bitsRes.data || []).forEach((bit: any) => {
        allParts.push({
          id: `bit-${bit.Bit}`,
          name: `${bit.Bit} (${bit.Shortcut})`,
          type: 'Bit',
          stats: {
            attack: bit.Attack || 0,
            defense: bit.Defense || 0,
            stamina: bit.Stamina || 0,
            dash: bit.Dash || 0,
            burstRes: bit['Burst Res'] || 0
          },
          data: bit
        });
      });

      // Process lockchips
      (lockchipsRes.data || []).forEach((lockchip: any) => {
        allParts.push({
          id: `lockchip-${lockchip.Lockchip}`,
          name: lockchip.Lockchip,
          type: 'Lockchip',
          stats: {
            attack: lockchip.Attack || 0,
            defense: lockchip.Defense || 0,
            stamina: lockchip.Stamina || 0,
            dash: 0,
            burstRes: 0
          },
          data: lockchip
        });
      });

      // Process assist blades
      (assistBladesRes.data || []).forEach((assistBlade: any) => {
        allParts.push({
          id: `assistblade-${assistBlade['Assist Blade']}`,
          name: `${assistBlade['Assist Blade Name']} (${assistBlade['Assist Blade']})`,
          type: 'Assist Blade',
          stats: {
            attack: assistBlade.Attack || 0,
            defense: assistBlade.Defense || 0,
            stamina: assistBlade.Stamina || 0,
            dash: 0,
            burstRes: 0
          },
          data: assistBlade
        });
      });

      setParts(allParts);
    } catch (error) {
      console.error('Error fetching parts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatIcon = (stat: string) => {
    switch (stat) {
      case 'attack': return <Zap size={16} className="text-red-500" />;
      case 'defense': return <Shield size={16} className="text-blue-500" />;
      case 'stamina': return <Clock size={16} className="text-green-500" />;
      case 'dash': return <Activity size={16} className="text-yellow-500" />;
      case 'burstRes': return <ShieldCheck size={16} className="text-purple-500" />;
      default: return null;
    }
  };

  const getStatColor = (stat: string) => {
    switch (stat) {
      case 'attack': return 'bg-red-500';
      case 'defense': return 'bg-blue-500';
      case 'stamina': return 'bg-green-500';
      case 'dash': return 'bg-yellow-500';
      case 'burstRes': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Blade': return 'bg-red-100 text-red-800';
      case 'Ratchet': return 'bg-blue-100 text-blue-800';
      case 'Bit': return 'bg-green-100 text-green-800';
      case 'Lockchip': return 'bg-purple-100 text-purple-800';
      case 'Assist Blade': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAndSortedParts = parts
    .filter(part => {
      const matchesSearch = part.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || part.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      if (sortBy === 'name') {
        aValue = a.name;
        bValue = b.name;
      } else {
        aValue = a.stats[sortBy];
        bValue = b.stats[sortBy];
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

  const handleSort = (key: typeof sortBy) => {
    if (sortBy === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDirection('desc');
    }
  };

  const renderPartCard = (part: Part) => (
    <div key={part.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(part.type)}`}>
              {part.type}
            </span>
            {part.line && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                {part.line}
              </span>
            )}
          </div>
          <h3 className="font-bold text-lg text-gray-900 mb-2">{part.name}</h3>
        </div>
        <button
          onClick={() => setSelectedPart(part)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="View Details"
        >
          <Eye size={16} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(part.stats).map(([stat, value]) => {
          if (value === 0) return null;
          return (
            <div key={stat} className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                {getStatIcon(stat)}
                <span className="text-xs font-medium text-gray-600 capitalize">
                  {stat === 'burstRes' ? 'Burst Res' : stat}
                </span>
              </div>
              <span className="font-bold text-gray-900">{value}</span>
            </div>
          );
        })}
      </div>

      {/* 3D Viewer Placeholder */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
            <RotateCcw size={20} className="text-gray-400" />
          </div>
          <p className="text-xs text-gray-500">3D Viewer</p>
          <p className="text-xs text-gray-400">Coming Soon</p>
        </div>
      </div>
    </div>
  );

  const renderPartRow = (part: Part) => (
    <tr key={part.id} className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(part.type)}`}>
            {part.type}
          </span>
          <div>
            <div className="font-medium text-gray-900">{part.name}</div>
            {part.line && (
              <div className="text-sm text-gray-500">{part.line} Line</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="flex items-center justify-center space-x-1">
          {part.stats.attack > 0 && (
            <>
              <Zap size={12} className="text-red-500" />
              <span className="font-medium">{part.stats.attack}</span>
            </>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="flex items-center justify-center space-x-1">
          {part.stats.defense > 0 && (
            <>
              <Shield size={12} className="text-blue-500" />
              <span className="font-medium">{part.stats.defense}</span>
            </>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="flex items-center justify-center space-x-1">
          {part.stats.stamina > 0 && (
            <>
              <Clock size={12} className="text-green-500" />
              <span className="font-medium">{part.stats.stamina}</span>
            </>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="flex items-center justify-center space-x-1">
          {part.stats.dash > 0 && (
            <>
              <Activity size={12} className="text-yellow-500" />
              <span className="font-medium">{part.stats.dash}</span>
            </>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="flex items-center justify-center space-x-1">
          {part.stats.burstRes > 0 && (
            <>
              <ShieldCheck size={12} className="text-purple-500" />
              <span className="font-medium">{part.stats.burstRes}</span>
            </>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <button
          onClick={() => setSelectedPart(part)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="View Details"
        >
          <Eye size={16} />
        </button>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="page-container">
        <div className="content-wrapper">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading parts database...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="content-wrapper">
        <div className="page-header">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="page-title flex items-center">
                <Database size={32} className="mr-3 text-blue-600" />
                Parts Database
              </h1>
              <p className="page-subtitle">Explore all available Beyblade parts and their statistics</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search parts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="Blade">Blades</option>
                <option value="Ratchet">Ratchets</option>
                <option value="Bit">Bits</option>
                <option value="Lockchip">Lockchips</option>
                <option value="Assist Blade">Assist Blades</option>
              </select>
            </div>

            <div>
              <select
                value={`${sortBy}-${sortDirection}`}
                onChange={(e) => {
                  const [key, direction] = e.target.value.split('-');
                  setSortBy(key as any);
                  setSortDirection(direction as any);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="attack-desc">Attack (High-Low)</option>
                <option value="attack-asc">Attack (Low-High)</option>
                <option value="defense-desc">Defense (High-Low)</option>
                <option value="defense-asc">Defense (Low-High)</option>
                <option value="stamina-desc">Stamina (High-Low)</option>
                <option value="stamina-asc">Stamina (Low-High)</option>
                <option value="dash-desc">Dash (High-Low)</option>
                <option value="dash-asc">Dash (Low-High)</option>
                <option value="burstRes-desc">Burst Res (High-Low)</option>
                <option value="burstRes-asc">Burst Res (Low-High)</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredAndSortedParts.length} of {parts.length} parts
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Attack</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Defense</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Stamina</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Dash</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>Burst Res</span>
              </div>
            </div>
          </div>
        </div>

        {/* Parts Display */}
        {filteredAndSortedParts.length === 0 ? (
          <div className="text-center py-12">
            <Database size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Parts Found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedParts.map(renderPartCard)}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Part</span>
                      {sortBy === 'name' && (
                        sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('attack')}
                      className="flex items-center justify-center space-x-1 hover:text-gray-700 w-full"
                    >
                      <Zap size={12} className="text-red-500" />
                      <span>Attack</span>
                      {sortBy === 'attack' && (
                        sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('defense')}
                      className="flex items-center justify-center space-x-1 hover:text-gray-700 w-full"
                    >
                      <Shield size={12} className="text-blue-500" />
                      <span>Defense</span>
                      {sortBy === 'defense' && (
                        sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('stamina')}
                      className="flex items-center justify-center space-x-1 hover:text-gray-700 w-full"
                    >
                      <Clock size={12} className="text-green-500" />
                      <span>Stamina</span>
                      {sortBy === 'stamina' && (
                        sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('dash')}
                      className="flex items-center justify-center space-x-1 hover:text-gray-700 w-full"
                    >
                      <Activity size={12} className="text-yellow-500" />
                      <span>Dash</span>
                      {sortBy === 'dash' && (
                        sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('burstRes')}
                      className="flex items-center justify-center space-x-1 hover:text-gray-700 w-full"
                    >
                      <ShieldCheck size={12} className="text-purple-500" />
                      <span>Burst Res</span>
                      {sortBy === 'burstRes' && (
                        sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedParts.map(renderPartRow)}
              </tbody>
            </table>
          </div>
        )}

        {/* Part Details Modal */}
        {selectedPart && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-4 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedPart.name}</h2>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
                        {selectedPart.type}
                      </span>
                      {selectedPart.line && (
                        <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
                          {selectedPart.line} Line
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPart(null)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Stats Display */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(selectedPart.stats).map(([stat, value]) => (
                      <div key={stat} className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          {getStatIcon(stat)}
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{value}</div>
                        <div className="text-sm text-gray-600 capitalize">
                          {stat === 'burstRes' ? 'Burst Res' : stat}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3D Viewer Placeholder */}
                <div className="bg-gray-50 rounded-xl p-8 text-center">
                  <div className="w-24 h-24 bg-gray-200 rounded-xl mx-auto mb-4 flex items-center justify-center">
                    <RotateCcw size={32} className="text-gray-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">3D Part Viewer</h4>
                  <p className="text-gray-600 mb-4">
                    Interactive 3D visualization of this part will be available soon
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-500">
                      Framework ready for 3D/2D part visualization implementation
                    </p>
                  </div>
                </div>

                {/* Raw Data (for debugging) */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      View Raw Data
                    </summary>
                    <div className="mt-3 bg-gray-50 rounded-lg p-4">
                      <pre className="text-xs text-gray-600 overflow-x-auto">
                        {JSON.stringify(selectedPart.data, null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}