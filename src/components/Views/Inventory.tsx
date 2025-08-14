import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Package, Search, Filter, Layers } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { DeckBuilder } from './DeckBuilder';

interface InventoryItem {
  id: string;
  part_type: 'Blade' | 'Ratchet' | 'Bit' | 'Lockchip' | 'Assist Blade';
  part_name: string;
  part_data: any;
  quantity: number;
  notes?: string;
  created_at: string;
}

export function Inventory() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'inventory' | 'deck-builder'>('inventory');
  
  // Early return for guest users - don't load anything
  if (!user || user.id.startsWith('guest-')) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory & Deck Builder</h1>
          <p className="text-gray-600">Track your parts and build custom decks</p>
        </div>
        
        <div className="text-center py-12">
          <div className="flex justify-center space-x-4 mb-6">
            <Package size={64} className="text-gray-400" />
            <Layers size={64} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Inventory & Deck Builder</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Track your Beyblade parts collection and build powerful custom decks. 
            Save deck presets for quick tournament registration.
          </p>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-8 max-w-md mx-auto mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                🎯
              </div>
            </div>
            <h3 className="text-xl font-bold text-blue-900 mb-3">Login to Access Tools</h3>
            <p className="text-blue-800 text-sm mb-6">
              Create a free account to access inventory tracking and deck building tools!
            </p>
            <div className="space-y-2 text-sm text-blue-700">
              <div className="flex items-center justify-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Track unlimited Beyblade parts
              </div>
              <div className="flex items-center justify-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Build and save custom decks
              </div>
              <div className="flex items-center justify-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Quick tournament registration
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 max-w-lg mx-auto">
            <p className="text-gray-600 text-sm">
              <strong>Ready to start?</strong> Click the "Login" button to create your account and unlock inventory & deck building features.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'Blade' | 'Blade (Custom)' | 'Ratchet' | 'Bit' | 'Lockchip' | 'Assist Blade'>('all');
  
  // Form state
  const [formData, setFormData] = useState({
    part_type: 'Blade' as const,
    part_name: '',
    part_data: null as any,
    quantity: 1,
    notes: ''
  });

  // Parts data for selection
  const [partsData, setPartsData] = useState<{
    blades: any[];
    ratchets: any[];
    bits: any[];
    lockchips: any[];
    assistBlades: any[];
  }>({
    blades: [],
    ratchets: [],
    bits: [],
    lockchips: [],
    assistBlades: []
  });

  useEffect(() => {
    fetchInventory();
    fetchPartsData();
  }, [user]);

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getPartOptions = (partType: string) => {
    switch (partType) {
      case 'Blade':
        return partsData.blades;
      case 'Ratchet':
        return partsData.ratchets;
      case 'Bit':
        return partsData.bits;
      case 'Lockchip':
        return partsData.lockchips;
      case 'Assist Blade':
        return partsData.assistBlades;
      default:
        return [];
    }
  };

  const getPartDisplayName = (part: any, partType: string): string => {
    switch (partType) {
      case 'Blade':
      case 'Blade (Custom)':
        return part.Blades;
      case 'Ratchet':
        return part.Ratchet;
      case 'Bit':
        return `${part.Bit} (${part.Shortcut})`;
      case 'Lockchip':
        return part.Lockchip;
      case 'Assist Blade':
        return `${part['Assist Blade Name']} (${part['Assist Blade']})`;
      default:
        return '';
    }
  };

  const startAdd = () => {
    setIsAdding(true);
    setFormData({
      part_type: 'Blade',
      part_name: '',
      part_data: null,
      quantity: 1,
      notes: ''
    });
  };

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setFormData({
      part_type: item.part_type,
      part_name: item.part_name,
      part_data: item.part_data,
      quantity: item.quantity,
      notes: item.notes || ''
    });
  };

  const saveItem = async () => {
    if (!formData.part_name || !formData.part_data) {
      alert('Please select a part.');
      return;
    }

    try {
      const itemData = {
        user_id: user.id,
        part_type: formData.part_type,
        part_name: formData.part_name,
        part_data: formData.part_data,
        quantity: formData.quantity,
        notes: formData.notes || null
      };

      if (isAdding) {
        const { error } = await supabase
          .from('user_inventory')
          .insert([itemData]);
        
        if (error) throw error;
      } else if (editingId) {
        const { error } = await supabase
          .from('user_inventory')
          .update(itemData)
          .eq('id', editingId);
        
        if (error) throw error;
      }

      await fetchInventory();
      cancelEdit();
    } catch (error) {
      console.error('Error saving inventory item:', error);
      alert('Failed to save inventory item. Please try again.');
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchInventory();
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      alert('Failed to delete inventory item. Please try again.');
    }
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      part_type: 'Blade',
      part_name: '',
      part_data: null,
      quantity: 1,
      notes: ''
    });
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterType === 'all' || item.part_type === filterType;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'deck-builder') {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory & Deck Builder</h1>
              <p className="text-gray-600">Track your parts and build custom decks</p>
            </div>
            <div className="filter-tabs">
              <button
                onClick={() => setCurrentView('inventory')}
                className={`filter-tab ${
                  currentView === 'inventory' ? 'filter-tab-active' : 'filter-tab-inactive'
                }`}
              >
                <Package size={16} className="mr-2" />
                Inventory
              </button>
              <button
                onClick={() => setCurrentView('deck-builder')}
                className={`filter-tab ${
                  currentView === 'deck-builder' ? 'filter-tab-active' : 'filter-tab-inactive'
                }`}
              >
                <Layers size={16} className="mr-2" />
                Deck Builder
              </button>
            </div>
          </div>
        </div>
        <DeckBuilder />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory & Deck Builder</h1>
              <p className="text-gray-600">Track your parts and build custom decks</p>
            </div>
            <div className="filter-tabs">
              <button
                onClick={() => setCurrentView('inventory')}
                className={`filter-tab ${
                  currentView === 'inventory' ? 'filter-tab-active' : 'filter-tab-inactive'
                }`}
              >
                <Package size={16} className="mr-2" />
                Inventory
              </button>
              <button
                onClick={() => setCurrentView('deck-builder')}
                className={`filter-tab ${
                  currentView === 'deck-builder' ? 'filter-tab-active' : 'filter-tab-inactive'
                }`}
              >
                <Layers size={16} className="mr-2" />
                Deck Builder
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={startAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Part</span>
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search parts or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Parts</option>
              <option value="Blade">Blades</option>
              <option value="Blade (Custom)">Blades (Custom)</option>
              <option value="Ratchet">Ratchets</option>
              <option value="Bit">Bits</option>
              <option value="Lockchip">Lockchips</option>
              <option value="Assist Blade">Assist Blades</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {isAdding ? 'Add New Part' : 'Edit Part'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Part Type</label>
              <select
                value={formData.part_type}
                onChange={(e) => setFormData({
                  ...formData, 
                  part_type: e.target.value as any,
                  part_name: '',
                  part_data: null
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Blade">Blade</option>
                <option value="Blade (Custom)">Blade (Custom)</option>
                <option value="Ratchet">Ratchet</option>
                <option value="Bit">Bit</option>
                <option value="Lockchip">Lockchip</option>
                <option value="Assist Blade">Assist Blade</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Part</label>
              <select
                value={formData.part_data ? JSON.stringify(formData.part_data) : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    const selectedPart = JSON.parse(e.target.value);
                    setFormData({
                      ...formData,
                      part_name: getPartDisplayName(selectedPart, formData.part_type),
                      part_data: selectedPart
                    });
                  }
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Part</option>
                {getPartOptions(formData.part_type).map((part: any, idx) => (
                  <option key={idx} value={JSON.stringify(part)}>
                    {getPartDisplayName(part, formData.part_type)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="e.g., condition, source, etc."
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={cancelEdit}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <X size={16} />
              <span>Cancel</span>
            </button>
            <button
              onClick={saveItem}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Save size={16} />
              <span>Save</span>
            </button>
          </div>
        </div>
      )}

      {/* Inventory List */}
      {filteredInventory.length === 0 ? (
        <div className="text-center py-12">
          <Package size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">
            {inventory.length === 0 ? 'No parts in your inventory yet' : 'No parts match your search'}
          </p>
          {inventory.length === 0 && (
            <button
              onClick={startAdd}
              className="mt-4 text-blue-600 hover:text-blue-800 underline"
            >
              Add your first part
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInventory.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mb-2">
                    {item.part_type}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">{item.part_name}</h3>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => startEdit(item)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span className="font-medium">{item.quantity}</span>
                </div>
                {item.notes && (
                  <div>
                    <span className="font-medium">Notes:</span>
                    <p className="text-gray-700 mt-1">{item.notes}</p>
                  </div>
                )}
                <div className="text-xs text-gray-500 pt-2 border-t">
                  Added: {new Date(item.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Part Stats */}
              {item.part_data && (
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(item.part_data).map(([key, value]) => {
                      if (typeof value === 'number' && value > 0 && ['Attack', 'Defense', 'Stamina', 'Dash', 'Burst Res'].includes(key)) {
                        return (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600">{key}:</span>
                            <span className="font-medium">{value}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}