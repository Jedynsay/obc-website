import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export function CommunityHeroSection({ user, onLoginClick, onLogout }) {
  const { scrollY } = useScroll();

  // Hero scales slightly as you scroll
  const scale = useTransform(scrollY, [0, 300], [1, 1.05]);

  return (
    <motion.div
      style={{ scale }}
      className="relative w-full h-screen overflow-hidden"
    >
      {/* Background Image */}
      <img
        src="/community.jpg"
        alt="Ormoc Beyblade Community"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/70"></div>

      {/* Login/Logout button */}
      <div className="absolute top-4 right-4 z-20">
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

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-4">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 drop-shadow-lg">
          Ormoc Beyblade Community
        </h1>
        <p className="text-lg md:text-xl max-w-2xl drop-shadow-md">
          Welcome to the home of competitive Beyblade in Ormoc. Let it rip!
        </p>
      </div>

      {/* Scroll overlay rectangle */}
      <motion.div
        style={{
          y: useTransform(scrollY, [0, 400], [0, -400])
        }}
        className="absolute top-full left-0 w-full h-screen bg-slate-950 z-0"
      />
    </motion.div>
  );
}
