import React, { useState, useEffect } from 'react';
import { Crown, Star, Play } from 'lucide-react';

export function CommunityHighlights({ topPlayers, currentTournamentFilter, setTournamentFilter, tournaments, recentMatches }) {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  useEffect(() => {
    if (topPlayers.length > 1) {
      const timer = setInterval(() => {
        setCurrentPlayerIndex((prev) => (prev + 1) % topPlayers.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [topPlayers.length]);

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <h2 className="text-3xl font-bold mb-6">Community Champions</h2>
      
      {topPlayers.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center mb-8">
          <div className="w-20 h-20 bg-yellow-400 text-black rounded-full flex items-center justify-center mx-auto text-2xl font-bold relative">
            {topPlayers[currentPlayerIndex]?.name.charAt(0)}
            <Crown className="absolute -top-3 -right-3 text-yellow-400" size={20} />
          </div>
          <h3 className="mt-4 text-xl font-semibold">{topPlayers[currentPlayerIndex]?.name}</h3>
          <div className="mt-2 flex justify-center gap-6 text-sm text-slate-400">
            <div><span className="text-blue-400 font-bold">{topPlayers[currentPlayerIndex]?.wins}</span> Wins</div>
            <div><span className="text-purple-400 font-bold">{topPlayers[currentPlayerIndex]?.tournaments}</span> Tournaments</div>
            <div><span className="text-green-400 font-bold">{topPlayers[currentPlayerIndex]?.winRate}%</span> Win Rate</div>
          </div>
        </div>
      )}

      {/* Live Results */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold flex items-center gap-2"><Play size={18} className="text-green-400" /> Live Results</h3>
          <select
            value={currentTournamentFilter}
            onChange={(e) => setTournamentFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm"
          >
            <option value="all">All Tournaments</option>
            {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        {recentMatches.length === 0 ? (
          <p className="text-slate-500 text-sm">No matches found.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentMatches.slice(0, 5).map((match, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-white">{match.winner_name}</span>
                <span className="text-slate-400">defeated</span>
                <span className="text-slate-300">{match.winner_name === match.player1_name ? match.player2_name : match.player1_name}</span>
                <span className="text-slate-500">{match.outcome?.split(' (')[0] || 'Victory'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
