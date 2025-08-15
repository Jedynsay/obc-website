import React from 'react';
import { User } from 'lucide-react';
import { Tournament } from '../../../types';

interface PlayerInfoSectionProps {
  playerName: string;
  setPlayerName: (name: string) => void;
  paymentMode: 'free' | 'cash' | 'gcash' | 'bank_transfer';
  setPaymentMode: (mode: 'free' | 'cash' | 'gcash' | 'bank_transfer') => void;
  tournament: Tournament;
  validationErrors: { duplicatePlayerName: boolean };
}

export function PlayerInfoSection({
  playerName,
  setPlayerName,
  paymentMode,
  setPaymentMode,
  tournament,
  validationErrors
}: PlayerInfoSectionProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
      <div className="flex items-center mb-4">
        <User className="text-blue-600 mr-2" size={20} />
        <h3 className="text-lg font-semibold text-blue-900">Player Information</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Player Name */}
        <div>
          <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-1">
            Player Name *
          </label>
          <input
            type="text"
            id="playerName"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your player name"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {validationErrors.duplicatePlayerName && (
            <div className="mt-1 text-xs text-red-600">⚠ This player name is already registered</div>
          )}
        </div>

        {/* Payment Mode */}
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
  );
}
