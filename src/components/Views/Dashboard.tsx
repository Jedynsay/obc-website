"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import { supabase } from "../../lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy, ArrowRight, LogIn, LogOut, Settings, X, Crown, Activity, Bell } from "lucide-react"
import { LoginForm } from "../Auth/LoginForm"

interface Tournament {
  id: string
  name: string
  tournament_date: string
  location: string
  current_participants: number
  max_participants: number
  status: string
}

interface DashboardStats {
  totalTournaments: number
  activePlayers: number
  upcomingEvents: number
  completedMatches: number
}

interface TopPlayer {
  name: string
  wins: number
  tournaments: number
  winRate: number
}

interface DashboardProps {
  onViewChange?: (view: string) => void
}

export function Dashboard({ onViewChange }: DashboardProps) {
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    totalTournaments: 0,
    activePlayers: 0,
    upcomingEvents: 0,
    completedMatches: 0,
  })
  const [upcomingTournaments, setUpcomingTournaments] = useState<Tournament[]>([])
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([])
  const [deckPresets, setDeckPresets] = useState<any[]>([])
  const [recentMatches, setRecentMatches] = useState<any[]>([])
  const [allTournaments, setAllTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTournamentFilter, setSelectedTournamentFilter] = useState<string>("all")
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)

  const fetchTopPlayers = async () => {
    try {
      // Optimize performance by limiting to recent matches only
      // This prevents slow loading when there are thousands of match results
      const { data: matches } = await supabase
        .from("match_results")
        .select("player1_name, player2_name, winner_name")
        .order("submitted_at", { ascending: false })
        .limit(1000) // Limit to most recent 1000 matches for performance

      if (!matches) return

      // Calculate player stats
      const playerStats: { [key: string]: { wins: number; total: number; tournaments: Set<string> } } = {}

      matches.forEach((match) => {
        const { player1_name, player2_name, winner_name } = match

        // Use normalized names for consistent tracking
        const normalizedPlayer1 = match.normalized_player1_name || match.player1_name.toLowerCase()
        const normalizedPlayer2 = match.normalized_player2_name || match.player2_name.toLowerCase()
        const normalizedWinner = match.normalized_winner_name || match.winner_name.toLowerCase()

        // Initialize players if not exists
        if (!playerStats[player1_name]) {
          playerStats[player1_name] = { wins: 0, total: 0, tournaments: new Set() }
        }
        if (!playerStats[player2_name]) {
          playerStats[player2_name] = { wins: 0, total: 0, tournaments: new Set() }
        }

        // Count total matches
        playerStats[player1_name].total++
        playerStats[player2_name].total++

        // Count wins
        if (winner_name === player1_name) {
          playerStats[player1_name].wins++
        } else if (winner_name === player2_name) {
          playerStats[player2_name].wins++
        }
      })

      // Convert to array and calculate win rates
      const playersArray = Object.entries(playerStats)
        .map(([name, stats]) => ({
          name,
          wins: stats.wins,
          tournaments: stats.tournaments.size,
          winRate: stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0,
        }))
        .filter((player) => player.wins > 0) // Only show players with at least 1 win
        .sort((a, b) => {
          // Sort by wins first, then by win rate
          if (b.wins !== a.wins) return b.wins - a.wins
          return b.winRate - a.winRate
        })
        .slice(0, 5) // Top 5 players

      setTopPlayers(playersArray)
    } catch (error) {
      console.error("Error fetching top players:", error)
    }
  }

  const fetchDashboardStats = async () => {
    try {
      // Fetch tournaments
      const { data: tournaments } = await supabase.from("tournaments").select("*")

      // Fetch match results
      const { data: matches } = await supabase.from("match_results").select("*")

      // Fetch unique players from matches
      const uniquePlayers = new Set()
      matches?.forEach((match) => {
        if (match.player1_name) uniquePlayers.add(match.player1_name)
        if (match.player2_name) uniquePlayers.add(match.player2_name)
      })

      // Calculate upcoming events
      const now = new Date()
      const upcoming = tournaments?.filter((t) => new Date(t.tournament_date) > now && t.status !== "completed") || []

      setStats({
        totalTournaments: tournaments?.length || 0,
        activePlayers: uniquePlayers.size,
        upcomingEvents: upcoming.length,
        completedMatches: matches?.length || 0,
      })

      setUpcomingTournaments(upcoming.slice(0, 3))
      setAllTournaments(tournaments || [])
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    }
  }

  const fetchDeckPresets = async () => {
    if (!user || user.id.startsWith("guest-")) return

    try {
      const { data } = await supabase.from("deck_presets").select("*").eq("user_id", user.id)

      setDeckPresets(data || [])
    } catch (error) {
      console.error("Error fetching deck presets:", error)
    }
  }

  const fetchRecentMatches = async () => {
    try {
      let query = supabase
        .from("match_results")
        .select(`
          *,
          tournaments!inner(name)
        `)
        .order("submitted_at", { ascending: false })

      if (selectedTournamentFilter !== "all") {
        query = query.eq("tournament_id", selectedTournamentFilter)
      }

      const { data: matches } = await query.limit(20)
      setRecentMatches(matches || [])
    } catch (error) {
      console.error("Error fetching recent matches:", error)
    }
  }

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true)
      await Promise.all([fetchDashboardStats(), fetchTopPlayers(), fetchDeckPresets(), fetchRecentMatches()])
      setLoading(false)
    }

    loadDashboardData()
  }, [user])

  useEffect(() => {
    fetchRecentMatches()
  }, [selectedTournamentFilter])

  // Auto-rotate top players
  useEffect(() => {
    if (topPlayers.length <= 1) return

    const interval = setInterval(() => {
      setCurrentPlayerIndex((prev) => (prev + 1) % topPlayers.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [topPlayers.length])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 font-medium">Loading dashboard...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Trophy className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Ormoc Beyblade Club</h1>
                <p className="text-sm text-slate-400">Tournament Dashboard</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {user && !user.id.startsWith("guest-") ? (
                <>
                  <button className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">
                    <Bell size={20} />
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-3 bg-slate-800 hover:bg-slate-700 rounded-lg px-3 py-2 transition-colors"
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-white">{user.username}</span>
                    </button>

                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute top-full right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1"
                        >
                          <div className="px-4 py-3 border-b border-slate-700">
                            <p className="font-medium text-white">{user.username}</p>
                            <p className="text-sm text-slate-400 capitalize">{user.role.replace("_", " ")}</p>
                          </div>
                          <button className="w-full text-left px-4 py-2 hover:bg-slate-700 flex items-center space-x-2 text-slate-300">
                            <Settings size={16} />
                            <span>Settings</span>
                          </button>
                          <button
                            onClick={async () => {
                              setShowUserMenu(false)
                              await logout()
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-red-900/20 flex items-center space-x-2 text-red-400"
                          >
                            <LogOut size={16} />
                            <span>Logout</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2"
                >
                  <LogIn size={16} />
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          <img src="/community.png" alt="Beyblade Community" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900"></div>
        </motion.div>

        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6 text-balance"
          >
            Ormoc Beyblade
            <span className="block bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Championship
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-300 mb-8 text-pretty"
          >
            Where legends are forged and champions rise
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={() => onViewChange?.("tournaments")}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105"
            >
              Join Tournament
            </button>
            <button
              onClick={() => onViewChange?.("analytics")}
              className="bg-slate-800/50 backdrop-blur-sm hover:bg-slate-700/50 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all border border-slate-600"
            >
              View Rankings
            </button>
          </motion.div>
        </div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-slate-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-slate-400 rounded-full mt-2"></div>
          </div>
        </motion.div>
      </section>

      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Tournament Statistics</h2>
            <p className="text-slate-400 text-lg">Live data from our competitive community</p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              {
                label: "Tournaments",
                value: stats.totalTournaments,
                color: "from-amber-500 to-orange-500",
              },
              {
                label: "Active Players",
                value: stats.activePlayers,
                color: "from-green-500 to-emerald-500",
              },
              {
                label: "Upcoming Events",
                value: stats.upcomingEvents,
                color: "from-blue-500 to-cyan-500",
              },
              {
                label: "Total Matches",
                value: stats.completedMatches,
                color: "from-purple-500 to-pink-500",
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                  {stat.value}
                </div>
                <div className="text-slate-400 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <motion.button
              onClick={() => onViewChange?.("tournaments")}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 hover:border-blue-500/50 transition-all duration-300 text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Tournaments</h3>
                {stats.upcomingEvents > 0 && (
                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                    {stats.upcomingEvents} Live
                  </span>
                )}
              </div>
              <p className="text-slate-400 mb-4">Register and compete in battles</p>

              {upcomingTournaments.length > 0 ? (
                <div className="space-y-2">
                  <div className="font-medium text-white">{upcomingTournaments[0].name}</div>
                  <div className="text-sm text-slate-400">
                    {new Date(upcomingTournaments[0].tournament_date).toLocaleDateString()} •{" "}
                    {upcomingTournaments[0].location}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      {upcomingTournaments[0].current_participants}/{upcomingTournaments[0].max_participants} registered
                    </span>
                    <ArrowRight size={16} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">No upcoming tournaments</span>
                  <ArrowRight size={16} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </motion.button>

            <motion.button
              onClick={() => onViewChange?.("analytics")}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 hover:border-purple-500/50 transition-all duration-300 text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Analytics</h3>
                <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm font-medium">
                  Live
                </span>
              </div>
              <p className="text-slate-400 mb-4">Performance metrics and trends</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">{stats.completedMatches} matches analyzed</span>
                <ArrowRight size={16} className="text-purple-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>

            <motion.button
              onClick={() => onViewChange?.("inventory")}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -4 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 hover:border-orange-500/50 transition-all duration-300 text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Deck Builder</h3>
                <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm font-medium">
                  {deckPresets.length} Saved
                </span>
              </div>
              <p className="text-slate-400 mb-4">Create and optimize combinations</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  {user && !user.id.startsWith("guest-") ? `${deckPresets.length} presets` : "Build combinations"}
                </span>
                <ArrowRight size={16} className="text-orange-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {topPlayers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
              >
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <Crown className="text-yellow-400 mr-3" size={24} />
                  Current Champion
                </h3>

                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {topPlayers[0]?.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-white">{topPlayers[0]?.name}</h4>
                    <p className="text-slate-400">Community Leader</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{topPlayers[0]?.wins}</div>
                    <div className="text-sm text-slate-500">Wins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{topPlayers[0]?.tournaments}</div>
                    <div className="text-sm text-slate-500">Tournaments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{topPlayers[0]?.winRate}%</div>
                    <div className="text-sm text-slate-500">Win Rate</div>
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                  Live Activity
                </h3>
                <select
                  value={selectedTournamentFilter}
                  onChange={(e) => setSelectedTournamentFilter(e.target.value)}
                  className="text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Tournaments</option>
                  {allTournaments.map((tournament) => (
                    <option key={tournament.id} value={tournament.id}>
                      {tournament.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentMatches.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity size={32} className="text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-500">No recent matches</p>
                  </div>
                ) : (
                  recentMatches.slice(0, 6).map((match, index) => (
                    <div
                      key={`${match.tournament_id}-${match.submitted_at}-${index}`}
                      className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                          <Trophy size={14} className="text-green-400" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{match.winner_name}</div>
                          <div className="text-sm text-slate-400">
                            vs {match.winner_name === match.player1_name ? match.player2_name : match.player1_name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-300">{match.outcome?.split(" (")[0] || "Victory"}</div>
                        <div className="text-xs text-slate-500">
                          {new Date(match.submitted_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-800 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div>
              <h4 className="font-semibold text-white">Ormoc Beyblade Club</h4>
              <p className="text-slate-400 text-sm">Building competitive Beyblade in Ormoc</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm font-medium">System Online</span>
              </div>
              <span className="text-slate-500 text-sm">v0.5.3</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Click outside to close user menu */}
      {showUserMenu && <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />}

      <AnimatePresence>
        {showLoginModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50"
              onClick={() => setShowLoginModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center p-4 z-50"
            >
              <div className="relative bg-slate-800 rounded-xl shadow-2xl max-w-md w-full border border-slate-700">
                <LoginForm onLoginSuccess={() => setShowLoginModal(false)} />
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center text-slate-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
