import React, { useState } from 'react';
import { Calendar, MapPin, Users, Trophy, Zap, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useConfirmation } from '../../context/ConfirmationContext';
import { TournamentRegistration } from './TournamentRegistration';

export function Tournaments() {
  const { user } = useAuth();
  const { alert } = useConfirmation();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'active' | 'completed'>('all');
  const [showPractice, setShowPractice] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const { data, error } = await supabase
          .from('tournaments')
          .select('*')
          .order('tournament_date', { ascending: true });

        if (error) throw error;
        setTournaments(data || []);
      } catch (error) {
        console.error('Error fetching tournaments:', error);
        setTournaments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  const filteredTournaments = tournaments.filter(tournament => {
    const statusMatch = filter === 'all' || tournament.status === filter;
    const practiceMatch = showPractice || !tournament.is_practice;
    const searchMatch =
      tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tournament.location.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && practiceMatch && searchMatch;
  });

  const handleTournamentRegistration = (playerName: string, beyblades: any[]) => {
    alert('Registration Complete', `Successfully registered ${playerName} with ${beyblades.length} Beyblades for the tournament!`);
    setSelectedTournament(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center mb-4">
            <Trophy size={40} className="mr-4 text-cyan-400" />
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Tournament Arena
            </span>
          </h1>
          <p className="text-slate-400 text-lg">Join the ultimate Beyblade battles and prove your worth</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-700 pb-2 mb-8">
          {/* Tabs */}
          <div className="flex space-x-6">
            {['upcoming', 'active', 'completed', 'all'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab as any)}
                className={`relative pb-2 text-sm font-medium capitalize transition-colors group ${
                  filter === tab ? 'text-cyan-400' : 'text-slate-400 hover:text-cyan-300'
                }`}
              >
                {tab}
                <span
                  className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-500
                  ${filter === tab ? 'w-full' : 'w-0 group-hover:w-full'}`}
                />
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tournaments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2 py-2 bg-transparent border-b border-slate-700 text-sm focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* Toggle */}
          <label className="flex items-center cursor-pointer space-x-2">
            <input
              type="checkbox"
              checked={showPractice}
              onChange={() => setShowPractice(!showPractice)}
              className="sr-only"
            />
            <div className="relative w-10 h-5 bg-slate-700">
              <div
                className={`absolute top-0.5 left-0.5 h-4 w-4 bg-white transform transition-transform duration-300 ${
                  showPractice ? 'translate-x-5 bg-cyan-400' : ''
                }`}
              />
            </div>
            <span className="text-sm text-slate-300">Show Practice</span>
          </label>
        </div>

        {/* Tournament Grid */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading tournaments...</div>
        ) : filteredTournaments.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No tournaments found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="border border-slate-700 bg-slate-900/40 p-6 rounded-none transition hover:border-cyan-500/50"
              >
                <h3 className="text-lg font-bold mb-2">{tournament.name}</h3>
                <div className="text-slate-400 text-sm mb-2">{tournament.location}</div>
                <div className="text-slate-400 text-sm mb-2">{new Date(tournament.tournament_date).toLocaleDateString()}</div>

                {tournament.status === 'upcoming' && (
                  <button
                    onClick={() => setSelectedTournament(tournament.id)}
                    className="relative mt-4 pb-1 text-cyan-400 text-sm font-medium group"
                  >
                    Register
                    <span className="absolute left-0 bottom-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 w-0 group-hover:w-full transition-all duration-500" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedTournament && (
          <TournamentRegistration
            tournament={filteredTournaments.find(t => t.id === selectedTournament)!}
            onClose={() => setSelectedTournament(null)}
            onSubmit={handleTournamentRegistration}
          />
        )}
      </div>
    </div>
  );
}
