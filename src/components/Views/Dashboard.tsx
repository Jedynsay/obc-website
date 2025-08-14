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
    <div className="page-container">
      <div className="content-wrapper">
        <div className="page-header">
          <h1 className="page-title">
            Welcome{user ? ` back, ${user.username}` : ' to OBC Portal'}
          </h1>
          <p className="page-subtitle">
            {user 
              ? 'Check out upcoming tournaments and manage your Beyblade collection' 
              : 'Explore tournaments and Beyblade data. Login to access personal features like inventory and deck building'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsDisplay.map((stat, index) => (
            <div key={index} className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="metric-label">{stat.label}</p>
                  <p className="metric-value">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${
                  index === 0 ? 'bg-blue-50 text-blue-600' :
                  index === 1 ? 'bg-green-50 text-green-600' :
                  index === 2 ? 'bg-orange-50 text-orange-600' : 'bg-purple-50 text-purple-600'
                }`}>
                  <stat.icon size={24} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="section-card">
            <h2 className="section-title">
              <Trophy className="section-icon" />
              Upcoming Tournaments
            </h2>
            <div className="space-y-4">
              {upcomingTournaments.map((tournament) => (
                <div key={tournament.id} className="card p-6 border-l-4 border-blue-500 hover:shadow-md transition-all duration-200">
                  <h3 className="font-space-grotesk font-bold text-gray-900 mb-2 text-lg">{tournament.name}</h3>
                  <p className="text-gray-600 font-inter mb-3">{new Date(tournament.tournament_date).toLocaleDateString()} • {tournament.location}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-500 font-inter font-medium">
                      {tournament.current_participants}/{tournament.max_participants} registered
                    </span>
                    <span className="tournament-status-upcoming">
                      {tournament.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="section-card">
            <h2 className="section-title">
              <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center mr-3">
                <span className="text-white text-sm">✓</span>
              </div>
              System Status
            </h2>
            <div className="text-center py-8 space-y-4">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <span className="text-white text-2xl">✓</span>
              </div>
              <div>
                <p className="text-gray-900 font-space-grotesk font-bold text-xl">All Systems Operational</p>
                <p className="text-gray-600 font-inter mt-3">Connected to Supabase database</p>
              </div>
              <div className="grid grid-cols-2 gap-6 mt-8">
                <div className="metric-card">
                  <p className="metric-value text-green-600">99.9%</p>
                  <p className="metric-label">Uptime</p>
                </div>
                <div className="metric-card">
                  <p className="metric-value text-blue-600">&lt;50ms</p>
                  <p className="metric-label">Response</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}