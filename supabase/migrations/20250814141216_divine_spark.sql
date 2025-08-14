/*
  # Fix tournament registrations cascade deletion

  1. Add missing foreign key constraint
    - Add foreign key from tournament_registrations.tournament_id to tournaments.id
    - Use CASCADE deletion so registrations are deleted when tournament is deleted

  2. Update deletion function
    - Include tournament_registrations in the cascade deletion
    - Provide better reporting of deleted data
*/

-- First, let's check if there are any orphaned registrations and clean them up
DELETE FROM tournament_registrations 
WHERE tournament_id NOT IN (SELECT id FROM tournaments);

-- Add the missing foreign key constraint with CASCADE
DO $$
BEGIN
  -- Check if the foreign key constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tournament_registrations_tournament_id_fkey'
    AND table_name = 'tournament_registrations'
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE tournament_registrations 
    ADD CONSTRAINT tournament_registrations_tournament_id_fkey 
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update the tournament deletion function to be more comprehensive
CREATE OR REPLACE FUNCTION delete_tournament_completely(tournament_id_to_delete UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role TEXT;
  tournament_name TEXT;
  registrations_count INTEGER := 0;
  beyblades_count INTEGER := 0;
  parts_count INTEGER := 0;
  match_results_count INTEGER := 0;
  match_sessions_count INTEGER := 0;
  result JSON;
BEGIN
  -- Check if user has permission (admin or developer role)
  SELECT role INTO current_user_role 
  FROM profiles 
  WHERE id = auth.uid();
  
  IF current_user_role NOT IN ('admin', 'developer') THEN
    RAISE EXCEPTION 'Permission denied. Only admins and developers can delete tournaments.';
  END IF;
  
  -- Get tournament name for reporting
  SELECT name INTO tournament_name 
  FROM tournaments 
  WHERE id = tournament_id_to_delete;
  
  IF tournament_name IS NULL THEN
    RAISE EXCEPTION 'Tournament not found.';
  END IF;
  
  -- Count related data before deletion
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
  
  SELECT COUNT(*) INTO match_results_count 
  FROM match_results 
  WHERE tournament_id = tournament_id_to_delete;
  
  SELECT COUNT(*) INTO match_sessions_count 
  FROM match_sessions 
  WHERE tournament_id = tournament_id_to_delete;
  
  -- Delete the tournament (CASCADE will handle related data)
  DELETE FROM tournaments WHERE id = tournament_id_to_delete;
  
  -- Build result JSON
  result := json_build_object(
    'success', true,
    'tournament_name', tournament_name,
    'deleted_counts', json_build_object(
      'registrations', registrations_count,
      'beyblades', beyblades_count,
      'beyblade_parts', parts_count,
      'match_results', match_results_count,
      'match_sessions', match_sessions_count
    )
  );
  
  RETURN result;
END;
$$;