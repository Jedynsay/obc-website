import React from 'react';

export function CommunityHeroSection({ user, onLoginClick, onLogout }) {
  return (
    <section className="relative h-screen w-full">
      {/* Background Image */}
      <img
        src="/community.jpg"
        alt="Community"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Login/Logout button */}
      <div className="absolute top-6 right-6">
        {user ? (
          <button
            onClick={onLogout}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={onLoginClick}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            Login
          </button>
        )}
      </div>

      {/* Centered overlay text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-6">
        <h1 className="text-5xl font-bold mb-4">OBC</h1>
        <p className="text-lg">Welcome to the Community</p>
        <p className="mt-2 text-sm text-slate-200">Scroll down to see tournaments, stats, and top players</p>
      </div>
    </section>
  );
}
