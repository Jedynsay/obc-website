import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';

export default function Tournaments() {
  const [activeTab, setActiveTab] = useState('all');
  const [showPractice, setShowPractice] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = [
    { id: 'all', label: 'All Tournaments' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Past' },
    { id: 'registered', label: 'Registered' },
  ];

  return (
    <div className="p-6 text-white">
      {/* Header */}
      <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-6">
        Tournament Arena
      </h1>

      {/* Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        {/* Tabs styled like sidebar */}
        <div className="flex space-x-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-1 py-2 text-sm font-medium transition group 
                ${activeTab === tab.id ? 'text-cyan-400' : 'text-slate-300 hover:text-cyan-400'}`}
            >
              {tab.label}
              <div
                className={`absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-cyan-500 to-purple-500
                  group-hover:w-full transition-all duration-500
                  ${activeTab === tab.id ? 'w-full' : ''}`}
              />
            </button>
          ))}
        </div>

        {/* Right controls: search + toggle */}
        <div className="flex items-center space-x-4">
          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tournaments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>

          {/* Show practice toggle */}
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showPractice}
              onChange={() => setShowPractice(!showPractice)}
              className="sr-only"
            />
            <div className="relative w-10 h-5 bg-slate-700 rounded-full transition">
              <div
                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-md transform transition-transform duration-300
                  ${showPractice ? 'translate-x-5 bg-cyan-400' : ''}`}
              />
            </div>
            <span className="ml-2 text-sm text-slate-300">Show Practice</span>
          </label>
        </div>
      </div>

      {/* Tournament Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Example card */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl shadow-md hover:shadow-cyan-500/20 transition">
          <h2 className="text-xl font-semibold mb-2">Spring Invitational</h2>
          <p className="text-slate-400 text-sm mb-4">March 10, 2025 • Online</p>
          <button className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg shadow hover:opacity-90 transition">
            Register
          </button>
        </div>
      </div>
    </div>
  );
}
