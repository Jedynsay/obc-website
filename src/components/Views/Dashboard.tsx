"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "../../context/AuthContext"
import { supabase } from "../../lib/supabase"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import {
  Trophy,
  TrendingUp,
  Users,
  Calendar,
  ArrowRight,
  Star,
  Target,
  BarChart3,
  Zap,
  LogIn,
  LogOut,
  Settings,
  X,
  Crown,
  Activity,
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto"></div>
            <div
              className="absolute inset-0 w-20 h-20 border-4 border-purple-500/20 border-b-purple-400 rounded-full animate-spin mx-auto"
              style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
            ></div>
            <div
              className="absolute inset-2 w-16 h-16 border-2 border-blue-400/40 border-r-blue-300 rounded-full animate-spin"
              style={{ animationDuration: "2s" }}
            ></div>
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <p className="text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-2xl font-bold mb-2">
              OBC Portal
            </p>
            <p className="text-slate-400 text-sm">Initializing tournament systems...</p>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-900 text-white overflow-hidden relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* User Menu - Top Right */}
      <div className="fixed top-6 right-6 z-50">
        {user && !user.id.startsWith("guest-") ? (
          <div className="relative">
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl px-5 py-3 shadow-2xl hover:bg-slate-700/60 transition-all duration-300 hover:scale-105"
            >
              <div className="w-11 h-11 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="font-semibold text-sm text-white">{user.username}</p>
                <p className="text-xs text-slate-300 capitalize">{user.role.replace("_", " ")}</p>
              </div>
            </motion.button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute top-full right-0 mt-3 w-52 bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl py-2"
                >
                  <div className="px-5 py-4 border-b border-slate-700/50">
                    <p className="font-semibold text-white">{user.username}</p>
                    <p className="text-sm text-slate-400 capitalize">{user.role.replace("_", " ")}</p>
                  </div>
                  <button className="w-full text-left px-5 py-3 hover:bg-slate-700/50 flex items-center space-x-3 text-slate-300 hover:text-white transition-all duration-200">
                    <Settings size={18} />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={async () => {
                      setShowUserMenu(false)
                      await logout()
                    }}
                    className="w-full text-left px-5 py-3 hover:bg-red-900/30 flex items-center space-x-3 text-red-400 hover:text-red-300 transition-all duration-200"
                  >
                    <LogOut size={18} />
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
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-7 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-cyan-500/25 hover:scale-105"
          >
            <LogIn size={20} />
            <span>Login</span>
          </motion.button>
        )}
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />}

      {/* Hero Section with Community Image */}
      <motion.section
        ref={containerRef}
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <img src="/community.jpg" alt="Ormoc Beyblade Community" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-purple-900/30 to-slate-900/90"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-2xl">
                Ormoc Beyblade Club
              </span>
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-xl md:text-3xl text-slate-200 mb-10 leading-relaxed font-medium"
            >
              Welcome to the home of competitive Beyblade in Ormoc.
              <span className="text-transparent bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text font-bold">
                {" "}
                Let it rip!
              </span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-6 justify-center"
            >
              <button
                onClick={() => onViewChange?.("tournaments")}
                className="group relative bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/30 flex items-center justify-center space-x-3 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Trophy size={26} className="relative z-10" />
                <span className="relative z-10">Join Tournament</span>
                <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform relative z-10" />
              </button>

              <button
                onClick={() => onViewChange?.("analytics")}
                className="group relative bg-slate-800/80 hover:bg-slate-700/80 backdrop-blur-xl text-white border-2 border-slate-600/50 hover:border-purple-400/50 px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                <BarChart3 size={26} className="relative z-10" />
                <span className="relative z-10">View Analytics</span>
                <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform relative z-10" />
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-7 h-12 border-2 border-cyan-400/60 rounded-full flex justify-center shadow-lg shadow-cyan-400/20">
            <div className="w-1.5 h-4 bg-gradient-to-b from-cyan-400 to-purple-400 rounded-full mt-2 animate-bounce"></div>
          </div>
        </motion.div>
      </motion.section>
      {/* Main Content with Parallax */}
      <motion.div style={{ y: contentY }} className="relative z-20 bg-gradient-to-b from-slate-900 to-slate-800">
        {/* Community Stats Section */}
        <section className="py-24 bg-gradient-to-b from-slate-900 via-slate-800/50 to-slate-800 relative">
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 25% 25%, cyan 1px, transparent 1px), radial-gradient(circle at 75% 75%, purple 1px, transparent 1px)`,
                backgroundSize: "50px 50px",
              }}
            ></div>
          </div>

          <div className="max-w-7xl mx-auto px-6 relative">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-5xl font-black text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text mb-6">
                Community at a Glance
              </h2>
              <p className="text-slate-300 text-xl max-w-3xl mx-auto leading-relaxed">
                Track the pulse of our competitive scene with real-time statistics and performance metrics
              </p>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  label: "Total Tournaments",
                  value: stats.totalTournaments,
                  icon: Trophy,
                  color: "from-yellow-400 to-orange-500",
                  bgColor: "bg-yellow-500/10",
                  borderColor: "border-yellow-400/20",
                },
                {
                  label: "Active Bladers",
                  value: stats.activePlayers,
                  icon: Users,
                  color: "from-green-400 to-emerald-500",
                  bgColor: "bg-green-500/10",
                  borderColor: "border-green-400/20",
                },
                {
                  label: "Upcoming Events",
                  value: stats.upcomingEvents,
                  icon: Calendar,
                  color: "from-cyan-400 to-blue-500",
                  bgColor: "bg-cyan-500/10",
                  borderColor: "border-cyan-400/20",
                },
                {
                  label: "Total Matches",
                  value: stats.completedMatches,
                  icon: Target,
                  color: "from-purple-400 to-pink-500",
                  bgColor: "bg-purple-500/10",
                  borderColor: "border-purple-400/20",
                },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  viewport={{ once: true }}
                  className={`${stat.bgColor} backdrop-blur-xl border-2 ${stat.borderColor} rounded-3xl p-8 text-center hover:shadow-2xl transition-all duration-300 relative overflow-hidden group`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div
                    className={`w-16 h-16 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg relative z-10`}
                  >
                    <stat.icon className="text-white" size={28} />
                  </div>
                  <div className="text-4xl font-black text-white mb-3 relative z-10">{stat.value}</div>
                  <div className="text-slate-300 text-sm font-semibold relative z-10">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Access Hub */}
        <section className="py-20 bg-slate-800">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-white mb-4">Quick Access Hub</h2>
              <p className="text-slate-300 text-lg">Jump into action with our most popular features</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Tournament Hub */}
              <motion.button
                onClick={() => onViewChange?.("tournaments")}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                whileHover={{ scale: 1.02, y: -8 }}
                whileTap={{ scale: 0.98 }}
                viewport={{ once: true }}
                className="group bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-left w-full hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Trophy className="text-white" size={32} />
                  </div>
                  {stats.upcomingEvents > 0 && (
                    <span className="bg-green-400 text-slate-900 px-3 py-1 rounded-full text-xs font-bold">
                      {stats.upcomingEvents} LIVE
                    </span>
                  )}
                </div>

                <h3 className="text-white font-bold text-2xl mb-3">Tournament Hub</h3>
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
                      <div className="flex items-center text-white font-medium group-hover:translate-x-2 transition-transform">
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
                whileHover={{ scale: 1.02, y: -8 }}
                whileTap={{ scale: 0.98 }}
                viewport={{ once: true }}
                className="group bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-8 text-left w-full hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="text-white" size={32} />
                  </div>
                  <span className="bg-purple-300 text-purple-900 px-3 py-1 rounded-full text-xs font-bold">
                    LIVE DATA
                  </span>
                </div>

                <h3 className="text-white font-bold text-2xl mb-3">Performance Analytics</h3>
                <p className="text-purple-100 mb-6">Deep dive into meta trends and player performance metrics</p>

                <div className="space-y-3">
                  <div className="text-white font-semibold">Meta Analysis Available</div>
                  <div className="text-purple-200 text-sm">
                    {stats.completedMatches} matches analyzed • Real-time updates
                  </div>
                  <div className="flex items-center text-white font-medium group-hover:translate-x-2 transition-transform">
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
                whileHover={{ scale: 1.02, y: -8 }}
                whileTap={{ scale: 0.98 }}
                viewport={{ once: true }}
                className="group bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl p-8 text-left w-full hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Zap className="text-white" size={32} />
                  </div>
                  <span className="bg-orange-300 text-orange-900 px-3 py-1 rounded-full text-xs font-bold">
                    {deckPresets.length} SAVED
                  </span>
                </div>

                <h3 className="text-white font-bold text-2xl mb-3">Deck Builder</h3>
                <p className="text-orange-100 mb-6">Create and optimize your Beyblade combinations</p>

                <div className="space-y-3">
                  <div className="text-white font-semibold">
                    {user && !user.id.startsWith("guest-")
                      ? `${deckPresets.length} deck presets saved`
                      : "Build custom combinations"}
                  </div>
                  <div className="text-orange-200 text-sm">Track inventory • Save presets • Optimize builds</div>
                  <div className="flex items-center text-white font-medium group-hover:translate-x-2 transition-transform">
                    <span>Start Building</span>
                    <ArrowRight size={16} className="ml-2" />
                  </div>
                </div>
              </motion.button>
            </div>
          </div>
        </section>
        {/* Community Champions */}
        <section className="py-24 bg-gradient-to-b from-slate-800 to-slate-900 relative">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 rounded-full blur-2xl animate-pulse"></div>
            <div
              className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-2xl animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>

          <div className="max-w-7xl mx-auto px-6 relative">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-5xl font-black text-transparent bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text mb-6">
                Community Champions
              </h2>
              <p className="text-slate-300 text-xl leading-relaxed">Celebrating our top performers and rising stars</p>
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
                    className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-2 border-yellow-400/20 rounded-3xl p-16 text-center relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-orange-500/5 to-red-500/5"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>

                    <div className="relative z-10">
                      <div className="flex items-center justify-center mb-10">
                        <div className="relative">
                          <div className="w-32 h-32 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 rounded-full flex items-center justify-center text-6xl font-black text-black shadow-2xl relative">
                            {topPlayers[currentPlayerIndex]?.name.charAt(0).toUpperCase()}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-full"></div>
                          </div>
                          <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-xl">
                            <Crown size={24} className="text-black" />
                          </div>
                          <div className="absolute inset-0 w-32 h-32 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                        </div>
                      </div>

                      <h3 className="text-4xl font-black text-white mb-4">{topPlayers[currentPlayerIndex]?.name}</h3>
                      <div className="flex items-center justify-center space-x-3 mb-10">
                        <Star className="text-yellow-400" size={24} />
                        <span className="text-transparent bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text font-bold text-xl">
                          Community Champion
                        </span>
                        <Star className="text-yellow-400" size={24} />
                      </div>

                      <div className="grid grid-cols-3 gap-10 max-w-2xl mx-auto">
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-400/20">
                          <div className="text-5xl font-black text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text mb-3">
                            {topPlayers[currentPlayerIndex]?.wins}
                          </div>
                          <div className="text-slate-400 font-semibold">Total Wins</div>
                        </div>
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/20">
                          <div className="text-5xl font-black text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text mb-3">
                            {topPlayers[currentPlayerIndex]?.tournaments}
                          </div>
                          <div className="text-slate-400 font-semibold">Tournaments</div>
                        </div>
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-green-400/20">
                          <div className="text-5xl font-black text-transparent bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text mb-3">
                            {topPlayers[currentPlayerIndex]?.winRate}%
                          </div>
                          <div className="text-slate-400 font-semibold">Win Rate</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {topPlayers.length > 1 && (
                  <div className="flex justify-center space-x-4 mt-10">
                    {topPlayers.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPlayerIndex(index)}
                        className={`w-4 h-4 rounded-full transition-all duration-300 ${
                          index === currentPlayerIndex
                            ? "bg-gradient-to-r from-yellow-400 to-orange-400 scale-125 shadow-lg shadow-yellow-400/50"
                            : "bg-slate-600 hover:bg-slate-500 hover:scale-110"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </section>

        {/* Live Activity Feed */}
        <section className="py-20 bg-slate-900">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8"
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
                <div>
                  <h3 className="text-2xl font-bold text-white flex items-center mb-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse mr-3"></div>
                    Live Match Results
                  </h3>
                  <p className="text-slate-400">Real-time updates from ongoing tournaments</p>
                </div>

                <div className="flex items-center space-x-4">
                  <select
                    value={selectedTournamentFilter}
                    onChange={(e) => setSelectedTournamentFilter(e.target.value)}
                    className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Tournaments</option>
                    {allTournaments.map((tournament) => (
                      <option key={tournament.id} value={tournament.id}>
                        {tournament.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center space-x-2 bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-sm font-medium">LIVE</span>
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
                    <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Activity size={40} className="text-slate-400" />
                    </div>
                    <h4 className="text-xl font-semibold text-white mb-2">No Recent Activity</h4>
                    <p className="text-slate-400">
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
                        className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-6 hover:bg-slate-700/50 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                W
                              </div>
                              <div>
                                <div className="text-white font-semibold">{match.winner_name}</div>
                                <div className="text-slate-400 text-sm">
                                  defeated{" "}
                                  {match.winner_name === match.player1_name ? match.player2_name : match.player1_name}
                                </div>
                              </div>
                            </div>

                            {(match.player1_beyblade || match.player2_beyblade) && (
                              <div className="text-xs text-slate-500 font-mono bg-slate-800/50 rounded px-2 py-1">
                                {match.winner_name === match.player1_name
                                  ? `${match.player1_beyblade || "Unknown"} vs ${match.player2_beyblade || "Unknown"}`
                                  : `${match.player2_beyblade || "Unknown"} vs ${match.player1_beyblade || "Unknown"}`}
                              </div>
                            )}
                          </div>

                          <div className="text-right">
                            <div className="text-slate-300 text-sm font-medium">
                              {match.outcome?.split(" (")[0] || "Victory"}
                            </div>
                            <div className="text-slate-500 text-xs mt-1">
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

        {/* Community Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="border-t-2 border-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 bg-slate-950 py-16 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5"></div>
          <div className="max-w-7xl mx-auto px-6 relative">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">
              <div className="text-center md:text-left">
                <h4 className="text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text font-black text-2xl mb-3">
                  Ormoc Beyblade Club
                </h4>
                <p className="text-slate-300 text-lg mb-2">Building the future of competitive Beyblade in Ormoc</p>
                <p className="text-slate-500 text-sm">Created with ❤️ by Jedynsay</p>
              </div>

              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-3 bg-green-500/20 border border-green-400/30 rounded-xl px-4 py-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                  <span className="text-green-400 font-bold text-sm">System Online</span>
                </div>
                <div className="text-slate-400 font-mono text-sm bg-slate-800/50 px-3 py-2 rounded-lg">
                  Portal v0.5.3
                </div>
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
              <div className="relative pointer-events-auto bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
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
