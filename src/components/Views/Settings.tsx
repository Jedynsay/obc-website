import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Shield, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export function Settings() {
  const { user, setUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState(user?.role || 'user');
  const [saving, setSaving] = useState(false);

  const roles = [
    { value: 'user', label: 'User', description: 'Basic user access' },
    { value: 'technical_officer', label: 'Technical Officer', description: 'Can manage matches and analytics' },
    { value: 'admin', label: 'Admin', description: 'Can manage tournaments and users' },
    { value: 'developer', label: 'Developer', description: 'Full system access' }
  ];

  const updateRole = async () => {
    if (!user || selectedRole === user.role) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: selectedRole })
        .eq('id', user.id);

      if (error) throw error;

      // Update local user state
      setUser({
        ...user,
        role: selectedRole as any
      });

      alert('Role updated successfully!');
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.id.startsWith('guest-')) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <SettingsIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings</h2>
          <p className="text-gray-600 mb-6">Manage your account settings and preferences</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                🔒
              </div>
            </div>
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">Login Required</h3>
            <p className="text-yellow-800 text-sm mb-4">
              You need to create an account and log in to access your account settings.
            </p>
            <p className="text-yellow-700 text-xs">
              Create a free account to customize your profile and preferences!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* User Info */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center mb-6">
          <User className="text-blue-600 mr-2" size={20} />
          <h2 className="text-xl font-bold text-gray-900">User Information</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <div className="w-full border border-gray-200 rounded-md px-3 py-2 bg-gray-50 text-gray-700">
              {user.username}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="w-full border border-gray-200 rounded-md px-3 py-2 bg-gray-50 text-gray-700">
              {user.email}
            </div>
          </div>
        </div>
      </div>

      {/* Role Management (Debug) */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
        <div className="flex items-center mb-6">
          <Shield className="text-yellow-600 mr-2" size={20} />
          <h2 className="text-xl font-bold text-yellow-900">Role Management (Debug)</h2>
        </div>
        
        <div className="mb-4 p-3 bg-white rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>Debug Feature:</strong> Change your role for testing different access levels. 
            This is for development purposes only.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Role</label>
            <div className="w-full border border-gray-200 rounded-md px-3 py-2 bg-gray-50 text-gray-700 capitalize">
              {user.role.replace('_', ' ')}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Change Role To</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              {roles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedRole !== user.role && (
          <div className="mt-4 p-3 bg-white rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800 mb-2">
              <strong>Selected Role:</strong> {roles.find(r => r.value === selectedRole)?.label}
            </p>
            <p className="text-xs text-yellow-700">
              {roles.find(r => r.value === selectedRole)?.description}
            </p>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={updateRole}
            disabled={selectedRole === user.role || saving}
            className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
            <Save size={16} />
            <span>Update Role</span>
          </button>
        </div>
      </div>
    </div>
  );
}