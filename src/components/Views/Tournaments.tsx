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

        {/* Controls: Tabs + Search + Toggle */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 backdrop-blur-sm mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Tabs */}
          <div className="flex space-x-6 border-b border-slate-800 w-full sm:w-auto">
            {['upcoming', 'active', 'completed', 'all'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab as any)}
                className={`relative pb-2 text-sm font-medium capitalize transition-colors group ${
                  filter === tab
                    ? 'text-cyan-400'
                    : 'text-slate-400 hover:text-cyan-300'
                }`}
              >
                {tab}
                <span
                  className={`absolute left-0 bottom-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-500 ${
                    filter === tab ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                ></span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center bg-slate-900 border-b border-slate-700 px-3 py-2 w-full sm:w-64">
            <Search size={16} className="text-slate-400 mr-2" />
            <input
              type="text"
              placeholder="Search tournaments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent flex-1 text-sm focus:outline-none placeholder-slate-500"
            />
          </div>

          {/* Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPractice(!showPractice)}
              className={`relative w-12 h-6 flex items-center rounded-full transition-colors duration-300 ${
                showPractice ? 'bg-cyan-500/80' : 'bg-slate-700'
              }`}
            >
              <span
                className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300 ${
                  showPractice ? 'translate-x-6 bg-cyan-400' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-slate-300">Show Practice</span>
          </div>
        </div>

        {/* Tournament Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-lg animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Loading tournaments...</p>
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-800/50 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Trophy size={32} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No tournaments found</h3>
            <p className="text-slate-400">Check back later for upcoming events</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="bg-slate-900/60 border border-slate-800 p-6 rounded-lg backdrop-blur-sm transition-all duration-300 group hover:shadow-[0_0_25px_rgba(0,200,255,0.4)] relative"
              >
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-500 group-hover:w-full"></div>

                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                      {tournament.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-medium capitalize ${
                          tournament.status === 'upcoming'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : tournament.status === 'active'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                        }`}
                      >
                        {tournament.status}
                      </span>
                      {tournament.is_practice && (
                        <span className="px-3 py-1 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
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
                        : `${Math.round((tournament.current_participants / tournament.max_participants) * 100)}%`}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-lg h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
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
                    className="w-full relative overflow-hidden text-white font-medium px-6 py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group/button"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-600 opacity-80 group-hover/button:opacity-100 transition-opacity"></span>
                    <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.3),transparent_40%)] opacity-0 group-hover/button:opacity-100 transition-opacity"></span>
                    <span className="relative flex items-center justify-center space-x-2">
                      <Zap size={16} />
                      <span>
                        {!tournament.registration_open
                          ? 'Registration Closed'
                          : tournament.max_participants !== 999999 &&
                            tournament.current_participants >= tournament.max_participants
                          ? 'Tournament Full'
                          : 'Register for Tournament'}
                      </span>
                    </span>
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
