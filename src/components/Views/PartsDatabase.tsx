import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Grid,
  List,
  Zap,
  Shield,
  Clock,
  Activity,
  ShieldCheck,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Part {
  id: string;
  name: string;
  category: string; // Blade, Bit, Ratchet, etc.
  role?: string;    // Attack, Defense, Stamina, Balance (from Supabase)
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
  const [sortBy, setSortBy] = useState<
    'name' | 'role' | 'attack' | 'defense' | 'stamina' | 'dash' | 'burstRes'
  >('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [activeTab, setActiveTab] = useState<string>('lockchips');
  const [activeRole, setActiveRole] = useState<string>('');
  const [bladeFilter, setBladeFilter] = useState<string>('');

  const tabs = ['lockchips', 'blades (custom)', 'blades', 'ratchets', 'bits'];

  useEffect(() => {
    fetchAllParts();
  }, []);

  const fetchAllParts = async () => {
    setLoading(true);
    try {
      const [bladesRes, ratchetsRes, bitsRes, lockchipsRes, assistBladesRes] =
        await Promise.all([
          supabase.from('beypart_blade').select('*'),
          supabase.from('beypart_ratchet').select('*'),
          supabase.from('beypart_bit').select('*'),
          supabase.from('beypart_lockchip').select('*'),
          supabase.from('beypart_assistblade').select('*'),
        ]);

      const allParts: Part[] = [];

      (bladesRes.data || []).forEach((blade: any) => {
        allParts.push({
          id: `blade-${blade.Blades}`,
          name: blade.Blades,
          category: 'Blade',
          role: blade.Type,
          line: blade.Line,
          stats: {
            attack: blade.Attack || 0,
            defense: blade.Defense || 0,
            stamina: blade.Stamina || 0,
            dash: 0,
            burstRes: 0,
          },
          data: blade,
        });
      });

      (ratchetsRes.data || []).forEach((ratchet: any) => {
        allParts.push({
          id: `ratchet-${ratchet.Ratchet}`,
          name: ratchet.Ratchet,
          category: 'Ratchet',
          role: ratchet.Type,
          stats: {
            attack: ratchet.Attack || 0,
            defense: ratchet.Defense || 0,
            stamina: ratchet.Stamina || 0,
            dash: 0,
            burstRes: 0,
          },
          data: ratchet,
        });
      });

      (bitsRes.data || []).forEach((bit: any) => {
        allParts.push({
          id: `bit-${bit.Bit}`,
          name: `${bit.Bit} (${bit.Shortcut})`,
          category: 'Bit',
          role: bit.Type,
          stats: {
            attack: bit.Attack || 0,
            defense: bit.Defense || 0,
            stamina: bit.Stamina || 0,
            dash: bit.Dash || 0,
            burstRes: bit['Burst Res'] || 0,
          },
          data: bit,
        });
      });

      (lockchipsRes.data || []).forEach((lockchip: any) => {
        allParts.push({
          id: `lockchip-${lockchip.Lockchip}`,
          name: lockchip.Lockchip,
          category: 'Lockchip',
          role: lockchip.Type,
          stats: {
            attack: lockchip.Attack || 0,
            defense: lockchip.Defense || 0,
            stamina: lockchip.Stamina || 0,
            dash: 0,
            burstRes: 0,
          },
          data: lockchip,
        });
      });

      (assistBladesRes.data || []).forEach((assistBlade: any) => {
        allParts.push({
          id: `assistblade-${assistBlade['Assist Blade']}`,
          name: `${assistBlade['Assist Blade Name']} (${assistBlade['Assist Blade']})`,
          category: 'Assist Blade',
          role: assistBlade.Type,
          stats: {
            attack: assistBlade.Attack || 0,
            defense: assistBlade.Defense || 0,
            stamina: assistBlade.Stamina || 0,
            dash: 0,
            burstRes: 0,
          },
          data: assistBlade,
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
      case 'attack':
        return <Zap size={16} className="text-red-500" />;
      case 'defense':
        return <Shield size={16} className="text-blue-500" />;
      case 'stamina':
        return <Clock size={16} className="text-green-500" />;
      case 'dash':
        return <Activity size={16} className="text-yellow-500" />;
      case 'burstRes':
        return <ShieldCheck size={16} className="text-purple-500" />;
      default:
        return null;
    }
  };

  const filteredAndSortedParts = parts
    .filter((part) => part.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      let aValue: any, bValue: any;
      if (sortBy === 'name') {
        aValue = a.name;
        bValue = b.name;
      } else if (sortBy === 'role') {
        aValue = a.role || '';
        bValue = b.role || '';
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

  const tabFilteredParts = filteredAndSortedParts.filter((part) => {
    if (activeTab === 'blades (custom)')
      return part.category === 'Blade' && part.line?.toLowerCase() === 'custom';
    if (activeTab === 'blades') {
      if (!bladeFilter)
        return part.category === 'Blade' && ['basic', 'unique', 'x-over'].includes(part.line?.toLowerCase() || '');
      return part.category === 'Blade' && part.line?.toLowerCase() === bladeFilter.toLowerCase();
    }
    if (activeTab === 'lockchips') return part.category === 'Lockchip';
    if (activeTab === 'ratchets') return part.category === 'Ratchet';
    if (activeTab === 'bits') return part.category === 'Bit';
    return true;
  });

  const roleFilteredParts = tabFilteredParts.filter((part) => {
    if (!activeRole) return true;
    return (part.role || '').toLowerCase() === activeRole;
  });

  const renderPartCard = (part: Part) => {
    return (
      <div
        key={part.id}
        onClick={() => setSelectedPart(part)}
        className="cursor-pointer bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition"
      >
        <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
          <span className="text-gray-400 text-sm">2D/3D Preview</span>
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold truncate break-words">{part.name}</h3>
          {part.role && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {part.role}
            </span>
          )}
        </div>
        {part.line && (
          <p className="text-xs text-gray-500 mt-1 truncate">{part.line}</p>
        )}
      </div>
    );
  };

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
        {/* Header */}
        <div className="page-header">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="page-title flex items-center">
                <Database size={32} className="mr-3 text-blue-600" />
                Parts Database
              </h1>
              <p className="page-subtitle">
                Explore all available Beyblade parts and their statistics
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Search + Role Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search parts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Role Filter (always visible, right side) */}
            <div className="md:col-start-4">
              <select
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Roles</option>
                <option value="attack">Attack</option>
                <option value="defense">Defense</option>
                <option value="stamina">Stamina</option>
                <option value="balance">Balance</option>
              </select>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex space-x-2 border-b overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 text-sm font-medium capitalize ${activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Blade dropdown */}
          {activeTab === 'blades' && (
            <div className="mt-2">
              <select
                value={bladeFilter}
                onChange={(e) => setBladeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All</option>
                <option value="Basic">Basic</option>
                <option value="Unique">Unique</option>
                <option value="X-Over">X-Over</option>
              </select>
            </div>
          )}
        </div>

        {/* Parts Display */}
        {roleFilteredParts.length === 0 ? (
          <div className="text-center py-12">
            <Database size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Parts Found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {roleFilteredParts.map(renderPartCard)}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['name','role','attack','defense','stamina']
                    .concat(activeTab === 'bits' ? ['dash','burstRes'] : [])
                    .map((col) => (
                      <th
                        key={col}
                        className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-blue-600 ${
                          col === 'name' ? 'text-left' : 'text-center'
                        }`}
                        onClick={() => {
                          setSortBy(col as any);
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        }}
                      >
                        <div className="inline-flex items-center justify-center space-x-1">
                          <span>{col}</span>
                          <span className="w-4 inline-block">
                            {sortBy === col && (sortDirection === 'asc' ? '⬆️' : '⬇️')}
                          </span>
                        </div>
                      </th>
                    ))}
                  <th></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {roleFilteredParts.map((part) => (
                  <tr key={part.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-left truncate break-words">{part.name}</td>
                    <td className="px-6 py-4 text-center">{part.role || '-'}</td>
                    <td className="px-6 py-4 text-center">{part.stats.attack}</td>
                    <td className="px-6 py-4 text-center">{part.stats.defense}</td>
                    <td className="px-6 py-4 text-center">{part.stats.stamina}</td>
                    {activeTab === 'bits' && (
                      <>
                        <td className="px-6 py-4 text-center">{part.stats.dash}</td>
                        <td className="px-6 py-4 text-center">{part.stats.burstRes}</td>
                      </>
                    )}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedPart(part)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
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
                    <h2 className="text-2xl font-bold truncate">{selectedPart.name}</h2>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
                        {selectedPart.category}
                      </span>
                      {selectedPart.role && (
                        <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
                          {selectedPart.role}
                        </span>
                      )}
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

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(selectedPart.stats)
                      .filter(([stat]) =>
                        selectedPart.category === 'Bit'
                          ? true
                          : !['dash','burstRes'].includes(stat)
                      )
                      .map(([stat, value]) => (
                        <div key={stat} className="text-center">
                          <div className="flex justify-center mb-1">{getStatIcon(stat)}</div>
                          <div className="text-sm font-medium capitalize">{stat}</div>
                          <div className="text-lg font-bold text-gray-900">{value}</div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="mb-6 bg-gray-50 rounded-xl p-6 text-center">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">3D Viewer</h4>
                  <p className="text-gray-600">Coming Soon</p>
                </div>

                <div className="mb-6 bg-gray-50 rounded-xl p-6 text-center">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Win Rate</h4>
                  <p className="text-gray-600">Coming Soon</p>
                </div>

                <div className="mb-6 bg-gray-50 rounded-xl p-6 text-center">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Top 3 Combos</h4>
                  <p className="text-gray-600">Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
