"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "../../context/AuthContext"
import { supabase } from "../../lib/supabase"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { ArrowRight, LogIn, LogOut, Settings, X } from "lucide-react"
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

  // Parallax scroll refs (hero section only now)
  const containerRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll(
    containerRef.current
      ? {
          target: containerRef,
          offset: ["start start", "end start"],
          layoutEffect: false,
        }
      : undefined,
  )

  // Parallax transforms
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -200])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -100])

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-12 h-12 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading OBC Portal...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden">
      <div className="fixed top-6 right-6 z-50">
        {user && !user.id.startsWith("guest-") ? (
          <div className="relative">
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="font-semibold text-sm text-gray-900">{user.username}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role.replace("_", " ")}</p>
              </div>
            </motion.button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2"
                >
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-900">{user.username}</p>
                    <p className="text-sm text-gray-500 capitalize">{user.role.replace("_", " ")}</p>
                  </div>
                  <button className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors">
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={async () => {
                      setShowUserMenu(false)
                      await logout()
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setShowLoginModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 shadow-sm"
          >
            <LogIn size={18} />
            <span>Login</span>
          </motion.button>
        )}
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />}

      <motion.section
        ref={containerRef}
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <img src="/community.jpg" alt="Ormoc Beyblade Community" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-white">Ormoc Beyblade Club</h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              Welcome to the home of competitive Beyblade in Ormoc. Let it rip!
            </p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={() => onViewChange?.("tournaments")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-3"
              >
                <span>Join Tournament</span>
                <ArrowRight size={20} />
              </button>

              <button
                onClick={() => onViewChange?.("analytics")}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 hover:border-white/30 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-3"
              >
                <span>View Analytics</span>
                <ArrowRight size={20} />
              </button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      <motion.div style={{ y: contentY }} className="relative z-20 bg-white">
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Community Stats</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Track the pulse of our competitive scene with real-time statistics
              </p>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  label: "Total Tournaments",
                  value: stats.totalTournaments,
                  color: "bg-yellow-50 border-yellow-200",
                },
                {
                  label: "Active Bladers",
                  value: stats.activePlayers,
                  color: "bg-green-50 border-green-200",
                },
                {
                  label: "Upcoming Events",
                  value: stats.upcomingEvents,
                  color: "bg-blue-50 border-blue-200",
                },
                {
                  label: "Total Matches",
                  value: stats.completedMatches,
                  color: "bg-purple-50 border-purple-200",
                },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`${stat.color} border rounded-lg p-6 text-center`}
                >
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600 text-sm font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Quick Access</h2>
              <p className="text-gray-600 text-lg">Jump into action with our most popular features</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Tournament Hub */}
              <motion.button
                onClick={() => onViewChange?.("tournaments")}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                whileHover={{ y: -4 }}
                viewport={{ once: true }}
                className="bg-blue-600 hover:bg-blue-700 rounded-lg p-8 text-left w-full transition-all duration-300 text-white"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-bold text-2xl">Tournament Hub</h3>
                  {stats.upcomingEvents > 0 && (
                    <span className="bg-green-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold">
                      {stats.upcomingEvents} LIVE
                    </span>
                  )}
                </div>

                <p className="text-blue-100 mb-6">Register for upcoming battles and view tournament brackets</p>

                {upcomingTournaments.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-white font-semibold">{upcomingTournaments[0].name}</div>
                    <div className="text-blue-200 text-sm">
                      {new Date(upcomingTournaments[0].tournament_date).toLocaleDateString()} •{" "}
                      {upcomingTournaments[0].location}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-200 text-sm">
                        {upcomingTournaments[0].current_participants}/{upcomingTournaments[0].max_participants}{" "}
                        registered
                      </span>
                      <div className="flex items-center text-white font-medium">
                        <span>Register Now</span>
                        <ArrowRight size={16} className="ml-2" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-blue-200">No upcoming tournaments</div>
                )}
              </motion.button>

              {/* Analytics Dashboard */}
              <motion.button
                onClick={() => onViewChange?.("analytics")}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                whileHover={{ y: -4 }}
                viewport={{ once: true }}
                className="bg-purple-600 hover:bg-purple-700 rounded-lg p-8 text-left w-full transition-all duration-300 text-white"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-bold text-2xl">Performance Analytics</h3>
                  <span className="bg-purple-300 text-purple-900 px-3 py-1 rounded-full text-xs font-bold">
                    LIVE DATA
                  </span>
                </div>

                <p className="text-purple-100 mb-6">Deep dive into meta trends and player performance metrics</p>

                <div className="space-y-3">
                  <div className="text-white font-semibold">Meta Analysis Available</div>
                  <div className="text-purple-200 text-sm">
                    {stats.completedMatches} matches analyzed • Real-time updates
                  </div>
                  <div className="flex items-center text-white font-medium">
                    <span>View Analytics</span>
                    <ArrowRight size={16} className="ml-2" />
                  </div>
                </div>
              </motion.button>

              {/* Deck Builder */}
              <motion.button
                onClick={() => onViewChange?.("inventory")}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                whileHover={{ y: -4 }}
                viewport={{ once: true }}
                className="bg-orange-600 hover:bg-orange-700 rounded-lg p-8 text-left w-full transition-all duration-300 text-white"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-bold text-2xl">Deck Builder</h3>
                  <span className="bg-orange-300 text-orange-900 px-3 py-1 rounded-full text-xs font-bold">
                    {deckPresets.length} SAVED
                  </span>
                </div>

                <p className="text-orange-100 mb-6">Create and optimize your Beyblade combinations</p>

                <div className="space-y-3">
                  <div className="text-white font-semibold">
                    {user && !user.id.startsWith("guest-")
                      ? `${deckPresets.length} deck presets saved`
                      : "Build custom combinations"}
                  </div>
                  <div className="text-orange-200 text-sm">Track inventory • Save presets • Optimize builds</div>
                  <div className="flex items-center text-white font-medium">
                    <span>Start Building</span>
                    <ArrowRight size={16} className="ml-2" />
                  </div>
                </div>
              </motion.button>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Community Champions</h2>
              <p className="text-gray-600 text-lg">Celebrating our top performers and rising stars</p>
            </motion.div>

            {topPlayers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="relative"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPlayerIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white border border-gray-200 rounded-lg p-12 text-center"
                  >
                    <div className="flex items-center justify-center mb-8">
                      <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center text-4xl font-bold text-black">
                        {topPlayers[currentPlayerIndex]?.name.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    <h3 className="text-3xl font-bold text-gray-900 mb-3">{topPlayers[currentPlayerIndex]?.name}</h3>
                    <div className="text-yellow-600 font-semibold text-lg mb-8">Community Champion</div>

                    <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
                      <div>
                        <div className="text-4xl font-bold text-blue-600 mb-2">
                          {topPlayers[currentPlayerIndex]?.wins}
                        </div>
                        <div className="text-gray-600">Total Wins</div>
                      </div>
                      <div>
                        <div className="text-4xl font-bold text-purple-600 mb-2">
                          {topPlayers[currentPlayerIndex]?.tournaments}
                        </div>
                        <div className="text-gray-600">Tournaments</div>
                      </div>
                      <div>
                        <div className="text-4xl font-bold text-green-600 mb-2">
                          {topPlayers[currentPlayerIndex]?.winRate}%
                        </div>
                        <div className="text-gray-600">Win Rate</div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {topPlayers.length > 1 && (
                  <div className="flex justify-center space-x-3 mt-8">
                    {topPlayers.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPlayerIndex(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          index === currentPlayerIndex ? "bg-yellow-400" : "bg-gray-300 hover:bg-gray-400"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-gray-50 border border-gray-200 rounded-lg p-8"
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center mb-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                    Live Match Results
                  </h3>
                  <p className="text-gray-600">Real-time updates from ongoing tournaments</p>
                </div>

                <div className="flex items-center space-x-4">
                  <select
                    value={selectedTournamentFilter}
                    onChange={(e) => setSelectedTournamentFilter(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Tournaments</option>
                    {allTournaments.map((tournament) => (
                      <option key={tournament.id} value={tournament.id}>
                        {tournament.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-600 text-sm font-medium">LIVE</span>
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {recentMatches.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-16"
                  >
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">No Recent Activity</h4>
                    <p className="text-gray-600">
                      {selectedTournamentFilter === "all"
                        ? "No matches recorded yet across all tournaments"
                        : `No matches found for ${allTournaments.find((t) => t.id === selectedTournamentFilter)?.name || "this tournament"}`}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-4"
                  >
                    {recentMatches.slice(0, 6).map((match, index) => (
                      <motion.div
                        key={`${match.tournament_id}-${match.submitted_at}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white border border-gray-200 rounded-lg p-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                W
                              </div>
                              <div>
                                <div className="text-gray-900 font-semibold">{match.winner_name}</div>
                                <div className="text-gray-600 text-sm">
                                  defeated{" "}
                                  {match.winner_name === match.player1_name ? match.player2_name : match.player1_name}
                                </div>
                              </div>
                            </div>

                            {(match.player1_beyblade || match.player2_beyblade) && (
                              <div className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-1">
                                {match.winner_name === match.player1_name
                                  ? `${match.player1_beyblade || "Unknown"} vs ${match.player2_beyblade || "Unknown"}`
                                  : `${match.player2_beyblade || "Unknown"} vs ${match.player1_beyblade || "Unknown"}`}
                              </div>
                            )}
                          </div>

                          <div className="text-right">
                            <div className="text-gray-900 text-sm font-medium">
                              {match.outcome?.split(" (")[0] || "Victory"}
                            </div>
                            <div className="text-gray-500 text-xs mt-1">
                              {new Date(match.submitted_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </section>

        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="border-t border-gray-200 bg-gray-50 py-12"
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
              <div className="text-center md:text-left">
                <h4 className="text-gray-900 font-bold text-lg mb-2">Ormoc Beyblade Club</h4>
                <p className="text-gray-600">Building the future of competitive Beyblade in Ormoc</p>
                <p className="text-gray-500 text-sm mt-1">Created by Jedynsay</p>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-600 font-medium text-sm">System Online</span>
                </div>
                <div className="text-gray-500 text-sm">Portal v0.5.3</div>
              </div>
            </div>
          </div>
        </motion.footer>
      </motion.div>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowLoginModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none z-50"
            >
              <div className="relative pointer-events-auto bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <LoginForm onLoginSuccess={() => setShowLoginModal(false)} />
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
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
