import React from 'react';
import { BarChart3, TrendingUp, Trophy, Users, Calendar, Target } from 'lucide-react';
import { mockAnalytics, mockTournaments, mockMatches } from '../../data/mockData';

export function Analytics() {
  const completedTournaments = mockTournaments.filter(t => t.status === 'completed');
  const activeTournaments = mockTournaments.filter(t => t.status === 'active').length;
  const upcomingTournaments = mockTournaments.filter(t => t.status === 'upcoming').length;
  
  const winRates = [
    { player: 'BladeSpinner', wins: 8, matches: 10, winRate: 80 },
    { player: 'StormBreaker', wins: 6, matches: 9, winRate: 67 },
    { player: 'FlamePhoenix', wins: 7, matches: 12, winRate: 58 },
    { player: 'IronDefender', wins: 5, matches: 8, winRate: 63 },
  ];

  const stats = [
    { icon: Trophy, label: 'Total Tournaments', value: mockAnalytics.totalTournaments, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { icon: Users, label: 'Active Players', value: mockAnalytics.activePlayers, color: 'text-green-600', bgColor: 'bg-green-100' },
    { icon: Target, label: 'Completed Matches', value: mockAnalytics.completedMatches, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { icon: Calendar, label: 'Upcoming Events', value: mockAnalytics.upcomingEvents, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tournament Analytics</h1>
        <p className="text-gray-600">Comprehensive tournament and player statistics</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor} ${stat.color}`}>
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
        {/* Tournament Status Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="mr-2" size={24} />
            Tournament Status
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Completed</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(completedTournaments.length / mockTournaments.length) * 100}%` }}></div>
                </div>
                <span className="text-sm font-medium">{completedTournaments.length}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Active</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(activeTournaments / mockTournaments.length) * 100}%` }}></div>
                </div>
                <span className="text-sm font-medium">{activeTournaments}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Upcoming</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${(upcomingTournaments / mockTournaments.length) * 100}%` }}></div>
                </div>
                <span className="text-sm font-medium">{upcomingTournaments}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Players Win Rates */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="mr-2" size={24} />
            Top Player Win Rates
          </h2>
          <div className="space-y-4">
            {winRates.map((player, index) => (
              <div key={player.player} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{player.player}</p>
                    <p className="text-sm text-gray-600">{player.wins}/{player.matches} matches</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-gray-900">{player.winRate}%</p>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${player.winRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Match Statistics */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Match Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {mockMatches.filter(m => m.status === 'completed').length}
            </div>
            <p className="text-gray-600">Completed Matches</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {mockMatches.filter(m => m.status === 'in_progress').length}
            </div>
            <p className="text-gray-600">Ongoing Matches</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {mockMatches.filter(m => m.status === 'pending').length}
            </div>
            <p className="text-gray-600">Scheduled Matches</p>
          </div>
        </div>
      </div>
    </div>
  );
}