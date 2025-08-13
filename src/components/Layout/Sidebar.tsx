import React from 'react';
import { Home, Trophy, Users, BarChart3, Settings, Database, Calendar, Newspaper, Package, Layers } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  currentView: string;
  onViewChange: (view: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
  requiresAuth?: boolean;
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} />, roles: ['user', 'technical_officer', 'admin', 'developer'] },
  { id: 'tournaments', label: 'Tournaments', icon: <Trophy size={20} />, roles: ['user', 'technical_officer', 'admin', 'developer'] },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} />, roles: ['user', 'technical_officer', 'admin', 'developer'] },
  { id: 'inventory', label: 'My Inventory', icon: <Package size={20} />, roles: ['user', 'technical_officer', 'admin', 'developer'] },
  { id: 'deck-builder', label: 'Deck Builder', icon: <Layers size={20} />, roles: ['user', 'technical_officer', 'admin', 'developer'] },
  { id: 'match-tracker', label: 'Match Tracker', icon: <Calendar size={20} />, roles: ['technical_officer', 'admin', 'developer'] },
  { id: 'tournament-manager', label: 'Tournament Manager', icon: <Settings size={20} />, roles: ['admin', 'developer'] },
  { id: 'user-management', label: 'User Management', icon: <Users size={20} />, roles: ['admin', 'developer'] },
  { id: 'database', label: 'Database', icon: <Database size={20} />, roles: ['developer'] },
];

export function Sidebar({ isOpen, currentView, onViewChange }: SidebarProps) {
  const { user } = useAuth();

  const filteredMenuItems = menuItems.filter(item => 
    // For guest users (no user), only show items that don't require auth and are for 'user' role
    !user ? (!item.requiresAuth && item.roles.includes('user')) :
    // For authenticated users, show items based on their role
    item.roles.includes(user.role || 'user')
  );

  return (
    <aside className={`
      fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-md border-r border-slate-700/50 text-white transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="h-full px-4 py-6 overflow-y-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-8 h-8 bg-gradient-to-br from-energy-400 to-battle-500 rounded-full flex items-center justify-center font-orbitron font-bold text-sm shadow-energy animate-spin-slow">
              ⚡
            </div>
            <div>
              <h2 className="font-orbitron font-bold text-sm bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                BEYBLADE
              </h2>
              <p className="text-xs text-slate-400 font-rajdhani">PORTAL</p>
            </div>
          </div>
        </div>
        
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onViewChange(item.id)}
                className={`
                  w-full flex items-center p-3 rounded-lg transition-all duration-300 group font-rajdhani font-medium
                  ${currentView === item.id 
                    ? 'bg-gradient-to-r from-blue-600/80 to-indigo-600/80 text-white shadow-glow border border-blue-500/30' 
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white hover:shadow-glow'
                  }
                `}
              >
                <div className={`${currentView === item.id ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'} transition-colors`}>
                  {item.icon}
                </div>
                <span className="ml-3 font-rajdhani">{item.label}</span>
                {currentView === item.id && (
                  <div className="ml-auto w-2 h-2 bg-blue-400 rounded-full animate-pulse-glow"></div>
                )}
              </button>
            </li>
          ))}
        </ul>
        
        <div className="mt-8 px-2">
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg p-4 border border-slate-600/30">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-6 h-6 bg-gradient-to-br from-energy-400 to-energy-600 rounded-full flex items-center justify-center">
                <span className="text-xs">⚡</span>
              </div>
              <h3 className="font-orbitron font-semibold text-sm text-white">BATTLE READY</h3>
            </div>
            <p className="text-xs text-slate-400 font-rajdhani">
              Tournament management system powered by advanced Beyblade analytics
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}