import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SignupFormProps {
  onBackToLogin: () => void;
  onSignupSuccess?: () => void;
}

export function SignupForm({ onBackToLogin, onSignupSuccess }: SignupFormProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters long.');
      setLoading(false);
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
      setError('Username can only contain letters, numbers, hyphens, and underscores.');
      setLoading(false);
      return;
    }
    
    const success = await signup(username.trim(), email.trim(), password, 'user');
    if (success) {
      setSuccess(true);
    } else {
      setError('Failed to create account. Username might already be taken or there was a server error. Please try a different username.');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="w-full max-w-md p-8 mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-space-grotesk">Account Created!</h2>
            <p className="text-gray-600 mb-6">
              Your account has been successfully created! You can now sign in to access the system.
            </p>
            <button
              onClick={onBackToLogin}
              className="primary-button w-full"
            >
              Back to Login
            </button>
          </div>
        </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={onBackToLogin}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-3 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-space-grotesk">Create Account</h2>
            <p className="text-gray-600 font-inter">Join the Beyblade community</p>
          </div>
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
              minLength={3}
              placeholder="Choose a unique username"
            />
          </div>

          <div>
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field w-full"
              required
              placeholder="Enter your email address"
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
                minLength={6}
                placeholder="At least 6 characters"
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

          <div>
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field w-full pr-10"
                required
                minLength={6}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md font-inter">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="primary-button w-full disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 font-inter">
            By creating an account, you agree to participate in tournaments and follow community guidelines. All new accounts start with basic user permissions.
          </p>
        </div>
        
        <div className="mt-6">
          <button
            onClick={onBackToLogin}
            className="secondary-button w-full"
          >
            Back to Login
          </button>
        </div>
      </div>
  );
}