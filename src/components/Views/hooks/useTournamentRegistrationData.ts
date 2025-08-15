import { useState, useEffect } from 'react';
import { supabase } from '/src/lib/supabase';
import { Tournament } from '../types';
import { useAuth } from '/src/context/AuthContext';
import { useConfirmation } from '/src/context/ConfirmationContext';

export function useTournamentRegistrationData(tournament: Tournament, onClose: () => void) {
  const { user } = useAuth();
  const { alert } = useConfirmation();

  const [playerName, setPlayerName] = useState('');
  const [paymentMode, setPaymentMode] = useState<'free' | 'cash' | 'gcash' | 'bank_transfer'>(
    tournament.is_free ? 'free' : 'cash'
  );
  const [beyblades, setBeyblades] = useState([{ id: '1', bladeLine: '', parts: {} }]);
  const [deckPresets, setDeckPresets] = useState<any[]>([]);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [partsData, setPartsData] = useState({
    blades: [],
    ratchets: [],
    bits: [],
    lockchips: [],
    assistBlades: []
  });
  const [isLoadingParts, setIsLoadingParts] = useState(false);
  const [partsError, setPartsError] = useState<string | null>(null);

  // Fetch parts data from Supabase
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

  // Fetch deck presets
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

  // Load preset into beyblades
  const loadPreset = (presetId: string) => {
    const preset = deckPresets.find(p => p.id === presetId);
    if (!preset) return;
    const presetBeyblades = preset.beyblades
      .slice(0, tournament.beyblades_per_player)
      .map((bey: any, index: number) => ({
        id: (index + 1).toString(),
        bladeLine: bey.blade_line,
        parts: bey.parts
      }));
    setBeyblades(presetBeyblades);
    setSelectedPreset('');
  };

  // Submit registration
  const handleSubmit = async () => {
    // Simple validation (more in useBeybladeValidation)
    if (!playerName.trim()) {
      await alert('Missing Information', 'Please enter your player name.');
      return;
    }

    try {
      // Insert registration
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

      // Insert each Beyblade & parts
      for (const beyblade of beyblades) {
        const beyName = generateBeybladeName(beyblade);
        const { data: beyData, error: beyError } = await supabase
          .from('tournament_beyblades')
          .insert({
            registration_id: registration.id,
            beyblade_name: beyName,
            blade_line: beyblade.bladeLine
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

  // Helper functions
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
    const requiredParts = getRequiredParts(beyblade.bladeLine);
    if (!requiredParts.every(p => beyblade.parts[p])) return '';
    if (beyblade.bladeLine === 'Custom') {
      const { Lockchip, 'Main Blade': MainBlade, 'Assist Blade': AssistBlade, Ratchet, Bit } = beyblade.parts;
      return `${Lockchip?.Lockchip || ''}${MainBlade?.Blades || ''} ${AssistBlade?.['Assist Blade'] || ''}${Ratchet?.Ratchet || ''}${Bit?.Shortcut || ''}`;
    } else {
      const { Blade, Ratchet, Bit } = beyblade.parts;
      return `${Blade?.Blades || ''} ${Ratchet?.Ratchet || ''}${Bit?.Shortcut || ''}`;
    }
  };

  const getRequiredParts = (bladeLine: string) => {
    switch (bladeLine) {
      case 'Basic':
      case 'Unique':
      case 'X-Over':
        return ['Blade', 'Ratchet', 'Bit'];
      case 'Custom':
        return ['Lockchip', 'Main Blade', 'Assist Blade', 'Ratchet', 'Bit'];
      default:
        return [];
    }
  };

  // On mount
  useEffect(() => {
    fetchPartsData();
    fetchDeckPresets();
  }, []);

  return {
    playerName, setPlayerName,
    paymentMode, setPaymentMode,
    beyblades, setBeyblades,
    deckPresets, selectedPreset, setSelectedPreset, loadPreset,
    partsData, isLoadingParts, partsError, fetchPartsData,
    handleSubmit
  };
}
