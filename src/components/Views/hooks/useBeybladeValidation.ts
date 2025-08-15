import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Tournament } from '../../../types';

interface ValidationErrors {
  duplicateParts: string[];
  duplicatePlayerName: boolean;
}

export function useBeybladeValidation(
  playerName: string,
  beyblades: any[],
  tournament: Tournament
) {
  const [existingPlayerNames, setExistingPlayerNames] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    duplicateParts: [],
    duplicatePlayerName: false
  });

  // Fetch existing confirmed player names for this tournament
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

  // Check for duplicate player name
  const validatePlayerName = (name: string) => {
    const normalizedName = name.toLowerCase().trim();
    const isDuplicate = existingPlayerNames.includes(normalizedName);
    setValidationErrors(prev => ({ ...prev, duplicatePlayerName: isDuplicate }));
    return !isDuplicate;
  };

  // Check for duplicate parts across all beyblades
  const validateBeybladeConfiguration = () => {
    const duplicateParts: string[] = [];
    const allUsedParts = new Map<string, { beybladeIndex: number; partType: string }>();

    beyblades.forEach((bey, beyIndex) => {
      const requiredParts = getRequiredParts(bey.bladeLine);
      requiredParts.forEach(partType => {
        const part = bey.parts[partType];
        if (!part) return;
        const partName = getPartDisplayName(part, partType);
        const partKey = `${partType}:${partName}`;

        if (allUsedParts.has(partKey)) {
          const firstUse = allUsedParts.get(partKey)!;
          duplicateParts.push(`${partName} (${partType}) is used in both Beyblade ${firstUse.beybladeIndex + 1} and Beyblade ${beyIndex + 1}`);
        } else {
          allUsedParts.set(partKey, { beybladeIndex: beyIndex, partType });
        }
      });
    });

    setValidationErrors(prev => ({ ...prev, duplicateParts }));
    return duplicateParts.length === 0;
  };

  // Required parts by blade line
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

  // Display name helper
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

  // Combined form validation
  const isFormValid = () => {
    if (!playerName.trim()) return false;
    if (validationErrors.duplicatePlayerName) return false;
    if (validationErrors.duplicateParts.length > 0) return false;
    return beyblades.every(bey => {
      if (!bey.bladeLine) return false;
      const requiredParts = getRequiredParts(bey.bladeLine);
      return requiredParts.every(partType => bey.parts[partType]);
    });
  };

  // Run on player name change
  useEffect(() => {
    if (playerName.trim()) {
      validatePlayerName(playerName);
    } else {
      setValidationErrors(prev => ({ ...prev, duplicatePlayerName: false }));
    }
  }, [playerName, existingPlayerNames]);

  // Run on beyblade change
  useEffect(() => {
    validateBeybladeConfiguration();
  }, [beyblades]);

  // Fetch names when tournament changes
  useEffect(() => {
    fetchExistingPlayerNames();
  }, [tournament.id]);

  return { validationErrors, isFormValid, validatePlayerName, validateBeybladeConfiguration };
}
