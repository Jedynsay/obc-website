import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, User, UserCheck, Layers, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useConfirmation } from '../../context/ConfirmationContext';
import { StatBar } from './StatBar';
import { supabase } from '../../lib/supabase';

interface Tournament {
  id: string;
  name: string;
  description?: string;
  is_free: boolean;
  beyblades_per_player: number;
}

interface TournamentRegistrationProps {
  tournament: Tournament;
  onClose: () => void;
}

type PaymentMode = 'free' | 'cash' | 'gcash' | 'bank_transfer';

interface Part {
  [key: string]: any;
}

interface Beyblade {
  id: string;
  isCustom: boolean;
  parts: Record<string, Part | null>;
}

export function TournamentRegistration({ tournament, onClose }: TournamentRegistrationProps) {
  const { user } = useAuth();
  const { alert } = useConfirmation();

  const [playerName, setPlayerName] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(
    tournament.is_free ? 'free' : 'cash'
  );
  const [beyblades, setBeyblades] = useState<Beyblade[]>([
    { id: '1', isCustom: false, parts: {} }
  ]);
  const [deckPresets, setDeckPresets] = useState<any[]>([]);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [registeringForSelf, setRegisteringForSelf] = useState(false);
  const [partsData, setPartsData] = useState({
    blades: [] as Part[],
    ratchets: [] as Part[],
    bits: [] as Part[],
    lockchips: [] as Part[],
    assistBlades: [] as Part[]
  });
  const [isLoadingParts, setIsLoadingParts] = useState(false);
  const [partsError, setPartsError] = useState<string | null>(null);
  const [existingPlayerNames, setExistingPlayerNames] = useState<string[]>([]);

  // --- Auto-fill player name when registering for self ---
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

  // --- Required parts depending on custom toggle ---
  const getRequiredParts = (isCustom: boolean): string[] =>
    isCustom
      ? ['Lockchip', 'Main Blade', 'Assist Blade', 'Ratchet', 'Bit']
      : ['Blade', 'Ratchet', 'Bit'];

  const getPartOptions = useCallback(
    (isCustom: boolean, partType: string) => {
      let options: Part[] = [];
      switch (partType) {
        case 'Blade':
          options = partsData.blades.filter(b => b.Line !== 'Custom');
          break;
        case 'Main Blade':
          options = partsData.blades.filter(b => b.Line === 'Custom');
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
      return options.sort((a, b) =>
        getPartDisplayName(a, partType).localeCompare(getPartDisplayName(b, partType))
      );
    },
    [partsData]
  );

  const getPartDisplayName = (part: Part, partType: string) => {
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

  const generateBeybladeName = (beyblade: Beyblade) => {
    const requiredParts = getRequiredParts(beyblade.isCustom);
    if (!requiredParts.every(p => beyblade.parts[p])) return '';
    if (beyblade.isCustom) {
      const { Lockchip, 'Main Blade': MainBlade, 'Assist Blade': AssistBlade, Ratchet, Bit } =
        beyblade.parts;
      return `${Lockchip?.Lockchip || ''}${MainBlade?.Blades || ''} ${AssistBlade?.['Assist Blade'] || ''}${Ratchet?.Ratchet || ''}${Bit?.Shortcut || ''}`;
    } else {
      const { Blade, Ratchet, Bit } = beyblade.parts;
      return `${Blade?.Blades || ''} ${Ratchet?.Ratchet || ''}${Bit?.Shortcut || ''}`;
    }
  };

  const calculateStats = (parts: Record<string, Part | null>) =>
    Object.values(parts).reduce(
      (stats, part) => {
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

  const updatePart = (beybladeId: string, partType: string, selectedPart: Part) => {
    setBeyblades(prev =>
      prev.map(b =>
        b.id === beybladeId
          ? { ...b, parts: { ...b.parts, [partType]: selectedPart } }
          : b
      )
    );
  };

  const removeBeyblade = (id: string) => {
    if (beyblades.length > 1) {
      setBeyblades(beyblades.filter(b => b.id !== id));
    }
  };

  const isFormValid = () => {
    if (!playerName.trim()) return false;
    const normalizedName = playerName.toLowerCase().trim();
    if (existingPlayerNames.includes(normalizedName)) return false;
    return beyblades.every(bey => {
      const requiredParts = getRequiredParts(bey.isCustom);
      return requiredParts.every(p => bey.parts[p]);
    });
  };

  const handleSubmit = async () => {
    if (!playerName.trim()) {
      await alert('Missing Information', 'Please enter your player name.');
      return;
    }

    try {
      const { data: tournamentData } = await supabase
        .from('tournaments')
        .select('is_free')
        .eq('id', tournament.id)
        .single();

      const paymentStatus = tournamentData?.is_free ? 'confirmed' : 'unpaid';

      const { data: registration, error: regError } = await supabase
        .from('tournament_registrations')
        .insert({
          tournament_id: tournament.id,
          player_name: playerName.trim(),
          payment_mode: paymentMode,
          status: paymentStatus === 'confirmed' ? 'confirmed' : 'pending',
          payment_status: paymentStatus
        })
        .select()
        .single();
      if (regError) throw regError;

      for (const beyblade of beyblades) {
        const beyName = generateBeybladeName(beyblade);
        const { data: beyData, error: beyError } = await supabase
          .from('tournament_beyblades')
          .insert({
            registration_id: registration.id,
            beyblade_name: beyName,
            blade_line: beyblade.isCustom ? 'Custom' : 'Standard'
          })
          .select()
          .single();
        if (beyError) throw beyError;

        const partsToInsert = Object.entries(beyblade.parts).map(([partType, partData]) => ({
          beyblade_id: beyData.id,
          part_type: partType,
          part_name: getPartDisplayName(partData!, partType),
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
        {/* ... header and other sections unchanged ... */}

        {/* Beyblade Cards */}
        {beyblades.map((beyblade, index) => (
          <div key={beyblade.id} className="border border-gray-200 rounded-lg p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Beyblade #{index + 1}</h3>

              {/* Custom toggle */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <span className="text-sm font-medium text-gray-700">Custom Line</span>
                <div
                  onClick={() =>
                    setBeyblades(prev =>
                      prev.map(b =>
                        b.id === beyblade.id ? { ...b, isCustom: !b.isCustom, parts: {} } : b
                      )
                    )
                  }
                  className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${
                    beyblade.isCustom ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                      beyblade.isCustom ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </label>

              {beyblades.length > 1 && (
                <button
                  onClick={() => removeBeyblade(beyblade.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Generated Name
              </label>
              <div className="border border-gray-200 rounded-md px-3 py-2 bg-gray-50 text-sm font-mono">
                {generateBeybladeName(beyblade) || 'Select all parts to generate name'}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {getRequiredParts(beyblade.isCustom).map(partType => (
                <div key={partType}>
                  <label className="block text-sm font-medium mb-1">{partType} *</label>
                  <select
                    value={beyblade.parts[partType] ? JSON.stringify(beyblade.parts[partType]) : ''}
                    onChange={e =>
                      e.target.value &&
                      updatePart(beyblade.id, partType, JSON.parse(e.target.value))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select {partType}</option>
                    {getPartOptions(beyblade.isCustom, partType).map((part, idx) => (
                      <option key={idx} value={JSON.stringify(part)}>
                        {getPartDisplayName(part, partType)}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {Object.keys(beyblade.parts).length > 0 && (
              <StatBar stats={calculateStats(beyblade.parts)} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
