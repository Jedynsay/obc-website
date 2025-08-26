import React, { useEffect, useState } from 'react';
import { X, Plus, User, UserCheck, Layers, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useConfirmation } from '../../context/ConfirmationContext';
import { StatBar } from './StatBar';
import { supabase } from '../../lib/supabase';

/*
  Refactored TournamentRegistration
  - Strongly typed Part/Beyblade structures
  - Toggle for Custom Line (per-beyblade)
  - BeybladeCard component embedded for single-file convenience
  - Batch inserts for beyblades and parts
  - No JSON.stringify in selects (uses ids)
*/

// ------------------- Types & Enums -------------------
export type PartType =
  | 'Blade'
  | 'Main Blade'
  | 'Assist Blade'
  | 'Ratchet'
  | 'Bit'
  | 'Lockchip';

export interface Stats {
  attack: number;
  defense: number;
  stamina: number;
  dash: number;
  burstRes: number;
}

export interface Part {
  id: string;
  type: PartType;
  displayName: string;
  stats: Stats;
  raw: any; // preserve original DB row
}

export interface Beyblade {
  id: string; // local id (e.g. timestamp string)
  isCustom: boolean;
  parts: Partial<Record<PartType, Part>>;
}

interface PartsData {
  blades: Part[];
  ratchets: Part[];
  bits: Part[];
  lockchips: Part[];
  assistBlades: Part[];
}

// ------------------- Utils -------------------
const emptyStats = (): Stats => ({ attack: 0, defense: 0, stamina: 0, dash: 0, burstRes: 0 });

const getRequiredParts = (isCustom: boolean): PartType[] =>
  isCustom ? ['Lockchip', 'Main Blade', 'Assist Blade', 'Ratchet', 'Bit'] : ['Blade', 'Ratchet', 'Bit'];

const calculateStats = (parts: Partial<Record<PartType, Part>>): Stats =>
  Object.values(parts).reduce((acc, p) => {
    if (p) {
      acc.attack += p.stats.attack || 0;
      acc.defense += p.stats.defense || 0;
      acc.stamina += p.stats.stamina || 0;
      acc.dash += p.stats.dash || 0;
      acc.burstRes += p.stats.burstRes || 0;
    }
    return acc;
  }, emptyStats());

const generateBeybladeName = (b: Beyblade) => {
  const required = getRequiredParts(b.isCustom);
  if (!required.every(p => !!b.parts[p])) return '';

  if (b.isCustom) {
    const Lockchip = b.parts['Lockchip'];
    const MainBlade = b.parts['Main Blade'];
    const AssistBlade = b.parts['Assist Blade'];
    const Ratchet = b.parts['Ratchet'];
    const Bit = b.parts['Bit'];
    // put separators for readability
    return [Lockchip?.displayName, MainBlade?.displayName].filter(Boolean).join('-') + ' ' +
      [AssistBlade?.displayName, Ratchet?.displayName, Bit?.displayName].filter(Boolean).join('-');
  }

  const Blade = b.parts['Blade'];
  const Ratchet = b.parts['Ratchet'];
  const Bit = b.parts['Bit'];
  return [Blade?.displayName, [Ratchet?.displayName, Bit?.displayName].filter(Boolean).join('-')].filter(Boolean).join(' ');
};

// ------------------- BeybladeCard (embedded) -------------------
interface BeybladeCardProps {
  beyblade: Beyblade;
  availableParts: PartsData;
  onUpdate: (updated: Beyblade) => void;
  onRemove: () => void;
}

const BeybladeCard: React.FC<BeybladeCardProps> = ({ beyblade, availableParts, onUpdate, onRemove }) => {
  const required = getRequiredParts(beyblade.isCustom);

  const handleToggleCustom = (checked: boolean) => {
    onUpdate({ ...beyblade, isCustom: checked, parts: {} });
  };

  const getOptionsFor = (partType: PartType): Part[] => {
    switch (partType) {
      case 'Blade':
        return availableParts.blades.filter(b => (b.raw?.Line || '').toLowerCase() !== 'custom');
      case 'Main Blade':
        return availableParts.blades.filter(b => (b.raw?.Line || '').toLowerCase() === 'custom');
      case 'Ratchet':
        return availableParts.ratchets;
      case 'Bit':
        return availableParts.bits;
      case 'Lockchip':
        return availableParts.lockchips;
      case 'Assist Blade':
        return availableParts.assistBlades;
      default:
        return [];
    }
  };

  const onPartSelect = (partType: PartType, partId: string) => {
    if (!partId) {
      const next = { ...beyblade, parts: { ...beyblade.parts } };
      delete next.parts[partType];
      onUpdate(next);
      return;
    }

    const option = getOptionsFor(partType).find(p => p.id === partId);
    if (!option) return;
    onUpdate({ ...beyblade, parts: { ...beyblade.parts, [partType]: option } });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 sm:p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">Beyblade</h3>
          <p className="text-xs text-gray-500">Configure parts for this Beyblade</p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="flex items-center cursor-pointer select-none">
            <span className="mr-2 text-sm text-gray-700">Custom Line</span>
            <input
              type="checkbox"
              checked={beyblade.isCustom}
              onChange={(e) => handleToggleCustom(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-11 h-6 flex items-center p-1 rounded-full duration-200 ${beyblade.isCustom ? 'bg-blue-500' : 'bg-gray-300'}`}>
              <div className={`bg-white w-4 h-4 rounded-full shadow transform duration-200 ${beyblade.isCustom ? 'translate-x-5' : ''}`} />
            </div>
          </label>

          <button onClick={onRemove} className="p-2 text-red-600 hover:bg-red-50 rounded-full">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Generated Name</label>
        <div className="border border-gray-200 rounded-md px-3 py-2 bg-gray-50 text-sm font-mono">
          {generateBeybladeName(beyblade) || 'Select all parts to generate name'}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {required.map((partType) => (
          <div key={partType}>
            <label className="block text-sm font-medium mb-1">{partType} *</label>
            <select
              value={beyblade.parts[partType]?.id || ''}
              onChange={(e) => onPartSelect(partType as PartType, e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select {partType}</option>
              {getOptionsFor(partType as PartType).map(opt => (
                <option key={opt.id} value={opt.id}>{opt.displayName}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {Object.keys(beyblade.parts).length > 0 && (
        <div className="mt-4">
          <StatBar stats={calculateStats(beyblade.parts)} />
        </div>
      )}
    </div>
  );
};

// ------------------- TournamentRegistration Component -------------------
interface TournamentRegistrationProps {
  tournament: any; // keep this flexible for tournament shape you already use
  onClose: () => void;
}

export default function TournamentRegistration({ tournament, onClose }: TournamentRegistrationProps) {
  const { user } = useAuth();
  const { alert } = useConfirmation();

  const [playerName, setPlayerName] = useState('');
  const [paymentMode, setPaymentMode] = useState<'free' | 'cash' | 'gcash' | 'bank_transfer'>(
    tournament?.is_free ? 'free' : 'cash'
  );

  const [beyblades, setBeyblades] = useState<Beyblade[]>([{ id: Date.now().toString(), isCustom: false, parts: {} }]);
  const [deckPresets, setDeckPresets] = useState<any[]>([]);
  const [selectedPreset, setSelectedPreset] = useState('');

  const [partsData, setPartsData] = useState<PartsData>({ blades: [], ratchets: [], bits: [], lockchips: [], assistBlades: [] });
  const [isLoadingParts, setIsLoadingParts] = useState(false);
  const [partsError, setPartsError] = useState<string | null>(null);
  const [existingPlayerNames, setExistingPlayerNames] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // auto-fill when registering for self
  const [registeringForSelf, setRegisteringForSelf] = useState(false);
  useEffect(() => {
    if (registeringForSelf && user && !user.id?.startsWith('guest-')) setPlayerName(user.username);
    if (!registeringForSelf) setPlayerName('');
  }, [registeringForSelf, user]);

  useEffect(() => {
    fetchPartsData();
    fetchDeckPresets();
    fetchExistingPlayerNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------- fetch & mappers ---------------
  const mapBlade = (row: any): Part => ({
    id: String(row.id),
    type: 'Blade',
    displayName: row.Blades || row.name || 'Unnamed Blade',
    stats: {
      attack: row.Attack || 0,
      defense: row.Defense || 0,
      stamina: row.Stamina || 0,
      dash: row.Dash || 0,
      burstRes: row['Burst Res'] || 0
    },
    raw: row
  });

  const mapRatchet = (row: any): Part => ({
    id: String(row.id),
    type: 'Ratchet',
    displayName: row.Ratchet || row.name || 'Unnamed Ratchet',
    stats: { attack: row.Attack || 0, defense: row.Defense || 0, stamina: row.Stamina || 0, dash: row.Dash || 0, burstRes: row['Burst Res'] || 0 },
    raw: row
  });

  const mapBit = (row: any): Part => ({
    id: String(row.id),
    type: 'Bit',
    displayName: `${row.Bit || row.name || 'Bit'}${row.Shortcut ? ` (${row.Shortcut})` : ''}`,
    stats: { attack: row.Attack || 0, defense: row.Defense || 0, stamina: row.Stamina || 0, dash: row.Dash || 0, burstRes: row['Burst Res'] || 0 },
    raw: row
  });

  const mapLockchip = (row: any): Part => ({
    id: String(row.id),
    type: 'Lockchip',
    displayName: row.Lockchip || row.name || 'Lockchip',
    stats: emptyStats(),
    raw: row
  });

  const mapAssistBlade = (row: any): Part => ({
    id: String(row.id),
    type: 'Assist Blade',
    displayName: `${row['Assist Blade Name'] || row.name || 'Assist'}${row['Assist Blade'] ? ` (${row['Assist Blade']})` : ''}`,
    stats: { attack: row.Attack || 0, defense: row.Defense || 0, stamina: row.Stamina || 0, dash: row.Dash || 0, burstRes: row['Burst Res'] || 0 },
    raw: row
  });

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
        blades: (bladesRes.data || []).map(mapBlade),
        ratchets: (ratchetsRes.data || []).map(mapRatchet),
        bits: (bitsRes.data || []).map(mapBit),
        lockchips: (lockchipsRes.data || []).map(mapLockchip),
        assistBlades: (assistBladesRes.data || []).map(mapAssistBlade)
      });
    } catch (err) {
      console.error(err);
      setPartsError('Failed to load Beyblade parts. Please try again.');
    } finally {
      setIsLoadingParts(false);
    }
  };

  const fetchDeckPresets = async () => {
    if (!user || user.id?.startsWith('guest-')) return;
    try {
      const { data, error } = await supabase.from('deck_presets').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
      if (error) throw error;
      setDeckPresets(data || []);
    } catch (err) {
      console.error('fetchDeckPresets', err);
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
      setExistingPlayerNames((data || []).map((r: any) => String(r.player_name || '').toLowerCase().trim()));
    } catch (err) {
      console.error('Error fetching player names', err);
    }
  };

  const loadPreset = (presetId: string) => {
    const preset = deckPresets.find(p => p.id === presetId);
    if (!preset) return;
    const presetBeyblades: Beyblade[] = (preset.beyblades || []).slice(0, tournament.beyblades_per_player).map((b: any, idx: number) => ({
      id: `${Date.now()}-${idx}`,
      isCustom: (b.blade_line || '').toLowerCase() === 'custom',
      parts: {} // we keep parts minimal; you could map if you store parts inside presets
    }));
    setBeyblades(presetBeyblades);
    setSelectedPreset('');
  };

  // ------------------- Validation -------------------
  const isFormValid = () => {
    if (!playerName.trim()) return false;
    const normalized = playerName.toLowerCase().trim();
    if (existingPlayerNames.includes(normalized)) return false;

    return beyblades.every(b => {
      const req = getRequiredParts(b.isCustom);
      return req.every(rt => !!b.parts[rt]);
    });
  };

  // ------------------- Submit -------------------
  const handleSubmit = async () => {
    if (!playerName.trim()) {
      await alert('Missing Information', 'Please enter your player name.');
      return;
    }

    if (!tournament?.registration_open) {
      await alert('Registration Closed', 'Registration for this tournament has been closed by the administrators.');
      return;
    }

    if (tournament.max_participants !== 999999 && tournament.current_participants >= tournament.max_participants) {
      await alert('Tournament Full', 'This tournament has reached its maximum number of participants.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Re-fetch tournament is_free to decide payment status
      const tourRes = await supabase.from('tournaments').select('is_free').eq('id', tournament.id).single();
      if (tourRes.error) throw tourRes.error;
      const paymentStatus = tourRes.data?.is_free ? 'confirmed' : 'unpaid';

      // create registration
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

      // Batch insert beyblades
      const beybladeRows = beyblades.map(b => ({
        registration_id: registration.id,
        beyblade_name: generateBeybladeName(b),
        blade_line: b.isCustom ? 'Custom' : 'Standard'
      }));

      const { data: insertedBeyblades, error: bbError } = await supabase.from('tournament_beyblades').insert(beybladeRows).select();
      if (bbError) throw bbError;

      // Build parts inserts using returned beyblade ids
      const partsToInsert: any[] = [];
      // insertedBeyblades is an array in same order, ideally
      insertedBeyblades.forEach((inserted: any, idx: number) => {
        const localB = beyblades[idx];
        Object.entries(localB.parts).forEach(([partType, partObj]) => {
          if (!partObj) return;
          partsToInsert.push({
            beyblade_id: inserted.id,
            part_type: partType,
            part_name: partObj.displayName,
            part_data: partObj.raw
          });
        });
      });

      if (partsToInsert.length > 0) {
        const { error: partsErr } = await supabase.from('tournament_beyblade_parts').insert(partsToInsert);
        if (partsErr) throw partsErr;
      }

      await alert('Registration Successful', `You have registered ${playerName} for ${tournament.name}!`);
      onClose();

    } catch (err: any) {
      console.error('Registration error', err);
      await alert('Registration Failed', err?.message || String(err) || 'Unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------- Render -------------------
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-full sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto relative">

        {isLoadingParts && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading Beyblade parts...</p>
            </div>
          </div>
        )}

        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex justify-between items-center">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Tournament Registration</h2>
            <p className="text-gray-600">{tournament?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">

          {partsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{partsError}</p>
              <button onClick={fetchPartsData} className="text-sm underline text-red-600">Try Again</button>
            </div>
          )}

          {tournament?.description && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tournament Details</h3>
              <p className="text-gray-700">{tournament.description}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
            <div className="flex items-center mb-4">
              <User className="text-blue-600 mr-2" size={20} />
              <h3 className="text-lg font-semibold text-blue-900">Player Information</h3>
            </div>

            {user && !user.id?.startsWith('guest-') && (
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
                    <span className="text-sm font-medium text-blue-900">Registering for myself ({user.username})</span>
                  </div>
                </label>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-1">Player Name *</label>
                <input
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  disabled={registeringForSelf}
                  placeholder="Enter your player name"
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${registeringForSelf ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
                {playerName.trim() && existingPlayerNames.includes(playerName.toLowerCase().trim()) && (
                  <div className="mt-1 text-xs text-red-600">⚠ This player name is already registered</div>
                )}
              </div>

              <div>
                <label htmlFor="paymentMode" className="block text-sm font-medium text-gray-700 mb-1">Mode of Payment *</label>
                <select
                  id="paymentMode"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {tournament?.is_free && <option value="free">Free Entry</option>}
                  <option value="cash">Cash</option>
                  <option value="gcash">GCash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
            </div>
          </div>

          {!user?.id?.startsWith('guest-') && deckPresets.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
              <div className="flex items-center mb-4">
                <Layers className="text-green-600 mr-2" size={20} />
                <h3 className="text-lg font-semibold text-green-900">Quick Setup with Deck Presets</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Deck Preset</label>
                  <select value={selectedPreset} onChange={(e) => setSelectedPreset(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">-- Select a preset --</option>
                    {deckPresets.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({(p.beyblades || []).length} Beyblades)</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button type="button" onClick={() => selectedPreset && loadPreset(selectedPreset)} disabled={!selectedPreset} className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 text-sm">Load Preset</button>
                </div>
              </div>

              {selectedPreset && (
                <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                  <div className="text-sm text-green-800">
                    <strong>Preview:</strong>
                    {(deckPresets.find(p => p.id === selectedPreset)?.beyblades || []).slice(0, 3).map((b: any, i: number) => (
                      <div key={i} className="font-mono text-xs mt-1">• {b.name || `Beyblade ${i + 1}`}</div>
                    ))}
                    {(deckPresets.find(p => p.id === selectedPreset)?.beyblades || []).length > 3 && (
                      <div className="text-xs mt-1 text-green-600">+{(deckPresets.find(p => p.id === selectedPreset)?.beyblades || []).length - 3} more...</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {beyblades.map((b, idx) => (
            <BeybladeCard
              key={b.id}
              beyblade={b}
              availableParts={partsData}
              onUpdate={(updated) => setBeyblades(cur => cur.map(bb => bb.id === b.id ? updated : bb))}
              onRemove={() => setBeyblades(cur => cur.filter(bb => bb.id !== b.id))}
            />
          ))}

          {beyblades.length < (tournament?.beyblades_per_player || 3) && (
            <button
              onClick={() => setBeyblades(cur => [...cur, { id: Date.now().toString(), isCustom: false, parts: {} }])}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center space-x-2"
            >
              <Plus size={20} />
              <span>Add Another Beyblade</span>
            </button>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={!isFormValid() || isLoadingParts || isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                  <span>Registering...</span>
                </>
              ) : (
                <span>Register</span>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}