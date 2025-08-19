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

      {/* Overlay text like before */}
      <div className="absolute bottom-16 left-6 text-white">
        <h1 className="text-4xl font-bold">Welcome to the Community</h1>
        <p className="mt-2 text-lg">Scroll down to see tournaments, stats, and top players</p>
      </div>
    </section>
  );
}
