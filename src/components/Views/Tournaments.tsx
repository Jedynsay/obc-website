import React, { useState } from 'react';
import { Calendar, MapPin, Users, Trophy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useConfirmation } from '../../context/ConfirmationContext';
import { TournamentRegistration } from './TournamentRegistration';

export function Tournaments() {
  const { user } = useAuth();
  const { alert } = useConfirmation();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'active' | 'completed'>('all');
  const [showPractice, setShowPractice] = useState(false);
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
    return statusMatch && practiceMatch;
  });

  const handleTournamentRegistration = (playerName: string, beyblades: any[]) => {
    alert('Registration Complete', `Successfully registered ${playerName} with ${beyblades.length} Beyblades for the tournament!`);
    setSelectedTournament(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
      case 'active': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'completed': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-16">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold uppercase tracking-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Tournaments
            </span>
          </h1>
          <p className="mt-4 text-slate-400 text-lg">Join the ultimate Beyblade battles</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div className="flex space-x-3">
            {['upcoming', 'active', 'completed', 'all'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab as any)}
                className={`px-5 py-2 rounded-full text-sm font-semibold uppercase tracking-wide transition ${
                  filter === tab
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <label className="flex items-center space-x-2 text-slate-400 text-sm">
            <input
              type="checkbox"
              checked={showPractice}
              onChange={(e) => setShowPractice(e.target.checked)}
              className="w-4 h-4 text-purple-500 bg-slate-900 border-slate-700 rounded focus:ring-purple-500"
            />
            <span>Show Practice Tournaments</span>
          </label>
        </div>

        {/* Tournament Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-400 animate-pulse">
            Loading tournaments...
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-12 h-12 mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-300">No tournaments found</h3>
            <p className="text-slate-500">Check back later for upcoming events</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="p-6 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900/70 transition shadow-lg"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">{tournament.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tournament.status)}`}>
                    {tournament.status}
                  </span>
                </div>

                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{tournament.description}</p>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center text-slate-400">
                    <Calendar size={14} className="mr-2 text-cyan-400" />
                    {new Date(tournament.tournament_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-slate-400">
                    <MapPin size={14} className="mr-2 text-purple-400" />
                    {tournament.location}
                  </div>
                  <div className="flex items-center text-slate-400">
                    <Users size={14} className="mr-2 text-pink-400" />
                    {tournament.max_participants === 999999
                      ? `${tournament.current_participants} participants`
                      : `${tournament.current_participants}/${tournament.max_participants}`}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-slate-400 text-xs mb-1">
                    <span>Registration</span>
                    <span>
                      {tournament.max_participants === 999999
                        ? `${tournament.current_participants} registered`
                        : `${Math.round((tournament.current_participants / tournament.max_participants) * 100)}%`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-gradient-to-r from-cyan-500 to-purple-600"
                      style={{
                        width:
                          tournament.max_participants === 999999
                            ? '100%'
                            : `${Math.min(
                                (tournament.current_participants / tournament.max_participants) * 100,
                                100
                              )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {tournament.status === 'upcoming' && (
                  <button
                    onClick={() => setSelectedTournament(tournament.id)}
                    disabled={
                      !tournament.registration_open ||
                      (tournament.max_participants !== 999999 &&
                        tournament.current_participants >= tournament.max_participants)
                    }
                    className="w-full py-2 rounded-md text-sm font-semibold uppercase tracking-wide transition
                      bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {!tournament.registration_open
                      ? 'Registration Closed'
                      : tournament.max_participants !== 999999 &&
                        tournament.current_participants >= tournament.max_participants
                      ? 'Tournament Full'
                      : 'Register'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Registration Modal */}
        {selectedTournament && (
          <TournamentRegistration
            tournament={filteredTournaments.find((t) => t.id === selectedTournament)!}
            onClose={() => setSelectedTournament(null)}
            onSubmit={handleTournamentRegistration}
          />
        )}
      </div>
    </div>
  );
}
