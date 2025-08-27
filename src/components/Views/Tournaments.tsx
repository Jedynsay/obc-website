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

  const searchTournamentByCode = async () => {
    if (!tournamentCode.trim()) {
      setCodeSearchResult(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('tournament_code', tournamentCode.toUpperCase())
        .single();

      if (error) {
        setCodeSearchResult({ error: 'Tournament not found' });
        return;
      }

      setCodeSearchResult(data);
    } catch (error) {
      setCodeSearchResult({ error: 'Tournament not found' });
    }
  };

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

        {/* Tournament Code Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Join with Tournament Code</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Enter 8-character tournament code"
                value={tournamentCode}
                onChange={(e) => setTournamentCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && searchTournamentByCode()}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                maxLength={8}
              />
            </div>
            <button
              onClick={searchTournamentByCode}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search Tournament
            </button>
          </div>
          
          {codeSearchResult && (
            <div className="mt-4">
              {codeSearchResult.error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">{codeSearchResult.error}</p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-green-900">{codeSearchResult.name}</h3>
                      <p className="text-green-700 text-sm">{codeSearchResult.location}</p>
                      <p className="text-green-600 text-sm">
                        {new Date(codeSearchResult.tournament_date).toLocaleDateString()}
                      </p>
                      {codeSearchResult.is_practice && (
                        <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium mt-2">
                          Practice Tournament
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedTournament(codeSearchResult.id)}
                      disabled={!codeSearchResult.registration_open}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {codeSearchResult.registration_open ? 'Register' : 'Registration Closed'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="filter-tabs">
              {['upcoming', 'active', 'completed', 'all'].map((tab) => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredTournaments.map((tournament) => (
              <div key={tournament.id} className="card p-4 hover:shadow-lg transition-all duration-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-space-grotesk font-bold text-gray-900 mb-1">{tournament.name}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`badge capitalize ${getStatusColor(tournament.status)}`}>
                        {tournament.status}
                      </span>
                      {tournament.is_practice && (
                        <span className="badge bg-purple-100 text-purple-800">
                          Practice
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {tournament.description && (
                  <p className="text-gray-600 mb-4 font-inter text-sm line-clamp-2">{tournament.description}</p>
                )}
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-gray-600 font-inter text-sm">
                  <div className="flex items-center text-gray-400 font-inter">
                    <Calendar size={14} className="mr-2" />
                    <span className="text-sm">{new Date(tournament.tournament_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-gray-400 font-inter">
                    <MapPin size={14} className="mr-2" />
                    <span className="text-sm">{tournament.location}</span>
                  </div>
                  <div className="flex items-center text-gray-400 font-inter">
                    <Users size={14} className="mr-2" />
                    <span className="text-sm">
                      {tournament.max_participants === 999999
                        ? `${tournament.current_participants} participants`
                        : `${tournament.current_participants}/${tournament.max_participants}`}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-gray-400 font-inter mb-1 text-sm">
                    <span>Registration</span>
                    <span className="text-xs">
                      {tournament.max_participants === 999999 
                        ? `${tournament.current_participants} registered`
                        : `${Math.round((tournament.current_participants / tournament.max_participants) * 100)}%`
                      }
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: tournament.max_participants === 999999 
                          ? '100%' 
                          : `${Math.min((tournament.current_participants / tournament.max_participants) * 100, 100)}%` 
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
                    className="primary-button w-full disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {!tournament.registration_open 
                      ? 'Registration Closed'
                      : tournament.max_participants !== 999999 && tournament.current_participants >= tournament.max_participants 
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