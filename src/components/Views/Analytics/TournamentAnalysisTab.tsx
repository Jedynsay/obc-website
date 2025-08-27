import React, { useState, useEffect } from 'react';
import { Database, Users, BarChart3, Target } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { MetaAnalysisSubTab } from './MetaAnalysisSubTab';
import { PlayerAnalyticsSubTab } from './PlayerAnalyticsSubTab';

interface Tournament {
  id: string;
  name: string;
  status: string;
  tournament_date: string;
}

export function TournamentAnalysisTab() {
  const [currentSubTab, setCurrentSubTab] = useState<'meta' | 'player'>('meta');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name, status, tournament_date')
        .order('tournament_date', { ascending: false });

      if (error) throw error;
      
      setTournaments(data || []);
      
      // Auto-select first completed tournament
      const completedTournament = data?.find(t => t.status === 'completed');
      if (completedTournament) {
        setSelectedTournament(completedTournament.id);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubTabChange = (subTab: 'meta' | 'player') => {
    if (subTab === currentSubTab) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSubTab(subTab);
      setIsTransitioning(false);
    }, 150);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading tournaments...</p>
      </div>
    );
  }

  if (isTransitioning) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Tournament Selection */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <Database size={24} className="mr-2 text-blue-400" />
          Tournament Selection
        </h2>
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Tournament for Analysis
          </label>
          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="w-full border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
          >
            <option value="">-- Select Tournament --</option>
            {tournaments.map(tournament => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.name} ({tournament.status}) - {new Date(tournament.tournament_date).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedTournament && (
        <>
          {/* Sub-tabs */}
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
            <div className="filter-tabs bg-gray-700">
              <button
                onClick={() => handleSubTabChange('meta')}
                className={`filter-tab ${
                  currentSubTab === 'meta' ? 'filter-tab-active' : 'filter-tab-inactive'
                }`}
              >
                <BarChart3 size={16} className="mr-2" />
                Meta Analysis
              </button>
              <button
                onClick={() => handleSubTabChange('player')}
                className={`filter-tab ${
                  currentSubTab === 'player' ? 'filter-tab-active' : 'filter-tab-inactive'
                }`}
              >
                <Users size={16} className="mr-2" />
                Player Analytics
              </button>
            </div>
          </div>

          {/* Sub-tab Content */}
          {currentSubTab === 'meta' && (
            <MetaAnalysisSubTab tournamentId={selectedTournament} />
          )}
          {currentSubTab === 'player' && (
            <PlayerAnalyticsSubTab tournamentId={selectedTournament} />
          )}
        </>
      )}

      {!selectedTournament && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Database size={32} className="text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Select a Tournament</h3>
          <p className="text-gray-400">
            Choose a tournament from the dropdown above to view detailed meta analysis and player analytics.
          </p>
        </div>
      )}
    </div>
  );
}