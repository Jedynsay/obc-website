import React from 'react';
import { Trophy, Users, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { mockAnalytics, mockTournaments, mockNews } from '../../data/mockData';

export function Dashboard() {
  const { user } = useAuth();
  const upcomingTournaments = mockTournaments.filter(t => t.status === 'upcoming').slice(0, 3);
  const featuredNews = mockNews.filter(n => n.featured).slice(0, 2);

  const stats = [
    { icon: Trophy, label: 'Total Tournaments', value: mockAnalytics.totalTournaments, color: 'text-blue-600' },
    { icon: Users, label: 'Active Players', value: mockAnalytics.activePlayers, color: 'text-green-600' },
    { icon: Calendar, label: 'Upcoming Events', value: mockAnalytics.upcomingEvents, color: 'text-orange-600' },
    { icon: TrendingUp, label: 'Completed Matches', value: mockAnalytics.completedMatches, color: 'text-purple-600' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Demo Mode Banner */}
      {user?.id.startsWith('guest-') && (
        <div className="mb-6 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">🎭 Demo Mode Active</h3>
              <p className="text-purple-100">
                You're currently viewing as: <span className="font-semibold capitalize">{user.role.replace('_', ' ')}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-purple-200">
                Switch roles using the demo button in the header
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.username}!
        </h1>
        <p className="text-gray-600">
          {user?.id.startsWith('guest-') 
            ? `Exploring the ${user.role.replace('_', ' ')} dashboard - Here's what's happening in the Beyblade community`
            : "Here's what's happening in the Beyblade community"
          }
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg bg-gray-100 ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Tournaments */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Tournaments</h2>
          <div className="space-y-4">
            {upcomingTournaments.map((tournament) => (
              <div key={tournament.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <h3 className="font-semibold text-gray-900">{tournament.name}</h3>
                <p className="text-sm text-gray-600">{tournament.date} • {tournament.location}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500">
                    {tournament.currentParticipants}/{tournament.maxParticipants} registered
                  </span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {tournament.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Featured News */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Latest News</h2>
          <div className="space-y-4">
            {featuredNews.map((news) => (
              <div key={news.id} className="border-b border-gray-200 last:border-b-0 pb-4 last:pb-0">
                <h3 className="font-semibold text-gray-900 mb-2">{news.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{news.content.substring(0, 120)}...</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">By {news.author}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    news.category === 'tournament' ? 'bg-orange-100 text-orange-800' :
                    news.category === 'announcement' ? 'bg-red-100 text-red-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {news.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}