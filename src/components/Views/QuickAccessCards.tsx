import React from 'react';
import { Trophy, TrendingUp, Newspaper, Layers, ArrowRight } from 'lucide-react';

export function QuickAccessCards({ stats, upcomingTournaments, deckPresets, onViewChange }) {
  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      
        {/* Next Tournament */}
        <Card onClick={() => onViewChange?.('tournaments')} icon={<Trophy />} title="Next Tournament" accent="blue">
          {upcomingTournaments.length > 0 ? (
            <>
              <p className="font-semibold">{upcomingTournaments[0].name}</p>
              <p className="text-sm text-slate-400">{new Date(upcomingTournaments[0].tournament_date).toLocaleDateString()}</p>
              <p className="text-sm text-slate-400">{upcomingTournaments[0].location}</p>
            </>
          ) : <p className="text-slate-400">No upcoming tournaments</p>}
        </Card>

        {/* Meta Analysis */}
        <Card onClick={() => onViewChange?.('analytics')} icon={<TrendingUp />} title="Meta Analysis" accent="purple">
          <p className="text-sm text-slate-400">Latest tier rankings</p>
          <span className="flex items-center gap-1 text-purple-400">View Stats <ArrowRight size={14} /></span>
        </Card>

        {/* News */}
        <Card onClick={() => alert('News coming soon!')} icon={<Newspaper />} title="News & Updates" accent="green">
          <p className="text-sm text-slate-400">Stay informed on events</p>
        </Card>

        {/* Deck Presets */}
        <Card onClick={() => onViewChange?.('inventory')} icon={<Layers />} title="Your Decks" accent="orange">
          <p className="text-sm text-slate-400">{deckPresets.length} saved presets</p>
        </Card>
      </div>
    </section>
  );
}

function Card({ onClick, icon, title, children, accent }) {
  const accentColors = {
    blue: 'bg-blue-600',
    purple: 'bg-purple-600',
    green: 'bg-green-600',
    orange: 'bg-orange-600'
  };
  return (
    <button
      onClick={onClick}
      className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-left hover:border-blue-500 transition-all hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1"
    >
      <div className={`w-12 h-12 ${accentColors[accent]} rounded-lg flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <div className="space-y-2">
        <h3 className="font-bold text-lg text-white">{title}</h3>
        <div className="text-slate-400">
          {children}
        </div>
      </div>
    </button>
  );
}