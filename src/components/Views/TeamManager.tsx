import React from 'react';
import { Users, Plus, Settings, Crown, UserPlus, UserMinus, Shield, MessageSquare, Heart, Star } from 'lucide-react';

export function TeamManager() {
  return (
    <div className="page-container">
      <div className="content-wrapper">
        <div className="page-header">
          <h1 className="page-title flex items-center">
            <Users size={32} className="mr-3 text-purple-600" />
            Team Manager
          </h1>
          <p className="page-subtitle">Create and manage competitive teams</p>
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
              Create competitive teams, manage rosters, and coordinate team tournaments. 
              Perfect for organizing group battles and team-based competitions.
            </p>

            {/* Feature Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-purple-200">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Crown size={24} className="text-purple-600" />
                </div>
                <h3 className="font-bold text-purple-900 mb-2">Team Creation</h3>
                <p className="text-purple-700 text-sm">Create teams with custom names, logos, and member roles</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-purple-200">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <UserPlus size={24} className="text-indigo-600" />
                </div>
                <h3 className="font-bold text-purple-900 mb-2">Member Management</h3>
                <p className="text-purple-700 text-sm">Add, remove, and assign roles to team members</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-purple-200">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield size={24} className="text-purple-600" />
                </div>
                <h3 className="font-bold text-purple-900 mb-2">Team Tournaments</h3>
                <p className="text-purple-700 text-sm">Organize and participate in team-based competitions</p>
              </div>
            </div>

            <div className="bg-white/40 backdrop-blur-sm border border-purple-200 rounded-xl p-6 max-w-md mx-auto">
              <h4 className="font-bold text-purple-900 mb-3">Planned Features:</h4>
              <div className="space-y-2 text-sm text-purple-800 text-left">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Team creation and customization
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Member invitation system
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Team-based tournament registration
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Team performance analytics
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Role-based permissions
                </div>
              </div>
            </div>

            <div className="mt-8 text-purple-600 text-sm">
              Stay tuned for updates! This feature is in active development.
            </div>
          </div>
        </div>

        {/* Community Manager Coming Soon Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-200 rounded-2xl p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
              <Heart size={48} className="text-white" />
            </div>
            
            <h2 className="text-4xl font-bold text-pink-900 mb-4">Community Manager</h2>
            <div className="inline-block bg-gradient-to-r from-pink-600 to-rose-600 text-white px-6 py-2 rounded-full font-bold text-lg mb-6 shadow-lg">
              COMING SOON
            </div>
            
            <p className="text-pink-800 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
              Foster community engagement, manage events, and build connections within the Beyblade community. 
              Perfect for organizing social activities and community outreach.
            </p>

            {/* Feature Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-pink-200">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={24} className="text-pink-600" />
                </div>
                <h3 className="font-bold text-pink-900 mb-2">Community Events</h3>
                <p className="text-pink-700 text-sm">Organize meetups, workshops, and social gatherings</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-pink-200">
                <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Star size={24} className="text-rose-600" />
                </div>
                <h3 className="font-bold text-pink-900 mb-2">Member Recognition</h3>
                <p className="text-pink-700 text-sm">Highlight achievements and celebrate milestones</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-pink-200">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Heart size={24} className="text-pink-600" />
                </div>
                <h3 className="font-bold text-pink-900 mb-2">Community Outreach</h3>
                <p className="text-pink-700 text-sm">Connect with new players and grow the community</p>
              </div>
            <div className="bg-white/40 backdrop-blur-sm border border-pink-200 rounded-xl p-6 max-w-md mx-auto">
              <h4 className="font-bold text-pink-900 mb-3">Planned Features:</h4>
              <div className="space-y-2 text-sm text-pink-800 text-left">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-pink-500 rounded-full mr-3"></span>
                  Community event planning and management
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-pink-500 rounded-full mr-3"></span>
                  Member spotlight and achievements
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-pink-500 rounded-full mr-3"></span>
                  Community feedback and suggestions
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-pink-500 rounded-full mr-3"></span>
                  Social media integration
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-pink-500 rounded-full mr-3"></span>
                  Community growth analytics
                </div>
              </div>
            </div>
            </div>
            <div className="mt-8 text-pink-600 text-sm">
              Building stronger communities together! This feature is in active development.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}