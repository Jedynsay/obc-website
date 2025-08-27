"use client"
import { User, Trophy, Target, Zap } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

interface DevPlayerSelectorProps {
  selectedPlayer: string
  onPlayerChange: (player: string) => void
  availablePlayers: string[]
}

function DevPlayerSelector({ selectedPlayer, onPlayerChange, availablePlayers }: DevPlayerSelectorProps) {
  return (
    <div className="bg-gradient-to-r from-red-900/20 to-red-800/20 backdrop-blur-sm border border-red-500/30 rounded-2xl p-6 mb-8 shadow-2xl">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mr-3 shadow-lg">
          <span className="text-white text-sm font-bold">D</span>
        </div>
        <h3 className="text-xl font-bold bg-gradient-to-r from-red-400 to-red-300 bg-clip-text text-transparent">
          Developer Mode
        </h3>
      </div>
      <div className="max-w-md">
        <label className="block text-sm font-medium text-red-300 mb-3">View Personal Stats for Player:</label>
        <select
          value={selectedPlayer}
          onChange={(e) => onPlayerChange(e.target.value)}
          className="w-full bg-gray-900/50 backdrop-blur-sm border border-red-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400 transition-all duration-300"
        >
          <option value="">-- Select Player --</option>
          {availablePlayers.map((player) => (
            <option key={player} value={player}>
              {player}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

interface PersonalStatsTabProps {
  user: any
  loading: boolean
  targetPlayer: string
  personalCombos: any[]
  isDeveloper: boolean
  devSelectedPlayer: string
  setDevSelectedPlayer: (player: string) => void
  availablePlayers: string[]
  selectedCombo: string
  setSelectedCombo: (combo: string) => void
  tournamentHistory: any[]
  finishDistribution: any[]
  pointsPerFinish: any[]
}

export function PersonalStatsTab({
  user,
  loading,
  targetPlayer,
  personalCombos,
  isDeveloper,
  devSelectedPlayer,
  setDevSelectedPlayer,
  availablePlayers,
  selectedCombo,
  setSelectedCombo,
  tournamentHistory,
  finishDistribution,
  pointsPerFinish,
}: PersonalStatsTabProps) {
  if (!user || user.id.startsWith("guest-")) {
    return (
      <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-12 text-center shadow-2xl">
        <div className="w-20 h-20 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-cyan-400/30">
          <User size={40} className="text-cyan-400" />
        </div>
        <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-3">
          Login Required
        </h3>
        <p className="text-gray-300 text-lg">
          Please log in to view your personal tournament statistics and performance analytics.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="relative mx-auto mb-6 w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-500 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-400 animate-spin animation-delay-150"></div>
        </div>
        <p className="text-gray-300 text-lg">Loading personal stats...</p>
      </div>
    )
  }

  if (!targetPlayer || personalCombos.length === 0) {
    return (
      <div className="space-y-8">
        {isDeveloper && (
          <DevPlayerSelector
            selectedPlayer={devSelectedPlayer}
            onPlayerChange={setDevSelectedPlayer}
            availablePlayers={availablePlayers}
          />
        )}

        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-gray-600/30 rounded-2xl p-12 text-center shadow-2xl">
          <div className="w-20 h-20 bg-gradient-to-r from-gray-700/50 to-gray-600/50 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-500/30">
            <Trophy size={40} className="text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">No Match History</h3>
          <p className="text-gray-300 text-lg">
            {isDeveloper && devSelectedPlayer
              ? `${devSelectedPlayer} hasn't participated in any recorded matches yet.`
              : "You haven't participated in any recorded matches yet. Join a tournament to start building your statistics!"}
          </p>
        </div>
      </div>
    )
  }

  const selectedComboData = selectedCombo ? personalCombos.find((c) => c.combo === selectedCombo) : null

  return (
    <div className="space-y-10">
      {/* Developer Player Selector */}
      {isDeveloper && (
        <DevPlayerSelector
          selectedPlayer={devSelectedPlayer}
          onPlayerChange={setDevSelectedPlayer}
          availablePlayers={availablePlayers}
        />
      )}

      {/* Personal Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {personalCombos.reduce((sum, combo) => sum + combo.totalMatches, 0)}
              </div>
              <div className="text-gray-300 font-medium">Total Matches</div>
            </div>
            <div className="p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-sm rounded-xl border border-cyan-400/30 group-hover:scale-110 transition-transform duration-300">
              <Target size={28} className="text-cyan-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                {personalCombos.length > 0
                  ? (
                      (personalCombos.reduce((sum, combo) => sum + combo.wins, 0) /
                        personalCombos.reduce((sum, combo) => sum + combo.totalMatches, 0)) *
                      100
                    ).toFixed(1)
                  : "0.0"}
                %
              </div>
              <div className="text-gray-300 font-medium">Overall Win Rate</div>
            </div>
            <div className="p-4 bg-gradient-to-r from-emerald-500/20 to-green-500/20 backdrop-blur-sm rounded-xl border border-emerald-400/30 group-hover:scale-110 transition-transform duration-300">
              <Trophy size={28} className="text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {personalCombos.reduce((sum, combo) => sum + combo.totalPoints, 0)}
              </div>
              <div className="text-gray-300 font-medium">Total Points</div>
            </div>
            <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-xl border border-purple-400/30 group-hover:scale-110 transition-transform duration-300">
              <Zap size={28} className="text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-orange-500/20 rounded-2xl p-6 shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                {tournamentHistory.length}
              </div>
              <div className="text-gray-300 font-medium">Tournaments Played</div>
            </div>
            <div className="p-4 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 backdrop-blur-sm rounded-xl border border-orange-400/30 group-hover:scale-110 transition-transform duration-300">
              <User size={28} className="text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personal Finish Distribution */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-gray-600/30 rounded-2xl p-8 shadow-2xl">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-6">
            Your Finish Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={finishDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {finishDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(17, 24, 39, 0.9)",
                  border: "1px solid rgba(75, 85, 99, 0.3)",
                  borderRadius: "12px",
                  color: "#fff",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Points Per Finish Type with Values */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-gray-600/30 rounded-2xl p-8 shadow-2xl">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-6">
            Points Per Finish Type
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pointsPerFinish}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(75, 85, 99, 0.3)" />
                <XAxis dataKey="finish" tick={{ fill: "#9CA3AF" }} />
                <YAxis tick={{ fill: "#9CA3AF" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(17, 24, 39, 0.9)",
                    border: "1px solid rgba(75, 85, 99, 0.3)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="points" fill="url(#barGradient)" />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>

            <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 backdrop-blur-sm rounded-xl p-6 border border-gray-600/30">
              <h4 className="font-bold text-white mb-4 text-lg">Points Breakdown</h4>
              <div className="space-y-4">
                {pointsPerFinish.map((finish) => (
                  <div
                    key={finish.finish}
                    className="flex justify-between items-center p-3 bg-gray-900/30 rounded-lg border border-gray-600/20"
                  >
                    <span className="text-gray-300 font-medium">{finish.finish}:</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      {finish.points}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Combo Performance */}
      <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-gray-600/30 rounded-2xl p-8 shadow-2xl">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-6">
          Your Combo Performance
        </h3>
        <div className="mb-6">
          <select
            value={selectedCombo}
            onChange={(e) => setSelectedCombo(e.target.value)}
            className="bg-gray-900/50 backdrop-blur-sm border border-gray-600/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all duration-300"
          >
            <option value="">Select combo for detailed view</option>
            {personalCombos.map((combo) => (
              <option key={combo.combo} value={combo.combo}>
                {combo.combo} ({combo.totalMatches} matches)
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-600/30">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50 transition-colors duration-200">
                  Combo
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50 transition-colors duration-200">
                  Blade Line
                </th>
                <th className="px-6 py-4 text-center text-sm font-bold text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50 transition-colors duration-200">
                  Matches
                </th>
                <th className="px-6 py-4 text-center text-sm font-bold text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50 transition-colors duration-200">
                  Win Rate
                </th>
                <th className="px-6 py-4 text-center text-sm font-bold text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50 transition-colors duration-200">
                  Weighted Win Rate
                </th>
                <th className="px-6 py-4 text-center text-sm font-bold text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50 transition-colors duration-200">
                  Avg Points
                </th>
                <th className="px-6 py-4 text-center text-sm font-bold text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50 transition-colors duration-200">
                  Combo Score
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900/30 backdrop-blur-sm">
              {personalCombos.map((combo, index) => (
                <tr
                  key={index}
                  className={`hover:bg-gray-700/30 cursor-pointer transition-all duration-200 border-b border-gray-600/20 ${
                    selectedCombo === combo.combo ? "bg-cyan-500/10 border-cyan-500/30" : ""
                  }`}
                  onClick={() => setSelectedCombo(combo.combo === selectedCombo ? "" : combo.combo)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{combo.combo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        combo.bladeLine === "Basic"
                          ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          : combo.bladeLine === "Unique"
                            ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                            : combo.bladeLine === "Custom"
                              ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                              : combo.bladeLine === "X-Over"
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                      }`}
                    >
                      {combo.bladeLine}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 text-center font-medium">
                    {combo.totalMatches}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span
                      className={`font-bold ${
                        combo.winRate >= 60
                          ? "text-emerald-400"
                          : combo.winRate >= 40
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      {combo.winRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-cyan-400 text-center">
                    {(combo.weightedWinRate * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 text-center font-medium">
                    {combo.avgPointsPerMatch.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-400 text-center">
                    {combo.comboScore.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Selected Combo Details */}
        {selectedComboData && (
          <div className="mt-8 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 backdrop-blur-sm border border-cyan-500/30 rounded-2xl p-8 shadow-xl">
            <h4 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-6">
              Detailed Analysis: {selectedComboData.combo}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h5 className="font-bold text-white mb-4 text-lg">Win Finishes</h5>
                <div className="space-y-3">
                  {Object.entries(selectedComboData.finishDistribution).map(([finish, count]) => (
                    <div
                      key={finish}
                      className="flex justify-between items-center p-3 bg-gray-900/30 rounded-lg border border-gray-600/20"
                    >
                      <span className="text-gray-300 font-medium">{finish}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-white">{count}</span>
                        <span className="text-sm text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-full">
                          (
                          {selectedComboData.totalMatches > 0 ? ((count / selectedComboData.wins) * 100).toFixed(0) : 0}
                          %)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="font-bold text-white mb-4 text-lg">Points Breakdown</h5>
                <div className="space-y-3">
                  {Object.entries(selectedComboData.pointsPerFinish).map(([finish, points]) => (
                    <div
                      key={finish}
                      className="flex justify-between items-center p-3 bg-gray-900/30 rounded-lg border border-gray-600/20"
                    >
                      <span className="text-gray-300 font-medium">{finish}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-white">{points} pts</span>
                        <span className="text-sm text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">
                          (avg:{" "}
                          {selectedComboData.finishDistribution[finish] > 0
                            ? (points / selectedComboData.finishDistribution[finish]).toFixed(1)
                            : "0.0"}
                          )
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tournament History */}
      <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-gray-600/30 rounded-2xl p-8 shadow-2xl">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-6">
          Tournament History
        </h3>
        <div className="overflow-x-auto rounded-xl border border-gray-600/30">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50 transition-colors duration-200">
                  Tournament
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50 transition-colors duration-200">
                  Date
                </th>
                <th className="px-6 py-4 text-center text-sm font-bold text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50 transition-colors duration-200">
                  Matches
                </th>
                <th className="px-6 py-4 text-center text-sm font-bold text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50 transition-colors duration-200">
                  Wins
                </th>
                <th className="px-6 py-4 text-center text-sm font-bold text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50 transition-colors duration-200">
                  Win Rate
                </th>
                <th className="px-6 py-4 text-center text-sm font-bold text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50 transition-colors duration-200">
                  Total Points
                </th>
                <th className="px-6 py-4 text-center text-sm font-bold text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50 transition-colors duration-200">
                  Avg Points
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900/30 backdrop-blur-sm">
              {tournamentHistory.map((tournament, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-700/30 transition-colors duration-200 border-b border-gray-600/20"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {tournament.tournamentName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {tournament.date ? new Date(tournament.date).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 text-center font-medium">
                    {tournament.matches}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-400 text-center font-bold">
                    {tournament.wins}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span
                      className={`font-bold ${
                        tournament.winRate >= 60
                          ? "text-emerald-400"
                          : tournament.winRate >= 40
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      {tournament.winRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white text-center font-bold">
                    {tournament.points}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 text-center font-medium">
                    {tournament.avgPointsPerMatch.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MVP Combo Spotlight */}
      {personalCombos.length > 0 && (
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-8 shadow-2xl">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-6">
            {isDeveloper && devSelectedPlayer ? `${devSelectedPlayer}'s MVP Combo` : "Your MVP Combo"}
          </h3>
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-yellow-500/20 animate-pulse">
              <Trophy size={48} className="text-white" />
            </div>
            <h4 className="text-3xl font-bold text-white mb-8">{personalCombos[0].combo}</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="text-center p-6 bg-gradient-to-br from-gray-800/50 to-gray-700/50 backdrop-blur-sm rounded-xl border border-gray-600/30">
                <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {personalCombos[0].totalMatches}
                </div>
                <div className="text-gray-300 font-medium mt-2">Matches</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-gray-800/50 to-gray-700/50 backdrop-blur-sm rounded-xl border border-gray-600/30">
                <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                  {personalCombos[0].winRate.toFixed(1)}%
                </div>
                <div className="text-gray-300 font-medium mt-2">Win Rate</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-gray-800/50 to-gray-700/50 backdrop-blur-sm rounded-xl border border-gray-600/30">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {personalCombos[0].avgPointsPerMatch.toFixed(2)}
                </div>
                <div className="text-gray-300 font-medium mt-2">Avg Points</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-gray-800/50 to-gray-700/50 backdrop-blur-sm rounded-xl border border-gray-600/30">
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                  {personalCombos[0].comboScore.toFixed(1)}
                </div>
                <div className="text-gray-300 font-medium mt-2">Combo Score</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
