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
  const [tournamentCode, setTournamentCode] = useState('');
  const [codeSearchResult, setCodeSearchResult] = useState<any>(null);
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
    console.log('Tournament registration:', { playerName, beyblades });
    alert('Registration Complete', `Successfully registered ${playerName} with ${beyblades.length} Beyblades for the tournament!`);
    setSelectedTournament(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'text-cyan-400 border-cyan-400/40';
      case 'active': return 'text-green-400 border-green-400/40';
      case 'completed': return 'text-purple-400 border-purple-400/40';
      default: return 'text-slate-400 border-slate-600';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Header (kept original style) */}
        <div className="page-header mb-12">
          <h1 className="page-title">Tournaments</h1>
          <p className="page-subtitle">Join the ultimate Beyblade breakattles</p>
        </div>

        {/* Filters */}
        <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex space-x-3">
            {['upcoming', 'active', 'completed', 'all'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab as any)}
                className={`px-5 py-2 text-sm font-semibold uppercase tracking-wide rounded-md border transition
                  ${filter === tab 
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-[0_0_15px_rgba(0,200,255,0.5)]' 
                    : 'border-slate-700 text-slate-400 hover:text-white hover:border-cyan-400/50'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <label className="flex items-center space-x-2 text-sm text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showPractice}
              onChange={(e) => setShowPractice(e.target.checked)}
              className="w-4 h-4 text-purple-500 border-slate-700 rounded focus:ring-purple-500"
            />
            <span>Show Practice Tournaments</span>
          </label>
        </div>

        {/* Tournament Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="animate-spin h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full mb-4"></div>
            <p>Loading tournaments...</p>
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-slate-500" />
            <h3 className="text-xl font-bold mb-2">No tournaments found</h3>
            <p className="text-slate-400">Check back later for upcoming events</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="relative bg-slate-900/70 border border-slate-800 rounded-lg p-6 hover:shadow-[0_0_25px_rgba(0,200,255,0.2)] transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">{tournament.name}</h3>
                  <span
                    className={`px-3 py-1 rounded-full border text-xs font-semibold uppercase ${getStatusColor(
                      tournament.status
                    )}`}
                  >
                    {tournament.status}
                  </span>
                </div>

                {tournament.description && (
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">{tournament.description}</p>
                )}

                <div className="space-y-2 text-sm text-slate-300 mb-6">
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-2 text-cyan-400" />
                    {new Date(tournament.tournament_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <MapPin size={14} className="mr-2 text-purple-400" />
                    {tournament.location}
                  </div>
                  <div className="flex items-center">
                    <Users size={14} className="mr-2 text-pink-400" />
                    {tournament.max_participants === 999999
                      ? `${tournament.current_participants} participants`
                      : `${tournament.current_participants}/${tournament.max_participants}`}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Registration</span>
                    <span>
                      {tournament.max_participants === 999999
                        ? `${tournament.current_participants} registered`
                        : `${Math.round((tournament.current_participants / tournament.max_participants) * 100)}%`}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-purple-500"
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
                      (tournament.max_participants !== 999999 && tournament.current_participants >= tournament.max_participants)
                    }
                    className="w-full py-2 px-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-md font-semibold text-sm uppercase tracking-wide hover:shadow-[0_0_20px_rgba(0,200,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {!tournament.registration_open
                      ? 'Registration Closed'
                      : tournament.max_participants !== 999999 && tournament.current_participants >= tournament.max_participants
                      ? 'Tournament Full'
                      : 'Register'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tournament Registration Modal */}
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
