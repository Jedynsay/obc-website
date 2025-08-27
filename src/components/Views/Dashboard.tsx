"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import { supabase } from "../../lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import {
  Trophy,
  TrendingUp,
  Users,
  Calendar,
  ArrowRight,
  Target,
  Zap,
  LogIn,
  LogOut,
  Settings,
  X,
  Crown,
  Activity,
  Bell,
} from "lucide-react"
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading dashboard...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Trophy className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Ormoc Beyblade Club</h1>
                <p className="text-sm text-slate-500">Tournament Dashboard</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {user && !user.id.startsWith("guest-") ? (
                <>
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <Bell size={20} />
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-3 bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-2 transition-colors"
                    >
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-700">{user.username}</span>
                    </button>

                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1"
                        >
                          <div className="px-4 py-3 border-b border-slate-100">
                            <p className="font-medium text-slate-900">{user.username}</p>
                            <p className="text-sm text-slate-500 capitalize">{user.role.replace("_", " ")}</p>
                          </div>
                          <button className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center space-x-2 text-slate-700">
                            <Settings size={16} />
                            <span>Settings</span>
                          </button>
                          <button
                            onClick={async () => {
                              setShowUserMenu(false)
                              await logout()
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center space-x-2 text-red-600"
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
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <LogIn size={16} />
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back!</h2>
          <p className="text-slate-600">Here's what's happening in the Ormoc Beyblade community.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: "Total Tournaments",
              value: stats.totalTournaments,
              icon: Trophy,
              color: "text-amber-600",
              bgColor: "bg-amber-50",
            },
            {
              label: "Active Players",
              value: stats.activePlayers,
              icon: Users,
              color: "text-green-600",
              bgColor: "bg-green-50",
            },
            {
              label: "Upcoming Events",
              value: stats.upcomingEvents,
              icon: Calendar,
              color: "text-blue-600",
              bgColor: "bg-blue-50",
            },
            {
              label: "Total Matches",
              value: stats.completedMatches,
              icon: Target,
              color: "text-purple-600",
              bgColor: "bg-purple-50",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`${stat.bgColor} rounded-xl p-6 border border-slate-200`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={stat.color} size={24} />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</div>
              <div className="text-sm text-slate-600">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.button
            onClick={() => onViewChange?.("tournaments")}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            className="bg-white rounded-xl p-6 border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Trophy className="text-blue-600" size={24} />
              </div>
              {stats.upcomingEvents > 0 && (
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                  {stats.upcomingEvents} Active
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Tournaments</h3>
            <p className="text-slate-600 text-sm mb-4">Register and compete in upcoming battles</p>

            {upcomingTournaments.length > 0 ? (
              <div className="space-y-2">
                <div className="font-medium text-slate-900">{upcomingTournaments[0].name}</div>
                <div className="text-sm text-slate-500">
                  {new Date(upcomingTournaments[0].tournament_date).toLocaleDateString()} •{" "}
                  {upcomingTournaments[0].location}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    {upcomingTournaments[0].current_participants}/{upcomingTournaments[0].max_participants} registered
                  </span>
                  <ArrowRight size={16} className="text-blue-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">No upcoming tournaments</span>
                <ArrowRight size={16} className="text-blue-600 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </motion.button>

          <motion.button
            onClick={() => onViewChange?.("analytics")}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -2 }}
            className="bg-white rounded-xl p-6 border border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200 text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">Live</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Analytics</h3>
            <p className="text-slate-600 text-sm mb-4">View performance metrics and trends</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{stats.completedMatches} matches analyzed</span>
              <ArrowRight size={16} className="text-purple-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>

          <motion.button
            onClick={() => onViewChange?.("inventory")}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -2 }}
            className="bg-white rounded-xl p-6 border border-slate-200 hover:border-orange-300 hover:shadow-lg transition-all duration-200 text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Zap className="text-orange-600" size={24} />
              </div>
              <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                {deckPresets.length} Saved
              </span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Deck Builder</h3>
            <p className="text-slate-600 text-sm mb-4">Create and optimize combinations</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">
                {user && !user.id.startsWith("guest-") ? `${deckPresets.length} presets` : "Build combinations"}
              </span>
              <ArrowRight size={16} className="text-orange-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {topPlayers.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <Crown className="text-yellow-500 mr-2" size={20} />
                Top Performer
              </h3>

              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {topPlayers[0]?.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900">{topPlayers[0]?.name}</h4>
                  <p className="text-slate-500">Community Champion</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{topPlayers[0]?.wins}</div>
                  <div className="text-sm text-slate-500">Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{topPlayers[0]?.tournaments}</div>
                  <div className="text-sm text-slate-500">Tournaments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{topPlayers[0]?.winRate}%</div>
                  <div className="text-sm text-slate-500">Win Rate</div>
                </div>
              </div>

              {topPlayers.length > 1 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-center space-x-2">
                    {topPlayers.slice(0, 5).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPlayerIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentPlayerIndex ? "bg-blue-600" : "bg-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Recent Matches
              </h3>
              <select
                value={selectedTournamentFilter}
                onChange={(e) => setSelectedTournamentFilter(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <Activity size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500">No recent matches</p>
                </div>
              ) : (
                recentMatches.slice(0, 8).map((match, index) => (
                  <div
                    key={`${match.tournament_id}-${match.submitted_at}-${index}`}
                    className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Trophy size={14} className="text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{match.winner_name}</div>
                        <div className="text-sm text-slate-500">
                          vs {match.winner_name === match.player1_name ? match.player2_name : match.player1_name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-600">{match.outcome?.split(" (")[0] || "Victory"}</div>
                      <div className="text-xs text-slate-400">
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
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div>
              <h4 className="font-semibold text-slate-900">Ormoc Beyblade Club</h4>
              <p className="text-slate-500 text-sm">Building competitive Beyblade in Ormoc</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">System Online</span>
              </div>
              <span className="text-slate-400 text-sm">v0.5.3</span>
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
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowLoginModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center p-4 z-50"
            >
              <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
                <LoginForm onLoginSuccess={() => setShowLoginModal(false)} />
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-600 transition-colors"
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
