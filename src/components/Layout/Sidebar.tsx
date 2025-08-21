import React, { useEffect } from 'react';
import {
  Home, Trophy, Users, BarChart3, Settings,
  Database, Calendar, Package, X, LogIn, LogOut
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
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} />, roles: ['user', 'technical_officer', 'admin', 'developer'] },
  { id: 'parts-database', label: 'Parts Database', icon: <Database size={20} />, roles: ['user', 'technical_officer', 'admin', 'developer'] },
  { id: 'inventory', label: 'Inventory & Decks', icon: <Package size={20} />, roles: ['user', 'technical_officer', 'admin', 'developer'] },
  { id: 'team-manager', label: 'Team Manager', icon: <Users size={20} />, roles: ['user', 'technical_officer', 'admin', 'developer'] },
  { id: 'match-tracker', label: 'Match Tracker', icon: <Calendar size={20} />, roles: ['technical_officer', 'admin', 'developer'] },
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
        <div className="fixed inset-0 bg-black bg-opacity-30 z-30" />
      )}

      <aside
        id="app-sidebar"
        className={`fixed left-0 top-0 z-50 h-screen flex flex-col 
        transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        bg-white border-r border-gray-200 w-64`}
        style={{ pointerEvents: 'auto' }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center font-space-grotesk font-bold text-lg text-white">
              B
            </div>
            {isOpen && (
              <div>
                <h1 className="text-xl font-space-grotesk font-bold text-gray-900">OBC Portal</h1>
                <p className="text-xs text-gray-500 font-inter">Beyblade Community</p>
              </div>
            )}
          </div>
          {isOpen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Scrollable menu */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={currentView === item.id ? 'sidebar-item-active' : 'sidebar-item'}
                >
                  <div className="transition-colors">{item.icon}</div>
                  {isOpen && <span className="ml-3 font-inter">{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Auth Section */}
        <div className="px-4 border-t border-gray-200 py-4">
          {user && !user.id.startsWith('guest-') ? (
            <button
              onClick={handleLogout}
              className="sidebar-item w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <div className="transition-colors"><LogOut size={20} /></div>
              {isOpen && <span className="ml-3 font-inter">Logout</span>}
            </button>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="sidebar-item w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <div className="transition-colors"><LogIn size={20} /></div>
              {isOpen && <span className="ml-3 font-inter">Login</span>}
            </button>
          )}
        </div>

        {isOpen && (
          <div className="px-2 pb-4">
            <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-xs text-white">J</span>
                </div>
                <h3 className="font-space-grotesk font-semibold text-sm text-gray-900">
                  Created by Jedynsay
                </h3>
              </div>
              <p className="text-xs text-gray-600 font-inter mb-2">Powered by Supabase</p>
            </div>
          </div>
        )}
      </aside>

      {/* Login Modal */}
      {showLoginModal && (
        <>
          <div
            className="modal-overlay"
            style={{ zIndex: 50 }}
            onClick={() => setShowLoginModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none z-50">
            <div className="relative pointer-events-auto bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh]">
              <LoginForm onLoginSuccess={() => setShowLoginModal(false)} />
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
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
