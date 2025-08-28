import React, { useEffect } from 'react';
import {
  Home, Trophy, Users, BarChart3, Settings,
  Database, Package, X, LogIn, LogOut, Crown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LoginForm } from '../Auth/LoginForm';

interface SidebarProps {
  isOpen: boolean;
  currentView: string;
  onViewChange: (view: string) => void;
  onToggle: () => void;
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
  { id: 'leaderboards', label: 'Leaderboards', icon: <Crown size={20} />, roles: ['user', 'technical_officer', 'admin', 'developer'] },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} />, roles: ['user', 'technical_officer', 'admin', 'developer'] },
  { id: 'parts-database', label: 'Parts Database', icon: <Database size={20} />, roles: ['user', 'technical_officer', 'admin', 'developer'] },
  { id: 'inventory', label: 'Inventory & Decks', icon: <Package size={20} />, roles: ['user', 'technical_officer', 'admin', 'developer'] },
  { id: 'team-manager', label: 'Team Manager', icon: <Users size={20} />, roles: ['user', 'technical_officer', 'admin', 'developer'] },
  { id: 'community-manager', label: 'Community Manager', icon: <Users size={20} />, roles: ['user', 'technical_officer', 'admin', 'developer'] },
  { id: 'tournament-manager', label: 'Tournament Manager', icon: <Settings size={20} />, roles: ['admin', 'developer'] },
  { id: 'user-management', label: 'User Management', icon: <Users size={20} />, roles: ['admin', 'developer'] },
  { id: 'database', label: 'Database', icon: <Database size={20} />, roles: ['developer'] },
];

export function Sidebar({ isOpen, currentView, onViewChange, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = React.useState(false);

  const filteredMenuItems = menuItems.filter(item =>
    !user ? (!item.requiresAuth && item.roles.includes('user')) :
    item.roles.includes(user.role || 'user')
  );

  const handleLogout = async () => {
    await logout();
    onToggle();
  };

  // Detect mouse near left edge on desktop
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth > 768) { // Desktop only
        if (e.clientX <= 20 && !isOpen) {
          onToggle();
        } else if (e.clientX > 200 && isOpen) {
          onToggle();
        }
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isOpen, onToggle]);

  // Mobile outside-click close (ignore hamburger)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (window.innerWidth <= 768 && isOpen) {
        const sidebarEl = document.getElementById('app-sidebar');
        const toggleBtn = document.getElementById('sidebar-toggle-btn');
        if (
          sidebarEl &&
          !sidebarEl.contains(e.target as Node) &&
          toggleBtn &&
          !toggleBtn.contains(e.target as Node)
        ) {
          onToggle();
        }
      }
    };
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen, onToggle]);

  return (
    <>
      {/* Backdrop for all screen sizes when sidebar is open */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30" />
      )}

      <aside
        id="app-sidebar"
        className={`fixed left-0 top-0 z-50 h-screen flex flex-col 
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        bg-slate-950 border-r border-cyan-500/30 w-64 shadow-[0_0_30px_rgba(0,200,255,0.2)]`}
        style={{ pointerEvents: 'auto' }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/30 bg-gradient-to-r from-slate-900 to-slate-950">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-lg text-white shadow-[0_0_15px_rgba(0,200,255,0.5)]">
              B
            </div>
            {isOpen && (
              <div>
                <h1 className="text-xl font-bold text-white">OBC Portal</h1>
                <p className="text-xs text-cyan-400">Ormoc Beyblade Club</p>
              </div>
            )}
          </div>
          {isOpen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="p-2 hover:bg-cyan-500/20 rounded-lg transition-colors text-cyan-400 hover:text-white"
            >
              <X size={20} />
            </button>
          )}
        </div>

<div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
  {/* Overview */}
  <div>
    {isOpen && <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Overview</p>}
    <ul className="space-y-1">
      {['dashboard', 'tournaments', 'analytics'].map((id) => {
        const item = menuItems.find(m => m.id === id)!;
        return (
          <li key={id}>
            <button
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center px-2 py-2 relative transition group
                ${currentView === item.id ? 'text-cyan-400' : 'text-slate-300 hover:text-cyan-400'}
              `}
            >
              <div className="mr-3">{item.icon}</div>
              {isOpen && <span className="ml-3 font-medium">{item.label}</span>}
              <div
                className={`absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-cyan-500 to-purple-500
                  group-hover:w-full transition-all duration-500
                  ${currentView === item.id ? 'w-full' : ''}
                `}
              />
            </button>
          </li>
        );
      })}
    </ul>
  </div>

  {/* Database */}
  <div>
    {isOpen && <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Database</p>}
    <ul className="space-y-1">
      {['parts-database', 'inventory'].map((id) => {
        const item = menuItems.find(m => m.id === id)!;
        return (
          <li key={id}>
            <button
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center px-2 py-2 relative transition group
                ${currentView === item.id ? 'text-cyan-400' : 'text-slate-300 hover:text-cyan-400'}
              `}
            >
              <div className="mr-3">{item.icon}</div>
              {isOpen && <span className="ml-3 font-medium">{item.label}</span>}
              <div
                className={`absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-cyan-500 to-purple-500
                  group-hover:w-full transition-all duration-500
                  ${currentView === item.id ? 'w-full' : ''}
                `}
              />
            </button>
          </li>
        );
      })}
    </ul>
  </div>

  {/* Management */}
  <div>
    {isOpen && <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Management</p>}
    <ul className="space-y-1">
      {['team-manager', 'community-manager', 'tournament-manager', 'user-management'].map((id) => {
        const item = menuItems.find(m => m.id === id)!;
        return (
          <li key={id}>
            <button
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center px-2 py-2 relative transition group
                ${currentView === item.id ? 'text-cyan-400' : 'text-slate-300 hover:text-cyan-400'}
              `}
            >
              <div className="mr-3">{item.icon}</div>
              {isOpen && <span className="ml-3 font-medium">{item.label}</span>}
              <div
                className={`absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-cyan-500 to-purple-500
                  group-hover:w-full transition-all duration-500
                  ${currentView === item.id ? 'w-full' : ''}
                `}
              />
            </button>
          </li>
        );
      })}
    </ul>
  </div>

  {/* Developer */}
  <div>
    {isOpen && <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Developer</p>}
    <ul className="space-y-1">
      {['database'].map((id) => {
        const item = menuItems.find(m => m.id === id)!;
        return (
          <li key={id}>
            <button
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center px-2 py-2 relative transition group
                ${currentView === item.id ? 'text-cyan-400' : 'text-slate-300 hover:text-cyan-400'}
              `}
            >
              <div className="mr-3">{item.icon}</div>
              {isOpen && <span className="ml-3 font-medium">{item.label}</span>}
              <div
                className={`absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-cyan-500 to-purple-500
                  group-hover:w-full transition-all duration-500
                  ${currentView === item.id ? 'w-full' : ''}
                `}
              />
            </button>
          </li>
        );
      })}
    </ul>
  </div>
</div>


        {/* Auth Section */}
        <div className="px-4 border-t border-cyan-500/30 py-4 bg-gradient-to-r from-slate-950 to-slate-900">
          {user && !user.id.startsWith('guest-') ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/30 border border-transparent transition-all duration-200"
            >
              <div className="transition-colors"><LogOut size={20} /></div>
              {isOpen && <span className="ml-3 font-medium">Logout</span>}
            </button>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full flex items-center px-3 py-3 rounded-lg text-cyan-400 hover:text-white hover:bg-cyan-500/20 hover:border-cyan-500/30 border border-transparent transition-all duration-200"
            >
              <div className="transition-colors"><LogIn size={20} /></div>
              {isOpen && <span className="ml-3 font-medium">Login</span>}
            </button>
          )}
        </div>

        {isOpen && (
          <div className="px-2 pb-4">
            <div className="bg-slate-900/50 border border-cyan-500/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-gradient-to-r from-cyan-500 to-purple-600 rounded flex items-center justify-center">
                  <span className="text-xs text-white font-bold">J</span>
                </div>
                <h3 className="font-semibold text-sm text-cyan-400">
                  Created by Jedynsay
                </h3>
              </div>
              <p className="text-xs text-slate-400 mb-2">Powered by Supabase</p>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400 font-medium">System Online</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Login Modal */}
      {showLoginModal && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={() => setShowLoginModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none z-50">
            <div className="relative pointer-events-auto bg-slate-950 border border-cyan-500/30 rounded-xl shadow-[0_0_40px_rgba(0,200,255,0.3)] max-w-md w-full mx-4 max-h-[90vh]">
              <LoginForm onLoginSuccess={() => setShowLoginModal(false)} />
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-slate-800 hover:bg-slate-700 border border-cyan-500/30 rounded-full flex items-center justify-center text-cyan-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}