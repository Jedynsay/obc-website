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
      <div className="text-center py-12 m-6">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400">Loading tournaments...</p>
      </div>
    );
  }

  if (isTransitioning) {
    return (
      <div className="text-center py-12 m-6">
        <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Tournament Selection */}
      <div className="bg-slate-900/50 border border-cyan-500/30 rounded-xl p-6 backdrop-blur-sm">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <Database size={24} className="mr-2 text-cyan-400" />
          Tournament Selection
        </h2>
        <div className="max-w-md">
          <label className="block text-sm font-medium text-cyan-400 mb-2">
            Select Tournament for Analysis
          </label>
          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
          <div className="bg-slate-900/50 border border-cyan-500/30 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center space-x-1 bg-slate-800/50 border border-cyan-500/20 rounded-lg p-1">
              <button
                onClick={() => handleSubTabChange('meta')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 flex items-center ${
                  currentSubTab === 'meta' 
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,200,255,0.3)]' 
                    : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50'
                }`}
              >
                <BarChart3 size={16} className="mr-2" />
                Meta Analysis
              </button>
              <button
                onClick={() => handleSubTabChange('player')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 flex items-center ${
                  currentSubTab === 'player' 
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,200,255,0.3)]' 
                    : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50'
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
        <div className="bg-slate-900/50 border border-cyan-500/30 rounded-xl p-8 text-center m-6">
          <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Database size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Select a Tournament</h3>
          <p className="text-slate-400">
            Choose a tournament from the dropdown above to view detailed meta analysis and player analytics.
          </p>
        </div>
      )}
    </div>
  );
}