import React from 'react';
import { Users, BarChart3, TrendingUp, Target } from 'lucide-react';

export function CommunityAnalytics() {
  return (
    <div className="page-container">
      <div className="content-wrapper">
        <div className="page-header">
          <h1 className="page-title flex items-center">
            <Users size={32} className="mr-3 text-green-600" />
            Community Analytics
          </h1>
          <p className="page-subtitle">Track and grow communities across the platform</p>
        </div>

        {/* Coming Soon Card */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
              <BarChart3 size={48} className="text-white" />
            </div>
            
            <h2 className="text-4xl font-bold text-green-900 mb-4">Community Analytics</h2>
            <div className="inline-block bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-full font-bold text-lg mb-6 shadow-lg">
              COMING SOON
            </div>
            
            <p className="text-green-800 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
              Soon, every community will be able to track engagement, growth, and tournament participation. 
              Gain insights, compare statistics, and help your community thrive.
            </p>

            {/* Feature Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-green-200">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <TrendingUp size={24} className="text-green-600" />
                </div>
                <h3 className="font-bold text-green-900 mb-2">Growth Metrics</h3>
                <p className="text-green-700 text-sm">Track new member growth and community activity trends</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-green-200">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Target size={24} className="text-emerald-600" />
                </div>
                <h3 className="font-bold text-green-900 mb-2">Engagement Insights</h3>
                <p className="text-green-700 text-sm">Analyze posts, discussions, and tournament participation</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-green-200">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users size={24} className="text-green-600" />
                </div>
                <h3 className="font-bold text-green-900 mb-2">Community Comparison</h3>
                <p className="text-green-700 text-sm">Compare stats across different communities for insights and growth opportunities</p>
              </div>
            </div>

            <div className="bg-white/40 backdrop-blur-sm border border-green-200 rounded-xl p-6 max-w-md mx-auto">
              <h4 className="font-bold text-green-900 mb-3">Planned Features:</h4>
              <div className="space-y-2 text-sm text-green-800 text-left">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Community growth tracking
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Engagement analytics and trends
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Community comparison and insights
                </div>
              </div>
            </div>

            <div className="mt-8 text-green-600 text-sm">
              Community analytics is coming soon — empowering every community to grow stronger!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
