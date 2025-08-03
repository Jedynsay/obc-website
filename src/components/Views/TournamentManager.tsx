import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { mockTournaments } from '../../data/mockData';
import type { Tournament } from '../../types';

export function TournamentManager() {
  const [tournaments, setTournaments] = useState(mockTournaments);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Tournament>>({});

  const startCreate = () => {
    setIsCreating(true);
    setFormData({
      name: '',
      description: '',
      date: '',
      location: '',
      maxParticipants: 16,
      status: 'upcoming',
      registrationDeadline: '',
      prizePool: ''
    });
  };

  const startEdit = (tournament: Tournament) => {
    setEditingId(tournament.id);
    setFormData(tournament);
  };

  const saveChanges = () => {
    if (isCreating) {
      const newTournament: Tournament = {
        ...formData as Tournament,
        id: Date.now().toString(),
        currentParticipants: 0
      };
      setTournaments([...tournaments, newTournament]);
      setIsCreating(false);
    } else if (editingId) {
      setTournaments(tournaments.map(t => 
        t.id === editingId ? { ...t, ...formData } : t
      ));
      setEditingId(null);
    }
    setFormData({});
  };

  const cancelEdit = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({});
  };

  const deleteTournament = (id: string) => {
    if (confirm('Are you sure you want to delete this tournament?')) {
      setTournaments(tournaments.filter(t => t.id !== id));
    }
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tournament Manager</h1>
          <p className="text-gray-600">Create and manage tournaments</p>
        </div>
        <button
          onClick={startCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Create Tournament</span>
        </button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {isCreating ? 'Create New Tournament' : 'Edit Tournament'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tournament Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tournament Date</label>
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration Deadline</label>
              <input
                type="date"
                value={formData.registrationDeadline || ''}
                onChange={(e) => setFormData({...formData, registrationDeadline: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
              <input
                type="number"
                value={formData.maxParticipants || ''}
                onChange={(e) => setFormData({...formData, maxParticipants: parseInt(e.target.value)})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prize Pool</label>
              <input
                type="text"
                value={formData.prizePool || ''}
                onChange={(e) => setFormData({...formData, prizePool: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., $500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beyblades per Player</label>
              <input
                type="number"
                min="1"
                max="5"
                value={formData.beybladesPerPlayer || 3}
                onChange={(e) => setFormData({...formData, beybladesPerPlayer: parseInt(e.target.value)})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Players per Team</label>
              <input
                type="number"
                min="1"
                max="4"
                value={formData.playersPerTeam || 1}
                onChange={(e) => setFormData({...formData, playersPerTeam: parseInt(e.target.value)})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {!isCreating && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status || ''}
                  onChange={(e) => setFormData({...formData, status: e.target.value as Tournament['status']})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={cancelEdit}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <X size={16} />
              <span>Cancel</span>
            </button>
            <button
              onClick={saveChanges}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Save size={16} />
              <span>Save</span>
            </button>
          </div>
        </div>
      )}

      {/* Tournaments List */}
      <div className="space-y-4">
        {tournaments.map((tournament) => (
          <div key={tournament.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{tournament.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(tournament.status)}`}>
                    {tournament.status}
                  </span>
                </div>
                <p className="text-gray-600 mb-2">{tournament.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Date:</span> {tournament.date}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> {tournament.location}
                  </div>
                  <div>
                    <span className="font-medium">Participants:</span> {tournament.currentParticipants}/{tournament.maxParticipants}
                  </div>
                  <div>
                    <span className="font-medium">Prize Pool:</span> {tournament.prizePool}
                  </div>
                  <div>
                    <span className="font-medium">Beyblades/Player:</span> {tournament.beybladesPerPlayer}
                  </div>
                  <div>
                    <span className="font-medium">Players/Team:</span> {tournament.playersPerTeam}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => startEdit(tournament)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => deleteTournament(tournament.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Registration Deadline: {tournament.registrationDeadline}</span>
                <span>Tournament ID: {tournament.id}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}