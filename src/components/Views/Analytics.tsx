"use client"

import { useState } from "react"
import { BarChart3, TrendingUp, Trophy, Users, Target, User, Database, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"

// Mock tab components for demonstration
const OverviewTab = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-xl bg-primary/10">
          <Trophy className="w-6 h-6 text-primary" />
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">1,247</p>
          <p className="text-sm text-muted-foreground">Total Tournaments</p>
        </div>
      </div>
      <div className="flex items-center text-sm">
        <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
        <span className="text-emerald-500 font-medium">+12.5%</span>
        <span className="text-muted-foreground ml-1">vs last month</span>
      </div>
    </Card>

    <Card className="p-6 bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-xl bg-secondary/10">
          <Users className="w-6 h-6 text-secondary" />
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">89,432</p>
          <p className="text-sm text-muted-foreground">Active Players</p>
        </div>
      </div>
      <div className="flex items-center text-sm">
        <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
        <span className="text-emerald-500 font-medium">+8.2%</span>
        <span className="text-muted-foreground ml-1">vs last month</span>
      </div>
    </Card>

    <Card className="p-6 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-xl bg-accent/10">
          <Target className="w-6 h-6 text-accent" />
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">94.7%</p>
          <p className="text-sm text-muted-foreground">Completion Rate</p>
        </div>
      </div>
      <div className="flex items-center text-sm">
        <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
        <span className="text-emerald-500 font-medium">+2.1%</span>
        <span className="text-muted-foreground ml-1">vs last month</span>
      </div>
    </Card>
  </div>
)

const PersonalStatsTab = () => (
  <div className="space-y-6">
    <Card className="p-6 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-primary/20">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Your Performance</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">156</p>
          <p className="text-sm text-muted-foreground">Tournaments Won</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-secondary">89.2%</p>
          <p className="text-sm text-muted-foreground">Win Rate</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-accent">2,847</p>
          <p className="text-sm text-muted-foreground">Total Points</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-chart-2">#12</p>
          <p className="text-sm text-muted-foreground">Global Rank</p>
        </div>
      </div>
    </Card>
  </div>
)

const TournamentAnalysisTab = () => (
  <div className="space-y-6">
    <Card className="p-6 bg-gradient-to-br from-chart-1/10 to-chart-2/10 border-chart-1/20">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Tournament Insights</h3>
      <p className="text-muted-foreground">Advanced tournament analysis and trends will be displayed here.</p>
    </Card>
  </div>
)

const CommunityAnalyticsTab = () => (
  <div className="space-y-6">
    <Card className="p-6 bg-gradient-to-br from-chart-3/10 to-chart-4/10 border-chart-3/20">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Community Metrics</h3>
      <p className="text-muted-foreground">Community engagement and social analytics will be displayed here.</p>
    </Card>
  </div>
)

export function Analytics() {
  const [currentTab, setCurrentTab] = useState<"overview" | "personal" | "tournament" | "community">("overview")
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleTabChange = (tab: "overview" | "personal" | "tournament" | "community") => {
    if (tab === currentTab) return

    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentTab(tab)
      setIsTransitioning(false)
    }, 150)
  }

  if (isTransitioning) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-32">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-secondary rounded-full animate-spin animate-reverse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-secondary">
                  <BarChart3 size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Tournament Analytics
                  </h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Sparkles size={16} className="text-primary" />
                    <p className="text-sm">Comprehensive tournament, player, and community insights</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleTabChange("overview")}
                className={`group relative px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                  currentTab === "overview"
                    ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/25 scale-105"
                    : "bg-card hover:bg-primary/10 text-muted-foreground hover:text-primary border border-border/50 hover:border-primary/30"
                }`}
              >
                <Trophy size={16} />
                Overview
                {currentTab === "overview" && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-secondary opacity-20 animate-pulse"></div>
                )}
              </button>

              <button
                onClick={() => handleTabChange("personal")}
                className={`group relative px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                  currentTab === "personal"
                    ? "bg-gradient-to-r from-secondary to-secondary/80 text-white shadow-lg shadow-secondary/25 scale-105"
                    : "bg-card hover:bg-secondary/10 text-muted-foreground hover:text-secondary border border-border/50 hover:border-secondary/30"
                }`}
              >
                <User size={16} />
                Personal Stats
                {currentTab === "personal" && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-secondary to-accent opacity-20 animate-pulse"></div>
                )}
              </button>

              <button
                onClick={() => handleTabChange("tournament")}
                className={`group relative px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                  currentTab === "tournament"
                    ? "bg-gradient-to-r from-accent to-accent/80 text-white shadow-lg shadow-accent/25 scale-105"
                    : "bg-card hover:bg-accent/10 text-muted-foreground hover:text-accent border border-border/50 hover:border-accent/30"
                }`}
              >
                <Database size={16} />
                Tournament Analysis
                {currentTab === "tournament" && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-accent to-primary opacity-20 animate-pulse"></div>
                )}
              </button>

              <button
                onClick={() => handleTabChange("community")}
                className={`group relative px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                  currentTab === "community"
                    ? "bg-gradient-to-r from-chart-2 to-chart-2/80 text-white shadow-lg shadow-chart-2/25 scale-105"
                    : "bg-card hover:bg-chart-2/10 text-muted-foreground hover:text-chart-2 border border-border/50 hover:border-chart-2/30"
                }`}
              >
                <Users size={16} />
                Community Analytics
                {currentTab === "community" && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-chart-2 to-chart-3 opacity-20 animate-pulse"></div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-in fade-in-50 duration-500">
          {currentTab === "overview" && <OverviewTab />}
          {currentTab === "personal" && <PersonalStatsTab />}
          {currentTab === "tournament" && <TournamentAnalysisTab />}
          {currentTab === "community" && <CommunityAnalyticsTab />}
        </div>
      </div>
    </div>
  )
}
