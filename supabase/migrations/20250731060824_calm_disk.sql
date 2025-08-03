/*
  # User Registration System

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique, not null)
      - `email` (text, unique, nullable for guest users)
      - `role` (text, not null, default 'user')
      - `joined_date` (timestamptz, default now())
      - `avatar` (text, nullable)
    
    - `registrations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `tournament_id` (text, not null)
      - `player_name` (text, not null)
      - `registered_at` (timestamptz, default now())
    
    - `beyblades`
      - `id` (uuid, primary key)
      - `registration_id` (uuid, references registrations)
      - `name` (text, not null)
      - `blade_line` (text, not null)
      - `registered_at` (timestamptz, default now())
    
    - `beyblade_parts`
      - `id` (uuid, primary key)
      - `beyblade_id` (uuid, references beyblades)
      - `part_type` (text, not null)
      - `part_name` (text, not null)
      - `part_details` (jsonb)

  2. Security
    - Enable RLS on all tables
    - Add policies for user access control
    - Allow users to manage their own data
    - Allow public read access for tournament data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text UNIQUE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'technical_officer', 'admin', 'developer')),
  joined_date timestamptz NOT NULL DEFAULT now(),
  avatar text
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tournament_id text NOT NULL,
  player_name text NOT NULL,
  registered_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Registrations policies
CREATE POLICY "Anyone can read registrations"
  ON registrations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own registrations"
  ON registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registrations"
  ON registrations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create beyblades table
CREATE TABLE IF NOT EXISTS beyblades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  name text NOT NULL,
  blade_line text NOT NULL CHECK (blade_line IN ('Basic', 'Unique', 'Custom', 'X-Over')),
  registered_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE beyblades ENABLE ROW LEVEL SECURITY;

-- Beyblades policies
CREATE POLICY "Anyone can read beyblades"
  ON beyblades
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert beyblades for own registrations"
  ON beyblades
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM registrations 
      WHERE registrations.id = beyblades.registration_id 
      AND registrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update beyblades for own registrations"
  ON beyblades
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM registrations 
      WHERE registrations.id = beyblades.registration_id 
      AND registrations.user_id = auth.uid()
    )
  );

-- Create beyblade_parts table
CREATE TABLE IF NOT EXISTS beyblade_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beyblade_id uuid NOT NULL REFERENCES beyblades(id) ON DELETE CASCADE,
  part_type text NOT NULL,
  part_name text NOT NULL,
  part_details jsonb
);

ALTER TABLE beyblade_parts ENABLE ROW LEVEL SECURITY;

-- Beyblade parts policies
CREATE POLICY "Anyone can read beyblade parts"
  ON beyblade_parts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert parts for own beyblades"
  ON beyblade_parts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM beyblades 
      JOIN registrations ON registrations.id = beyblades.registration_id
      WHERE beyblades.id = beyblade_parts.beyblade_id 
      AND registrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update parts for own beyblades"
  ON beyblade_parts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM beyblades 
      JOIN registrations ON registrations.id = beyblades.registration_id
      WHERE beyblades.id = beyblade_parts.beyblade_id 
      AND registrations.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_registrations_tournament_id ON registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_beyblades_registration_id ON beyblades(registration_id);
CREATE INDEX IF NOT EXISTS idx_beyblade_parts_beyblade_id ON beyblade_parts(beyblade_id);