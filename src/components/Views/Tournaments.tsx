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
  const [tournaments, setTournaments] = useState<any[]>([]);
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
    alert('Registration Complete', `Successfully registered ${playerName} with ${beyblades.length} Beyblades!`);
    setSelectedTournament(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40';
      case 'active': return 'bg-green-500/20 text-green-400 border border-green-500/40';
      case 'completed': return 'bg-purple-500/20 text-purple-400 border border-purple-500/40';
      default: return 'bg-slate-700/40 text-slate-300 border border-slate-600/40';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-16">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-exo2 font-bold uppercase tracking-wide bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Tournaments
        </h1>
        <p className="mt-3 text-slate-400">Join the ultimate Beyblade breakattles</p>
      </div>

      {/* Filters */}
      <div className="mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex space-x-3">
          {['upcoming', 'active', 'completed', 'all'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`px-5 py-2 rounded-md uppercase text-sm font-semibold tracking-wide transition ${
                filter === tab
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-[0_0_15px_rgba(0,200,255,0.5)]'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-2 text-slate-400">
          <input
            type="checkbox"
            id="showPractice"
            checked={showPractice}
            onChange={(e) => setShowPractice(e.target.checked)}
            className="w-4 h-4 text-purple-500 border-slate-600 rounded bg-slate-800 focus:ring-purple-500"
          />
          <label htmlFor="showPractice" className="text-sm">Show Practice Tournaments</label>
        </div>
      </div>

      {/* Tournament Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin h-12 w-12 border-4 border-cyan-500/40 border-t-cyan-400 rounded-full mx-auto mb-6"></div>
          <p className="text-slate-400">Loading tournaments...</p>
        </div>
      ) : filteredTournaments.length === 0 ? (
        <div className="text-center py-20 border border-slate-800 rounded-lg bg-slate-900/60">
          <Trophy className="w-12 h-12 text-slate-500 mx-auto mb-6" />
          <h3 className="text-xl font-bold mb-2">No tournaments found</h3>
          <p className="text-slate-400">Check back later for upcoming events</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTournaments.map((tournament) => (
            <div
              key={tournament.id}
              className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 hover:shadow-[0_0_25px_rgba(0,200,255,0.2)] transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">{tournament.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(tournament.status)}`}>
                      {tournament.status}
                    </span>
                    {tournament.is_practice && (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/40">
                        Practice
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {tournament.description && (
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{tournament.description}</p>
              )}
              
              <div className="space-y-2 mb-4 text-slate-300 text-sm">
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
                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-500"
                    style={{
                      width:
                        tournament.max_participants === 999999
                          ? '100%'
                          : `${Math.min((tournament.current_participants / tournament.max_participants) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {tournament.status === 'upcoming' && (
                <button
                  onClick={() => setSelectedTournament(tournament.id)}
                  disabled={
                    !tournament.registration_open ||
                    (tournament.max_participants !== 999999 && tournament.current_participants >= tournament.max_participants)
                  }
                  className="w-full py-3 rounded-md font-semibold uppercase tracking-wide transition disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:shadow-[0_0_20px_rgba(0,200,255,0.4)]"
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
          tournament={filteredTournaments.find(t => t.id === selectedTournament)!}
          onClose={() => setSelectedTournament(null)}
          onSubmit={handleTournamentRegistration}
        />
      )}
    </div>
  );
}
