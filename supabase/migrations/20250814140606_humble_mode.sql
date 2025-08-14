/*
  # Fix tournament cascade deletion

  1. Database Changes
    - Add CASCADE deletion to foreign key constraints
    - Ensure all tournament-related data is deleted when tournament is deleted
    
  2. Tables affected
    - tournament_registrations -> tournaments
    - tournament_beyblades -> tournament_registrations  
    - tournament_beyblade_parts -> tournament_beyblades
    - match_results -> tournaments
    - match_sessions -> tournaments
    
  3. Security
    - Maintain existing RLS policies
    - Ensure proper cascade behavior
*/

-- First, drop existing foreign key constraints that don't have CASCADE
ALTER TABLE tournament_registrations 
DROP CONSTRAINT IF EXISTS tournament_registrations_tournament_id_fkey;

ALTER TABLE tournament_beyblades 
DROP CONSTRAINT IF EXISTS tournament_beyblades_registration_id_fkey;

ALTER TABLE tournament_beyblade_parts 
DROP CONSTRAINT IF EXISTS tournament_beyblade_parts_beyblade_id_fkey;

ALTER TABLE match_results 
DROP CONSTRAINT IF EXISTS match_results_tournament_id_fkey;

ALTER TABLE match_sessions 
DROP CONSTRAINT IF EXISTS match_sessions_tournament_id_fkey;

-- Add foreign key constraints with CASCADE deletion
ALTER TABLE tournament_registrations 
ADD CONSTRAINT tournament_registrations_tournament_id_fkey 
FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;

ALTER TABLE tournament_beyblades 
ADD CONSTRAINT tournament_beyblades_registration_id_fkey 
FOREIGN KEY (registration_id) REFERENCES tournament_registrations(id) ON DELETE CASCADE;

ALTER TABLE tournament_beyblade_parts 
ADD CONSTRAINT tournament_beyblade_parts_beyblade_id_fkey 
FOREIGN KEY (beyblade_id) REFERENCES tournament_beyblades(id) ON DELETE CASCADE;

ALTER TABLE match_results 
ADD CONSTRAINT match_results_tournament_id_fkey 
FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;

ALTER TABLE match_sessions 
ADD CONSTRAINT match_sessions_tournament_id_fkey 
FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;

-- Create a function to safely delete tournaments with all related data
CREATE OR REPLACE FUNCTION delete_tournament_completely(tournament_id_to_delete UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role TEXT;
  tournament_name TEXT;
  deleted_counts JSON;
  registrations_count INTEGER;
  beyblades_count INTEGER;
  parts_count INTEGER;
  matches_count INTEGER;
  sessions_count INTEGER;
BEGIN
  -- Check if user has permission (admin or developer role)
  SELECT role INTO current_user_role 
  FROM profiles 
  WHERE id = auth.uid();
  
  IF current_user_role NOT IN ('admin', 'developer') THEN
    RAISE EXCEPTION 'Permission denied. Only admins and developers can delete tournaments.';
  END IF;
  
  -- Check if tournament exists and get its name
  SELECT name INTO tournament_name 
  FROM tournaments 
  WHERE id = tournament_id_to_delete;
  
  IF tournament_name IS NULL THEN
    RAISE EXCEPTION 'Tournament not found.';
  END IF;
  
  -- Count related data before deletion for reporting
  SELECT COUNT(*) INTO registrations_count 
  FROM tournament_registrations 
  WHERE tournament_id = tournament_id_to_delete;
  
  SELECT COUNT(*) INTO beyblades_count 
  FROM tournament_beyblades tb
  JOIN tournament_registrations tr ON tb.registration_id = tr.id
  WHERE tr.tournament_id = tournament_id_to_delete;
  
  SELECT COUNT(*) INTO parts_count 
  FROM tournament_beyblade_parts tbp
  JOIN tournament_beyblades tb ON tbp.beyblade_id = tb.id
  JOIN tournament_registrations tr ON tb.registration_id = tr.id
  WHERE tr.tournament_id = tournament_id_to_delete;
  
  SELECT COUNT(*) INTO matches_count 
  FROM match_results 
  WHERE tournament_id = tournament_id_to_delete;
  
  SELECT COUNT(*) INTO sessions_count 
  FROM match_sessions 
  WHERE tournament_id = tournament_id_to_delete;
  
  -- Delete the tournament (CASCADE will handle related data)
  DELETE FROM tournaments WHERE id = tournament_id_to_delete;
  
  -- Return summary of what was deleted
  deleted_counts := json_build_object(
    'tournament_name', tournament_name,
    'registrations_deleted', registrations_count,
    'beyblades_deleted', beyblades_count,
    'parts_deleted', parts_count,
    'matches_deleted', matches_count,
    'sessions_deleted', sessions_count
  );
  
  RETURN deleted_counts;
END;
$$;