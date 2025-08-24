import React, { useState } from 'react';
import { Eye, EyeOff, Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SignupForm } from './SignupForm';
import { supabase } from '../../lib/supabase';

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'login' | 'signup'>('login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setResetMessage('Password reset email sent! Check your inbox for further instructions.');
    } catch (error: any) {
      setResetMessage(`Error: ${error.message}`);
    } finally {
      setResetLoading(false);
    }
  };
  if (currentView === 'signup') {
    return <SignupForm onBackToLogin={() => setCurrentView('login')} onSignupSuccess={onLoginSuccess} />;
  }

  if (showForgotPassword) {
    return (
      <div className="w-full max-w-md p-8 mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={() => setShowForgotPassword(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-3 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-space-grotesk">Reset Password</h2>
            <p className="text-gray-600 font-inter">Enter your email to receive reset instructions</p>
          </div>
        </div>

        <form onSubmit={handleForgotPassword} className="space-y-6">
          <div>
            <label htmlFor="resetEmail" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="resetEmail"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="input-field w-full"
              required
              placeholder="Enter your email address"
            />
          </div>

          {resetMessage && (
            <div className={`text-sm font-inter text-center p-3 rounded-md ${
              resetMessage.includes('Error') 
                ? 'text-red-600 bg-red-50' 
                : 'text-green-600 bg-green-50'
            }`}>
              {resetMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={resetLoading}
            className="primary-button w-full disabled:opacity-50 text-center"
          >
            {resetLoading ? 'Sending...' : 'Send Reset Email'}
          </button>
        </form>

        <div className="mt-6">
          <button
            onClick={() => setShowForgotPassword(false)}
            className="secondary-button w-full text-center"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
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
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field w-full pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm font-inter text-center">{error}</div>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-sm text-blue-600 hover:text-blue-800 font-inter"
          >
            Forgot your password?
          </button>
        </div>
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