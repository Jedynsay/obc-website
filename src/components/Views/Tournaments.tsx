import React, { useState } from 'react';
import { Calendar, MapPin, Users, Trophy, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { TournamentRegistration } from './TournamentRegistration';

export function Tournaments() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'active' | 'completed'>('all');
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
  
  const filteredTournaments = tournaments.filter(tournament => 
    filter === 'all' || tournament.status === filter
  );

  const handleTournamentRegistration = (playerName: string, beyblades: any[]) => {
    console.log('Tournament registration:', { playerName, beyblades });
    alert(`Successfully registered ${playerName} with ${beyblades.length} Beyblades for the tournament!`);
    setSelectedTournament(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'tournament-status-upcoming';
      case 'active': return 'tournament-status-active';
      case 'completed': return 'tournament-status-completed';
      default: return 'tournament-status-completed';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Tournaments</h1>
        <p className="page-subtitle">Join the ultimate Beyblade battles!</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-10">
        <nav className="flex space-x-2 bg-slate-800/60 rounded-2xl p-2 backdrop-blur-md border border-slate-600/30">
          {['all', 'upcoming', 'active', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`px-6 py-3 rounded-xl font-rajdhani font-bold capitalize transition-all duration-300 ${
                filter === tab
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-glow scale-105'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tournament Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-300 font-rajdhani text-lg">Loading tournaments...</p>
        </div>
      ) : filteredTournaments.length === 0 ? (
        <div className="text-center py-20">
          <Trophy size={64} className="mx-auto text-slate-400 mb-6" />
          <p className="text-slate-300 font-orbitron font-bold text-xl">No tournaments found</p>
          <p className="text-slate-400 font-rajdhani text-lg mt-3">Check back later for upcoming events</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTournaments.map((tournament) => (
            <div key={tournament.id} className="beyblade-card hover:scale-105 transition-all duration-500">
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-orbitron font-bold text-white">{tournament.name}</h3>
                  <span className={`px-3 py-2 rounded-full text-sm font-bold capitalize ${getStatusColor(tournament.status)}`}>
                    {tournament.status}
                  </span>
                </div>
                
                <p className="text-slate-300 mb-6 font-rajdhani text-lg">{tournament.description}</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-slate-300 font-rajdhani font-medium">
                    <Calendar size={16} className="mr-2" />
                    {new Date(tournament.tournament_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-slate-300 font-rajdhani font-medium">
                    <MapPin size={16} className="mr-2" />
                    {tournament.location}
                  </div>
                  <div className="flex items-center text-slate-300 font-rajdhani font-medium">
                    <Users size={16} className="mr-2" />
                    {tournament.current_participants}/{tournament.max_participants} participants
                  </div>
                  {tournament.prize_pool && (
                    <div className="flex items-center text-slate-300 font-rajdhani font-medium">
                      <Trophy size={16} className="mr-2" />
                      Prize Pool: {tournament.prize_pool}
                    </div>
                  )}
                  <div className="flex items-center text-slate-300 font-rajdhani font-medium">
                    <Clock size={16} className="mr-2" />
                    Registration ends: {new Date(tournament.registration_deadline).toLocaleDateString()}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-slate-300 font-rajdhani font-medium mb-2">
                    <span>Registration Progress</span>
                    <span>{Math.round((tournament.current_participants / tournament.max_participants) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 shadow-glow"
                      style={{ width: `${(tournament.current_participants / tournament.max_participants) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {tournament.status === 'upcoming' && (
                  <button
                    onClick={() => setSelectedTournament(tournament.id)}
                    disabled={tournament.current_participants >= tournament.max_participants}
                    className="w-full beyblade-button disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0"
                  >
                    {tournament.current_participants >= tournament.max_participants 
                      ? 'Tournament Full' 
                      : 'Register for Tournament'}
                  </button>
                )}
              </div>
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