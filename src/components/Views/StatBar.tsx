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
    { key: 'attack', label: 'Attack', color: 'bg-red-500', icon: <Zap size={12} className="text-red-500" />, max: 200 },
    { key: 'defense', label: 'Defense', color: 'bg-blue-500', icon: <Shield size={12} className="text-blue-500" />, max: 200 },
    { key: 'stamina', label: 'Stamina', color: 'bg-green-500', icon: <Clock size={12} className="text-green-500" />, max: 200 },
    { key: 'dash', label: 'Dash', color: 'bg-yellow-500', icon: <Activity size={12} className="text-yellow-500" />, max: 50 },
    { key: 'burstRes', label: 'Burst Res', color: 'bg-purple-500', icon: <ShieldCheck size={12} className="text-purple-500" />, max: 80 }
  ];

  return (
    <div className="bg-gray-700 rounded-lg p-4 mt-4">
      <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
      <h5 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
        <Activity size={16} className="mr-2" />
        Combined Stats
      </h5>
      <div className="space-y-2">
        {statMeta.map(({ key, label, color, icon, max }) => (
          <div key={key} className="flex items-center">
            <div className="flex items-center w-20 text-xs font-medium text-gray-400">
              {icon}
              <span className="ml-1">{label}</span>
            </div>
            <div className="flex-1 mx-3">
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${color}`}
                  style={{ width: `${Math.min((stats[key as keyof typeof stats] / max) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="w-8 text-xs font-bold text-gray-300 text-right">
              {stats[key as keyof typeof stats]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
