import React from 'react';
import { Trash2 } from 'lucide-react';
import { StatBar } from './StatBar';

interface BeybladeFormCardProps {
  beyblade: any;
  index: number;
  beyblades: any[];
  setBeyblades: (beys: any[]) => void;
  partsData: {
    blades: any[];
    ratchets: any[];
    bits: any[];
    lockchips: any[];
    assistBlades: any[];
  };
  fusionParts: any[]; // NEW
  validationErrors: { duplicateParts: string[] };
}

export function BeybladeFormCard({
  beyblade,
  index,
  beyblades,
  setBeyblades,
  partsData,
  fusionParts,
  validationErrors
}: BeybladeFormCardProps) {
  const getRequiredParts = (bladeLine: string): string[] => {
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

  const isSlotDisabled = (slotType: string) => {
    return Object.entries(beyblade.parts).some(([slot, part]: any) => {
      if (!part) return false;
      const shortcut = part.Shortcut || part.part_shortcut;
      const fusion = fusionParts.find(fp => fp.part_shortcut === shortcut);
      return fusion?.covered_parts?.includes(slotType) && slot !== slotType;
    });
  };

  const getPartOptions = (bladeLine: string, partType: string) => {
    let options: any[] = [];
    switch (partType) {
      case 'Blade':
        options = partsData.blades.filter(blade => blade.Line === bladeLine);
        break;
      case 'Main Blade':
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

    // Merge fusion parts that can fill this slot
    const fusionOptions = fusionParts.filter(fp =>
      fp.covered_parts?.includes(partType)
    );

    return [...options, ...fusionOptions].sort((a, b) =>
      getPartDisplayName(a, partType).localeCompare(getPartDisplayName(b, partType))
    );
  };

  const getPartDisplayName = (part: any, partType: string) => {
    if (part.part_name) return `${part.part_name} (${part.part_shortcut})`; // fusion part
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

  const updateBeyblade = (field: string, value: any) => {
    setBeyblades(beyblades.map(b =>
      b.id === beyblade.id
        ? field === 'bladeLine'
          ? { ...b, bladeLine: value, parts: {} }
          : { ...b, [field]: value }
        : b
    ));
  };

  const updatePart = (partType: string, selectedPart: any) => {
    let newParts = { ...beyblade.parts, [partType]: selectedPart };

    // If selected part is a fusion part, clear other covered slots
    if (selectedPart && selectedPart.part_shortcut) {
      const fusion = fusionParts.find(fp => fp.part_shortcut === selectedPart.part_shortcut);
      if (fusion?.covered_parts) {
        fusion.covered_parts.forEach((coveredSlot: string) => {
          if (coveredSlot !== partType) {
            newParts[coveredSlot] = undefined;
          }
        });
      }
    }

    setBeyblades(beyblades.map(b =>
      b.id === beyblade.id ? { ...b, parts: newParts } : b
    ));
  };

  const removeBeyblade = () => {
    if (beyblades.length > 1) {
      setBeyblades(beyblades.filter(b => b.id !== beyblade.id));
    }
  };

  const generateBeybladeName = () => {
    const requiredParts = getRequiredParts(beyblade.bladeLine);
    if (!requiredParts.every(p => beyblade.parts[p])) return '';
    if (beyblade.bladeLine === 'Custom') {
      const { Lockchip, 'Main Blade': MainBlade, 'Assist Blade': AssistBlade, Ratchet, Bit } = beyblade.parts;
      return `${Lockchip?.Lockchip || ''}${MainBlade?.Blades || ''} ${AssistBlade?.['Assist Blade'] || ''}${Ratchet?.Ratchet || ''}${Bit?.Shortcut || Bit?.part_shortcut || ''}`;
    } else {
      const { Blade, Ratchet, Bit } = beyblade.parts;
      return `${Blade?.Blades || ''} ${Ratchet?.Ratchet || Ratchet?.part_shortcut || ''}${Bit?.Shortcut || Bit?.part_shortcut || ''}`;
    }
  };

  const calculateStats = () => {
    return Object.values(beyblade.parts).reduce(
      (stats: any, part: any) => {
        if (part) {
          stats.attack += part.Attack || part.attack || 0;
          stats.defense += part.Defense || part.defense || 0;
          stats.stamina += part.Stamina || part.stamina || 0;
          stats.dash += part.Dash || part.dash || 0;
          stats.burstRes += part['Burst Res'] || part.burst_resistance || 0;
        }
        return stats;
      },
      { attack: 0, defense: 0, stamina: 0, dash: 0, burstRes: 0 }
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Beyblade #{index + 1}</h3>
        {beyblades.length > 1 && (
          <button onClick={removeBeyblade} className="p-2 text-red-600 hover:bg-red-50 rounded-full">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Blade Line */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Blade Line *
          </label>
          <select
            value={beyblade.bladeLine}
            onChange={(e) => updateBeyblade('bladeLine', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Blade Line</option>
            <option value="Basic">Basic</option>
            <option value="Unique">Unique</option>
            <option value="Custom">Custom</option>
            <option value="X-Over">X-Over</option>
          </select>
        </div>

        {beyblade.bladeLine && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Generated Name
            </label>
            <div className="border border-gray-200 rounded-md px-3 py-2 bg-gray-50 text-sm font-mono">
              {generateBeybladeName() || 'Select all parts to generate name'}
            </div>
          </div>
        )}
      </div>

      {/* Parts Selection */}
      {beyblade.bladeLine && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {getRequiredParts(beyblade.bladeLine).map((partType) => {
            const options = getPartOptions(beyblade.bladeLine, partType);
            return (
              <div key={partType}>
                <label className="block text-sm font-medium mb-1">
                  {partType} *
                </label>
                <select
                  value={beyblade.parts[partType] ? JSON.stringify(beyblade.parts[partType]) : ''}
                  onChange={(e) => e.target.value && updatePart(partType, JSON.parse(e.target.value))}
                  disabled={isSlotDisabled(partType)}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isSlotDisabled(partType) ? 'bg-gray-200 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="">Select {partType}</option>
                  {options.map((part: any, idx) => (
                    <option key={idx} value={JSON.stringify(part)}>
                      {getPartDisplayName(part, partType)}
                    </option>
                  ))}
                </select>
                {beyblade.parts[partType] &&
                  validationErrors.duplicateParts.some(err =>
                    err.includes(getPartDisplayName(beyblade.parts[partType], partType))
                  ) && (
                    <div className="mt-1 text-xs text-red-600">
                      ⚠ This part is used in another Beyblade
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      {beyblade.bladeLine && Object.keys(beyblade.parts).length > 0 && (
        <StatBar stats={calculateStats()} />
      )}
    </div>
  );
}
