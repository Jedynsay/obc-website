import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SignupForm } from './SignupForm';

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'login' | 'signup'>('login');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const success = await login(username, password);
    if (success) {
      // Login successful - close modal and reset form
      setUsername('');
      setPassword('');
      setError('');
      onLoginSuccess?.();
    } else {
      setError('Invalid username or password. Please check your credentials and try again.');
    }
    setLoading(false);
  };

  if (currentView === 'signup') {
    return <SignupForm onBackToLogin={() => setCurrentView('login')} onSignupSuccess={onLoginSuccess} />;
  }

  return (
    <div className="max-w-md w-full beyblade-card p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-energy-400 to-battle-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-energy animate-spin-slow">
            <span className="text-white text-3xl font-orbitron font-bold">⚡</span>
          </div>
          <h2 className="text-3xl font-orbitron font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">OBC PORTAL</h2>
          <p className="text-slate-300 mt-2 font-rajdhani">Sign in to access your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <User className="text-white" size={24} />
          </div>
          <h2 className="text-2xl font-orbitron font-bold text-white">User Information</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-rajdhani font-semibold text-slate-300 mb-3">Username</label>
            <div className="beyblade-input bg-slate-800/80 border-slate-600/50 text-white font-rajdhani font-medium text-lg">
              {user.username}
            </div>
          </div>
          <div>
            <label className="block text-sm font-rajdhani font-semibold text-slate-300 mb-3">Email</label>
            <div className="beyblade-input bg-slate-800/80 border-slate-600/50 text-white font-rajdhani font-medium text-lg">
              {user.email}
            </div>
          </div>
        </div>
      </div>
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => setCurrentView('signup')}
              className="w-full flex justify-center py-2 px-4 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Create New Account
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Create an account to participate in tournaments and access all features.
          </p>
        </div>
    </div>
  );
}