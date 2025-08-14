import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, Users, Eye, Swords, Calendar, CreditCard, CheckCircle, ArrowLeft, Trophy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Tournament } from '../../types';

interface TournamentRegistration {
  registration_id: string;
  player_name: string;
  payment_mode: string;
  registered_at: string;
  status: string;
  beyblades: Array<{
    beyblade_id: string;
    beyblade_name: string;
    blade_line: string;
    parts: any[];
  }>;
}

export function TournamentManager() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [viewingRegistrations, setViewingRegistrations] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewingMatches, setViewingMatches] = useState<string | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [editMatchData, setEditMatchData] = useState<any>({});
  const [viewingAllRegistrations, setViewingAllRegistrations] = useState(false);
  const [allRegistrations, setAllRegistrations] = useState<TournamentRegistration[]>([]);
  const [loadingAllRegistrations, setLoadingAllRegistrations] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'developer';

  React.useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournamentRegistrations = async (tournamentId: string) => {
    setLoadingRegistrations(true);
    try {
      const { data, error } = await supabase
        .from('tournament_registration_details')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('registered_at', { ascending: false });

      if (error) throw error;

      // Group by registration_id
      const groupedData: { [key: string]: any } = {};
      
      data?.forEach((row: any) => {
        if (!groupedData[row.registration_id]) {
          groupedData[row.registration_id] = {
            registration_id: row.registration_id,
            tournament_id: row.tournament_id,
            player_name: row.player_name,
            payment_mode: row.payment_mode,
            registered_at: row.registered_at,
            status: row.status,
            payment_status: row.payment_status,
            beyblades: []
          };
        }

        if (row.beyblade_id) {
          const existingBeyblade = groupedData[row.registration_id].beyblades
            .find((b: any) => b.beyblade_id === row.beyblade_id);
          
          if (!existingBeyblade) {
            groupedData[row.registration_id].beyblades.push({
              beyblade_id: row.beyblade_id,
              beyblade_name: row.beyblade_name,
              blade_line: row.blade_line,
              parts: row.beyblade_parts || []
            });
          }
        }
      });

      setRegistrations(Object.values(groupedData));
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setRegistrations([]);
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const updatePaymentStatus = async (registrationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .update({ payment_status: newStatus })
        .eq('id', registrationId);

      if (error) throw error;

      // Refresh registrations
      if (viewingRegistrations) {
        await fetchTournamentRegistrations(viewingRegistrations);
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status');
    }
  };

  const getPartOrder = (parts: any[], bladeLine: string) => {
    if (bladeLine === 'Custom') {
      const order = ['Lockchip', 'Main Blade', 'Assist Blade', 'Ratchet', 'Bit'];
      return order.map(partType => parts.find(p => p.part_type === partType)).filter(Boolean);
    } else {
      const order = ['Blade', 'Ratchet', 'Bit'];
      return order.map(partType => parts.find(p => p.part_type === partType)).filter(Boolean);
    }
  };

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('tournament_date', { ascending: false });

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
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
      status: 'upcoming',
      registration_deadline: '',
      prize_pool: '',
      beyblades_per_player: 3,
      players_per_team: 1,
      is_free: true,
      entry_fee: 0,
      tournament_type: 'casual'
    });
  };

  const startEdit = (tournament: any) => {
    setEditingId(tournament.id);
    setFormData(tournament);
  };

  const saveChanges = async () => {
    try {
      if (isCreating) {
        const { error } = await supabase
          .from('tournaments')
          .insert([formData]);
        
        if (error) {
          console.error('Insert error:', error);
          if (error.code === '42501' || error.message.includes('RLS')) {
            alert('Permission denied. You need admin or developer role to create tournaments.');
          } else {
            alert(`Failed to create tournament: ${error.message}`);
          }
          return;
        }
      } else if (editingId) {
        const { error } = await supabase
          .from('tournaments')
          .update(formData)
          .eq('id', editingId);
        
        if (error) {
          console.error('Update error:', error);
          if (error.code === '42501' || error.message.includes('RLS') || error.code === '42883') {
            alert('Permission denied. You need admin or developer role to edit tournaments.');
          } else {
            alert(`Failed to update tournament: ${error.message}`);
          }
          return;
        }
      }

      await fetchTournaments();
      setIsCreating(false);
      setEditingId(null);
      setFormData({});
    } catch (error) {
      console.error('Error saving tournament:', error);
      alert(`Failed to save tournament: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  };


  const cancelEdit = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({});
  };

  const viewRegistrations = async (tournamentId: string) => {
    setLoadingRegistrations(true);
    setViewingRegistrations(tournamentId);
    
    try {
      const { data, error } = await supabase
        .from('tournament_registration_details')
        .select('*')
        .eq('tournament_id', tournamentId);

      if (error) {
        throw error;
      }

      // Group registrations by registration_id
      const groupedRegistrations: { [key: string]: TournamentRegistration } = {};
      
      data?.forEach((row: any) => {
        if (!groupedRegistrations[row.registration_id]) {
          groupedRegistrations[row.registration_id] = {
            registration_id: row.registration_id,
            player_name: row.player_name,
            payment_mode: row.payment_mode,
            registered_at: row.registered_at,
            status: row.status,
            beyblades: []
          };
        }

        if (row.beyblade_id) {
          const existingBeyblade = groupedRegistrations[row.registration_id].beyblades
            .find(b => b.beyblade_id === row.beyblade_id);
          
          if (!existingBeyblade) {
            groupedRegistrations[row.registration_id].beyblades.push({
              beyblade_id: row.beyblade_id,
              beyblade_name: row.beyblade_name,
              blade_line: row.blade_line,
              parts: row.beyblade_parts || []
            });
          }
        }
      });

      setRegistrations(Object.values(groupedRegistrations));
    } catch (error) {
      console.error('Error fetching registrations:', error);
      alert('Failed to load registrations. Please try again.');
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const deleteTournament = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tournament? This will permanently delete ALL related data including registrations, beyblades, parts, matches, and sessions. This action cannot be undone.')) {
      return;
    }

    try {
      // Use the database function to safely delete tournament and all related data
      const { data, error } = await supabase.rpc('delete_tournament_completely', {
        tournament_id_to_delete: id
      });

      if (error) {
        console.error('Delete error:', error);
        if (error.code === '42501' || error.message.includes('RLS')) {
          alert('Permission denied. You need admin or developer role to delete tournaments.');
        } else {
          alert(`Failed to delete tournament: ${error.message}`);
        }
        return;
      }
      
      // Show detailed deletion summary
      if (data) {
        const summary = `Tournament "${data.tournament_name}" deleted successfully!\n\n` +
          `Deleted data:\n` +
          `• ${data.registrations_deleted} registrations\n` +
          `• ${data.beyblades_deleted} beyblades\n` +
          `• ${data.parts_deleted} beyblade parts\n` +
          `• ${data.matches_deleted} match results\n` +
          `• ${data.sessions_deleted} match sessions`;
        alert(summary);
      } else {
        alert('Tournament deleted successfully!');
      }
      
      await fetchTournaments();
    } catch (error) {
      console.error('Error deleting tournament:', error);
      alert(`Failed to delete tournament: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  };

  const viewMatches = async (tournamentId: string) => {
    setLoadingMatches(true);
    setViewingMatches(tournamentId);
    
    try {
      const { data, error } = await supabase
        .from('match_results')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('submitted_at', { ascending: false });

      if (error) {
        throw error;
      }

      setMatches(data || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
      alert('Failed to load matches. Please try again.');
    } finally {
      setLoadingMatches(false);
    }
  };

  const startEditMatch = (match: any) => {
    setEditingMatch(match.id);
    setEditMatchData({ ...match });
  };

  const saveMatchChanges = async () => {
    if (!editingMatch || !isAdmin) return;

    try {
      const { error } = await supabase
        .from('match_results')
        .update(editMatchData)
        .eq('id', editingMatch);

      if (error) {
        console.error('Update error:', error);
        alert(`Failed to update match: ${error.message}`);
        return;
      }

      setEditingMatch(null);
      setEditMatchData({});
      await viewMatches(viewingMatches!);
      alert('Match updated successfully!');
    } catch (error) {
      console.error('Error updating match:', error);
      alert(`Failed to update match: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const cancelEditMatch = () => {
    setEditingMatch(null);
    setEditMatchData({});
  };

  const deleteMatch = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this match? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('match_results')
        .delete()
        .eq('id', matchId);

      if (error) {
        console.error('Delete error:', error);
        alert(`Failed to delete match: ${error.message}`);
        return;
      }
      
      alert('Match deleted successfully!');
      await viewMatches(viewingMatches!);
    } catch (error) {
      console.error('Error deleting match:', error);
      alert(`Failed to delete match: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const viewAllRegistrations = async () => {
    setLoadingAllRegistrations(true);
    setViewingAllRegistrations(true);
    
    try {
      const { data, error } = await supabase
        .from('tournament_registration_details')
        .select('*')
        .order('registered_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Group registrations by registration_id
      const groupedRegistrations: { [key: string]: TournamentRegistration } = {};
      
      data?.forEach((row: any) => {
        if (!groupedRegistrations[row.registration_id]) {
          groupedRegistrations[row.registration_id] = {
            registration_id: row.registration_id,
            player_name: row.player_name,
            payment_mode: row.payment_mode,
            registered_at: row.registered_at,
            status: row.status,
            tournament_name: tournaments.find(t => t.id === row.tournament_id)?.name || 'Unknown Tournament',
            tournament_id: row.tournament_id,
            payment_status: row.payment_status || 'confirmed',
            beyblades: []
          };
        }

        if (row.beyblade_id) {
          const existingBeyblade = groupedRegistrations[row.registration_id].beyblades
            .find(b => b.beyblade_id === row.beyblade_id);
          
          if (!existingBeyblade) {
            groupedRegistrations[row.registration_id].beyblades.push({
              beyblade_id: row.beyblade_id,
              beyblade_name: row.beyblade_name,
              blade_line: row.blade_line,
              parts: row.beyblade_parts || []
            });
          }
        }
      });

      setAllRegistrations(Object.values(groupedRegistrations));
    } catch (error) {
      console.error('Error fetching all registrations:', error);
      alert('Failed to load registrations. Please try again.');
    } finally {
      setLoadingAllRegistrations(false);
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

  const handleViewRegistrations = (tournamentId: string) => {
    setViewingRegistrations(tournamentId);
    fetchTournamentRegistrations(tournamentId);
  };

  const handleBackToTournaments = () => {
    setViewingRegistrations(null);
    setRegistrations([]);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  // Registrations View
  if (viewingRegistrations) {
    const tournament = tournaments.find(t => t.id === viewingRegistrations);
    
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <button
            onClick={handleBackToTournaments}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back to Tournament Manager</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {tournament?.name} - Registrations
          </h1>
          <p className="text-gray-600">Manage tournament registrations and payment status</p>
        </div>

        {loadingRegistrations ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading registrations...</p>
          </div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No registrations found for this tournament</p>
          </div>
        ) : (
          <div className="space-y-6">
            {registrations.map((registration) => (
              <div key={registration.registration_id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {registration.player_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{registration.player_name}</h3>
                        <p className="text-sm text-gray-600">Registered: {new Date(registration.registered_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Payment Mode:</span>
                        <p className="font-medium capitalize">{registration.payment_mode?.replace('_', ' ') || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <p className="font-medium capitalize">{registration.status}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Payment Status</label>
                      <select
                        value={registration.payment_status || 'unpaid'}
                        onChange={(e) => updatePaymentStatus(registration.registration_id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                        <option value="confirmed">Confirmed</option>
                      </select>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      registration.payment_status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      registration.payment_status === 'paid' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {registration.payment_status || 'unpaid'}
                    </span>
                  </div>
                </div>

                {/* Beyblades */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <Trophy size={16} className="mr-2 text-yellow-500" />
                    Registered Beyblades ({registration.beyblades.length})
                  </h4>
                  
                  {registration.beyblades.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">No Beyblades registered</p>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {registration.beyblades.map((beyblade: any, index: number) => (
                        <div key={beyblade.beyblade_id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-center mb-3">
                            <h5 className="font-semibold text-gray-900">{beyblade.beyblade_name}</h5>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {beyblade.blade_line} Line
                            </span>
                          </div>
                          
                          {beyblade.parts.length > 0 ? (
                            <div className="space-y-2">
                              <h6 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Parts</h6>
                              <div className="space-y-1">
                                {getPartOrder(beyblade.parts, beyblade.blade_line).map((part: any, partIndex: number) => (
                                  <div key={partIndex} className="flex justify-between items-center text-xs">
                                    <span className="font-medium text-gray-700">{part.part_type}:</span>
                                    <span className="text-gray-600">{part.part_name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-500 text-xs">No parts configured</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tournament Manager</h1>
          <p className="text-gray-600">Create and manage tournaments</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={viewAllRegistrations}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Users size={20} />
            <span>All Registrations</span>
          </button>
          {isAdmin && (
            <button
              onClick={startCreate}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Create Tournament</span>
            </button>
          )}
        </div>
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
                value={formData.tournament_date || ''}
                onChange={(e) => setFormData({...formData, tournament_date: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration Deadline</label>
              <input
                type="date"
                value={formData.registration_deadline || ''}
                onChange={(e) => setFormData({...formData, registration_deadline: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
              <input
                type="number"
                value={formData.max_participants || ''}
                onChange={(e) => setFormData({...formData, max_participants: parseInt(e.target.value)})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prize Pool</label>
              <input
                type="text"
                value={formData.prize_pool || ''}
                onChange={(e) => setFormData({...formData, prize_pool: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., $500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tournament Type</label>
              <select
                value={formData.tournament_type || 'casual'}
                onChange={(e) => setFormData({...formData, tournament_type: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="casual">Casual</option>
                <option value="ranked">Ranked</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entry Type</label>
              <select
                value={formData.is_free ? 'free' : 'paid'}
                onChange={(e) => {
                  const isFree = e.target.value === 'free';
                  setFormData({
                    ...formData, 
                    is_free: isFree,
                    entry_fee: isFree ? 0 : formData.entry_fee || 50
                  });
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="free">Free Entry</option>
                <option value="paid">Paid Entry</option>
              </select>
            </div>

            {!formData.is_free && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entry Fee</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.entry_fee || ''}
                  onChange={(e) => setFormData({...formData, entry_fee: parseFloat(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beyblades per Player</label>
              <input
                type="number"
                min="1"
                max="5"
                value={formData.beyblades_per_player || 3}
                onChange={(e) => setFormData({...formData, beyblades_per_player: parseInt(e.target.value)})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Players per Team</label>
              <input
                type="number"
                min="1"
                max="4"
                value={formData.players_per_team || 1}
                onChange={(e) => setFormData({...formData, players_per_team: parseInt(e.target.value)})}
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
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status || ''}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tournament Type</label>
                  <select
                    value={formData.tournament_type || 'casual'}
                    onChange={(e) => setFormData({...formData, tournament_type: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="casual">Casual</option>
                    <option value="ranked">Ranked</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entry Type</label>
                  <select
                    value={formData.is_free ? 'free' : 'paid'}
                    onChange={(e) => {
                      const isFree = e.target.value === 'free';
                      setFormData({
                        ...formData, 
                        is_free: isFree,
                        entry_fee: isFree ? 0 : formData.entry_fee || 50
                      });
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="free">Free Entry</option>
                    <option value="paid">Paid Entry</option>
                  </select>
                </div>

                {!formData.is_free && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entry Fee (₱)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.entry_fee || ''}
                      onChange={(e) => setFormData({...formData, entry_fee: parseFloat(e.target.value) || 0})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="50.00"
                    />
                  </div>
                )}
              </>
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
                    <span className="font-medium">Date:</span> {new Date(tournament.tournament_date).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> {tournament.location}
                  </div>
                  <div>
                    <span className="font-medium">Participants:</span> {tournament.current_participants}/{tournament.max_participants}
                  </div>
                  <div>
                    <span className="font-medium">Prize Pool:</span> {tournament.prize_pool}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> 
                    <span className={`ml-1 capitalize ${tournament.tournament_type === 'ranked' ? 'text-orange-600 font-semibold' : 'text-gray-600'}`}>
                      {tournament.tournament_type}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Entry:</span> 
                    <span className={`ml-1 ${tournament.is_free ? 'text-green-600' : 'text-blue-600'} font-semibold`}>
                      {tournament.is_free ? 'Free' : `₱${tournament.entry_fee}`}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Beyblades/Player:</span> {tournament.beyblades_per_player}
                  </div>
                  <div>
                    <span className="font-medium">Players/Team:</span> {tournament.players_per_team}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                {isAdmin && (
                  <button
                    onClick={() => startEdit(tournament)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Edit Tournament"
                  >
                    <Edit size={16} />
                  </button>
                )}
                <button
                  onClick={() => handleViewRegistrations(tournament.id)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                  title="View Registrations"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => viewMatches(tournament.id)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                  title="View Matches"
                >
                  <Swords size={16} />
                </button>
                {isAdmin && (
                  <button
                    onClick={() => deleteTournament(tournament.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete Tournament"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Registration Deadline: {new Date(tournament.registration_deadline).toLocaleDateString()}</span>
                <span>Tournament ID: {tournament.id}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Registrations Modal */}
      {viewingRegistrations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Tournament Registrations</h2>
                <p className="text-gray-600">
                  {tournaments.find(t => t.id === viewingRegistrations)?.name}
                </p>
              </div>
              <button
                onClick={() => setViewingRegistrations(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {loadingRegistrations ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading registrations...</p>
                </div>
              ) : registrations.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No registrations yet for this tournament</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {registrations.map((registration) => (
                    <div key={registration.registration_id} className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{registration.player_name}</h3>
                          <p className="text-sm text-gray-600">
                            Registered: {new Date(registration.registered_at).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Payment: <span className="capitalize">{registration.payment_mode.replace('_', ' ')}</span>
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          registration.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          registration.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {registration.status}
                        </span>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900">Registered Beyblades:</h4>
                        {registration.beyblades.map((beyblade) => (
                          <div key={beyblade.beyblade_id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="font-medium text-gray-900">{beyblade.beyblade_name}</h5>
                              <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                                {beyblade.blade_line} Line
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-sm">
                              {beyblade.parts.map((part: any, index: number) => (
                                <div key={index} className="bg-white border border-gray-300 p-2 rounded">
                                  <div className="font-medium text-gray-700">{part.part_type}</div>
                                  <div className="text-gray-600">{part.part_name}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* All Registrations Modal */}
      {viewingAllRegistrations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">All Tournament Registrations</h2>
                <p className="text-gray-600">Manage payment status and registration details</p>
              </div>
              <button
                onClick={() => setViewingAllRegistrations(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {loadingAllRegistrations ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading all registrations...</p>
                </div>
              ) : allRegistrations.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No registrations found across all tournaments</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allRegistrations.map((registration) => (
                    <div key={registration.registration_id} className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{registration.player_name}</h3>
                            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              {registration.tournament_name}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Registered:</span>
                              <p>{new Date(registration.registered_at).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span className="font-medium">Payment Mode:</span>
                              <p className="capitalize">{registration.payment_mode.replace('_', ' ')}</p>
                            </div>
                            <div>
                              <span className="font-medium">Status:</span>
                              <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                                registration.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                registration.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {registration.status}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">Payment:</span>
                              <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                                registration.payment_status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                registration.payment_status === 'paid' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {registration.payment_status}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {isAdmin && (
                          <div className="flex space-x-2">
                            {registration.payment_status === 'unpaid' && (
                              <button
                                onClick={() => updatePaymentStatus(registration.registration_id, 'paid')}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1"
                              >
                                <CreditCard size={14} />
                                <span>Mark Paid</span>
                              </button>
                            )}
                            {registration.payment_status === 'paid' && (
                              <button
                                onClick={() => updatePaymentStatus(registration.registration_id, 'confirmed')}
                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center space-x-1"
                              >
                                <CheckCircle size={14} />
                                <span>Confirm</span>
                              </button>
                            )}
                            {registration.payment_status !== 'unpaid' && (
                              <button
                                onClick={() => updatePaymentStatus(registration.registration_id, 'unpaid')}
                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                              >
                                Mark Unpaid
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Beyblades:</span>
                          <span className="text-sm text-gray-600">
                            {registration.beyblades.length} registered
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {registration.beyblades.length > 0 ? (
                            registration.beyblades.map((beyblade, index) => (
                              <span key={index} className="inline-block bg-white px-3 py-1 rounded-full text-xs font-medium text-gray-700 border">
                                {beyblade.beyblade_name}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500 italic">No Beyblades registered</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Matches Modal */}
      {viewingMatches && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Tournament Matches</h2>
                <p className="text-gray-600">
                  {tournaments.find(t => t.id === viewingMatches)?.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setViewingMatches(null);
                  setEditingMatch(null);
                  setEditMatchData({});
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {loadingMatches ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading matches...</p>
                </div>
              ) : matches.length === 0 ? (
                <div className="text-center py-12">
                  <Swords size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No matches found for this tournament</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Round</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match #</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player 1</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player 1 Bey</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player 2</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player 2 Bey</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Winner</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outcome</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Officer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        {isAdmin && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {matches.map((match) => (
                        <tr key={match.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingMatch === match.id ? (
                              <input
                                type="number"
                                value={editMatchData.round_number || ''}
                                onChange={(e) => setEditMatchData({...editMatchData, round_number: parseInt(e.target.value)})}
                                className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                              />
                            ) : (
                              match.round_number
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingMatch === match.id ? (
                              <input
                                type="number"
                                value={editMatchData.match_number || ''}
                                onChange={(e) => setEditMatchData({...editMatchData, match_number: parseInt(e.target.value)})}
                                className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                              />
                            ) : (
                              match.match_number
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {editingMatch === match.id ? (
                              <input
                                type="text"
                                value={editMatchData.player1_name || ''}
                                onChange={(e) => setEditMatchData({...editMatchData, player1_name: e.target.value})}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              />
                            ) : (
                              match.player1_name
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingMatch === match.id ? (
                              <input
                                type="text"
                                value={editMatchData.player1_beyblade || ''}
                                onChange={(e) => setEditMatchData({...editMatchData, player1_beyblade: e.target.value})}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              />
                            ) : (
                              match.player1_beyblade
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {editingMatch === match.id ? (
                              <input
                                type="text"
                                value={editMatchData.player2_name || ''}
                                onChange={(e) => setEditMatchData({...editMatchData, player2_name: e.target.value})}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              />
                            ) : (
                              match.player2_name
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingMatch === match.id ? (
                              <input
                                type="text"
                                value={editMatchData.player2_beyblade || ''}
                                onChange={(e) => setEditMatchData({...editMatchData, player2_beyblade: e.target.value})}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              />
                            ) : (
                              match.player2_beyblade
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingMatch === match.id ? (
                              <select
                                value={editMatchData.winner_name || ''}
                                onChange={(e) => setEditMatchData({...editMatchData, winner_name: e.target.value})}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              >
                                <option value="">Select Winner</option>
                                <option value={editMatchData.player1_name}>{editMatchData.player1_name}</option>
                                <option value={editMatchData.player2_name}>{editMatchData.player2_name}</option>
                              </select>
                            ) : (
                              <span className={`font-medium ${
                                match.winner_name === match.player1_name ? 'text-green-600' : 'text-blue-600'
                              }`}>
                                {match.winner_name}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingMatch === match.id ? (
                              <select
                                value={editMatchData.outcome || ''}
                                onChange={(e) => setEditMatchData({...editMatchData, outcome: e.target.value})}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              >
                                <option value="">Select Outcome</option>
                                <option value="Spin Finish (1 pt)">Spin Finish (1 pt)</option>
                                <option value="Burst Finish (2 pts)">Burst Finish (2 pts)</option>
                                <option value="Over Finish (2 pts)">Over Finish (2 pts)</option>
                                <option value="Extreme Finish (3 pts)">Extreme Finish (3 pts)</option>
                              </select>
                            ) : (
                              match.outcome
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingMatch === match.id ? (
                              <input
                                type="number"
                                value={editMatchData.points_awarded || ''}
                                onChange={(e) => setEditMatchData({...editMatchData, points_awarded: parseInt(e.target.value)})}
                                className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                              />
                            ) : (
                              match.points_awarded
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingMatch === match.id ? (
                              <input
                                type="text"
                                value={editMatchData.tournament_officer || ''}
                                onChange={(e) => setEditMatchData({...editMatchData, tournament_officer: e.target.value})}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              />
                            ) : (
                              match.tournament_officer
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar size={12} className="mr-1" />
                              {new Date(match.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          {isAdmin && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                {editingMatch === match.id ? (
                                  <>
                                    <button
                                      onClick={saveMatchChanges}
                                      className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                      title="Save Changes"
                                    >
                                      <Save size={16} />
                                    </button>
                                    <button
                                      onClick={cancelEditMatch}
                                      className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
                                      title="Cancel"
                                    >
                                      <X size={16} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => startEditMatch(match)}
                                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                      title="Edit Match"
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button
                                      onClick={() => deleteMatch(match.id)}
                                      className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                      title="Delete Match"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}