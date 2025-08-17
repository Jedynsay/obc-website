import React, { useState } from 'react';
import { Calendar, MapPin, Users, Trophy, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useConfirmation } from '../../context/ConfirmationContext';
import { TournamentRegistration } from './TournamentRegistration';

export function Tournaments() {
  const { user } = useAuth();
  const { alert } = useConfirmation();
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
    alert('Registration Complete', `Successfully registered ${playerName} with ${beyblades.length} Beyblades for the tournament!`);
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
      <div className="content-wrapper">
        <div className="page-header">
          <h1 className="page-title">Tournaments</h1>
          <p className="page-subtitle">Join the ultimate Beyblade battles</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8">
          <div className="filter-tabs">
            {['all', 'upcoming', 'active', 'completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab as any)}
                className={`filter-tab capitalize ${
                  filter === tab ? 'filter-tab-active' : 'filter-tab-inactive'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tournament Grid */}
        {loading ? (
          <div className="empty-state">
            <div className="loading-spinner h-12 w-12 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tournaments...</p>
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="empty-state">
            <Trophy className="empty-icon" />
            <h3 className="empty-title">No tournaments found</h3>
            <p className="empty-description">Check back later for upcoming events</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament) => (
              <div key={tournament.id} className="card p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-space-grotesk font-bold text-gray-900">{tournament.name}</h3>
                  <span className={`badge capitalize ${getStatusColor(tournament.status)}`}>
                    {tournament.status}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-6 font-inter">{tournament.description}</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-gray-600 font-inter">
                    <Calendar size={16} className="mr-2" />
                    {new Date(tournament.tournament_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-gray-600 font-inter">
                    <MapPin size={16} className="mr-2" />
                    {tournament.location}
                  </div>
                  <div className="flex items-center text-gray-600 font-inter">
                    <Users size={16} className="mr-2" />
                    {tournament.max_participants === 999999
                      ? `${tournament.current_participants} participants`
                      : `${tournament.current_participants}/${tournament.max_participants} participants`}
                  </div>
                  {tournament.prize_pool && (
                    <div className="flex items-center text-gray-600 font-inter">
                      <Trophy size={16} className="mr-2" />
                      Prize Pool: {tournament.prize_pool}
                    </div>
                  )}
                  <div className="flex items-center text-gray-600 font-inter">
                    <Clock size={16} className="mr-2" />
                    Registration ends: {new Date(tournament.registration_deadline).toLocaleDateString()}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-gray-600 font-inter mb-2">
                    <span>Registration Progress</span>
                    <span>{Math.round((tournament.current_participants / tournament.max_participants) * 100)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${(tournament.current_participants / tournament.max_participants) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {tournament.status === 'upcoming' && (
                  <button
                    onClick={() => setSelectedTournament(tournament.id)}
                    disabled={tournament.current_participants >= tournament.max_participants}
                    className="primary-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {tournament.current_participants >= tournament.max_participants 
                      ? 'Tournament Full' 
                      : 'Register for Tournament'}
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
    </div>
  );
}