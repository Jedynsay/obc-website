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
    <div className="w-full max-w-md p-8 mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl font-bold font-space-grotesk">B</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 font-space-grotesk">OBC Portal</h2>
        <p className="text-gray-600 mt-2 font-inter">Sign in to access your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="username" className="form-label">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-field w-full"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field w-full"
            required
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm font-inter text-center">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="primary-button w-full disabled:opacity-50 text-center"
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
            <span className="px-2 bg-white text-gray-500 font-inter">Or</span>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => setCurrentView('signup')}
            className="secondary-button w-full text-center"
          >
            Create New Account
          </button>
        </div>
      </div>

      <div className="mt-6 text-center px-4">
        <p className="text-xs text-gray-500 font-inter">
          Create an account to participate in tournaments and access all features.
        </p>
      </div>

    </div>
  );
}