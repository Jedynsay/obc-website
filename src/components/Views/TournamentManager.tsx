import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Calendar, MapPin, Users, Trophy, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useConfirmation } from '../../context/ConfirmationContext';

interface Tournament {
  id: string;
  name: string;
  description?: string;
  tournament_date: string;
  location: string;
  max_participants: number;
  current_participants: number;
  status: 'upcoming' | 'active' | 'completed';
  registration_deadline: string;
  prize_pool?: string;
  beyblades_per_player: number;
  players_per_team: number;
  entry_fee: number;
  is_free: boolean;
  tournament_type: 'ranked' | 'casual';
  registration_open: boolean;
  is_practice: boolean;
  password?: string;
  created_at: string;
}

interface Registration {
  id: string;
  tournament_id: string;
  player_name: string;
  payment_mode: string;
  registered_at: string;
  status: string;
  payment_status: string;
  beyblades: Array<{
    beyblade_id: string;
    beyblade_name: string;
    blade_line: string;
  }>;
}

export function TournamentManager() {
  const { user } = useAuth();
  const { confirm, alert } = useConfirmation();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [currentView, setCurrentView] = useState<'tournaments' | 'registrations'>('tournaments');
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tournament_date: '',
    location: '',
    max_participants: 16,
    registration_deadline: '',
    prize_pool: '',
    beyblades_per_player: 3,
    players_per_team: 1,
    entry_fee: 0,
    is_free: true,
    tournament_type: 'casual' as 'ranked' | 'casual',
    is_practice: false,         // ✅ default value
    registration_open: true,    // ✅ default value
    password: ''
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'developer';

  useEffect(() => {
    if (isAdmin) {
      fetchTournaments();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedTournament && currentView === 'registrations') {
      fetchRegistrations();
    }
  }, [selectedTournament, currentView]);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('tournament_date', { ascending: false });

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    if (!selectedTournament) return;

    try {
      const { data, error } = await supabase
        .from('tournament_registration_details')
        .select('*')
        .eq('tournament_id', selectedTournament)
        .order('registered_at', { ascending: false });

      if (error) throw error;

      // Group by registration_id
      const groupedData: { [key: string]: Registration } = {};
      
      data?.forEach((row: any) => {
        if (!groupedData[row.registration_id]) {
          groupedData[row.registration_id] = {
            id: row.registration_id,
            tournament_id: row.tournament_id,
            player_name: row.player_name,
            payment_mode: row.payment_mode,
            registered_at: row.registered_at,
            status: row.status,
            payment_status: row.payment_status || 'confirmed',
            beyblades: []
          };
        }

        if (row.beyblade_id) {
          const existingBeyblade = groupedData[row.registration_id].beyblades
            .find(b => b.beyblade_id === row.beyblade_id);
          
          if (!existingBeyblade) {
            groupedData[row.registration_id].beyblades.push({
              beyblade_id: row.beyblade_id,
              beyblade_name: row.beyblade_name,
              blade_line: row.blade_line
            });
          }
        }
      });

      setRegistrations(Object.values(groupedData));
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const startCreate = () => {
    setIsCreating(true);
    setFormData({
      name: '',
      description: '',
      tournament_date: '',
      location: '',
      max_participants: 16,
      registration_deadline: '',
      prize_pool: '',
      beyblades_per_player: 3,
      players_per_team: 1,
      entry_fee: 0,
      is_free: true,
      tournament_type: 'casual',
      password: ''
    });
  };

  const startEdit = (tournament: Tournament) => {
    setEditingId(tournament.id);
    setFormData({
      name: tournament.name,
      description: tournament.description || '',
      tournament_date: tournament.tournament_date,
      location: tournament.location,
      max_participants: tournament.max_participants,
      registration_deadline: tournament.registration_deadline,
      prize_pool: tournament.prize_pool || '',
      beyblades_per_player: tournament.beyblades_per_player,
      players_per_team: tournament.players_per_team,
      entry_fee: tournament.entry_fee,
      is_free: tournament.is_free,
      tournament_type: tournament.tournament_type,
      password: tournament.password || ''
    });
  };

  const saveTournament = async () => {
    if (!formData.name.trim()) {
      await alert('Missing Information', 'Please enter a tournament name.');
      return;
    }

    if (!formData.password.trim()) {
      await alert('Missing Information', 'Please enter a tournament password.');
      return;
    }

    if (!formData.tournament_date) {
      await alert('Missing Information', 'Please select a tournament date.');
      return;
    }

    if (!formData.location.trim()) {
      await alert('Missing Information', 'Please enter a tournament location.');
      return;
    }

    if (!formData.registration_deadline) {
      await alert('Missing Information', 'Please select a registration deadline.');
      return;
    }

    try {
      const tournamentData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        tournament_date: formData.tournament_date,
        location: formData.location.trim(),
        max_participants: formData.max_participants,
        registration_deadline: formData.registration_deadline,
        prize_pool: formData.prize_pool.trim() || null,
        beyblades_per_player: formData.beyblades_per_player,
        players_per_team: formData.players_per_team,
        entry_fee: formData.entry_fee,
        is_free: formData.is_free,
        tournament_type: formData.tournament_type,
        is_practice: formData.is_practice,
        registration_open: formData.registration_open,
        password: formData.password.trim()
      };

      if (isCreating) {
        const { error } = await supabase
          .from('tournaments')
          .insert([tournamentData]);
        
        if (error) throw error;
      } else if (editingId) {
        const { error } = await supabase
          .from('tournaments')
          .update(tournamentData)
          .eq('id', editingId);
        
        if (error) throw error;
      }

      await fetchTournaments();
      cancelEdit();
      await alert('Success', 'Tournament saved successfully!');
    } catch (error) {
      console.error('Error saving tournament:', error);
      await alert('Error', 'Failed to save tournament. Please try again.');
    }
  };

  const updateTournamentStatus = async (tournamentId: string, newStatus: 'upcoming' | 'active' | 'completed') => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ status: newStatus })
        .eq('id', tournamentId);

      if (error) throw error;

      await fetchTournaments();
      await alert('Success', `Tournament status updated to ${newStatus}!`);
    } catch (error) {
      console.error('Error updating tournament status:', error);
      await alert('Error', 'Failed to update tournament status. Please try again.');
    }
  };

  const toggleRegistration = async (tournamentId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ registration_open: !currentState })
        .eq('id', tournamentId);

      if (error) throw error;

      await fetchTournaments();
      await alert('Success', `Registration ${!currentState ? 'opened' : 'closed'} successfully!`);
    } catch (error) {
      console.error('Error toggling registration:', error);
      await alert('Error', 'Failed to toggle registration. Please try again.');
    }
  };

  const deleteTournament = async (id: string) => {
    const confirmed = await confirm(
      'Delete Tournament',
      'Are you sure you want to delete this tournament? This will also delete all registrations and match data. This action cannot be undone.'
    );
    
    if (!confirmed) return;

    try {
      // Delete related data first, then the tournament
      await supabase.from('tournament_beyblade_parts').delete().eq('beyblade_id', `(SELECT id FROM tournament_beyblades WHERE registration_id IN (SELECT id FROM tournament_registrations WHERE tournament_id = '${id}'))`);
      await supabase.from('tournament_beyblades').delete().eq('registration_id', `(SELECT id FROM tournament_registrations WHERE tournament_id = '${id}')`);
      await supabase.from('tournament_registrations').delete().eq('tournament_id', id);
      await supabase.from('match_results').delete().eq('tournament_id', id);
      
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchTournaments();
      await alert('Success', 'Tournament deleted successfully!');
    } catch (error) {
      console.error('Error deleting tournament:', error);
      await alert('Error', 'Failed to delete tournament. Please try again.');
    }
  };

  const deleteRegistration = async (registrationId: string) => {
    const confirmed = await confirm(
      'Delete Registration',
      'Are you sure you want to delete this registration? This action cannot be undone.'
    );
    
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .delete()
        .eq("id", registrationId)

      if (error) throw error;

      await fetchRegistrations();
      await alert('Success', 'Registration deleted successfully!');
    } catch (error) {
      console.error('Error deleting registration:', error);
      await alert('Error', 'Failed to delete registration. Please try again.');
    }
  };

  const cancelEdit = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      tournament_date: '',
      location: '',
      max_participants: 16,
      registration_deadline: '',
      prize_pool: '',
      beyblades_per_player: 3,
      players_per_team: 1,
      entry_fee: 0,
      is_free: true,
      tournament_type: 'casual',
      password: ''
    });
  };

  if (!isAdmin) {
    return (
      <div className="page-container">
        <div className="content-wrapper">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-2xl">🔒</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You need admin or developer permissions to access tournament management.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="content-wrapper">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tournaments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="content-wrapper max-w-6xl mx-auto">
        <div className="page-header">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="page-title flex items-center">
                <Trophy size={28} className="mr-3 text-yellow-600" />
                Tournament Manager
              </h1>
              <p className="page-subtitle">Create and manage tournaments</p>
            </div>
            <div className="filter-tabs">
              <button
                onClick={() => setCurrentView('tournaments')}
                className={`filter-tab ${
                  currentView === 'tournaments' ? 'filter-tab-active' : 'filter-tab-inactive'
                }`}
              >
                <Trophy size={16} className="mr-2" />
                Tournaments
              </button>
              <button
                onClick={() => setCurrentView('registrations')}
                className={`filter-tab ${
                  currentView === 'registrations' ? 'filter-tab-active' : 'filter-tab-inactive'
                }`}
              >
                <Users size={16} className="mr-2" />
                Registrations
              </button>
            </div>
          </div>
        </div>

        {currentView === 'tournaments' && (
          <>
            <div className="flex justify-end mb-6">
              <button
                onClick={startCreate}
                className="primary-button flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Create Tournament</span>
              </button>
            </div>

            {/* Create/Edit Form */}
            {(isCreating || editingId) && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {isCreating ? "Create New Tournament" : "Edit Tournament"}
                </h2>
            
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tournament Name */}
                  <div>
                    <label htmlFor="tournamentName" className="form-label">
                      Tournament Name *
                    </label>
                    <input
                      id="tournamentName"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="input-field w-full"
                      placeholder="Enter tournament name"
                    />
                  </div>
            
                  {/* Tournament Date */}
                  <div>
                    <label htmlFor="tournamentDate" className="form-label">
                      Tournament Date *
                    </label>
                    <input
                      id="tournamentDate"
                      type="date"
                      required
                      value={formData.tournament_date}
                      onChange={(e) =>
                        setFormData({ ...formData, tournament_date: e.target.value })
                      }
                      className="input-field w-full"
                    />
                  </div>
            
                  {/* Location */}
                  <div>
                    <label htmlFor="tournamentLocation" className="form-label">
                      Location *
                    </label>
                    <input
                      id="tournamentLocation"
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      className="input-field w-full"
                      placeholder="Enter tournament location"
                    />
                  </div>
            
                  {/* Registration Deadline */}
                  <div>
                    <label htmlFor="registrationDeadline" className="form-label">
                      Registration Deadline *
                    </label>
                    <input
                      id="registrationDeadline"
                      type="date"
                      required
                      value={formData.registration_deadline}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          registration_deadline: e.target.value,
                        })
                      }
                      className="input-field w-full"
                    />
                  </div>
            
                  {/* Max Participants + Unlimited Toggle */}
                  <div>
                    <label htmlFor="maxParticipants" className="form-label">
                      Max Participants
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        id="maxParticipants"
                        type="number"
                        min="1"
                        disabled={formData.unlimited_participants}
                        value={
                          formData.unlimited_participants
                            ? ""
                            : formData.max_participants ?? ""
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            max_participants:
                              e.target.value === ""
                                ? undefined
                                : parseInt(e.target.value),
                          })
                        }
                        className="input-field w-full"
                      />
                    </div>
                    <div className="mt-2 flex items-center space-x-2">
                      <input
                        id="unlimitedParticipants"
                        type="checkbox"
                        checked={formData.unlimited_participants || false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            unlimited_participants: e.target.checked,
                            max_participants: e.target.checked
                              ? 999999
                              : formData.max_participants ?? undefined,
                          })
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label
                        htmlFor="unlimitedParticipants"
                        className="text-sm text-gray-700"
                      >
                        Unlimited Participants
                      </label>
                    </div>
                  </div>
            
                  {/* Beyblades per Player */}
                  <div>
                    <label htmlFor="beybladesPerPlayer" className="form-label">
                      Beyblades per Player
                    </label>
                    <input
                      id="beybladesPerPlayer"
                      type="number"
                      min="1"
                      max="5"
                      required
                      value={formData.beyblades_per_player ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          beyblades_per_player:
                            e.target.value === ""
                              ? undefined
                              : parseInt(e.target.value),
                        })
                      }
                      className="input-field w-full"
                    />
                  </div>
            
                  {/* Tournament Type */}
                  <div>
                    <label htmlFor="tournamentType" className="form-label">
                      Tournament Type
                    </label>
                    <select
                      id="tournamentType"
                      value={formData.tournament_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tournament_type: e.target.value as "ranked" | "casual",
                        })
                      }
                      className="select-field w-full"
                    >
                      <option value="casual">Casual</option>
                      <option value="ranked">Ranked</option>
                    </select>
                  </div>

                  {/* Practice Mode */}
                  <div>
                    <label className="form-label">Tournament Mode</label>
                    <div className="flex items-center space-x-2">
                      <input
                        id="practiceMode"
                        type="checkbox"
                        checked={formData.is_practice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_practice: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="practiceMode" className="text-sm text-gray-700">
                        Practice Tournament
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Practice tournaments don't contribute to global or personal stats
                    </p>
                  </div>
            
                  {/* Entry Fee */}
                  <div>
                    <label className="form-label">Entry Fee</label>
                    <div className="flex items-center space-x-2">
                      <input
                        id="freeTournament"
                        type="checkbox"
                        checked={formData.is_free}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_free: e.target.checked,
                            entry_fee: e.target.checked ? 0 : formData.entry_fee ?? 0,
                          })
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="freeTournament" className="text-sm text-gray-700">
                        Free Tournament
                      </label>
                    </div>
                    {!formData.is_free && (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.entry_fee ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            entry_fee:
                              e.target.value === ""
                                ? undefined
                                : parseFloat(e.target.value),
                          })
                        }
                        className="input-field w-full mt-2"
                        placeholder="0.00"
                      />
                    )}
                  </div>
            
                  {/* Password */}
                  <div className="md:col-span-2">
                    <label htmlFor="tournamentPassword" className="form-label">
                      Tournament Password *
                    </label>
                    <div className="relative">
                      <input
                        id="tournamentPassword"
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="input-field w-full pr-10"
                        placeholder="Enter tournament password"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowPassword(!showPassword);
                        }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      This password will be required for match tracking access
                    </p>
                  </div>
            
                  {/* Description */}
                  <div className="md:col-span-2">
                    <label htmlFor="tournamentDescription" className="form-label">
                      Description
                    </label>
                    <textarea
                      id="tournamentDescription"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      className="input-field w-full"
                      rows={3}
                      placeholder="Tournament description (optional)"
                    />
                  </div>
            
                  {/* Prize Pool */}
                  <div className="md:col-span-2">
                    <label htmlFor="prizePool" className="form-label">
                      Prize Pool
                    </label>
                    <input
                      id="prizePool"
                      type="text"
                      value={formData.prize_pool}
                      onChange={(e) =>
                        setFormData({ ...formData, prize_pool: e.target.value })
                      }
                      className="input-field w-full"
                      placeholder="e.g., ₱500 cash prize"
                    />
                  </div>
                </div>
            
                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="secondary-button flex items-center space-x-2"
                  >
                    <X size={16} />
                    <span>Cancel</span>
                  </button>
                  <button
                    type="button"
                    onClick={saveTournament}
                    className="primary-button flex items-center space-x-2"
                  >
                    <Save size={16} />
                    <span>Save Tournament</span>
                  </button>
                </div>
              </div>
            )}


            {/* Tournaments List */}
            {tournaments.length === 0 ? (
              <div className="text-center py-12">
                <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No tournaments created yet</p>
                <button
                  onClick={startCreate}
                  className="mt-4 text-blue-600 hover:text-blue-800 underline"
                >
                  Create your first tournament
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {tournaments.map((tournament) => (
                  <div key={tournament.id} className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{tournament.name}</h3>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium capitalize ${
                          tournament.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                          tournament.status === 'active' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {tournament.status}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => startEdit(tournament)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => deleteTournament(tournament.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-2" />
                        {new Date(tournament.tournament_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <MapPin size={14} className="mr-2" />
                        {tournament.location}
                      </div>
                      <div className="flex items-center">
                        <Users size={14} className="mr-2" />
                        {tournament.max_participants === 999999 
                          ? `${tournament.current_participants} participants (unlimited)`
                          : `${tournament.current_participants}/${tournament.max_participants} participants`
                        }
                      </div>
                      {tournament.password && (
                        <div className="flex items-center text-orange-600">
                          <span className="text-xs">🔒 Password protected</span>
                        </div>
                      )}
                      {tournament.is_practice && (
                        <div className="flex items-center text-purple-600">
                          <span className="text-xs">🎯 Practice Mode</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <span className={`text-xs ${tournament.registration_open ? 'text-green-600' : 'text-red-600'}`}>
                          {tournament.registration_open ? '✅ Registration Open' : '❌ Registration Closed'}
                        </span>
                      </div>
                    </div>

                    {/* Tournament Controls */}
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                      {/* Status Control */}
                      <div className="flex items-center space-x-2">
                        <label className="text-xs font-medium text-gray-600">Status:</label>
                        <select
                          value={tournament.status}
                          onChange={(e) => updateTournamentStatus(tournament.id, e.target.value as any)}
                          className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="upcoming">Upcoming</option>
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>

                      {/* Registration Toggle */}
                      <button
                        onClick={() => toggleRegistration(tournament.id, tournament.registration_open)}
                        className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                          tournament.registration_open 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {tournament.registration_open ? 'Close Registration' : 'Open Registration'}
                      </button>
                    </div>

                    <div className="text-xs text-gray-500 pt-2 border-t mt-3">
                      Created: {new Date(tournament.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {currentView === 'registrations' && (
          <>
            <div className="mb-6">
              <label className="form-label">Select Tournament</label>
              <select
                value={selectedTournament}
                onChange={(e) => setSelectedTournament(e.target.value)}
                className="select-field max-w-md"
              >
                <option value="">-- Select Tournament --</option>
                {tournaments.map(tournament => (
                  <option key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedTournament && (
              <div className="space-y-4">
                {registrations.length === 0 ? (
                  <div className="text-center py-8">
                    <Users size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No registrations found for this tournament</p>
                  </div>
                ) : (
                  registrations.map((registration) => (
                    <div key={registration.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {registration.player_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900">{registration.player_name}</h3>
                              <p className="text-sm text-gray-600">
                                {new Date(registration.registered_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Payment:</span>
                              <p className="font-medium capitalize">{registration.payment_mode?.replace('_', ' ') || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Status:</span>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ml-1 ${
                                registration.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                registration.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {registration.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => deleteRegistration(registration.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Registration"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Beyblades:</span>
                          <span className="text-sm text-gray-600">
                            {registration.beyblades.length} registered
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {registration.beyblades.length > 0 ? (
                            registration.beyblades.map((beyblade, index) => (
                              <span key={index} className="inline-block bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-700 border">
                                {beyblade.beyblade_name}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500 italic">No Beyblades registered</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}