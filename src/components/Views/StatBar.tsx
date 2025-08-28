import React from 'react';

interface StatBarProps {
  stats: {
    attack: number;
    defense: number;
    stamina: number;
    dash: number;
    burstRes: number;
  };
}

export function StatBar({ stats }: StatBarProps) {
  const statMeta = [
    { key: 'attack', label: 'Attack', gradient: 'from-red-500 via-pink-500 to-fuchsia-500', max: 200 },
    { key: 'defense', label: 'Defense', gradient: 'from-cyan-400 via-blue-500 to-indigo-500', max: 200 },
    { key: 'stamina', label: 'Stamina', gradient: 'from-green-400 via-emerald-500 to-teal-500', max: 200 },
    { key: 'dash', label: 'Dash', gradient: 'from-yellow-400 via-orange-500 to-red-500', max: 50 },
    { key: 'burstRes', label: 'Burst Res', gradient: 'from-purple-400 via-fuchsia-500 to-pink-600', max: 80 },
  ];

  return (
    <div className="bg-slate-950/80 border border-cyan-500/30 rounded-lg p-6 shadow-[0_0_25px_rgba(0,200,255,0.25)]">
      <h5 className="text-sm uppercase font-exo2 tracking-widest text-cyan-400 mb-6">
        Combined Stats
      </h5>

      <div className="space-y-6">
        {statMeta.map(({ key, label, gradient, max }) => {
          const value = stats[key as keyof typeof stats];
          const percentage = Math.min((value / max) * 100, 100);

          return (
            <div key={key} className="w-full">
              {/* Label + Value */}
              <div className="flex justify-between mb-1">
                <span className="text-xs font-exo2 uppercase tracking-wide text-slate-300">
                  {label}
                </span>
                <span className="text-xs font-exo2 font-bold text-cyan-300">{value}</span>
              </div>

              {/* Bar */}
              <div className="relative h-3 w-full bg-slate-800/60 overflow-hidden">
                <div
                  className={`absolute top-0 left-0 h-full bg-gradient-to-r ${gradient} transition-all duration-700`}
                  style={{
                    width: `${percentage}%`,
                    clipPath: 'polygon(0 0, 100% 0, 95% 100%, 0% 100%)', // angled right edge
                  }}
                />
                {/* Neon Glow */}
                <div
                  className={`absolute top-0 left-0 h-full bg-gradient-to-r ${gradient} opacity-30 blur-md`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
