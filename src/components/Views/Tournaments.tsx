import React, { useState } from 'react';
import { Calendar, MapPin, Users, Trophy, Search } from 'lucide-react';
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
          <div className="flex items-center space-x-6">
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

          {/* Search & Practice Toggle */}
          <div className="flex items-center gap-6">
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

            {/* Practice Toggle (bottom-right) */}
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
              <span className="text-sm text-slate-300">Practice</span>
            </label>
          </div>
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
            className="group relative border border-slate-700 bg-slate-900/40 p-6 rounded-none 
                       transition-all duration-300 hover:border-cyan-400/70 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]"
          >
            {/* Animated bottom underline */}
            <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 w-0 transition-all duration-500 group-hover:w-full" />
          
            {/* Title + Status + Practice in the same row */}
            <div className="flex justify-between items-start gap-2">
              <h3 className="text-xl font-bold leading-tight break-words max-w-[65%]">
                {tournament.name}
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`px-2 py-0.5 text-xs font-semibold rounded-sm
                    ${tournament.status === 'active'
                      ? 'text-green-400 bg-green-400/10'
                      : tournament.status === 'completed'
                      ? 'text-purple-400 bg-purple-400/10'
                      : 'text-cyan-400 bg-cyan-400/10'
                    }`}
                >
                  {tournament.status.toUpperCase()}
                </span>
          
                {tournament.is_practice && (
                  <span className="px-2 py-0.5 text-xs font-semibold text-yellow-400 bg-yellow-400/10 rounded-sm">
                    Practice
                  </span>
                )}
              </div>
            </div>
          
            {/* Description */}
            <p className="text-slate-400 text-sm mb-3 mt-2">{tournament.description}</p>
          
            {/* Details */}
            <div className="flex items-center text-slate-400 text-sm mb-2">
              <Calendar size={14} className="mr-2 text-cyan-400" />
              {new Date(tournament.tournament_date).toLocaleDateString()}
            </div>
            <div className="flex items-center text-slate-400 text-sm mb-2">
              <MapPin size={14} className="mr-2 text-cyan-400" />
              {tournament.location}
            </div>
            <div className="flex items-center text-slate-400 text-sm mb-4">
              <Users size={14} className="mr-2 text-cyan-400" />
              {tournament.max_participants === 999999 ? (
                <>{tournament.participants?.length || 0} players</>
              ) : (
                <>{tournament.participants?.length || 0} / {tournament.max_participants} players</>
              )}
            </div>
          
            {/* Progress Bar */}
            {tournament.max_participants !== 999999 && (
              <div className="w-full h-2 bg-slate-800 mb-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-700"
                  style={{
                    width: `${
                      ((tournament.participants?.length || 0) / tournament.max_participants) * 100
                    }%`,
                  }}
                />
              </div>
            )}
          
            {/* Register / Closed Button */}
            <div className="mt-4">
              {tournament.status === 'upcoming' ? (
                <button
                  onClick={() => setSelectedTournament(tournament.id)}
                  className="w-full relative px-4 py-2 text-sm font-semibold text-white 
                             bg-gradient-to-r from-cyan-500 to-purple-500 overflow-hidden 
                             transition-all duration-300 group-hover:shadow-[0_0_12px_rgba(34,211,238,0.6)]"
                >
                  <span className="relative z-10">Register</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent 
                                   translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </button>
              ) : (
                <button
                  disabled
                  className="w-full px-4 py-2 text-sm font-semibold text-slate-500 bg-slate-800 cursor-not-allowed"
                >
                  Registration Closed
                </button>
              )}
            </div>
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
