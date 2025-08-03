/*
  # Tournament Registration System

  1. New Tables
    - `tournament_registrations`
      - `id` (uuid, primary key)
      - `tournament_id` (text, not null)
      - `player_name` (text, not null)
      - `payment_mode` (text, not null)
      - `registered_at` (timestamptz, default now())
      - `status` (text, default 'pending')
    
    - `tournament_beyblades`
      - `id` (uuid, primary key)
      - `registration_id` (uuid, references tournament_registrations)
      - `beyblade_name` (text, not null)
      - `blade_line` (text, not null)
      - `registered_at` (timestamptz, default now())
    
    - `tournament_beyblade_parts`
      - `id` (uuid, primary key)
      - `beyblade_id` (uuid, references tournament_beyblades)
      - `part_type` (text, not null)
      - `part_name` (text, not null)
      - `part_data` (jsonb, stores complete part information)

  2. Security
    - Enable RLS on all tables
    - Allow public read access for tournament data
    - Allow public insert for registrations
    - Restrict updates and deletes to admins only
*/

-- Create tournament_registrations table
CREATE TABLE IF NOT EXISTS tournament_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id text NOT NULL,
  player_name text NOT NULL,
  payment_mode text NOT NULL CHECK (payment_mode IN ('free', 'cash', 'gcash', 'bank_transfer')),
  registered_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled'))
);

ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;

-- Tournament registrations policies
CREATE POLICY "Anyone can read tournament registrations"
  ON tournament_registrations
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert tournament registrations"
  ON tournament_registrations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admins can update tournament registrations"
  ON tournament_registrations
  FOR UPDATE
  USING (false);

CREATE POLICY "Only admins can delete tournament registrations"
  ON tournament_registrations
  FOR DELETE
  USING (false);

-- Create tournament_beyblades table
CREATE TABLE IF NOT EXISTS tournament_beyblades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES tournament_registrations(id) ON DELETE CASCADE,
  beyblade_name text NOT NULL,
  blade_line text NOT NULL CHECK (blade_line IN ('Basic', 'Unique', 'Custom', 'X-Over')),
  registered_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tournament_beyblades ENABLE ROW LEVEL SECURITY;

-- Tournament beyblades policies
CREATE POLICY "Anyone can read tournament beyblades"
  ON tournament_beyblades
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert tournament beyblades"
  ON tournament_beyblades
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admins can update tournament beyblades"
  ON tournament_beyblades
  FOR UPDATE
  USING (false);

CREATE POLICY "Only admins can delete tournament beyblades"
  ON tournament_beyblades
  FOR DELETE
  USING (false);

-- Create tournament_beyblade_parts table
CREATE TABLE IF NOT EXISTS tournament_beyblade_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beyblade_id uuid NOT NULL REFERENCES tournament_beyblades(id) ON DELETE CASCADE,
  part_type text NOT NULL,
  part_name text NOT NULL,
  part_data jsonb NOT NULL DEFAULT '{}'
);

ALTER TABLE tournament_beyblade_parts ENABLE ROW LEVEL SECURITY;

-- Tournament beyblade parts policies
CREATE POLICY "Anyone can read tournament beyblade parts"
  ON tournament_beyblade_parts
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert tournament beyblade parts"
  ON tournament_beyblade_parts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admins can update tournament beyblade parts"
  ON tournament_beyblade_parts
  FOR UPDATE
  USING (false);

CREATE POLICY "Only admins can delete tournament beyblade parts"
  ON tournament_beyblade_parts
  FOR DELETE
  USING (false);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament_id ON tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_player_name ON tournament_registrations(player_name);
CREATE INDEX IF NOT EXISTS idx_tournament_beyblades_registration_id ON tournament_beyblades(registration_id);
CREATE INDEX IF NOT EXISTS idx_tournament_beyblade_parts_beyblade_id ON tournament_beyblade_parts(beyblade_id);

-- Create a view for easy registration data retrieval
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
  json_agg(
    json_build_object(
      'part_type', tbp.part_type,
      'part_name', tbp.part_name,
      'part_data', tbp.part_data
    )
  ) as beyblade_parts
FROM tournament_registrations tr
LEFT JOIN tournament_beyblades tb ON tr.id = tb.registration_id
LEFT JOIN tournament_beyblade_parts tbp ON tb.id = tbp.beyblade_id
GROUP BY tr.id, tr.tournament_id, tr.player_name, tr.payment_mode, tr.registered_at, tr.status, tb.id, tb.beyblade_name, tb.blade_line
ORDER BY tr.registered_at DESC;