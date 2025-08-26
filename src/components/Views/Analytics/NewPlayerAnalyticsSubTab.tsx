{/* Player Selection */}
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
    <Users size={24} className="mr-2 text-blue-600" />
    Player Selection
  </h2>
  <div className="max-w-md">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Select Player for Detailed Analysis
    </label>
    <select
      value={selectedPlayer}
      onChange={(e) => setSelectedPlayer(e.target.value)}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">-- Select Player --</option>
      {playerNames.sort().map(playerName => (
        <option key={playerName} value={playerName}>
          {playerName}
        </option>
      ))}
    </select>
  </div>
</div>

{/* Tournament Rankings */}
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-lg font-bold flex items-center">
      <Trophy size={20} className="mr-2 text-yellow-600" />
      Tournament Player Rankings
    </h2>
    <button
      onClick={showAllPlayers}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
    >
      <Eye size={16} />
      <span>Show All</span>
    </button>
  </div>
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Matches</th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Win Rate</th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Weighted Win Rate</th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Points</th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Points/Match</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Most Common Win</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {Object.values(players)
          .sort((a, b) => b.weightedWinRate - a.weightedWinRate)
          .slice(0, 10)
          .map((player, index) => (
            <tr
              key={player.name}
              className={`hover:bg-gray-50 cursor-pointer ${
                selectedPlayer === player.name ? 'bg-blue-50' : ''
              }`}
              onClick={() => setSelectedPlayer(player.name)}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
                    {index + 1}
                  </div>
                  {player.name}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-center">{player.matches}</td>
              <td className="px-6 py-4 text-sm text-center">
                <span className={`font-medium ${
                  player.winRate >= 60 ? 'text-green-600' :
                  player.winRate >= 40 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {player.winRate.toFixed(1)}%
                </span>
              </td>
              <td className="px-6 py-4 text-sm font-bold text-blue-600 text-center">
                {(player.weightedWinRate * 100).toFixed(1)}%
              </td>
              <td className="px-6 py-4 text-sm font-medium text-center">{player.totalPoints}</td>
              <td className="px-6 py-4 text-sm text-center">{player.avgPointsPerMatch.toFixed(2)}</td>
              <td className="px-6 py-4 text-sm">{player.mostCommonWinFinish}</td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
</div>
