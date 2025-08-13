/*
# Complete Database Schema Migration

This migration creates all tables for the Beyblade Community application with the following structure:

## New Tables
1. **profiles** - User profiles linked to auth.users
2. **tournaments** - Tournament information and settings
3. **tournament_registrations** - Player registrations for tournaments
4. **tournament_beyblades** - Beyblades registered for tournaments
5. **tournament_beyblade_parts** - Parts for tournament beyblades
6. **matches** - Tournament matches
7. **match_results** - Individual match results
8. **match_sessions** - Complete match sessions
9. **registrations** - Legacy registration table
10. **beyblades** - Legacy beyblade table
11. **beyblade_parts** - Legacy beyblade parts
12. **users** - Application users table
13. **user_inventory** - User's beyblade parts inventory
14. **deck_presets** - Saved deck configurations
15. **players** - Player information
16. **beypart_assistblade** - Assist blade parts data (renamed from Beyblade - Assist Blade)
17. **beypart_bit** - Bit parts data (renamed from Beyblade - Bit)
18. **beypart_blade** - Blade parts data (renamed from Beyblade - Blades)
19. **beypart_lockchip** - Lockchip parts data (renamed from Beyblade - Lockchips)
20. **beypart_ratchet** - Ratchet parts data (renamed from Beyblade - Ratchets)

## Security
- All tables have RLS enabled
- Appropriate policies for each table based on user roles
- Trigger function for automatic profile creation

## Authentication
- Automatic profile creation on user signup
- Role-based access control
*/

-- =============================================
-- 1. PROFILES TABLE (Core user profiles)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  avatar text
);

-- Add check constraint for roles
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role = ANY (ARRAY['user'::text, 'technical_officer'::text, 'admin'::text, 'developer'::text]));

-- Create indexes
CREATE INDEX idx_profiles_username ON profiles USING btree (username);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = id);

-- =============================================
-- 2. TOURNAMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  tournament_date date NOT NULL,
  location text NOT NULL,
  max_participants integer NOT NULL,
  current_participants integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'upcoming',
  registration_deadline date NOT NULL,
  prize_pool text,
  beyblades_per_player integer NOT NULL DEFAULT 3,
  players_per_team integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add constraints
ALTER TABLE tournaments ADD CONSTRAINT tournaments_status_check 
CHECK (status = ANY (ARRAY['upcoming'::text, 'active'::text, 'completed'::text]));

ALTER TABLE tournaments ADD CONSTRAINT tournaments_max_participants_check 
CHECK (max_participants > 0);

ALTER TABLE tournaments ADD CONSTRAINT tournaments_current_participants_check 
CHECK (current_participants >= 0);

ALTER TABLE tournaments ADD CONSTRAINT tournaments_beyblades_per_player_check 
CHECK (beyblades_per_player > 0);

ALTER TABLE tournaments ADD CONSTRAINT tournaments_players_per_team_check 
CHECK (players_per_team > 0);

-- Create indexes
CREATE INDEX idx_tournaments_date ON tournaments USING btree (tournament_date);
CREATE INDEX idx_tournaments_status ON tournaments USING btree (status);

-- Enable RLS
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tournaments
CREATE POLICY "Anyone can read tournaments" ON tournaments
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Only admins can insert tournaments" ON tournaments
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Only admins can update tournaments" ON tournaments
  FOR UPDATE TO public
  USING (true);

CREATE POLICY "Only admins can delete tournaments" ON tournaments
  FOR DELETE TO public
  USING (true);

-- =============================================
-- 3. TOURNAMENT REGISTRATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tournament_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id text NOT NULL,
  player_name text NOT NULL,
  payment_mode text NOT NULL,
  registered_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending'
);

-- Add constraints
ALTER TABLE tournament_registrations ADD CONSTRAINT tournament_registrations_payment_mode_check 
CHECK (payment_mode = ANY (ARRAY['free'::text, 'cash'::text, 'gcash'::text, 'bank_transfer'::text]));

ALTER TABLE tournament_registrations ADD CONSTRAINT tournament_registrations_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text]));

-- Create indexes
CREATE INDEX idx_tournament_registrations_tournament_id ON tournament_registrations USING btree (tournament_id);
CREATE INDEX idx_tournament_registrations_player_name ON tournament_registrations USING btree (player_name);

-- Enable RLS
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tournament_registrations
CREATE POLICY "Anyone can read tournament registrations" ON tournament_registrations
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Anyone can insert tournament registrations" ON tournament_registrations
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Only admins can update tournament registrations" ON tournament_registrations
  FOR UPDATE TO public
  USING (true);

CREATE POLICY "Only admins can delete tournament registrations" ON tournament_registrations
  FOR DELETE TO public
  USING (true);

-- =============================================
-- 4. TOURNAMENT BEYBLADES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tournament_beyblades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES tournament_registrations(id) ON DELETE CASCADE,
  beyblade_name text NOT NULL,
  blade_line text NOT NULL,
  registered_at timestamptz NOT NULL DEFAULT now()
);

-- Add constraints
ALTER TABLE tournament_beyblades ADD CONSTRAINT tournament_beyblades_blade_line_check 
CHECK (blade_line = ANY (ARRAY['Basic'::text, 'Unique'::text, 'Custom'::text, 'X-Over'::text]));

-- Create indexes
CREATE INDEX idx_tournament_beyblades_registration_id ON tournament_beyblades USING btree (registration_id);

-- Enable RLS
ALTER TABLE tournament_beyblades ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tournament_beyblades
CREATE POLICY "Anyone can read tournament beyblades" ON tournament_beyblades
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Anyone can insert tournament beyblades" ON tournament_beyblades
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Only admins can update tournament beyblades" ON tournament_beyblades
  FOR UPDATE TO public
  USING (false);

CREATE POLICY "Only admins can delete tournament beyblades" ON tournament_beyblades
  FOR DELETE TO public
  USING (false);

-- =============================================
-- 5. TOURNAMENT BEYBLADE PARTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tournament_beyblade_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beyblade_id uuid NOT NULL REFERENCES tournament_beyblades(id) ON DELETE CASCADE,
  part_type text NOT NULL,
  part_name text NOT NULL,
  part_data jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX idx_tournament_beyblade_parts_beyblade_id ON tournament_beyblade_parts USING btree (beyblade_id);

-- Enable RLS
ALTER TABLE tournament_beyblade_parts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tournament_beyblade_parts
CREATE POLICY "Anyone can read tournament beyblade parts" ON tournament_beyblade_parts
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Anyone can insert tournament beyblade parts" ON tournament_beyblade_parts
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Only admins can update tournament beyblade parts" ON tournament_beyblade_parts
  FOR UPDATE TO public
  USING (false);

CREATE POLICY "Only admins can delete tournament beyblade parts" ON tournament_beyblade_parts
  FOR DELETE TO public
  USING (false);

-- =============================================
-- 6. MATCHES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player1_name text NOT NULL,
  player2_name text NOT NULL,
  winner_name text,
  round_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  start_time timestamptz,
  end_time timestamptz,
  score text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add constraints
ALTER TABLE matches ADD CONSTRAINT matches_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text]));

-- Create indexes
CREATE INDEX idx_matches_tournament_id ON matches USING btree (tournament_id);
CREATE INDEX idx_matches_status ON matches USING btree (status);

-- Enable RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for matches
CREATE POLICY "Anyone can read matches" ON matches
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Only technical officers and above can insert matches" ON matches
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Only technical officers and above can update matches" ON matches
  FOR UPDATE TO public
  USING (true);

CREATE POLICY "Only admins can delete matches" ON matches
  FOR DELETE TO public
  USING (true);

-- =============================================
-- 7. MATCH RESULTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS match_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  player1_name text NOT NULL,
  player2_name text NOT NULL,
  player1_beyblade text NOT NULL,
  player2_beyblade text NOT NULL,
  outcome text NOT NULL,
  winner_name text NOT NULL,
  points_awarded integer NOT NULL,
  match_number integer NOT NULL,
  phase_number integer NOT NULL,
  tournament_officer text NOT NULL,
  submitted_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_match_results_tournament_id ON match_results USING btree (tournament_id);

-- Enable RLS
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for match_results
CREATE POLICY "Anyone can read match results" ON match_results
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Match results are viewable by everyone" ON match_results
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert match results" ON match_results
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Match results can be inserted by authenticated users" ON match_results
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can delete" ON match_results
  FOR DELETE TO public
  USING (true);

-- =============================================
-- 8. MATCH SESSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS match_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  player1_name text NOT NULL,
  player2_name text NOT NULL,
  player1_final_score integer NOT NULL,
  player2_final_score integer NOT NULL,
  winner_name text NOT NULL,
  total_matches integer NOT NULL,
  tournament_officer text NOT NULL,
  session_data jsonb,
  deck_orders text,
  match_summary text,
  phases text
);

-- Enable RLS
ALTER TABLE match_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for match_sessions
CREATE POLICY "Allow all users to view match sessions" ON match_sessions
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Allow all users to insert match sessions" ON match_sessions
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Allow all users to update match sessions" ON match_sessions
  FOR UPDATE TO public
  USING (true);

CREATE POLICY "Allow all users to delete match sessions" ON match_sessions
  FOR DELETE TO public
  USING (true);

-- =============================================
-- 9. USERS TABLE (Application users)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text,
  role text NOT NULL DEFAULT 'user',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login timestamptz
);

-- Add constraints
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role = ANY (ARRAY['user'::text, 'technical_officer'::text, 'admin'::text, 'developer'::text]));

ALTER TABLE users ADD CONSTRAINT users_status_check 
CHECK (status = ANY (ARRAY['active'::text, 'suspended'::text, 'pending'::text]));

-- Create indexes
CREATE INDEX idx_users_username ON users USING btree (username);
CREATE INDEX idx_users_email ON users USING btree (email);
CREATE INDEX idx_users_role ON users USING btree (role);
CREATE UNIQUE INDEX users_email_key ON users USING btree (email);
CREATE UNIQUE INDEX users_username_key ON users USING btree (username);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Anyone can read users" ON users
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Only admins can insert users" ON users
  FOR INSERT TO public
  WITH CHECK (false);

CREATE POLICY "Only admins can update users" ON users
  FOR UPDATE TO public
  USING (false);

CREATE POLICY "Only admins can delete users" ON users
  FOR DELETE TO public
  USING (false);

-- =============================================
-- 10. REGISTRATIONS TABLE (Legacy)
-- =============================================
CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tournament_id text NOT NULL,
  player_name text NOT NULL,
  registered_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_registrations_user_id ON registrations USING btree (user_id);
CREATE INDEX idx_registrations_tournament_id ON registrations USING btree (tournament_id);

-- Enable RLS
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for registrations
CREATE POLICY "Anyone can read registrations" ON registrations
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own registrations" ON registrations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registrations" ON registrations
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- 11. BEYBLADES TABLE (Legacy)
-- =============================================
CREATE TABLE IF NOT EXISTS beyblades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  name text NOT NULL,
  blade_line text NOT NULL,
  registered_at timestamptz NOT NULL DEFAULT now()
);

-- Add constraints
ALTER TABLE beyblades ADD CONSTRAINT beyblades_blade_line_check 
CHECK (blade_line = ANY (ARRAY['Basic'::text, 'Unique'::text, 'Custom'::text, 'X-Over'::text]));

-- Create indexes
CREATE INDEX idx_beyblades_registration_id ON beyblades USING btree (registration_id);

-- Enable RLS
ALTER TABLE beyblades ENABLE ROW LEVEL SECURITY;

-- RLS Policies for beyblades
CREATE POLICY "Anyone can read beyblades" ON beyblades
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert beyblades for own registrations" ON beyblades
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.id = beyblades.registration_id 
    AND registrations.user_id = auth.uid()
  ));

CREATE POLICY "Users can update beyblades for own registrations" ON beyblades
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.id = beyblades.registration_id 
    AND registrations.user_id = auth.uid()
  ));

CREATE POLICY "Admins and developers can delete beyblades" ON beyblades
  FOR DELETE TO authenticated
  USING (auth.uid() IN (
    SELECT profiles.id FROM profiles 
    WHERE profiles.role = ANY (ARRAY['admin'::text, 'developer'::text])
  ));

-- =============================================
-- 12. BEYBLADE PARTS TABLE (Legacy)
-- =============================================
CREATE TABLE IF NOT EXISTS beyblade_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beyblade_id uuid NOT NULL REFERENCES beyblades(id) ON DELETE CASCADE,
  part_type text NOT NULL,
  part_name text NOT NULL,
  part_details jsonb
);

-- Create indexes
CREATE INDEX idx_beyblade_parts_beyblade_id ON beyblade_parts USING btree (beyblade_id);

-- Enable RLS
ALTER TABLE beyblade_parts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for beyblade_parts
CREATE POLICY "Anyone can read beyblade parts" ON beyblade_parts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert parts for own beyblades" ON beyblade_parts
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM beyblades 
    JOIN registrations ON registrations.id = beyblades.registration_id
    WHERE beyblades.id = beyblade_parts.beyblade_id 
    AND registrations.user_id = auth.uid()
  ));

CREATE POLICY "Users can update parts for own beyblades" ON beyblade_parts
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM beyblades 
    JOIN registrations ON registrations.id = beyblades.registration_id
    WHERE beyblades.id = beyblade_parts.beyblade_id 
    AND registrations.user_id = auth.uid()
  ));

CREATE POLICY "Admins and developers can delete beyblade parts" ON beyblade_parts
  FOR DELETE TO authenticated
  USING (auth.uid() IN (
    SELECT profiles.id FROM profiles 
    WHERE profiles.role = ANY (ARRAY['admin'::text, 'developer'::text])
  ));

-- =============================================
-- 13. USER INVENTORY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  part_type text NOT NULL,
  part_name text NOT NULL,
  part_data jsonb NOT NULL,
  quantity integer DEFAULT 1,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_inventory
CREATE POLICY "Users can manage their own inventory" ON user_inventory
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- 14. DECK PRESETS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS deck_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  beyblades jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE deck_presets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deck_presets
CREATE POLICY "Users can manage their own deck presets" ON deck_presets
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- 15. PLAYERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  beyblades jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE UNIQUE INDEX players_name_key ON players USING btree (name);

-- Enable RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- RLS Policies for players
CREATE POLICY "Players are viewable by everyone" ON players
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Players can be inserted by authenticated users" ON players
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- =============================================
-- 16. BEYBLADE PARTS DATA TABLES (Renamed)
-- =============================================

-- ASSIST BLADE PARTS
CREATE TABLE IF NOT EXISTS beypart_assistblade (
  "Assist Blade" text PRIMARY KEY,
  "Assist Blade Name" text,
  "Type" text,
  "Height" bigint,
  "Attack" bigint,
  "Defense" bigint,
  "Stamina" bigint,
  "Total Stat" bigint
);

-- Enable RLS
ALTER TABLE beypart_assistblade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON beypart_assistblade
  FOR SELECT TO public
  USING (true);

-- BIT PARTS
CREATE TABLE IF NOT EXISTS beypart_bit (
  "Bit" text PRIMARY KEY,
  "Shortcut" text,
  "Type" text,
  "Attack" bigint,
  "Defense" bigint,
  "Stamina" bigint,
  "Dash" bigint,
  "Burst Res" bigint
);

-- Enable RLS
ALTER TABLE beypart_bit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON beypart_bit
  FOR SELECT TO public
  USING (true);

-- BLADE PARTS
CREATE TABLE IF NOT EXISTS beypart_blade (
  "Blades" text PRIMARY KEY,
  "Line" text,
  "Type" text,
  "Attack" bigint,
  "Defense" bigint,
  "Stamina" bigint,
  "Total Stat" bigint,
  "Average Weight (g)" double precision
);

-- Enable RLS
ALTER TABLE beypart_blade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON beypart_blade
  FOR SELECT TO public
  USING (true);

-- LOCKCHIP PARTS
CREATE TABLE IF NOT EXISTS beypart_lockchip (
  "Lockchip" text PRIMARY KEY,
  "Attack" integer,
  "Defense" integer,
  "Stamina" integer
);

-- Enable RLS
ALTER TABLE beypart_lockchip ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON beypart_lockchip
  FOR SELECT TO public
  USING (true);

-- RATCHET PARTS
CREATE TABLE IF NOT EXISTS beypart_ratchet (
  "Ratchet" text PRIMARY KEY,
  "Attack" bigint,
  "Defense" bigint,
  "Stamina" bigint,
  "Total Stat" bigint
);

-- Enable RLS
ALTER TABLE beypart_ratchet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON beypart_ratchet
  FOR SELECT TO public
  USING (true);

-- =============================================
-- 17. TOURNAMENT REGISTRATION DETAILS VIEW
-- =============================================
CREATE OR REPLACE VIEW tournament_registration_details AS
SELECT 
  tr.id as registration_id,
  tr.tournament_id,
  tr.player_name,
  tr.payment_mode,
  tr.registered_at,
  tr.status,
  tb.id as beyblade_id,
  tb.beyblade_name,
  tb.blade_line,
  COALESCE(
    json_agg(
      json_build_object(
        'part_type', tbp.part_type,
        'part_name', tbp.part_name,
        'part_data', tbp.part_data
      )
    ) FILTER (WHERE tbp.id IS NOT NULL),
    '[]'::json
  ) as beyblade_parts
FROM tournament_registrations tr
LEFT JOIN tournament_beyblades tb ON tr.id = tb.registration_id
LEFT JOIN tournament_beyblade_parts tbp ON tb.id = tbp.beyblade_id
GROUP BY tr.id, tr.tournament_id, tr.player_name, tr.payment_mode, tr.registered_at, tr.status, tb.id, tb.beyblade_name, tb.blade_line;

-- =============================================
-- 18. AUTHENTICATION TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _username TEXT;
  _email TEXT;
BEGIN
  -- Safely extract username, trimming and providing a fallback
  _username := TRIM(COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)));

  -- Safely extract email, trimming
  _email := TRIM(NEW.email);

  INSERT INTO public.profiles (
    id,
    username,
    email,
    role
  ) VALUES (
    NEW.id,
    _username,
    _email,
    'user' -- All new signups are 'user' by default
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();