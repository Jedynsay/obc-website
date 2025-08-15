import React, { useEffect, useState } from 'react';

interface BeybladeLoaderProps {
  loading: boolean;
}

export const BeybladeLoader: React.FC<BeybladeLoaderProps> = ({ loading }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!loading) {
      setFadeOut(true);
    }
  }, [loading]);

  if (!loading && fadeOut) {
    // optional: render nothing after fade-out finishes
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
      <div className={`relative w-32 h-32 ${fadeOut ? 'fade-out' : 'spin-up'}`}>
        {/* Spiky Beyblade circle */}
        <div className="w-32 h-32 border-4 border-transparent border-t-yellow-400 rounded-full absolute top-0 left-0"></div>
        {/* Core */}
        <div className="w-12 h-12 bg-yellow-400 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <p className="mt-6 text-xl font-bold text-yellow-300 animate-pulse">
        Let it Rip! Loading Dashboard...
      </p>

      <style jsx>{`
        .spin-up {
          animation: spinUp 2s cubic-bezier(0.4,0,0.2,1) infinite;
          transform-origin: 50% 50%;
        }

        @keyframes spinUp {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(90deg); }
          50% { transform: rotate(270deg); }
          75% { transform: rotate(540deg); }
          100% { transform: rotate(720deg); }
        }

        .fade-out {
          animation: fadeOutSpin 1s forwards;
          transform-origin: 50% 50%;
        }

        @keyframes fadeOutSpin {
          0% { transform: rotate(0deg); opacity: 1; }
          50% { transform: rotate(360deg); opacity: 0.8; }
          100% { transform: rotate(450deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
