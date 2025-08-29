import React, { useState } from 'react';
import { BarChart3, TrendingUp, Trophy, Users, Calendar, Target, User, Database, X } from 'lucide-react';
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-4xl font-bold flex items-center mb-4">
                <BarChart3 size={40} className="mr-4 text-cyan-400" />
                <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Tournament Analytics
                </span>
              </h1>
              <p className="text-slate-400 text-lg">Analysis of tournament data and player performance</p>
            </div>
            
            {/* Tabs */}
            <div className="flex items-center space-x-6 border-b border-slate-700 pb-2">
              <button
                onClick={() => handleTabChange('overview')}
                className={`relative pb-2 text-sm font-medium transition-colors group flex items-center ${
                  currentTab === 'overview' 
                    ? 'text-cyan-400' 
                    : 'text-slate-400 hover:text-cyan-300'
                }`}
              >
                <Trophy size={16} className="mr-2" />
                Overview
                <span
                  className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-500
                  ${currentTab === 'overview' ? 'w-full' : 'w-0 group-hover:w-full'}`}
                />
              </button>
              <button
                onClick={() => handleTabChange('personal')}
                className={`relative pb-2 text-sm font-medium transition-colors group flex items-center ${
                  currentTab === 'personal' 
                    ? 'text-cyan-400' 
                    : 'text-slate-400 hover:text-cyan-300'
                }`}
              >
                <User size={16} className="mr-2" />
                Personal Stats
                <span
                  className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-500
                  ${currentTab === 'personal' ? 'w-full' : 'w-0 group-hover:w-full'}`}
                />
              </button>
              <button
                onClick={() => handleTabChange('tournament')}
                className={`relative pb-2 text-sm font-medium transition-colors group flex items-center ${
                  currentTab === 'tournament' 
                    ? 'text-cyan-400' 
                    : 'text-slate-400 hover:text-cyan-300'
                }`}
              >
                <Database size={16} className="mr-2" />
                Tournament Analysis
                <span
                  className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-500
                  ${currentTab === 'tournament' ? 'w-full' : 'w-0 group-hover:w-full'}`}
                />
              </button>
              <button
                onClick={() => handleTabChange('community')}
                className={`relative pb-2 text-sm font-medium transition-colors group flex items-center ${
                  currentTab === 'community' 
                    ? 'text-cyan-400' 
                    : 'text-slate-400 hover:text-cyan-300'
                }`}
              >
                <Users size={16} className="mr-2" />
                Community Analytics
                <span
                  className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-500
                  ${currentTab === 'community' ? 'w-full' : 'w-0 group-hover:w-full'}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-slate-900/50 border border-cyan-500/30 rounded-none backdrop-blur-sm">
          {currentTab === 'overview' && <OverviewTab />}
          {currentTab === 'personal' && <PersonalStatsTab />}
          {currentTab === 'tournament' && <TournamentAnalysisTab />}
          {currentTab === 'community' && <CommunityAnalyticsTab />}
        </div>
      </div>
    </div>
  );
}