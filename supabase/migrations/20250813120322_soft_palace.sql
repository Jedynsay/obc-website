/*
  # Complete Database Schema Recreation

  1. New Tables
    - `beypart_assistblade` - Assist Blade parts data
    - `beypart_bit` - Bit parts data  
    - `beypart_blade` - Blade parts data
    - `beypart_lockchip` - Lockchip parts data
    - `beypart_ratchet` - Ratchet parts data
    - `profiles` - User profiles linked to auth.users
    - `tournaments` - Tournament information
    - `tournament_registrations` - Tournament registrations
    - `tournament_beyblades` - Registered beyblades for tournaments
    - `tournament_beyblade_parts` - Parts for tournament beyblades
    - `matches` - Match information
    - `match_results` - Individual match results
    - `match_sessions` - Match session summaries
    - `users` - User management table
    - `registrations` - User registrations
    - `beyblades` - User beyblades
    - `beyblade_parts` - Parts for user beyblades
    - `user_inventory` - User part inventory
    - `deck_presets` - Saved deck configurations
    - `players` - Player data

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
    - Create authentication trigger for profile creation

  3. Views
    - `tournament_registration_details` - Complex registration view
*/

-- Drop existing objects that might conflict
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP VIEW IF EXISTS tournament_registration_details;

-- Drop existing tables if they exist (in dependency order)
DROP TABLE IF EXISTS tournament_beyblade_parts CASCADE;
DROP TABLE IF EXISTS tournament_beyblades CASCADE;
DROP TABLE IF EXISTS tournament_registrations CASCADE;
DROP TABLE IF EXISTS beyblade_parts CASCADE;
DROP TABLE IF EXISTS beyblades CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS match_results CASCADE;
DROP TABLE IF EXISTS match_sessions CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS deck_presets CASCADE;
DROP TABLE IF EXISTS user_inventory CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop Beyblade parts tables
DROP TABLE IF EXISTS "Beyblade - Assist Blade" CASCADE;
DROP TABLE IF EXISTS "Beyblade - Bit" CASCADE;
DROP TABLE IF EXISTS "Beyblade - Blades" CASCADE;
DROP TABLE IF EXISTS "Beyblade - Lockchips" CASCADE;
DROP TABLE IF EXISTS "Beyblade - Ratchets" CASCADE;
DROP TABLE IF EXISTS beypart_assistblade CASCADE;
DROP TABLE IF EXISTS beypart_bit CASCADE;
DROP TABLE IF EXISTS beypart_blade CASCADE;
DROP TABLE IF EXISTS beypart_lockchip CASCADE;
DROP TABLE IF EXISTS beypart_ratchet CASCADE;

-- Create Beyblade Parts Tables (renamed)
CREATE TABLE beypart_assistblade (
  "Assist Blade" text PRIMARY KEY,
  "Assist Blade Name" text,
  "Type" text,
  "Height" bigint,
  "Attack" bigint,
  "Defense" bigint,
  "Stamina" bigint,
  "Total Stat" bigint
);

ALTER TABLE beypart_assistblade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON beypart_assistblade
  FOR SELECT USING (true);

CREATE TABLE beypart_bit (
  "Bit" text PRIMARY KEY,
  "Shortcut" text,
  "Type" text,
  "Attack" bigint,
  "Defense" bigint,
  "Stamina" bigint,
  "Dash" bigint,
  "Burst Res" bigint
);

ALTER TABLE beypart_bit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON beypart_bit
  FOR SELECT USING (true);

CREATE TABLE beypart_blade (
  "Blades" text PRIMARY KEY,
  "Line" text,
  "Type" text,
  "Attack" bigint,
  "Defense" bigint,
  "Stamina" bigint,
  "Total Stat" bigint,
  "Average Weight (g)" double precision
);

ALTER TABLE beypart_blade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON beypart_blade
  FOR SELECT USING (true);

CREATE TABLE beypart_lockchip (
  "Lockchip" text PRIMARY KEY,
  "Attack" integer,
  "Defense" integer,
  "Stamina" integer
);

ALTER TABLE beypart_lockchip ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON beypart_lockchip
  FOR SELECT USING (true);

CREATE TABLE beypart_ratchet (
  "Ratchet" text PRIMARY KEY,
  "Attack" bigint,
  "Defense" bigint,
  "Stamina" bigint,
  "Total Stat" bigint
);

ALTER TABLE beypart_ratchet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON beypart_ratchet
  FOR SELECT USING (true);

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  avatar text
);

ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role = ANY (ARRAY['user'::text, 'technical_officer'::text, 'admin'::text, 'developer'::text]));

CREATE INDEX idx_profiles_username ON profiles USING btree (username);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create tournaments table
CREATE TABLE tournaments (
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

ALTER TABLE tournaments ADD CONSTRAINT tournaments_status_check 
  CHECK (status = ANY (ARRAY['upcoming'::text, 'active'::text, 'completed'::text]));
ALTER TABLE tournaments ADD CONSTRAINT tournaments_max_participants_check CHECK (max_participants > 0);
ALTER TABLE tournaments ADD CONSTRAINT tournaments_current_participants_check CHECK (current_participants >= 0);
ALTER TABLE tournaments ADD CONSTRAINT tournaments_beyblades_per_player_check CHECK (beyblades_per_player > 0);
ALTER TABLE tournaments ADD CONSTRAINT tournaments_players_per_team_check CHECK (players_per_team > 0);

CREATE INDEX idx_tournaments_date ON tournaments USING btree (tournament_date);
CREATE INDEX idx_tournaments_status ON tournaments USING btree (status);

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tournaments" ON tournaments
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert tournaments" ON tournaments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Only admins can update tournaments" ON tournaments
  FOR UPDATE USING (true);

CREATE POLICY "Only admins can delete tournaments" ON tournaments
  FOR DELETE USING (true);

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text,
  role text NOT NULL DEFAULT 'user',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login timestamptz
);

ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role = ANY (ARRAY['user'::text, 'technical_officer'::text, 'admin'::text, 'developer'::text]));
ALTER TABLE users ADD CONSTRAINT users_status_check 
  CHECK (status = ANY (ARRAY['active'::text, 'suspended'::text, 'pending'::text]));

CREATE INDEX idx_users_username ON users USING btree (username);
CREATE INDEX idx_users_email ON users USING btree (email);
CREATE INDEX idx_users_role ON users USING btree (role);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert users" ON users
  FOR INSERT WITH CHECK (false);

CREATE POLICY "Only admins can update users" ON users
  FOR UPDATE USING (false);

CREATE POLICY "Only admins can delete users" ON users
  FOR DELETE USING (false);

-- Create tournament_registrations table
CREATE TABLE tournament_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id text NOT NULL,
  player_name text NOT NULL,
  payment_mode text NOT NULL,
  registered_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending'
);

ALTER TABLE tournament_registrations ADD CONSTRAINT tournament_registrations_payment_mode_check 
  CHECK (payment_mode = ANY (ARRAY['free'::text, 'cash'::text, 'gcash'::text, 'bank_transfer'::text]));
ALTER TABLE tournament_registrations ADD CONSTRAINT tournament_registrations_status_check 
  CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text]));

CREATE INDEX idx_tournament_registrations_tournament_id ON tournament_registrations USING btree (tournament_id);
CREATE INDEX idx_tournament_registrations_player_name ON tournament_registrations USING btree (player_name);

ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tournament registrations" ON tournament_registrations
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert tournament registrations" ON tournament_registrations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Only admins can update tournament registrations" ON tournament_registrations
  FOR UPDATE USING (true);

CREATE POLICY "Only admins can delete tournament registrations" ON tournament_registrations
  FOR DELETE USING (true);

-- Create tournament_beyblades table
CREATE TABLE tournament_beyblades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES tournament_registrations(id) ON DELETE CASCADE,
  beyblade_name text NOT NULL,
  blade_line text NOT NULL,
  registered_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tournament_beyblades ADD CONSTRAINT tournament_beyblades_blade_line_check 
  CHECK (blade_line = ANY (ARRAY['Basic'::text, 'Unique'::text, 'Custom'::text, 'X-Over'::text]));

CREATE INDEX idx_tournament_beyblades_registration_id ON tournament_beyblades USING btree (registration_id);

ALTER TABLE tournament_beyblades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tournament beyblades" ON tournament_beyblades
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert tournament beyblades" ON tournament_beyblades
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Only admins can update tournament beyblades" ON tournament_beyblades
  FOR UPDATE USING (false);

CREATE POLICY "Only admins can delete tournament beyblades" ON tournament_beyblades
  FOR DELETE USING (false);

-- Create tournament_beyblade_parts table
CREATE TABLE tournament_beyblade_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beyblade_id uuid NOT NULL REFERENCES tournament_beyblades(id) ON DELETE CASCADE,
  part_type text NOT NULL,
  part_name text NOT NULL,
  part_data jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_tournament_beyblade_parts_beyblade_id ON tournament_beyblade_parts USING btree (beyblade_id);

ALTER TABLE tournament_beyblade_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tournament beyblade parts" ON tournament_beyblade_parts
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert tournament beyblade parts" ON tournament_beyblade_parts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Only admins can update tournament beyblade parts" ON tournament_beyblade_parts
  FOR UPDATE USING (false);

CREATE POLICY "Only admins can delete tournament beyblade parts" ON tournament_beyblade_parts
  FOR DELETE USING (false);

-- Create registrations table
CREATE TABLE registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tournament_id text NOT NULL,
  player_name text NOT NULL,
  registered_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_registrations_user_id ON registrations USING btree (user_id);
CREATE INDEX idx_registrations_tournament_id ON registrations USING btree (tournament_id);

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read registrations" ON registrations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own registrations" ON registrations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registrations" ON registrations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Create beyblades table
CREATE TABLE beyblades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  name text NOT NULL,
  blade_line text NOT NULL,
  registered_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE beyblades ADD CONSTRAINT beyblades_blade_line_check 
  CHECK (blade_line = ANY (ARRAY['Basic'::text, 'Unique'::text, 'Custom'::text, 'X-Over'::text]));

CREATE INDEX idx_beyblades_registration_id ON beyblades USING btree (registration_id);

ALTER TABLE beyblades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read beyblades" ON beyblades
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert beyblades for own registrations" ON beyblades
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM registrations 
      WHERE registrations.id = beyblades.registration_id 
      AND registrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update beyblades for own registrations" ON beyblades
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM registrations 
      WHERE registrations.id = beyblades.registration_id 
      AND registrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and developers can delete beyblades" ON beyblades
  FOR DELETE TO authenticated USING (
    auth.uid() IN (
      SELECT profiles.id FROM profiles 
      WHERE profiles.role = ANY (ARRAY['admin'::text, 'developer'::text])
    )
  );

-- Create beyblade_parts table
CREATE TABLE beyblade_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beyblade_id uuid NOT NULL REFERENCES beyblades(id) ON DELETE CASCADE,
  part_type text NOT NULL,
  part_name text NOT NULL,
  part_details jsonb
);

CREATE INDEX idx_beyblade_parts_beyblade_id ON beyblade_parts USING btree (beyblade_id);

ALTER TABLE beyblade_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read beyblade parts" ON beyblade_parts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert parts for own beyblades" ON beyblade_parts
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM beyblades 
      JOIN registrations ON registrations.id = beyblades.registration_id
      WHERE beyblades.id = beyblade_parts.beyblade_id 
      AND registrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update parts for own beyblades" ON beyblade_parts
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM beyblades 
      JOIN registrations ON registrations.id = beyblades.registration_id
      WHERE beyblades.id = beyblade_parts.beyblade_id 
      AND registrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and developers can delete beyblade parts" ON beyblade_parts
  FOR DELETE TO authenticated USING (
    auth.uid() IN (
      SELECT profiles.id FROM profiles 
      WHERE profiles.role = ANY (ARRAY['admin'::text, 'developer'::text])
    )
  );

-- Create matches table
CREATE TABLE matches (
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

ALTER TABLE matches ADD CONSTRAINT matches_status_check 
  CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text]));

CREATE INDEX idx_matches_tournament_id ON matches USING btree (tournament_id);
CREATE INDEX idx_matches_status ON matches USING btree (status);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read matches" ON matches
  FOR SELECT USING (true);

CREATE POLICY "Only technical officers and above can insert matches" ON matches
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Only technical officers and above can update matches" ON matches
  FOR UPDATE USING (true);

CREATE POLICY "Only admins can delete matches" ON matches
  FOR DELETE USING (true);

-- Create match_results table
CREATE TABLE match_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
  submitted_at timestamptz DEFAULT now(),
  tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE
);

CREATE INDEX idx_match_results_tournament_id ON match_results USING btree (tournament_id);

ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read match results" ON match_results
  FOR SELECT USING (true);

CREATE POLICY "Match results are viewable by everyone" ON match_results
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone can insert match results" ON match_results
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Match results can be inserted by authenticated users" ON match_results
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can delete" ON match_results
  FOR DELETE USING (true);

-- Create match_sessions table
CREATE TABLE match_sessions (
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

ALTER TABLE match_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all users to view match sessions" ON match_sessions
  FOR SELECT USING (true);

CREATE POLICY "Allow all users to insert match sessions" ON match_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all users to update match sessions" ON match_sessions
  FOR UPDATE USING (true);

CREATE POLICY "Allow all users to delete match sessions" ON match_sessions
  FOR DELETE USING (true);

-- Create user_inventory table
CREATE TABLE user_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  part_type text NOT NULL,
  part_name text NOT NULL,
  part_data jsonb NOT NULL,
  quantity integer DEFAULT 1,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own inventory" ON user_inventory
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Create deck_presets table
CREATE TABLE deck_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  beyblades jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE deck_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own deck presets" ON deck_presets
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Create players table
CREATE TABLE players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  beyblades jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players are viewable by everyone" ON players
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Players can be inserted by authenticated users" ON players
  FOR INSERT TO authenticated WITH CHECK (true);

-- Create the handle_new_user function
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

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create the tournament_registration_details view
CREATE VIEW tournament_registration_details AS
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