import React, { useState } from 'react';
import { Play, Pause, CheckCircle, Clock, Trophy, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function MatchTracker() {
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('1');
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [tournamentsRes, matchesRes] = await Promise.all([
          supabase.from('tournaments').select('*').order('tournament_date', { ascending: false }),
          supabase.from('matches').select('*').order('created_at', { ascending: false })
        ]);

        setTournaments(tournamentsRes.data || []);
        setMatches(matchesRes.data || []);
        
        if (tournamentsRes.data && tournamentsRes.data.length > 0) {
          setSelectedTournament(tournamentsRes.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredMatches = matches.filter(match => match.tournamentId === selectedTournament);
  const tournament = tournaments.find(t => t.id === selectedTournament);

  const updateMatchStatus = async (matchId: string, status: 'pending' | 'in_progress' | 'completed', winner?: string) => {
    try {
      const updateData = {
        status,
        winner_name: winner,
        start_time: status === 'in_progress' ? new Date().toISOString() : undefined,
        end_time: status === 'completed' ? new Date().toISOString() : undefined
      };

      const { error } = await supabase
        .from('matches')
        .update(updateData)
        .eq('id', matchId);

      if (error) throw error;

      setMatches(prev => prev.map(match => 
        match.id === matchId 
          ? { 
              ...match, 
              status, 
              winner_name: winner,
              start_time: status === 'in_progress' ? new Date().toISOString() : match.start_time,
              end_time: status === 'completed' ? new Date().toISOString() : match.end_time
            }
          : match
      ));
    } catch (error) {
      console.error('Error updating match:', error);
      alert('Failed to update match status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'in_progress': return <Play size={16} />;
      case 'completed': return <CheckCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Match Tracker</h1>
        <p className="text-gray-600">Track and manage tournament matches in real-time</p>
      </div>

      {/* Tournament Selection */}
      <div className="mb-6">
        <label htmlFor="tournament-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Tournament
        </label>
        <select
          id="tournament-select"
          value={selectedTournament}
          onChange={(e) => setSelectedTournament(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {tournaments.map(tournament => (
            <option key={tournament.id} value={tournament.id}>
              {tournament.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tournament Info */}
      {tournament && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{tournament.name}</h2>
              <p className="text-gray-600">{tournament.description}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{tournament.current_participants}</div>
                  <p className="text-sm text-gray-600">Participants</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{filteredMatches.filter(m => m.status === 'completed').length}</div>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Matches List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading matches...</p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-12">
          <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No matches found for this tournament</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((match) => (
            <div key={match.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(match.status)}`}>
                    {getStatusIcon(match.status)}
                    <span className="capitalize">{match.status.replace('_', ' ')}</span>
                  </span>
                  <span className="text-lg font-semibold text-gray-700">{match.round_name}</span>
                </div>
                <div className="text-sm text-gray-500">
                  Match ID: {match.id}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Player 1 */}
                <div className="text-center">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <Users className="mx-auto mb-2 text-blue-600" size={24} />
                    <h3 className="font-bold text-lg text-gray-900">{match.player1_name}</h3>
                    {match.winner_name === match.player1_name && (
                      <Trophy className="mx-auto mt-2 text-yellow-500" size={20} />
                    )}
                  </div>
                </div>

                {/* VS / Score */}
                <div className="text-center flex flex-col justify-center">
                  <div className="text-2xl font-bold text-gray-400 mb-2">VS</div>
                  {match.score && (
                    <div className="text-lg font-semibold text-gray-700">{match.score}</div>
                  )}
                  {match.status === 'completed' && match.winner_name && (
                    <div className="text-sm text-green-600 mt-2">
                      Winner: {match.winner_name}
                    </div>
                  )}
                </div>

                {/* Player 2 */}
                <div className="text-center">
                  <div className="bg-red-50 rounded-lg p-4">
                    <Users className="mx-auto mb-2 text-red-600" size={24} />
                    <h3 className="font-bold text-lg text-gray-900">{match.player2_name}</h3>
                    {match.winner_name === match.player2_name && (
                      <Trophy className="mx-auto mt-2 text-yellow-500" size={20} />
                    )}
                  </div>
                </div>
              </div>

              {/* Match Controls */}
              <div className="mt-6 flex justify-center space-x-3">
                {match.status === 'pending' && (
                  <button
                    onClick={() => updateMatchStatus(match.id, 'in_progress')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Play size={16} />
                    <span>Start Match</span>
                  </button>
                )}
                
                {match.status === 'in_progress' && (
                  <>
                    <button
                      onClick={() => updateMatchStatus(match.id, 'completed', match.player1_name)}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                      {match.player1_name} Wins
                    </button>
                    <button
                      onClick={() => updateMatchStatus(match.id, 'completed', match.player2_name)}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                      {match.player2_name} Wins
                    </button>
                    <button
                      onClick={() => updateMatchStatus(match.id, 'pending')}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center space-x-2"
                    >
                      <Pause size={16} />
                      <span>Pause</span>
                    </button>
                  </>
                )}

                {match.status === 'completed' && (
                  <button
                    onClick={() => updateMatchStatus(match.id, 'pending')}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Reset Match
                  </button>
                )}
              </div>

              {/* Match Timing */}
              {(match.start_time || match.end_time) && (
                <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                  {match.start_time && (
                    <div>Started: {new Date(match.start_time).toLocaleString()}</div>
                  )}
                  {match.end_time && (
                    <div>Ended: {new Date(match.end_time).toLocaleString()}</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}