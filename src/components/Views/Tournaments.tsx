import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Trophy, Zap } from 'lucide-react';
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

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const { data, error } = await supabase
          .from('tournaments')
          .select('*')
          .order('tournament_date', { ascending: true });
        if (error) throw error;
        setTournaments(data || []);
      } catch (err) {
        console.error('Error fetching tournaments:', err);
        setTournaments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
  }, []);

  const filteredTournaments = tournaments.filter((t) => {
    const statusMatch = filter === 'all' || t.status === filter;
    const practiceMatch = showPractice || !t.is_practice;
    return statusMatch && practiceMatch;
  });

  const handleTournamentRegistration = (playerName: string, beyblades: any[]) => {
    alert(
      'Registration Complete',
      `Successfully registered ${playerName} with ${beyblades.length} Beyblades!`
    );
    setSelectedTournament(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="mb-8 text-left">
          <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Tournament Arena
            </span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base mt-2">
            Join the ultimate battles and prove your worth
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-10">
          {['upcoming', 'active', 'completed', 'all'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`px-6 py-3 rounded-2xl font-semibold text-sm shadow-lg transition-all duration-300 flex-1 sm:flex-none text-center 
                ${
                  filter === tab
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-[0_0_20px_rgba(0,200,255,0.4)]'
                    : 'bg-slate-900/60 border border-cyan-500/20 text-slate-300 hover:text-cyan-400 hover:shadow-[0_0_15px_rgba(0,200,255,0.3)]'
                }`
            }
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
          <button
            onClick={() => setShowPractice(!showPractice)}
            className={`px-6 py-3 rounded-2xl font-semibold text-sm shadow-lg transition-all duration-300 flex-1 sm:flex-none text-center 
              ${
                showPractice
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-[0_0_20px_rgba(0,200,255,0.4)]'
                  : 'bg-slate-900/60 border border-cyan-500/20 text-slate-300 hover:text-cyan-400 hover:shadow-[0_0_15px_rgba(0,200,255,0.3)]'
              }`
          }
          >
            Practice
          </button>
        </div>

        {/* Tournament Cards */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-slate-400">Loading tournaments...</p>
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-800/50 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Trophy size={32} className="text-slate-500" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">No tournaments found</h3>
            <p className="text-slate-400">Check back later for new events</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="bg-slate-900/70 border border-cyan-500/30 rounded-xl p-6 backdrop-blur-sm hover:shadow-[0_0_25px_rgba(0,200,255,0.3)] transition-all duration-300"
              >
                {/* Title + Status */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold group-hover:text-cyan-400 transition-colors">
                    {tournament.name}
                  </h3>
                  <div className="flex gap-2">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize 
                        ${tournament.status === 'upcoming'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : tournament.status === 'active'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'}`}
                    >
                      {tournament.status}
                    </span>
                    {tournament.is_practice && (
                      <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        Practice
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 text-sm text-slate-300 mb-4">
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-2 text-cyan-400" />
                    {new Date(tournament.tournament_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <MapPin size={14} className="mr-2 text-cyan-400" />
                    {tournament.location}
                  </div>
                  <div className="flex items-center">
                    <Users size={14} className="mr-2 text-cyan-400" />
                    {tournament.max_participants === 999999
                      ? `${tournament.current_participants} participants`
                      : `${tournament.current_participants}/${tournament.max_participants}`}
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Registration</span>
                    <span>
                      {tournament.max_participants === 999999
                        ? `${tournament.current_participants} registered`
                        : `${Math.round(
                            (tournament.current_participants / tournament.max_participants) * 100
                          )}%`}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-lg h-2">
                    <div
                      className="h-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500"
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

                {/* Register */}
                {tournament.status === 'upcoming' && (
                  <button
                    onClick={() => setSelectedTournament(tournament.id)}
                    disabled={
                      !tournament.registration_open ||
                      (tournament.max_participants !== 999999 &&
                        tournament.current_participants >= tournament.max_participants)
                    }
                    className="w-full px-6 py-3 rounded-2xl font-semibold text-sm shadow-lg transition-all duration-300 flex items-center justify-center gap-2
                      bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-400 hover:to-purple-500 
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    <Zap size={16} />
                    {!tournament.registration_open
                      ? 'Registration Closed'
                      : tournament.max_participants !== 999999 &&
                        tournament.current_participants >= tournament.max_participants
                      ? 'Tournament Full'
                      : 'Register Now'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
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
