/*
  # Core Application Tables

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique, not null)
      - `email` (text, unique, nullable)
      - `role` (text, not null, default 'user')
      - `status` (text, not null, default 'active')
      - `created_at` (timestamptz, default now())
      - `last_login` (timestamptz, nullable)
    
    - `tournaments`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text)
      - `tournament_date` (date, not null)
      - `location` (text, not null)
      - `max_participants` (integer, not null)
      - `current_participants` (integer, default 0)
      - `status` (text, not null, default 'upcoming')
      - `registration_deadline` (date, not null)
      - `prize_pool` (text)
      - `beyblades_per_player` (integer, default 3)
      - `players_per_team` (integer, default 1)
      - `created_at` (timestamptz, default now())
    
    - `matches`
      - `id` (uuid, primary key)
      - `tournament_id` (uuid, references tournaments)
      - `player1_name` (text, not null)
      - `player2_name` (text, not null)
      - `winner_name` (text, nullable)
      - `round_name` (text, not null)
      - `status` (text, not null, default 'pending')
      - `start_time` (timestamptz, nullable)
      - `end_time` (timestamptz, nullable)
      - `score` (text, nullable)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
    - Allow public read access for tournaments and matches
    - Restrict user management to admins
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'technical_officer', 'admin', 'developer')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login timestamptz
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Anyone can read users"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert users"
  ON users
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Only admins can update users"
  ON users
  FOR UPDATE
  USING (false);

CREATE POLICY "Only admins can delete users"
  ON users
  FOR DELETE
  USING (false);

-- Create tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  tournament_date date NOT NULL,
  location text NOT NULL,
  max_participants integer NOT NULL CHECK (max_participants > 0),
  current_participants integer NOT NULL DEFAULT 0 CHECK (current_participants >= 0),
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  registration_deadline date NOT NULL,
  prize_pool text,
  beyblades_per_player integer NOT NULL DEFAULT 3 CHECK (beyblades_per_player > 0),
  players_per_team integer NOT NULL DEFAULT 1 CHECK (players_per_team > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

-- Tournaments policies
CREATE POLICY "Anyone can read tournaments"
  ON tournaments
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert tournaments"
  ON tournaments
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Only admins can update tournaments"
  ON tournaments
  FOR UPDATE
  USING (false);

CREATE POLICY "Only admins can delete tournaments"
  ON tournaments
  FOR DELETE
  USING (false);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player1_name text NOT NULL,
  player2_name text NOT NULL,
  winner_name text,
  round_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  start_time timestamptz,
  end_time timestamptz,
  score text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Matches policies
CREATE POLICY "Anyone can read matches"
  ON matches
  FOR SELECT
  USING (true);

CREATE POLICY "Only technical officers and above can insert matches"
  ON matches
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Only technical officers and above can update matches"
  ON matches
  FOR UPDATE
  USING (false);

CREATE POLICY "Only admins can delete matches"
  ON matches
  FOR DELETE
  USING (false);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_date ON tournaments(tournament_date);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

-- Insert sample data
INSERT INTO users (username, email, role, status, last_login) VALUES
  ('BladeSpinner', 'user@beyblade.com', 'user', 'active', '2024-01-25T10:30:00Z'),
  ('TechOfficer', 'officer@beyblade.com', 'technical_officer', 'active', '2024-01-25T09:15:00Z'),
  ('AdminMaster', 'admin@beyblade.com', 'admin', 'active', '2024-01-25T11:45:00Z'),
  ('StormBreaker', 'storm@beyblade.com', 'user', 'active', '2024-01-24T16:20:00Z'),
  ('FlamePhoenix', 'flame@beyblade.com', 'user', 'suspended', '2024-01-22T14:10:00Z'),
  ('IronDefender', 'iron@beyblade.com', 'user', 'active', '2024-01-23T12:30:00Z'),
  ('ThunderBolt', 'thunder@beyblade.com', 'user', 'active', '2024-01-24T18:45:00Z'),
  ('CrimsonDragon', 'crimson@beyblade.com', 'user', 'pending', NULL)
ON CONFLICT (username) DO NOTHING;

INSERT INTO tournaments (name, description, tournament_date, location, max_participants, current_participants, status, registration_deadline, prize_pool, beyblades_per_player, players_per_team) VALUES
  ('Way of the Phoenix - 15k Pool Open', 'Bring your A game, risk it all!', '2025-08-03', 'SM Center Ormoc', 32, 28, 'upcoming', '2025-08-01', '15k Pesos Price Pool', 3, 1),
  ('Way of the Phoenix - ABC Mode', 'Test your theory.', '2025-08-10', 'SM Center Ormoc', 16, 12, 'upcoming', '2025-08-08', 'SharkScale Deck Set, Cx-09 Random Boosters', 3, 1),
  ('Way of the Phoenix - All ATK Mode', 'No stamina, no balance, no defense. ALL ATTACK.', '2025-08-17', 'SM Center Ormoc', 24, 24, 'completed', '2025-08-15', 'AeroPegasus, and many more!', 3, 1),
  ('Winter Championship 2024', 'The ultimate winter tournament for all skill levels.', '2024-12-15', 'Manila Arena', 64, 45, 'active', '2024-12-10', '50k Pesos + Trophies', 4, 1),
  ('Rookie Cup 2025', 'Tournament for new players to showcase their skills.', '2025-02-20', 'Cebu Sports Complex', 20, 8, 'upcoming', '2025-02-15', 'Starter Sets + Medals', 2, 1)
ON CONFLICT DO NOTHING;

-- Insert matches (using tournament IDs from the inserted tournaments)
INSERT INTO matches (tournament_id, player1_name, player2_name, winner_name, round_name, status, start_time, end_time, score) 
SELECT 
  t.id,
  'BladeSpinner',
  'TornadoMaster',
  'BladeSpinner',
  'Quarter Finals',
  'completed',
  '2024-01-05T14:00:00Z',
  '2024-01-05T14:15:00Z',
  '3-1'
FROM tournaments t WHERE t.name = 'Way of the Phoenix - 15k Pool Open'
UNION ALL
SELECT 
  t.id,
  'StormBreaker',
  'IronDefender',
  NULL,
  'Semi Finals',
  'in_progress',
  '2024-01-05T15:00:00Z',
  NULL,
  NULL
FROM tournaments t WHERE t.name = 'Way of the Phoenix - 15k Pool Open'
UNION ALL
SELECT 
  t.id,
  'FlamePhoenix',
  'ThunderBolt',
  NULL,
  'Finals',
  'pending',
  NULL,
  NULL,
  NULL
FROM tournaments t WHERE t.name = 'Way of the Phoenix - 15k Pool Open'
UNION ALL
SELECT 
  t.id,
  'CrimsonDragon',
  'BladeSpinner',
  'CrimsonDragon',
  'Round 1',
  'completed',
  '2024-12-01T10:00:00Z',
  '2024-12-01T10:20:00Z',
  '3-2'
FROM tournaments t WHERE t.name = 'Winter Championship 2024'
ON CONFLICT DO NOTHING;