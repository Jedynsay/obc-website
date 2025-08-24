import React from 'react';
import { Users, Shield, BarChart3, Tag } from 'lucide-react';

export function TeamManager() {
  return (
    <div className="page-container">
      <div className="content-wrapper">
        <div className="page-header">
          <h1 className="page-title flex items-center">
            <Users size={32} className="mr-3 text-purple-600" />
            Team Manager
          </h1>
          <p className="page-subtitle">Build your team and compete together</p>
        </div>

        {/* Team Manager Coming Soon Card */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
              <Users size={48} className="text-white" />
            </div>
            
            <h2 className="text-4xl font-bold text-purple-900 mb-4">Team Manager</h2>
            <div className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-full font-bold text-lg mb-6 shadow-lg">
              COMING SOON
            </div>
            
            <p className="text-purple-800 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
              Compete not just as players, but as teams. The Team Manager will bring 
              team-based tournaments, performance analytics, and name tag customization 
              so every blader can proudly represent their squad.
            </p>

            {/* Feature Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-purple-200">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield size={24} className="text-purple-600" />
                </div>
                <h3 className="font-bold text-purple-900 mb-2">Team Tournaments</h3>
                <p className="text-purple-700 text-sm">Organize and battle in team vs team competitions</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-purple-200">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 size={24} className="text-indigo-600" />
                </div>
                <h3 className="font-bold text-purple-900 mb-2">Team Analytics</h3>
                <p className="text-purple-700 text-sm">Track your team’s performance and stats</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-purple-200">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Tag size={24} className="text-purple-600" />
                </div>
                <h3 className="font-bold text-purple-900 mb-2">Name Tags</h3>
                <p className="text-purple-700 text-sm">Show off your team name on your profile</p>
              </div>
            </div>

            <div className="bg-white/40 backdrop-blur-sm border border-purple-200 rounded-xl p-6 max-w-md mx-auto">
              <h4 className="font-bold text-purple-900 mb-3">Planned Features:</h4>
              <div className="space-y-2 text-sm text-purple-800 text-left">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Team vs team tournaments
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Team performance analytics
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Name tag integration for players
                </div>
              </div>
            </div>

            <div className="mt-8 text-purple-600 text-sm">
              Team play is coming soon — get ready to represent your squad!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
