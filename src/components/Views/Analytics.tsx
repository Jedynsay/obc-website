import React, { useState } from 'react';
import { BarChart3, Trophy, Users, User, Database } from 'lucide-react';
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

  if (isTransitioning) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Processing analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center mb-3">
            <BarChart3 size={32} className="mr-3 text-cyan-400" />
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Tournament Analytics
            </span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Analysis of tournament data and player performance
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-700 mb-6">
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {[
              { id: 'overview', label: 'Overview', icon: <Trophy size={16} className="mr-2" /> },
              { id: 'personal', label: 'Personal Stats', icon: <User size={16} className="mr-2" /> },
              { id: 'tournament', label: 'Tournament Analysis', icon: <Database size={16} className="mr-2" /> },
              { id: 'community', label: 'Community Analytics', icon: <Users size={16} className="mr-2" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`relative pb-2 text-sm sm:text-base font-medium transition-colors group flex items-center ${
                  currentTab === tab.id
                    ? 'text-cyan-400'
                    : 'text-slate-400 hover:text-cyan-300'
                }`}
              >
                {tab.icon}
                {tab.label}
                <span
                  className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-500
                  ${currentTab === tab.id ? 'w-full' : 'w-0 group-hover:w-full'}`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-slate-900/50 border border-cyan-500/30 rounded-none backdrop-blur-sm p-4 sm:p-6">
          {currentTab === 'overview' && <OverviewTab />}
          {currentTab === 'personal' && <PersonalStatsTab />}
          {currentTab === 'tournament' && <TournamentAnalysisTab />}
          {currentTab === 'community' && <CommunityAnalyticsTab />}
        </div>
      </div>
    </div>
  );
}
