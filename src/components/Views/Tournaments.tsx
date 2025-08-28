import React, { useState } from 'react';
import { Calendar, MapPin, Users, Trophy, Clock, Zap } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center mb-4">
            <Trophy size={40} className="mr-4 text-cyan-400" />
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Tournament Arena
            </span>
          </h1>
          <p className="text-slate-400 text-lg">Join the ultimate Beyblade battles and prove your worth</p>
        </div>

        {/* Tournament Code Search */}
        {/* <div className="bg-white rounded-none shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Join with Tournament Code</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Enter 8-character tournament code"
                value={tournamentCode}
                onChange={(e) => setTournamentCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && searchTournamentByCode()}
                className="w-full border border-gray-300 rounded-none px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                maxLength={8}
              />
            </div>
            <button
              onClick={searchTournamentByCode}
              className="bg-blue-600 text-white px-6 py-2 rounded-none hover:bg-blue-700 transition-colors"
            >
              Search Tournament
            </button>
          </div>
          
          {codeSearchResult && (
            <div className="mt-4">
              {codeSearchResult.error ? (
                <div className="bg-red-50 border border-red-200 rounded-none p-4">
                  <p className="text-red-700">{codeSearchResult.error}</p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-none p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-green-900">{codeSearchResult.name}</h3>
                      <p className="text-green-700 text-sm">{codeSearchResult.location}</p>
                      <p className="text-green-600 text-sm">
                        {new Date(codeSearchResult.tournament_date).toLocaleDateString()}
                      </p>
                      {codeSearchResult.is_practice && (
                        <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded-none text-xs font-medium mt-2">
                          Practice Tournament
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedTournament(codeSearchResult.id)}
                      disabled={!codeSearchResult.registration_open}
                      className="bg-green-600 text-white px-4 py-2 rounded-none hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {codeSearchResult.registration_open ? 'Register' : 'Registration Closed'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
 */}
        {/* Filter Tabs */}
        <div className="bg-slate-900/50 border border-cyan-500/30 rounded-none p-6 backdrop-blur-sm mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-1 bg-slate-800/50 border border-cyan-500/20 rounded-none p-1">
              {['upcoming', 'active', 'completed', 'all'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab as any)}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 capitalize ${
                    filter === tab 
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,200,255,0.3)]' 
                      : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showPractice"
                checked={showPractice}
                onChange={(e) => setShowPractice(e.target.checked)}
                className="w-4 h-4 text-cyan-600 border-cyan-500/30 rounded focus:ring-cyan-500 bg-slate-800"
              />
              <label htmlFor="showPractice" className="text-sm font-medium text-slate-300">
                Show Practice Tournaments
              </label>
            </div>
          </div>
        </div>

        {/* Tournament Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-none animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Loading tournaments...</p>
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-800/50 rounded-none flex items-center justify-center mx-auto mb-4">
              <Trophy size={32} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No tournaments found</h3>
            <p className="text-slate-400">Check back later for upcoming events</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament) => (
              <div key={tournament.id} className="bg-slate-900/50 border border-cyan-500/30 rounded-none p-6 backdrop-blur-sm hover:shadow-[0_0_30px_rgba(0,200,255,0.2)] transition-all duration-300 group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">{tournament.name}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-none text-xs font-medium capitalize ${
                        tournament.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        tournament.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                      }`}>
                        {tournament.status}
                      </span>
                      {tournament.is_practice && (
                        <span className="px-3 py-1 rounded-none text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          Practice
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {tournament.description && (
                  <p className="text-slate-300 mb-4 text-sm line-clamp-2">{tournament.description}</p>
                )}
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-slate-300">
                    <Calendar size={14} className="mr-2 text-cyan-400" />
                    <span className="text-sm">{new Date(tournament.tournament_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-slate-300">
                    <MapPin size={14} className="mr-2 text-cyan-400" />
                    <span className="text-sm">{tournament.location}</span>
                  </div>
                  <div className="flex items-center text-slate-300">
                    <Users size={14} className="mr-2 text-cyan-400" />
                    <span className="text-sm">
                      {tournament.max_participants === 999999
                        ? `${tournament.current_participants} participants`
                        : `${tournament.current_participants}/${tournament.max_participants}`}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-slate-400 mb-1 text-sm">
                    <span>Registration</span>
                    <span className="text-xs">
                      {tournament.max_participants === 999999 
                        ? `${tournament.current_participants} registered`
                        : `${Math.round((tournament.current_participants / tournament.max_participants) * 100)}%`
                      }
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-none h-2">
                    <div 
                      className="h-2 rounded-none bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
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
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium px-6 py-3 rounded-none hover:from-cyan-400 hover:to-purple-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,200,255,0.3)] group-hover:shadow-[0_0_30px_rgba(0,200,255,0.5)]"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Zap size={16} />
                      <span>
                    {!tournament.registration_open 
                      ? 'Registration Closed'
                      : tournament.max_participants !== 999999 && tournament.current_participants >= tournament.max_participants 
                      ? 'Tournament Full' 
                      : 'Register for Tournament'}
                      </span>
                    </div>
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