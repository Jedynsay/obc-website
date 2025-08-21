import React from 'react';
import { User, UserCheck } from 'lucide-react';
import { Tournament } from '../../types';
import { useAuth } from '../../context/AuthContext';

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
  const { user } = useAuth();
  const [registeringForSelf, setRegisteringForSelf] = React.useState(false);
  
  // Auto-fill player name when registering for self
  React.useEffect(() => {
    if (registeringForSelf && user && !user.id.startsWith('guest-')) {
      setPlayerName(user.username);
    } else if (!registeringForSelf) {
      setPlayerName('');
    }
  }, [registeringForSelf, user, setPlayerName]);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
      <div className="flex items-center mb-4">
        <User className="text-blue-600 mr-2" size={20} />
        <h3 className="text-lg font-semibold text-blue-900">Player Information</h3>
      </div>

      {/* Self Registration Toggle */}
      {user && !user.id.startsWith('guest-') && (
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
              <span className="text-sm font-medium text-blue-900">
                Registering for myself ({user.username})
              </span>
            </div>
          </label>
        </div>
      )}

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
            disabled={registeringForSelf}
            placeholder="Enter your player name"
            className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              registeringForSelf ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
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
