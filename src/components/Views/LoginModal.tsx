import React from 'react';
import { X } from 'lucide-react';
import { LoginForm } from '../../Auth/LoginForm';

export function LoginModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg p-6 w-full max-w-md">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-600 hover:text-black">
          <X size={20} />
        </button>
        <LoginForm onLoginSuccess={onClose} />
      </div>
    </div>
  );
}
