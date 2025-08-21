import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Trophy, Users, Calendar, Target, User, Database } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { OverviewTab } from './Analytics/OverviewTab';
import { PersonalStatsTab } from './Analytics/PersonalStatsTab';
import { TournamentAnalysisTab } from './Analytics/TournamentAnalysisTab';

export function Analytics() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<'overview' | 'personal' | 'tournament'>('overview');
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const handleTabChange = (tab: 'overview' | 'personal' | 'tournament') => {
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
      <div className="page-container">
        <div className="content-wrapper">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="content-wrapper">
        <div className="page-header">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="page-title flex items-center">
                <BarChart3 size={32} className="mr-3 text-blue-600" />
                Tournament Analytics
              </h1>
              <p className="page-subtitle">Comprehensive tournament and player statistics</p>
            </div>
            <div className="filter-tabs">
              <button
                onClick={() => handleTabChange('overview')}
                className={`filter-tab ${
                  currentTab === 'overview' ? 'filter-tab-active' : 'filter-tab-inactive'
                }`}
              >
                <Trophy size={16} className="mr-2" />
                Overview
              </button>
              <button
                onClick={() => handleTabChange('personal')}
                className={`filter-tab ${
                  currentTab === 'personal' ? 'filter-tab-active' : 'filter-tab-inactive'
                }`}
              >
                <User size={16} className="mr-2" />
                Personal Stats
              </button>
              <button
                onClick={() => handleTabChange('tournament')}
                className={`filter-tab ${
                  currentTab === 'tournament' ? 'filter-tab-active' : 'filter-tab-inactive'
                }`}
              >
                <Database size={16} className="mr-2" />
                Tournament Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {currentTab === 'overview' && <OverviewTab />}
        {currentTab === 'personal' && <PersonalStatsTab />}
        {currentTab === 'tournament' && <TournamentAnalysisTab />}
      </div>
    </div>
  );
}