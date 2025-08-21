import React, { useState } from 'react';
import { Trophy, Layers, ArrowRight, ChevronRight, Settings, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export function HeroSection({ user, onViewChange, onLoginClick, onLogout }) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-6 py-6 mt-[-80px] bg-slate-800/50 backdrop-blur-md rounded-xl shadow-md relative"
    >
      {/* User Menu */}
      {user && !user.id.startsWith('guest-') && (
        <div className="absolute top-4 right-4">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 bg-slate-700/90 rounded-lg px-3 py-1 hover:bg-slate-600 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-sm">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-sm">{user.username}</span>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-slate-700 border border-slate-600 rounded-lg shadow-lg">
                <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-600" onClick={() => setShowUserMenu(false)}>
                  <Settings size={16} /> Settings
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-600 text-red-400"
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
          <button onClick={onLoginClick} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg text-sm font-medium">
            Login
          </button>
        </div>
      ) : null}

      {/* Welcome Text + Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-lg text-slate-200">
            Welcome back, <span className="font-semibold text-blue-400">{user ? user.username : 'Blader'}</span>
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Ready to check tournaments or build your decks?
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onViewChange?.('tournaments')}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium text-sm"
          >
            <Trophy size={16} /> Tournaments <ArrowRight size={14} />
          </button>
          <button
            onClick={() => onViewChange?.('inventory')}
            className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-medium text-sm border border-slate-600"
          >
            <Layers size={16} /> Deck Builder <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </motion.section>
  );
}
