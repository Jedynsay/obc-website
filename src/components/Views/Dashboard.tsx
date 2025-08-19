import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export function CommunityHeroSection({ user, onLoginClick, onLogout, children }) {
  const { scrollY } = useScroll();

  // Slower rectangle movement
  const overlayY = useTransform(scrollY, [0, 1200], [0, -600]);

  // Dashboard content moves slightly slower for smooth "catch-up"
  const contentY = useTransform(scrollY, [0, 1200], [0, -300]);

  return (
    <div className="relative w-full min-h-[150vh] overflow-hidden">
      {/* Hero image */}
      <motion.img
        src="/community.jpg"
        alt="Ormoc Beyblade Community"
        className="absolute inset-0 w-full h-screen object-cover"
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
      <motion.div
        style={{ y: contentY }}
        className="relative z-10 flex flex-col items-center justify-center h-screen text-center text-white px-4"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 drop-shadow-lg">
          Ormoc Beyblade Community
        </h1>
        <p className="text-lg md:text-xl max-w-2xl drop-shadow-md">
          Welcome to the home of competitive Beyblade in Ormoc. Let it rip!
        </p>
      </motion.div>

      {/* Scroll-cover rectangle + dashboard content */}
      <motion.div
        style={{ y: overlayY }}
        className="absolute top-full left-0 w-full bg-slate-950 z-0"
      >
        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
