import React from 'react';
import { Trophy, Users, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = React.useState({
    totalTournaments: 0,
    activePlayers: 0,
    upcomingEvents: 0,
    completedMatches: 0
  });
  const [upcomingTournaments, setUpcomingTournaments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [tournamentsRes, usersRes, matchesRes] = await Promise.all([
          supabase.from('tournaments').select('*'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('match_results').select('*', { count: 'exact', head: true })
        ]);

        const tournaments = tournamentsRes.data || [];
        const upcoming = tournaments.filter(t => t.status === 'upcoming').slice(0, 3);
        
        setUpcomingTournaments(upcoming);
        setStats({
          totalTournaments: tournaments.length,
          activePlayers: usersRes.count || 0,
          upcomingEvents: tournaments.filter(t => t.status === 'upcoming').length,
          completedMatches: matchesRes.count || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statsDisplay = [
    { icon: Trophy, label: 'Total Tournaments', value: stats.totalTournaments, color: 'text-blue-600' },
    { icon: Users, label: 'Community Players', value: stats.activePlayers, color: 'text-green-600' },
    { icon: Calendar, label: 'Upcoming Events', value: stats.upcomingEvents, color: 'text-orange-600' },
    { icon: TrendingUp, label: 'Completed Matches', value: stats.completedMatches, color: 'text-purple-600' },
  ];

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container relative">
      <div className="page-header">
        <h1 className="page-title">
          Welcome{user ? ` back, ${user.username}` : ' to OBC Portal'}!
        </h1>
        <p className="page-subtitle">
          {user 
            ? 'Check out upcoming tournaments and manage your Beyblade collection!' 
            : 'Explore tournaments and Beyblade data. Login to access personal features like inventory and deck building.'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsDisplay.map((stat, index) => (
          <div key={index} className="stat-card group relative">
            <div className="flex items-center">
              <div className={`p-4 rounded-xl bg-gradient-to-br ${
                index === 0 ? 'from-blue-500/20 to-indigo-500/20' :
                index === 1 ? 'from-green-500/20 to-emerald-500/20' :
                index === 2 ? 'from-orange-500/20 to-yellow-500/20' : 'from-purple-500/20 to-pink-500/20'
              } ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-rajdhani font-medium text-slate-400">{stat.label}</p>
                <p className="text-3xl font-orbitron font-bold text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="beyblade-card p-6 relative">
          <h2 className="section-title">
            <div className="section-icon">
              <Trophy size={20} className="text-white" />
            </div>
            Upcoming Tournaments
          </h2>
          <div className="space-y-4">
            {upcomingTournaments.map((tournament) => (
              <div key={tournament.id} className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-xl p-6 border-l-4 border-blue-500 hover:border-indigo-400 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
                <h3 className="font-orbitron font-bold text-white mb-2 text-lg">{tournament.name}</h3>
                <p className="text-slate-300 font-rajdhani mb-3 text-base">{new Date(tournament.tournament_date).toLocaleDateString()} • {tournament.location}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-slate-400 font-rajdhani font-medium">
                    {tournament.current_participants}/{tournament.max_participants} registered
                  </span>
                  <span className="tournament-status-upcoming text-sm px-4 py-2 rounded-full font-rajdhani font-bold">
                    {tournament.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="beyblade-card p-6 relative">
          <h2 className="section-title">
            <div className="section-icon bg-gradient-to-br from-green-500 to-emerald-600">
              <span className="text-white text-2xl">⚡</span>
            </div>
            System Status
          </h2>
          <div className="text-center py-8 space-y-4">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-glow animate-pulse-glow">
              <span className="text-white text-2xl">✓</span>
            </div>
            <div>
              <p className="text-white font-orbitron font-bold text-xl">All Systems Operational</p>
              <p className="text-slate-300 font-rajdhani mt-3 text-lg">Connected to Supabase database</p>
            </div>
            <div className="grid grid-cols-2 gap-6 mt-8">
              <div className="bg-slate-800/60 rounded-xl p-4 backdrop-blur-sm border border-slate-600/30">
                <p className="text-green-400 font-orbitron font-bold text-2xl">99.9%</p>
                <p className="text-slate-300 font-rajdhani font-medium">Uptime</p>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-4 backdrop-blur-sm border border-slate-600/30">
                <p className="text-blue-400 font-orbitron font-bold text-2xl">&lt;50ms</p>
                <p className="text-slate-300 font-rajdhani font-medium">Response</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}