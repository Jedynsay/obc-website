import React, { useState, useEffect } from 'react';
import { X, Plus, User, UserCheck, Layers, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useConfirmation } from '../../context/ConfirmationContext';
import { StatBar } from './StatBar';
import { supabase } from '../../lib/supabase';

interface TournamentRegistrationProps {
  tournament: any;
  onClose: () => void;
}

export function TournamentRegistration({ tournament, onClose }: TournamentRegistrationProps) {
  const { user } = useAuth();
  const { alert } = useConfirmation();
  
  const [playerName, setPlayerName] = useState('');
  const [paymentMode, setPaymentMode] = useState<'free' | 'cash' | 'gcash' | 'bank_transfer'>(
    tournament.is_free ? 'free' : 'cash'
  );
  const [beyblades, setBeyblades] = useState([{ id: '1', isCustomLine: false, parts: {} }]);
  const [deckPresets, setDeckPresets] = useState<any[]>([]);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [registeringForSelf, setRegisteringForSelf] = useState(false);
  const [partsData, setPartsData] = useState({
    blades: [],
    ratchets: [],
    bits: [],
    lockchips: [],
    assistBlades: []
  });
  const [isLoadingParts, setIsLoadingParts] = useState(false);
  const [partsError, setPartsError] = useState<string | null>(null);
  const [existingPlayerNames, setExistingPlayerNames] = useState<string[]>([]);

  // Auto-fill player name when registering for self
  useEffect(() => {
    if (registeringForSelf && user && !user.id.startsWith('guest-')) {
      setPlayerName(user.username);
    } else if (!registeringForSelf) {
      setPlayerName('');
    }
  }, [registeringForSelf, user]);

  useEffect(() => {
    fetchPartsData();
    fetchDeckPresets();
    fetchExistingPlayerNames();
  }, []);

  const fetchPartsData = async () => {
    setIsLoadingParts(true);
    setPartsError(null);

    try {
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

      setPartsData({
        blades: bladesRes.data || [],
        ratchets: ratchetsRes.data || [],
        bits: bitsRes.data || [],
        lockchips: lockchipsRes.data || [],
        assistBlades: assistBladesRes.data || []
      });
    } catch (err) {
      console.error(err);
      setPartsError('Failed to load Beyblade parts. Please try again.');
    } finally {
      setIsLoadingParts(false);
    }
  };

  const fetchDeckPresets = async () => {
    if (!user || user.id.startsWith('guest-')) return;
    try {
      const { data, error } = await supabase
        .from('deck_presets')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setDeckPresets(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExistingPlayerNames = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select('player_name')
        .eq('tournament_id', tournament.id)
        .eq('status', 'confirmed');
      if (error) throw error;
      setExistingPlayerNames((data || []).map(r => r.player_name.toLowerCase().trim()));
    } catch (err) {
      console.error('Error fetching player names', err);
    }
  };

  const getRequiredParts = (bladeLine: string): string[] => {
    return bladeLine === 'Custom'
      ? ['Lockchip', 'Main Blade', 'Assist Blade', 'Ratchet', 'Bit']
      : ['Blade', 'Ratchet', 'Bit'];
  };

  const getPartOptions = (partType: string) => {
    let options: any[] = [];
    switch (partType) {
      case 'Blade':
        // Filter out Custom line blades for standard builds
        options = partsData.blades.filter(blade => blade.Line !== 'Custom');
        break;
      case 'Main Blade':
        // Only Custom line blades for custom builds
        options = partsData.blades.filter(blade => blade.Line === 'Custom');
        break;
      case 'Ratchet':
        options = partsData.ratchets;
        break;
      case 'Bit':
        options = partsData.bits;
        break;
      case 'Lockchip':
        options = partsData.lockchips;
        break;
      case 'Assist Blade':
        options = partsData.assistBlades;
        break;
    }
    return options.sort((a, b) => getPartDisplayName(a, partType).localeCompare(getPartDisplayName(b, partType)));
  };

  const getPartDisplayName = (part: any, partType: string) => {
    switch (partType) {
      case 'Blade':
      case 'Main Blade':
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

  const generateBeybladeName = (beyblade: any) => {
    const requiredParts = getRequiredParts(beyblade.isCustomLine ? 'Custom' : 'Basic');
    if (!requiredParts.every(p => beyblade.parts[p])) return '';
    if (beyblade.isCustomLine) {
      const { Lockchip, 'Main Blade': MainBlade, 'Assist Blade': AssistBlade, Ratchet, Bit } = beyblade.parts;
      return `${Lockchip?.Lockchip || ''}${MainBlade?.Blades || ''} ${AssistBlade?.['Assist Blade'] || ''}${Ratchet?.Ratchet || ''}${Bit?.Shortcut || ''}`;
    } else {
      const { Blade, Ratchet, Bit } = beyblade.parts;
      return `${Blade?.Blades || ''} ${Ratchet?.Ratchet || ''}${Bit?.Shortcut || ''}`;
    }
  };

  const calculateStats = (parts: any) => {
    return Object.values(parts).reduce(
      (stats: any, part: any) => {
        if (part) {
          stats.attack += part.Attack || 0;
          stats.defense += part.Defense || 0;
          stats.stamina += part.Stamina || 0;
          stats.dash += part.Dash || 0;
          stats.burstRes += part['Burst Res'] || 0;
        }
        return stats;
      },
      { attack: 0, defense: 0, stamina: 0, dash: 0, burstRes: 0 }
    );
  };

  const updateBeyblade = (id: string, field: string, value: any) => {
    setBeyblades(beyblades.map(b => {
      if (b.id === id) {
        if (field === 'isCustomLine') {
          // Clear parts when switching blade line type
          return { ...b, [field]: value, parts: {} };
        }
        return { ...b, [field]: value };
      }
      return b;
    }));
  };

  const updatePart = (beybladeId: string, partType: string, selectedPart: any) => {
    setBeyblades(beyblades.map(b => {
      if (b.id === beybladeId) {
        const newParts = { ...b.parts, [partType]: selectedPart };
        return { ...b, parts: newParts };
      }
      return b;
    }));
  };

  const removeBeyblade = (id: string) => {
    if (beyblades.length > 1) {
      setBeyblades(beyblades.filter(b => b.id !== id));
    }
  };

  const loadPreset = (presetId: string) => {
    const preset = deckPresets.find(p => p.id === presetId);
    if (!preset) return;
    
    // Determine if preset uses custom line by checking first beyblade
    const firstBey = preset.beyblades[0];
    const hasCustomParts = firstBey && (firstBey.parts.Lockchip || firstBey.parts['Main Blade'] || firstBey.parts['Assist Blade']);
    
    const presetBeyblades = preset.beyblades
      .slice(0, tournament.beyblades_per_player)
      .map((bey: any, index: number) => ({
        id: (index + 1).toString(),
        isCustomLine: hasCustomParts,
        parts: bey.parts
      }));
    setBeyblades(presetBeyblades);
    setSelectedPreset('');
  };

  const isFormValid = () => {
    if (!playerName.trim()) return false;
    const normalizedName = playerName.toLowerCase().trim();
    if (existingPlayerNames.includes(normalizedName)) return false;
    return beyblades.every(bey => {
      const requiredParts = getRequiredParts(bey.isCustomLine ? 'Custom' : 'Basic');
      return requiredParts.every(partType => bey.parts[partType]);
    });
  };

  const handleSubmit = async () => {
    if (!playerName.trim()) {
      await alert('Missing Information', 'Please enter your player name.');
      return;
    }

    try {
      const tournamentData = await supabase
        .from('tournaments')
        .select('is_free')
        .eq('id', tournament.id)
        .single();

      const paymentStatus = tournamentData.data?.is_free ? 'confirmed' : 'unpaid';

      const { data: registration, error: regError } = await supabase
        .from('tournament_registrations')
        .insert({
          tournament_id: tournament.id,
          player_name: playerName.trim(),
          payment_mode: paymentMode,
          status: 'confirmed',
          payment_status: paymentStatus
        })
        .select()
        .single();

      if (regError) throw regError;

      for (const beyblade of beyblades) {
        const beyName = generateBeybladeName(beyblade);
        const bladeLine = beyblade.isCustomLine ? 'Custom' : 'Basic';
        
        const { data: beyData, error: beyError } = await supabase
          .from('tournament_beyblades')
          .insert({
            registration_id: registration.id,
            beyblade_name: beyName,
            blade_line: bladeLine
          })
          .select()
          .single();
        if (beyError) throw beyError;

        const partsToInsert = Object.entries(beyblade.parts).map(([partType, partData]) => ({
          beyblade_id: beyData.id,
          part_type: partType,
          part_name: getPartDisplayName(partData, partType),
          part_data: partData
        }));

        const { error: partsError } = await supabase
          .from('tournament_beyblade_parts')
          .insert(partsToInsert);
        if (partsError) throw partsError;
      }

      await alert('Registration Successful', `You have registered ${playerName} for ${tournament.name}!`);
      onClose();
    } catch (err: any) {
      console.error(err);
      await alert('Registration Failed', err.message || 'Unknown error occurred.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-full sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto relative">
        {/* Loading Overlay */}
        {isLoadingParts && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading Beyblade parts...</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex justify-between items-center">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Tournament Registration</h2>
            <p className="text-gray-600">{tournament.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {partsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{partsError}</p>
              <button onClick={fetchPartsData} className="text-sm underline text-red-600">Try Again</button>
            </div>
          )}

          {/* Tournament Description */}
          {tournament.description && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tournament Details</h3>
              <p className="text-gray-700">{tournament.description}</p>
            </div>
          )}

          {/* Player Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
            <div className="flex items-center mb-4">
              <User className="text-blue-600 mr-2" size={20} />
              <h3 className="text-lg font-semibold text-blue-900">Player Information</h3>
            </div>
            
            <div className="flex items-center mb-4">
              <label htmlFor="paymentMode" className="block text-sm font-medium text-gray-700 mb-1">
                  Register your account to see personal stats across multiple tournaments
              </label>
            </div>

            {user && !user.id.startsWith('guest-') && (
              <div className="mb-4 p-3 bg-white rounded-lg border border-blue-200">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={registeringForSelf}
                    onChange={(e) => setRegisteringForSelf(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <UserCheck size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      Register for self? Player name entry should be same as your account username to view your own personal stats. ({user.username})
                    </span>
                  </div>
                </label>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-1">
                  Player Name *
                </label>
                <input
                  type="text"
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  disabled={registeringForSelf}
                  placeholder="Enter your player name"
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    registeringForSelf ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                />
                {playerName.trim() && existingPlayerNames.includes(playerName.toLowerCase().trim()) && (
                  <div className="mt-1 text-xs text-red-600">⚠ This player name is already registered</div>
                )}
              </div>

              <div>
                <label htmlFor="paymentMode" className="block text-sm font-medium text-gray-700 mb-1">
                  Mode of Payment *
                </label>
                <select
                  id="paymentMode"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {tournament.is_free && <option value="free">Free Entry</option>}
                  <option value="cash">Cash</option>
                  <option value="gcash">GCash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>

              </div>

            </div>
          </div>

          {/* Deck Presets Section */}
          {!user?.id.startsWith('guest-') && deckPresets.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
              <div className="flex items-center mb-4">
                <Layers className="text-green-600 mr-2" size={20} />
                <h3 className="text-lg font-semibold text-green-900">Quick Setup with Deck Presets</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Deck Preset
                  </label>
                  <select
                    value={selectedPreset}
                    onChange={(e) => setSelectedPreset(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">-- Select a preset --</option>
                    {deckPresets.map(preset => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name} ({preset.beyblades.length} Beyblades)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => selectedPreset && loadPreset(selectedPreset)}
                    disabled={!selectedPreset}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
                  >
                    Load Preset
                  </button>
                </div>
              </div>

              {selectedPreset && (
                <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                  <div className="text-sm text-green-800">
                    <strong>Preview:</strong>
                    {deckPresets.find(p => p.id === selectedPreset)?.beyblades.slice(0, 3).map((bey: any, index: number) => (
                      <div key={index} className="font-mono text-xs mt-1">
                        • {bey.name || `Beyblade ${index + 1}`}
                      </div>
                    ))}
                    {deckPresets.find(p => p.id === selectedPreset)?.beyblades.length > 3 && (
                      <div className="text-xs mt-1 text-green-600">
                        +{deckPresets.find(p => p.id === selectedPreset)?.beyblades.length - 3} more...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom Line Toggle */}
          {/* Beyblade Configuration Cards */}
          {beyblades.map((beyblade, index) => (
            <div key={beyblade.id} className="border border-gray-200 rounded-lg p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Beyblade #{index + 1}</h3>
                <div className="flex items-center space-x-2">
                  {/* Custom Line Toggle for this Beyblade */}
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-medium ${!beyblade.isCustomLine ? 'text-purple-900' : 'text-purple-600'}`}>
                      Standard Line
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={beyblade.isCustomLine}
                        onChange={(e) => updateBeyblade(beyblade.id, 'isCustomLine', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-8 h-4 rounded-full transition-colors ${
                        beyblade.isCustomLine ? 'bg-purple-600' : 'bg-gray-300'
                      }`}>
                        <div className={`w-3 h-3 bg-white rounded-full shadow transform transition-transform ${
                          beyblade.isCustomLine ? 'translate-x-4' : 'translate-x-0'
                        } mt-0.5 ml-0.5`}></div>
                      </div>
                    </label>
                    <span className={`text-xs font-medium ${beyblade.isCustomLine ? 'text-purple-900' : 'text-purple-600'}`}>
                      Custom Line
                    </span>
                  </div>
                  {beyblades.length > 1 && (
                    <button onClick={() => removeBeyblade(beyblade.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Generated Name
                </label>
                <div className="border border-gray-200 rounded-md px-3 py-2 bg-gray-50 text-sm font-mono">
                  {generateBeybladeName(beyblade) || 'Select all parts to generate name'}
                </div>
              </div>

              <div className="mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getRequiredParts(beyblade.isCustomLine ? 'Custom' : 'Basic').map((partType) => (
                    <div key={partType}>
                      <label className="block text-sm font-medium mb-1">
                        {partType} *
                      </label>
                      <select
                        value={beyblade.parts[partType] ? JSON.stringify(beyblade.parts[partType]) : ''}
                        onChange={(e) => e.target.value && updatePart(beyblade.id, partType, JSON.parse(e.target.value))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select {partType}</option>
                        {getPartOptions(partType).map((part: any, idx) => (
                          <option key={idx} value={JSON.stringify(part)}>
                            {getPartDisplayName(part, partType)}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {Object.keys(beyblade.parts).length > 0 && (
                <StatBar stats={calculateStats(beyblade.parts)} />
              )}
            </div>
          ))}

          {beyblades.length < tournament.beyblades_per_player && (
            <button
              onClick={() => setBeyblades([...beyblades, { id: Date.now().toString(), isCustomLine: false, parts: {} }])}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center space-x-2"
            >
              <Plus size={20} />
              <span>Add Another Beyblade</span>
            </button>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isFormValid() || isLoadingParts}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <span>Register</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
