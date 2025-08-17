import React, { useState } from 'react';
import { Trophy, Layers, ArrowRight, ChevronRight, Settings, LogOut } from 'lucide-react';

export function HeroSection({ user, onViewChange, onLoginClick, onLogout }) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <section className="relative overflow-hidden bg-slate-950 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-16 relative">
        
        {/* User Menu */}
        {user && !user.id.startsWith('guest-') && (
          <div className="absolute top-4 right-4">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 bg-slate-800/90 rounded-lg px-4 py-2 hover:bg-slate-700 transition-colors"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{user.username}</p>
                  <p className="text-xs text-slate-400">{user.role}</p>
                </div>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg">
                  <button className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-700" onClick={() => setShowUserMenu(false)}>
                    <Settings size={16} /> Settings
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-700 text-red-400"
                    onClick={() => { setShowUserMenu(false); onLogout(); }}>
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Login Button */}
        {!user || user.id.startsWith('guest-') ? (
          <div className="absolute top-4 right-4">
            <button onClick={onLoginClick} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold">
              Login
            </button>
          </div>
        ) : null}

        {/* Hero Text */}
        <div className="max-w-2xl">
          <h1 className="text-5xl font-bold leading-tight">
            Welcome back, <span className="text-blue-400">{user ? user.username : 'Blader'}</span>
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            Create decks. Register tournaments. Dominate the leaderboards. Let it rip.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button onClick={() => onViewChange?.('tournaments')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold">
              <Trophy size={20} /> Check Tournaments <ArrowRight size={16} />
            </button>
            <button onClick={() => onViewChange?.('inventory')}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-lg border border-slate-600">
              <Layers size={20} /> Deck Builder <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
