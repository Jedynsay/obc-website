import React from 'react';
import { Heart, MessageSquare, Star, Calendar, Users, Megaphone, Award, TrendingUp } from 'lucide-react';

export function CommunityManager() {
  return (
    <div className="page-container">
      <div className="content-wrapper">
        <div className="page-header">
          <h1 className="page-title flex items-center">
            <Heart size={32} className="mr-3 text-pink-600" />
            Community Manager
          </h1>
          <p className="page-subtitle">Foster community engagement and build connections</p>
        </div>

        {/* Coming Soon Card */}
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
              Perfect for organizing social activities and community outreach programs.
            </p>

            {/* Feature Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-pink-200">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Calendar size={24} className="text-pink-600" />
                </div>
                <h3 className="font-bold text-pink-900 mb-2">Event Planning</h3>
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
                  <Megaphone size={24} className="text-pink-600" />
                </div>
                <h3 className="font-bold text-pink-900 mb-2">Community Outreach</h3>
                <p className="text-pink-700 text-sm">Connect with new players and grow the community</p>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-pink-200">
                <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <TrendingUp size={24} className="text-rose-600" />
                </div>
                <h3 className="font-bold text-pink-900 mb-2">Growth Analytics</h3>
                <p className="text-pink-700 text-sm">Track community growth and engagement metrics</p>
              </div>
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
                  Member spotlight and achievements system
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-pink-500 rounded-full mr-3"></span>
                  Community feedback and suggestion box
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-pink-500 rounded-full mr-3"></span>
                  Social media integration and sharing
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-pink-500 rounded-full mr-3"></span>
                  Community growth and engagement analytics
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-pink-500 rounded-full mr-3"></span>
                  Welcome program for new members
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