import React from 'react';
import { BarChart3, Target, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PartStats {
  name: string;
  usage: number;
  wins: number;
  losses: number;
  winRate: number;
  avgPoints: number;
  comboScore: number;
}

interface ComboStats {
  combo: string;
  player: string;
  matches: number;
  wins: number;
  winRate: number;
  weightedWinRate: number;
  avgPoints: number;
  comboScore: number;
}

interface LineVsLineStats {
  attacker: string;
  defender: string;
  wins: number;
  matches: number;
  winRate: number;
}

interface MetaAnalysisSubTabProps {
  tournamentId: string;
  partStats?: { [category: string]: PartStats[] };
  topCombos?: ComboStats[];
  lineVsLine?: LineVsLineStats[];
  loading?: boolean;
}

export function MetaAnalysisSubTab({ 
  tournamentId, 
  partStats = {}, 
  topCombos = [], 
  lineVsLine = [], 
  loading = false 
}: MetaAnalysisSubTabProps) {
  
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Processing meta analysis...</p>
      </div>
    );
  }

  const hasData = Object.values(partStats).some(stats => stats.length > 0) || 
                  topCombos.length > 0 || 
                  lineVsLine.length > 0;

  if (!hasData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="text-center">
          <BarChart3 size={48} className="mx-auto text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Meta Data Available</h3>
          <p className="text-yellow-700">
            This tournament has no completed matches yet. Meta analysis requires match results to generate statistics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Combos Chart */}
      {topCombos.length > 0 && (
        <div className="chart-container">
          <h2 className="chart-title flex items-center">
            <Target size={24} className="mr-2 text-blue-600" />
            Top Combos by Score
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topCombos.slice(0, 10)} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="combo" 
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'comboScore' ? `${Number(value).toFixed(2)}` : value,
                  name === 'comboScore' ? 'Combo Score' : 
                  name === 'winRate' ? 'Win Rate (%)' : name
                ]}
                labelFormatter={(label) => `${label}`}
              />
              <Legend />
              <Bar dataKey="comboScore" fill="#3B82F6" name="Combo Score" />
              <Bar dataKey="winRate" fill="#10B981" name="Win Rate (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Line vs Line Matrix */}
      {lineVsLine.length > 0 && (
        <div className="chart-container">
          <h2 className="chart-title flex items-center">
            <TrendingUp size={24} className="mr-2 text-purple-600" />
            Blade Line Matchup Matrix
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attacker Line
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    vs Defender Line
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matches
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wins
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Win Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lineVsLine.map((matchup, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {matchup.attacker}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {matchup.defender}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {matchup.matches}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-center font-medium">
                      {matchup.wins}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`font-medium ${
                        matchup.winRate >= 60 ? 'text-green-600' :
                        matchup.winRate >= 40 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {matchup.winRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Part Statistics Tables */}
      {Object.entries(partStats).map(([category, stats]) => {
        if (stats.length === 0) return null;
        
        const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
        
        return (
          <div key={category} className="chart-container">
            <h2 className="chart-title flex items-center">
              <BarChart3 size={24} className="mr-2 text-indigo-600" />
              {categoryLabel} Performance
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {categoryLabel}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Wins
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Win Rate
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Points
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Combo Score
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.slice(0, 10).map((part, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {part.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {part.usage}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-center font-medium">
                        {part.wins}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <span className={`font-medium ${
                          part.winRate >= 60 ? 'text-green-600' :
                          part.winRate >= 40 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {part.winRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {part.avgPoints.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600 text-center">
                        {part.comboScore.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}