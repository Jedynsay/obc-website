import React from 'react';
import { Zap, Shield, Clock, Activity, ShieldCheck } from 'lucide-react';

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
    { key: 'attack', label: 'Attack', gradient: 'from-red-500 to-pink-500', icon: <Zap size={14} className="text-red-400" />, max: 200 },
    { key: 'defense', label: 'Defense', gradient: 'from-blue-500 to-cyan-500', icon: <Shield size={14} className="text-cyan-400" />, max: 200 },
    { key: 'stamina', label: 'Stamina', gradient: 'from-green-500 to-emerald-400', icon: <Clock size={14} className="text-green-400" />, max: 200 },
    { key: 'dash', label: 'Dash', gradient: 'from-yellow-400 to-orange-500', icon: <Activity size={14} className="text-yellow-400" />, max: 50 },
    { key: 'burstRes', label: 'Burst Res', gradient: 'from-purple-500 to-fuchsia-500', icon: <ShieldCheck size={14} className="text-purple-400" />, max: 80 }
  ];

  return (
    <div className="bg-slate-950/80 border border-cyan-500/30 p-5 mt-6 rounded-xl shadow-[0_0_20px_rgba(0,200,255,0.2)]">
      <h5 className="text-sm font-bold tracking-wide text-cyan-400 mb-4 flex items-center uppercase">
        <Activity size={16} className="mr-2 text-cyan-400" />
        Combined Stats
      </h5>

      <div className="space-y-3">
        {statMeta.map(({ key, label, gradient, icon, max }) => {
          const value = stats[key as keyof typeof stats];
          const percentage = Math.min((value / max) * 100, 100);

          return (
            <div key={key} className="flex items-center group">
              {/* Label */}
              <div className="flex items-center w-28 text-xs font-semibold text-slate-300 group-hover:text-cyan-400 transition">
                {icon}
                <span className="ml-2">{label}</span>
              </div>

              {/* Bar */}
              <div className="flex-1 mx-3 relative">
                <div className="w-full bg-slate-800/70 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${gradient} shadow-[0_0_15px_rgba(0,200,255,0.4)]`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                {/* Glow Line Overlay */}
                <div
                  className={`absolute top-0 left-0 h-2 bg-gradient-to-r ${gradient} opacity-30 blur-sm`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Value */}
              <div className="w-10 text-xs font-bold text-cyan-300 text-right">
                {value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
