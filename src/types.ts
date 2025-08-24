export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'technical_officer' | 'admin' | 'developer';
  joinedDate: string;
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  tournament_date: string;
  location: string;
  max_participants: number;
  current_participants: number;
  status: 'upcoming' | 'active' | 'completed';
  registration_deadline: string;
  prize_pool?: string;
  beyblades_per_player: number;
  players_per_team: number;
  entry_fee: number;
  is_free: boolean;
  tournament_type: 'ranked' | 'casual';
  password?: string;
  created_at: string;
}