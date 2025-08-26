import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { StatBar } from './StatBar';

// ------------------ TYPES ------------------
export type BladeLine = 'Standard' | 'Custom';

export interface Stats {
  attack: number;
  defense: number;
  stamina: number;
  dash: number;
  burstRes: number;
}

export type PartType =
  | 'Blade'
  | 'Main Blade'
  | 'Assist Blade'
  | 'Ratchet'
  | 'Bit'
  | 'Lockchip';

export interface Part {
  id: string;
  type: PartType;
  displayName: string;
  stats: Stats;
  raw: any; // original data from DB
}

export interface Beyblade {
  id: string;
  isCustom: boolean; // instead of bladeLine string
  parts: Partial<Record<PartType, Part>>;
}

// ------------------ UTILS ------------------
const getRequiredParts = (isCustom: boolean): PartType[] =>
  isCustom
    ? ['Lockchip', 'Main Blade', 'Assist Blade', 'Ratchet', 'Bit']
    : ['Blade', 'Ratchet', 'Bit'];

const generateBeybladeName = (b: Beyblade): string => {
  const requiredParts = getRequiredParts(b.isCustom);
  if (!requiredParts.every(p => b.parts[p])) return '';

  if (b.isCustom) {
    const { Lockchip, 'Main Blade': MainBlade, 'Assist Blade': AssistBlade, Ratchet, Bit } = b.parts;
    return `${Lockchip?.displayName || ''}${MainBlade?.displayName || ''} ${AssistBlade?.displayName || ''}${Ratchet?.displayName || ''}${Bit?.displayName || ''}`;
  } else {
    const { Blade, Ratchet, Bit } = b.parts;
    return `${Blade?.displayName || ''} ${Ratchet?.displayName || ''}${Bit?.displayName || ''}`;
  }
};

const calculateStats = (parts: Partial<Record<PartType, Part>>): Stats =>
  Object.values(parts).reduce(
    (acc, part) => {
      if (part) {
        acc.attack += part.stats.attack;
        acc.defense += part.stats.defense;
        acc.stamina += part.stats.stamina;
        acc.dash += part.stats.dash;
        acc.burstRes += part.stats.burstRes;
      }
      return acc;
    },
    { attack: 0, defense: 0, stamina: 0, dash: 0, burstRes: 0 }
  );

// ------------------ BEYBLADE CARD ------------------
interface BeybladeCardProps {
  beyblade: Beyblade;
  onUpdate: (updated: Beyblade) => void;
  onRemove: () => void;
  availableParts: {
    blades: Part[];
    ratchets: Part[];
    bits: Part[];
    lockchips: Part[];
    assistBlades: Part[];
  };
}

export const BeybladeCard: React.FC<BeybladeCardProps> = ({
  beyblade,
  onUpdate,
  onRemove,
  availableParts
}) => {
  const requiredParts = getRequiredParts(beyblade.isCustom);

  const handlePartChange = (partType: PartType, partId: string) => {
    let options: Part[] = [];

    switch (partType) {
      case 'Blade':
        options = availableParts.blades.filter(b => b.raw.Line !== 'Custom'); // exclude custom
        break;
      case 'Main Blade':
        options = availableParts.blades.filter(b => b.raw.Line === 'Custom');
        break;
      case 'Ratchet':
        options = availableParts.ratchets;
        break;
      case 'Bit':
        options = availableParts.bits;
        break;
      case 'Lockchip':
        options = availableParts.lockchips;
        break;
      case 'Assist Blade':
        options = availableParts.assistBlades;
        break;
    }

    const selectedPart = options.find(p => p.id === partId);
    if (!selectedPart) return;

    onUpdate({
      ...beyblade,
      parts: {
        ...beyblade.parts,
        [partType]: selectedPart
      }
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Beyblade</h3>
        <div className="flex items-center space-x-2">
          <label className="flex items-center cursor-pointer">
            <span className="mr-2 text-sm text-gray-700">Custom Line</span>
            <input
              type="checkbox"
              checked={beyblade.isCustom}
              onChange={(e) =>
                onUpdate({ ...beyblade, isCustom: e.target.checked, parts: {} })
              }
              className="sr-only"
            />
            <div
              className={`w-10 h-5 flex items-center bg-gray-300 rounded-full p-1 duration-300 ease-in-out ${
                beyblade.isCustom ? 'bg-blue-500' : ''
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                  beyblade.isCustom ? 'translate-x-5' : ''
                }`}
              />
            </div>
          </label>
          <button
            onClick={onRemove}
            className="p-2 text-red-600 hover:bg-red-50 rounded-full"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Generated Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Generated Name
        </label>
        <div className="border border-gray-200 rounded-md px-3 py-2 bg-gray-50 text-sm font-mono">
          {generateBeybladeName(beyblade) || 'Select all parts to generate name'}
        </div>
      </div>

      {/* Parts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {requiredParts.map((partType) => {
          let options: Part[] = [];

          switch (partType) {
            case 'Blade':
              options = availableParts.blades.filter(b => b.raw.Line !== 'Custom');
              break;
            case 'Main Blade':
              options = availableParts.blades.filter(b => b.raw.Line === 'Custom');
              break;
            case 'Ratchet':
              options = availableParts.ratchets;
              break;
            case 'Bit':
              options = availableParts.bits;
              break;
            case 'Lockchip':
              options = availableParts.lockchips;
              break;
            case 'Assist Blade':
              options = availableParts.assistBlades;
              break;
          }

          return (
            <div key={partType}>
              <label className="block text-sm font-medium mb-1">
                {partType} *
              </label>
              <select
                value={beyblade.parts[partType]?.id || ''}
                onChange={(e) => handlePartChange(partType, e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select {partType}</option>
                {options.map((part) => (
                  <option key={part.id} value={part.id}>
                    {part.displayName}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      {Object.keys(beyblade.parts).length > 0 && (
        <StatBar stats={calculateStats(beyblade.parts)} />
      )}
    </div>
  );
};
