import React, { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Save, X,
  Calendar, MapPin, Users, Trophy, Eye, EyeOff
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useConfirmation } from '../../context/ConfirmationContext';

export function TournamentManager() {
  const { user } = useAuth();
  const { confirm, alert } = useConfirmation();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [currentView, setCurrentView] = useState<'tournaments' | 'registrations'>('tournaments');
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin' || user?.role === 'developer';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">🔒</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-slate-400">
            You need admin or developer permissions to access tournament management.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center mb-4">
            <Trophy size={40} className="mr-4 text-cyan-400" />
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Tournament Manager
            </span>
          </h1>
          <p className="text-slate-400 text-lg">Create and manage tournaments with style</p>
        </div>

        {/* Tabs (Tournaments / Registrations) */}
        <div className="flex space-x-8 border-b border-slate-700 mb-8">
          {['tournaments', 'registrations'].map((tab) => (
            <button
              key={tab}
              onClick={() => setCurrentView(tab as any)}
              className={`relative pb-2 text-sm font-medium capitalize transition-colors group ${
                currentView === tab
                  ? 'text-cyan-400'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              {tab}
              <span
                className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-500
                ${currentView === tab ? 'w-full' : 'w-0 group-hover:w-full'}`}
              />
            </button>
          ))}
        </div>
        {/* Tournament Form */}
        {currentView === 'tournaments' && (
          <div className="bg-slate-900/40 border border-slate-700 p-6 mb-8">
            <h2 className="text-xl font-bold mb-6">Create / Edit Tournament</h2>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-none text-sm
                             focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-none text-sm
                             focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-none text-sm
                             focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Max Participants</label>
                <input
                  type="number"
                  placeholder="999999 = Unlimited"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-none text-sm
                             focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-none text-sm
                             focus:outline-none focus:ring-1 focus:ring-cyan-500"
                ></textarea>
              </div>

              {/* Buttons */}
              <div className="md:col-span-2 flex space-x-4 mt-4">
                <button
                  type="submit"
                  className="px-6 py-2 text-sm font-semibold text-white
                             bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300
                             hover:from-cyan-400 hover:to-purple-400"
                >
                  Save Tournament
                </button>
                <button
                  type="button"
                  className="px-6 py-2 text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        {/* Tournament List */}
        {currentView === 'tournaments' && (
          <div>
            <h2 className="text-xl font-bold mb-6">Manage Tournaments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className="group relative border border-slate-700 bg-slate-900/40 p-6 rounded-none 
                             transition-all duration-300 hover:border-cyan-400/70 
                             hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                >
                  {/* Animated bottom underline */}
                  <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 
                                   w-0 transition-all duration-500 group-hover:w-full" />

                  {/* Status + Practice tags */}
                  <div className="absolute top-3 right-3 flex space-x-2">
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-sm
                        ${tournament.status === 'active'
                          ? 'text-green-400 bg-green-400/10'
                          : tournament.status === 'completed'
                          ? 'text-purple-400 bg-purple-400/10'
                          : 'text-cyan-400 bg-cyan-400/10'
                        }`}
                    >
                      {tournament.status.toUpperCase()}
                    </span>
                    {tournament.is_practice && (
                      <span className="px-2 py-0.5 text-xs font-semibold text-yellow-400 bg-yellow-400/10 rounded-sm">
                        Practice
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold mb-2 pr-24">{tournament.name}</h3>
                  <p className="text-slate-400 text-sm mb-3 line-clamp-2">{tournament.description}</p>

                  {/* Details */}
                  <div className="flex items-center text-slate-400 text-sm mb-2">
                    <Calendar size={14} className="mr-2 text-cyan-400" />
                    {new Date(tournament.tournament_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-slate-400 text-sm mb-2">
                    <MapPin size={14} className="mr-2 text-cyan-400" />
                    {tournament.location}
                  </div>
                  <div className="flex items-center text-slate-400 text-sm mb-4">
                    <Users size={14} className="mr-2 text-cyan-400" />
                    {tournament.max_participants === 999999 ? (
                      <>{tournament.participants?.length || 0} players</>
                    ) : (
                      <>{tournament.participants?.length || 0} / {tournament.max_participants} players</>
                    )}
                  </div>

                  {/* Progress Bar (hidden if unlimited) */}
                  {tournament.max_participants !== 999999 && (
                    <div className="w-full h-2 bg-slate-800 mb-4 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-700"
                        style={{
                          width: `${
                            ((tournament.participants?.length || 0) / tournament.max_participants) * 100
                          }%`,
                        }}
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between mt-4 space-x-2">
                    <button
                      onClick={() => handleEditTournament(tournament)}
                      className="flex-1 px-3 py-2 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-purple-500 
                                 hover:from-cyan-400 hover:to-purple-400 transition-all duration-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTournament(tournament.id)}
                      className="px-3 py-2 text-sm font-semibold text-red-400 border border-red-400/40 hover:bg-red-500/10 transition"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleManageTournament(tournament.id)}
                      className="flex-1 px-3 py-2 text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Registrations */}
        {currentView === 'registrations' && (
          <div>
            <h2 className="text-xl font-bold mb-6">Manage Registrations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {registrations.map((reg) => (
                <div
                  key={reg.id}
                  className="group relative border border-slate-700 bg-slate-900/40 p-6 rounded-none 
                             transition-all duration-300 hover:border-cyan-400/70 
                             hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                >
                  {/* Animated underline */}
                  <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 
                                   w-0 transition-all duration-500 group-hover:w-full" />

                  {/* Status badge */}
                  <span
                    className={`absolute top-3 right-3 px-2 py-0.5 text-xs font-semibold rounded-sm
                      ${reg.status === 'approved'
                        ? 'text-green-400 bg-green-400/10'
                        : reg.status === 'rejected'
                        ? 'text-red-400 bg-red-400/10'
                        : 'text-yellow-400 bg-yellow-400/10'
                      }`}
                  >
                    {reg.status.toUpperCase()}
                  </span>

                  {/* Player info */}
                  <h3 className="text-lg font-bold mb-2">{reg.player_name}</h3>
                  <p className="text-slate-400 text-sm mb-3">
                    Tournament: {tournaments.find((t) => t.id === reg.tournament_id)?.name || "Unknown"}
                  </p>

                  <div className="text-slate-400 text-sm mb-2">
                    <Users size={14} className="inline mr-1 text-cyan-400" />
                    Beyblades: {reg.beyblades?.length || 0}
                  </div>

                  <div className="text-slate-400 text-sm mb-4">
                    <Calendar size={14} className="inline mr-1 text-cyan-400" />
                    Registered on {new Date(reg.created_at).toLocaleDateString()}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between mt-4 space-x-2">
                    <button
                      onClick={() => handleApproveRegistration(reg.id)}
                      className="flex-1 px-3 py-2 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-purple-500 
                                 hover:from-cyan-400 hover:to-purple-400 transition-all duration-300"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectRegistration(reg.id)}
                      className="px-3 py-2 text-sm font-semibold text-red-400 border border-red-400/40 hover:bg-red-500/10 transition"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleViewRegistration(reg.id)}
                      className="flex-1 px-3 py-2 text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
