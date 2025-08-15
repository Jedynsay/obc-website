import React, { useEffect, useState } from 'react';
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <header className="sticky top-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {/* Hamburger button */}
              <button
                onClick={onMenuToggle}
                className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              {/* Logo */}
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center font-bold text-lg text-white">
                  B
                </div>
                {!isMobile && (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">OBC Portal</h1>
                    <p className="text-xs text-gray-500">Beyblade Community</p>
                  </div>
                )}
              </div>
            </div>

            {/* User section */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100"
                >
                  <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  {!isMobile && (
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{user.username}</p>
                      <p className="text-xs capitalize text-gray-600">{user.role.replace('_', ' ')}</p>
                    </div>
                  )}
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                    <div className="py-1">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="font-semibold text-gray-900">{user.username}</p>
                        <p className="text-sm text-gray-600 capitalize">{user.role.replace('_', ' ')}</p>
                      </div>
                      <button className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-2 text-gray-700">
                        <Settings size={16} />
                        <span>Settings</span>
                      </button>
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center space-x-2 text-red-600"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="primary-button flex items-center space-x-2"
              >
                <LogIn size={20} />
                {!isMobile && <span className="font-semibold">Login</span>}
              </button>
            )}
          </div>
        </div>

        {/* Overlay for user menu click-outside */}
        {showUserMenu && (
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowUserMenu(false)}
          />
        )}

        {/* Login Modal */}
        {showLoginModal && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
              onClick={() => setShowLoginModal(false)}
            />
            <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
              <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full">
                <LoginForm onLoginSuccess={() => setShowLoginModal(false)} />
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </header>
    </>
  );
}
