import React, { useState } from 'react';
import { Calendar, MapPin, Users, Trophy, Clock } from 'lucide-react';
import { mockTournaments } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { TournamentRegistration } from './TournamentRegistration';

export function Tournaments() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'active' | 'completed'>('all');
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  
  const filteredTournaments = mockTournaments.filter(tournament => 
    filter === 'all' || tournament.status === filter
  );

  const handleTournamentRegistration = (playerName: string, beyblades: any[]) => {
    console.log('Tournament registration:', { playerName, beyblades });
    alert(`Successfully registered ${playerName} with ${beyblades.length} Beyblades for the tournament!`);
    setSelectedTournament(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tournaments</h1>
        <p className="text-gray-600">Compete in exciting Beyblade tournaments</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {['all', 'upcoming', 'active', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                filter === tab
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tournament Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTournaments.map((tournament) => (
          <div key={tournament.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">{tournament.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(tournament.status)}`}>
                  {tournament.status}
                </span>
              </div>
              
              <p className="text-gray-600 mb-4">{tournament.description}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar size={16} className="mr-2" />
                  {tournament.date}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin size={16} className="mr-2" />
                  {tournament.location}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users size={16} className="mr-2" />
                  {tournament.currentParticipants}/{tournament.maxParticipants} participants
                </div>
                {tournament.prizePool && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Trophy size={16} className="mr-2" />
                    Prize Pool: {tournament.prizePool}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <Clock size={16} className="mr-2" />
                  Registration ends: {tournament.registrationDeadline}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Registration Progress</span>
                  <span>{Math.round((tournament.currentParticipants / tournament.maxParticipants) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(tournament.currentParticipants / tournament.maxParticipants) * 100}%` }}
                  ></div>
                </div>
              </div>

              {tournament.status === 'upcoming' && user?.role === 'user' && (
                <button
                  onClick={() => setSelectedTournament(tournament.id)}
                  disabled={tournament.currentParticipants >= tournament.maxParticipants || user.id.startsWith('guest-')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {tournament.currentParticipants >= tournament.maxParticipants 
                    ? 'Tournament Full' 
                    : user.id.startsWith('guest-') 
                    ? 'Please log in to register' 
                    : 'Register for Tournament'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

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