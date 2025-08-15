import React from 'react';
import { Layers } from 'lucide-react';

interface DeckPresetSectionProps {
  deckPresets: any[];
  selectedPreset: string;
  setSelectedPreset: (id: string) => void;
  loadPreset: (id: string) => void;
}

export function DeckPresetSection({
  deckPresets,
  selectedPreset,
  setSelectedPreset,
  loadPreset
}: DeckPresetSectionProps) {
  return (
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
  );
}
