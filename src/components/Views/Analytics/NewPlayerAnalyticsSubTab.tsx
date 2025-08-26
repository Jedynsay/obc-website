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
{/* Player Performance Metrics */}
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
    <Target size={24} className="mr-2 text-blue-600" />
    {selectedPlayerData.name} - Detailed Performance
  </h3>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
    {/* Total Matches */}
    <div className="text-center">
      <div className="text-3xl font-bold text-blue-600">{selectedPlayerData.matches}</div>
      <div className="text-sm text-gray-600">Total Matches</div>
    </div>

    {/* Win Rate */}
    <div className="text-center">
      <div className="text-3xl font-bold text-green-600">{selectedPlayerData.winRate.toFixed(1)}%</div>
      <div className="text-sm text-gray-600">Win Rate</div>
    </div>

    {/* Total Points */}
    <div className="text-center">
      <div className="text-3xl font-bold text-purple-600">{selectedPlayerData.totalPoints}</div>
      <div className="text-sm text-gray-600">Total Points</div>
    </div>

    {/* Avg Points/Match */}
    <div className="text-center">
      <div className="text-3xl font-bold text-orange-600">{selectedPlayerData.avgPointsPerMatch.toFixed(2)}</div>
      <div className="text-sm text-gray-600">Avg Points/Match</div>
    </div>

    {/* Most Valuable Beyblade */}
    <div className="text-center">
      <div className="text-xl font-bold text-indigo-600">{selectedPlayerData.mvpCombo || "N/A"}</div>
      <div className="text-sm text-gray-600">Most Valuable Beyblade</div>
      {selectedPlayerData.mvpCombo && (
        <div className="text-lg font-bold text-indigo-700 mt-1">
          {selectedPlayerData.mvpComboScore} pts
        </div>
      )}
    </div>
  </div>
</div>
{/* Wins & Losses per Finish */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Wins per Finish Table */}
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h3 className="text-lg font-bold text-gray-900 mb-4">Wins per Finish</h3>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-green-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Beyblade
            </th>
            {FINISH_TYPES.map(finish => (
              <th key={finish} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {finish.split(" ")[0]}
              </th>
            ))}
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Points Gained
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Object.keys(selectedPlayerData.winsByFinish).map(beyblade => (
            <tr key={beyblade} className="hover:bg-green-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {beyblade}
              </td>
              {FINISH_TYPES.map(finish => (
                <td key={finish} className="px-6 py-4 text-sm text-center font-medium text-green-600">
                  {selectedPlayerData.winsByFinish[beyblade]?.[finish] || 0}
                </td>
              ))}
              <td className="px-6 py-4 text-sm text-center font-bold text-green-700">
                {selectedPlayerData.pointsGainedByBey[beyblade] || 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>

  {/* Losses per Finish Table */}
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h3 className="text-lg font-bold text-gray-900 mb-4">Losses per Finish</h3>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-red-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Beyblade
            </th>
            {FINISH_TYPES.map(finish => (
              <th key={finish} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {finish.split(" ")[0]}
              </th>
            ))}
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Points Given
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Object.keys(selectedPlayerData.lossesByFinish).map(beyblade => (
            <tr key={beyblade} className="hover:bg-red-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {beyblade}
              </td>
              {FINISH_TYPES.map(finish => (
                <td key={finish} className="px-6 py-4 text-sm text-center font-medium text-red-600">
                  {selectedPlayerData.lossesByFinish[beyblade]?.[finish] || 0}
                </td>
              ))}
              <td className="px-6 py-4 text-sm text-center font-bold text-red-700">
                {selectedPlayerData.pointsGivenByBey[beyblade] || 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
</div>
{/* Charts Section */}
<div className="space-y-6">
  {/* Finish Type Radar Chart */}
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h3 className="text-lg font-bold text-gray-900 mb-4">Points per Finish Type</h3>
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart
        data={Object.entries(selectedPlayerData.finishDistribution).map(([finish, count]) => ({
          finish,
          points: count * (FINISH_POINTS[finish as keyof typeof FINISH_POINTS] || 0),
          count,
        }))}
      >
        <PolarGrid />
        <PolarAngleAxis dataKey="finish" />
        <PolarRadiusAxis />
        <Radar
          name="Points"
          dataKey="points"
          stroke="#3B82F6"
          fill="#3B82F6"
          fillOpacity={0.3}
        />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  </div>

  {/* Phase Performance */}
  {Object.keys(selectedPlayerData.phasePerformance).length > 0 && (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Phase Performance</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Phase</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Matches</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Wins</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Win Rate</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Points</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(selectedPlayerData.phasePerformance)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([phase, stats]) => (
                <tr key={phase} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 text-center">
                    Phase {phase}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-center">{stats.matches}</td>
                  <td className="px-6 py-4 text-sm text-green-600 text-center font-medium">{stats.wins}</td>
                  <td className="px-6 py-4 text-sm text-center">
                    <span className={`font-medium ${
                      stats.matches > 0 && (stats.wins / stats.matches) * 100 >= 50 
                        ? "text-green-600" 
                        : "text-red-600"
                    }`}>
                      {stats.matches > 0 ? ((stats.wins / stats.matches) * 100).toFixed(1) : "0.0"}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-center">
                    {stats.matches > 0 ? (stats.points / stats.matches).toFixed(2) : "0.00"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )}
</div>
{/* Head-to-Head Statistics */}
{headToHead.length > 0 && (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-bold flex items-center">
        <TrendingUp size={20} className="mr-2 text-green-600" />
        Head-to-Head Matchups
      </h2>
      <button
        onClick={showAllHeadToHead}
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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Matchup
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Matches
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Player 1 Wins
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Player 2 Wins
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Player 1 Win Rate
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {headToHead
            .sort((a, b) => b.totalMatches - a.totalMatches)
            .slice(0, 10)
            .map((h2h, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {h2h.player1} vs {h2h.player2}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 text-center">
                  {h2h.totalMatches}
                </td>
                <td className="px-6 py-4 text-sm text-green-600 text-center font-medium">
                  {h2h.p1Wins}
                </td>
                <td className="px-6 py-4 text-sm text-red-600 text-center font-medium">
                  {h2h.p2Wins}
                </td>
                <td className="px-6 py-4 text-sm text-center">
                  <span className={`font-medium ${
                    h2h.p1WinRate >= 50 ? "text-green-600" : "text-red-600"
                  }`}>
                    {h2h.p1WinRate.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  </div>
)}
{/* Head-to-Head Statistics */}
{headToHead.length > 0 && (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-bold flex items-center">
        <TrendingUp size={20} className="mr-2 text-green-600" />
        Head-to-Head Matchups
      </h2>
      <button
        onClick={showAllHeadToHead}
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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Matchup
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Matches
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Player 1 Wins
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Player 2 Wins
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Player 1 Win Rate
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {headToHead
            .sort((a, b) => b.totalMatches - a.totalMatches)
            .slice(0, 10)
            .map((h2h, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {h2h.player1} vs {h2h.player2}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 text-center">
                  {h2h.totalMatches}
                </td>
                <td className="px-6 py-4 text-sm text-green-600 text-center font-medium">
                  {h2h.p1Wins}
                </td>
                <td className="px-6 py-4 text-sm text-red-600 text-center font-medium">
                  {h2h.p2Wins}
                </td>
                <td className="px-6 py-4 text-sm text-center">
                  <span className={`font-medium ${
                    h2h.p1WinRate >= 50 ? "text-green-600" : "text-red-600"
                  }`}>
                    {h2h.p1WinRate.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  </div>
)}
