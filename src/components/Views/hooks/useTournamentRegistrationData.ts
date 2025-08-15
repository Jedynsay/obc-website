import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Tournament } from '../../../types';

export function useTournamentRegistrationData(tournament: Tournament, onClose: () => void) {
  const [playerName, setPlayerName] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [beyblades, setBeyblades] = useState<any[]>([{ id: Date.now().toString(), bladeLine: '', parts: {} }]);
  const [deckPresets, setDeckPresets] = useState<any[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [partsData, setPartsData] = useState<any>({
    blades: [],
    ratchets: [],
    bits: [],
    lockchips: [],
    assistBlades: [],
  });
  const [fusionParts, setFusionParts] = useState<any[]>([]);
  const [isLoadingParts, setIsLoadingParts] = useState(false);
  const [partsError, setPartsError] = useState<string | null>(null);

  const fetchPartsData = async () => {
    setIsLoadingParts(true);
    setPartsError(null);
    try {
      const [bladesRes, ratchetsRes, bitsRes, lockchipsRes, assistBladesRes, fusionPartsRes] = await Promise.all([
        supabase.from('beyparts_blades').select('*'),
        supabase.from('beyparts_ratchets').select('*'),
        supabase.from('beyparts_bits').select('*'),
        supabase.from('beyparts_lockchips').select('*'),
        supabase.from('beyparts_assistblades').select('*'),
        supabase.from('beyparts_fusionparts').select('*'),
      ]);

      if (bladesRes.error) throw bladesRes.error;
      if (ratchetsRes.error) throw ratchetsRes.error;
      if (bitsRes.error) throw bitsRes.error;
      if (lockchipsRes.error) throw lockchipsRes.error;
      if (assistBladesRes.error) throw assistBladesRes.error;
      if (fusionPartsRes.error) throw fusionPartsRes.error;

      setPartsData({
        blades: bladesRes.data || [],
        ratchets: ratchetsRes.data || [],
        bits: bitsRes.data || [],
        lockchips: lockchipsRes.data || [],
        assistBlades: assistBladesRes.data || [],
      });

      setFusionParts(fusionPartsRes.data || []);
    } catch (error: any) {
      console.error('Error fetching parts:', error);
      setPartsError('Failed to load Beyblade parts. Please try again.');
    } finally {
      setIsLoadingParts(false);
    }
  };

  const loadPreset = (presetId: string) => {
    const preset = deckPresets.find((p) => p.id === presetId);
    if (preset) {
      setBeyblades(preset.beyblades || []);
    }
  };

  // Submit registration
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

  useEffect(() => {
    fetchPartsData();
  }, []);

  return {
    playerName,
    setPlayerName,
    paymentMode,
    setPaymentMode,
    beyblades,
    setBeyblades,
    deckPresets,
    selectedPreset,
    setSelectedPreset,
    loadPreset,
    partsData,
    fusionParts, // ✅ new return
    isLoadingParts,
    partsError,
    fetchPartsData,
    handleSubmit,
  };
}
