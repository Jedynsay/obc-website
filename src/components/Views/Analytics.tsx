import React, { useState } from 'react';
import { BarChart3, TrendingUp, Trophy, Users, Calendar, Target, User, Database } from 'lucide-react';
import { OverviewTab } from './Analytics/OverviewTab';
import { PersonalStatsTab } from './Analytics/PersonalStatsTab';
import { TournamentAnalysisTab } from './Analytics/TournamentAnalysisTab';
import { CommunityAnalyticsTab } from './Analytics/CommunityAnalyticsTab';
import { useAuth } from '../../context/AuthContext';

export function Analytics() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<'overview' | 'personal' | 'tournament' | 'community'>('overview');
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const handleTabChange = (tab: 'overview' | 'personal' | 'tournament' | 'community') => {
    if (tab === currentTab) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentTab(tab);
      setIsTransitioning(false);
    }, 150);
  };

  // Don't render content during transitions
  if (isTransitioning) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Processing analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold flex items-center mb-4">
                <BarChart3 size={40} className="mr-4 text-cyan-400" />
                <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Tournament Analytics
                </span>
              </h1>
              <p className="text-slate-400 text-lg">Analysis of tournament data and player performance</p>
            </div>
            <div className="flex items-center space-x-1 bg-slate-900/50 border border-cyan-500/30 rounded-lg p-1 backdrop-blur-sm">
              <button
                onClick={() => handleTabChange('overview')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 flex items-center ${
                  currentTab === 'overview' 
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,200,255,0.3)]' 
                    : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50'
                }`}
              >
                <Trophy size={16} className="mr-2" />
                Overview
              </button>
              <button
                onClick={() => handleTabChange('personal')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 flex items-center ${
                  currentTab === 'personal' 
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,200,255,0.3)]' 
                    : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50'
                }`}
              >
                <User size={16} className="mr-2" />
                Personal Stats
              </button>
              <button
                onClick={() => handleTabChange('tournament')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 flex items-center ${
                  currentTab === 'tournament' 
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,200,255,0.3)]' 
                    : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50'
                }`}
              >
                <Database size={16} className="mr-2" />
                Tournament Analysis
              </button>
              <button
                onClick={() => handleTabChange('community')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 flex items-center ${
                  currentTab === 'community' 
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,200,255,0.3)]' 
                    : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50'
                }`}
              >
                <Users size={16} className="mr-2" />
                Community Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-slate-900/30 border border-cyan-500/20 rounded-xl backdrop-blur-sm">
          {currentTab === 'overview' && <OverviewTab />}
          {currentTab === 'personal' && <PersonalStatsTab />}
          {currentTab === 'tournament' && <TournamentAnalysisTab />}
          {currentTab === 'community' && <CommunityAnalyticsTab />}
        </div>
      </div>
    </div>
  );
}