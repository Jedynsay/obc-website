import React, { useState, useEffect } from 'react';
import { X, Save, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useConfirmation } from '../../context/ConfirmationContext';
import { Tournament } from '../../types';
import { useTournamentRegistrationData } from './hooks/useTournamentRegistrationData';
import { useBeybladeValidation } from './hooks/useBeybladeValidation';
import { PlayerInfoSection } from './PlayerInfoSection';
import { DeckPresetSection } from './DeckPresetSection';
import { BeybladeFormCard } from './BeybladeFormCard';

interface TournamentRegistrationProps {
  tournament: Tournament;
  onClose: () => void;
}

export function TournamentRegistration({ tournament, onClose }: TournamentRegistrationProps) {
  const { user } = useAuth();
  const { alert } = useConfirmation();

  const {
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
    isLoadingParts,
    partsError,
    fetchPartsData,
    handleSubmit
  } = useTournamentRegistrationData(tournament, onClose);

  const { validationErrors, isFormValid } = useBeybladeValidation(playerName, beyblades, tournament);

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

          {/* Player Info */}
          <PlayerInfoSection
            playerName={playerName}
            setPlayerName={setPlayerName}
            paymentMode={paymentMode}
            setPaymentMode={setPaymentMode}
            tournament={tournament}
            validationErrors={validationErrors}
          />

          {/* Deck Presets */}
          {!user?.id.startsWith('guest-') && deckPresets.length > 0 && (
            <DeckPresetSection
              deckPresets={deckPresets}
              selectedPreset={selectedPreset}
              setSelectedPreset={setSelectedPreset}
              loadPreset={loadPreset}
            />
          )}

          {/* Beyblade Cards */}
          {beyblades.map((beyblade, index) => (
            <BeybladeFormCard
              key={beyblade.id}
              beyblade={beyblade}
              index={index}
              beyblades={beyblades}
              setBeyblades={setBeyblades}
              partsData={partsData}
              validationErrors={validationErrors}
            />
          ))}

          {beyblades.length < tournament.beyblades_per_player && (
            <button
              onClick={() => setBeyblades([...beyblades, { id: Date.now().toString(), bladeLine: '', parts: {} }])}
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
              <Save size={16} />
              <span>Register</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
