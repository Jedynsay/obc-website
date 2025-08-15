import React, { useEffect, useState } from 'react';
import { Home, Trophy, BarChart2, Box, Calendar, Settings, Users, Database, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export function Sidebar({ isOpen, isMobile, onClose, onToggle }: SidebarProps) {
  const { logout } = useAuth();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Click outside to close (mobile only)
  useEffect(() => {
    if (!isMobile || !isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      if (sidebar && !sidebar.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isOpen, onClose]);

  const menuItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Trophy, label: 'Tournaments', href: '/tournaments' },
    { icon: BarChart2, label: 'Stats', href: '/stats' },
    { icon: Box, label: 'Products', href: '/products' },
    { icon: Calendar, label: 'Events', href: '/events' },
    { icon: Settings, label: 'Settings', href: '/settings' },
    { icon: Users, label: 'Users', href: '/users' },
    { icon: Database, label: 'Database', href: '/database' },
  ];

  const collapsed = !isMobile && !isOpen; // desktop icon-only mode

  return (
    <>
      {/* Sidebar container */}
      <aside
        id="sidebar"
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-40
          ${isMobile ? (isOpen ? 'w-64' : 'w-0') : collapsed ? 'w-16' : 'w-64'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-gray-200">
          {!collapsed && <span className="text-lg font-bold">OBC Portal</span>}
          {collapsed && <span className="text-lg font-bold">B</span>}
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto">
          {menuItems.map(({ icon: Icon, label, href }) => (
            <a
              key={label}
              href={href}
              className={`flex items-center p-3 hover:bg-gray-100 transition-colors ${
                collapsed ? 'justify-center' : 'space-x-3'
              }`}
            >
              <Icon size={20} />
              {!collapsed && <span>{label}</span>}
            </a>
          ))}
        </nav>

        {/* Logout button */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={logout}
            className={`flex items-center w-full hover:bg-red-50 text-red-600 p-2 rounded-lg transition-colors ${
              collapsed ? 'justify-center' : 'space-x-3'
            }`}
          >
            <LogOut size={20} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={onClose}></div>
      )}
    </>
  );
}
