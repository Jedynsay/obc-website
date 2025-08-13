import React, { useState } from 'react';
import { Menu, X, User, LogOut, Settings, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LoginForm } from '../Auth/LoginForm';

interface HeaderProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

export function Header({ onMenuToggle, isMenuOpen }: HeaderProps) {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'technical_officer': return 'bg-blue-500';
      case 'developer': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <header className="bg-gradient-to-r from-slate-900/95 to-blue-900/95 backdrop-blur-md border-b border-slate-700/50 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-800/50 transition-all duration-300 hover:shadow-glow"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-energy-400 to-battle-500 rounded-full flex items-center justify-center font-orbitron font-bold text-lg shadow-energy animate-spin-slow">
                ⚡
              </div>
              <div>
                <h1 className="text-xl font-orbitron font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  BEYBLADE
                </h1>
                <p className="text-xs text-slate-400 font-rajdhani">COMMUNITY</p>
              </div>
            </div>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800/50 transition-all duration-300 hover:shadow-glow beyblade-glow"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center font-orbitron font-bold text-sm">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="font-rajdhani font-semibold text-white">{user.username}</p>
                    <p className={`text-xs font-rajdhani capitalize ${getRoleColor(user.role)}`}>
                      {user.role.replace('_', ' ')}
                    </p>
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-800/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl z-50">
                    <div className="py-1">
                      <div className="px-4 py-3 border-b border-slate-700/50">
                        <p className="font-rajdhani font-semibold text-white">{user.username}</p>
                        <p className="text-sm text-slate-400 capitalize font-rajdhani">{user.role.replace('_', ' ')}</p>
                      </div>
                      <button className="w-full text-left px-4 py-3 hover:bg-slate-700/50 flex items-center space-x-2 text-slate-300 hover:text-white transition-colors">
                        <Settings size={16} />
                        <span className="font-rajdhani">Settings</span>
                      </button>
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-3 hover:bg-red-900/20 flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <LogOut size={16} />
                        <span className="font-rajdhani">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!user && (
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowLoginModal(true)}
                className="beyblade-button flex items-center space-x-2"
              >
                <LogIn size={20} />
                <span className="hidden sm:block font-rajdhani font-semibold">Login</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => {
            setShowUserMenu(false);
          }}
        />
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center py-12">
            <div className="relative">
              <LoginForm onLoginSuccess={() => setShowLoginModal(false)} />
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute -top-2 -right-2 p-2 bg-slate-800/90 hover:bg-slate-700/90 rounded-full transition-colors text-white hover:text-red-400"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}