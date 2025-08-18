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
  RotateCcw,
  X,
} from 'lucide-react';
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
  const [sortBy, setSortBy] = useState<
    'name' | 'attack' | 'defense' | 'stamina' | 'dash' | 'burstRes'
  >('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [activeTab, setActiveTab] = useState<string>('lockchips');

  const tabs = ['lockchips', 'main blades', 'blades', 'ratchets', 'bits'];

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

      // Blades
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
            burstRes: 0,
          },
          data: blade,
        });
      });

      // Ratchets
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
            burstRes: 0,
          },
          data: ratchet,
        });
      });

      // Bits
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
            burstRes: bit['Burst Res'] || 0,
          },
          data: bit,
        });
      });

      // Lockchips
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
            burstRes: 0,
          },
          data: lockchip,
        });
      });

      // Assist Blades
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Blade':
        return 'bg-red-100 text-red-800';
      case 'Ratchet':
        return 'bg-blue-100 text-blue-800';
      case 'Bit':
        return 'bg-green-100 text-green-800';
      case 'Lockchip':
        return 'bg-purple-100 text-purple-800';
      case 'Assist Blade':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAndSortedParts = parts
    .filter((part) => part.name.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const tabFilteredParts = filteredAndSortedParts.filter((part) => {
    if (activeTab === 'main blades')
      return part.type === 'Blade' && part.line?.toLowerCase() === 'custom';
    if (activeTab === 'blades')
      return (
        part.type === 'Blade' &&
        ['basic', 'unique', 'x-over'].includes(part.line?.toLowerCase() || '')
      );
    if (activeTab === 'lockchips') return part.type === 'Lockchip';
    if (activeTab === 'ratchets') return part.type === 'Ratchet';
    if (activeTab === 'bits') return part.type === 'Bit';
    return true;
  });

  const renderPartCard = (part: Part) => (
    <div
      key={part.id}
      onClick={() => setSelectedPart(part)}
      className="cursor-pointer bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold truncate break-words">{part.name}</h3>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
            part.type
          )}`}
        >
          {part.type}
        </span>
      </div>
      {part.line && (
        <p className="text-xs text-gray-500 mt-1 truncate">{part.line}</p>
      )}
    </div>
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

        {/* Search + Sort + Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* Sort */}
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

          {/* Tabs */}
          <div className="mt-6 flex space-x-2 border-b overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        {/* Parts Display */}
        {tabFilteredParts.length === 0 ? (
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
            {tabFilteredParts.map(renderPartCard)}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="bg-white divide-y divide-gray-200">
                {tabFilteredParts.map((part) => (
                  <tr key={part.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 truncate break-words">{part.name}</td>
                    <td className="px-6 py-4 text-center">{part.type}</td>
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
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-4 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold truncate">
                      {selectedPart.name}
                    </h2>
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

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                {/* Stats */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Statistics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(selectedPart.stats).map(([stat, value]) => (
                      <div key={stat} className="text-center">
                        <div className="flex justify-center mb-1">
                          {getStatIcon(stat)}
                        </div>
                        <div className="text-sm font-medium capitalize">
                          {stat}
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3D Viewer Placeholder */}
                <div className="mb-6 bg-gray-50 rounded-xl p-6 text-center">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    3D Viewer
                  </h4>
                  <p className="text-gray-600">Coming Soon</p>
                </div>

                {/* Win Rate Placeholder */}
                <div className="mb-6 bg-gray-50 rounded-xl p-6 text-center">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Win Rate
                  </h4>
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
