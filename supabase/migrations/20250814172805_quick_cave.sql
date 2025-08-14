/*
  # Add delete tournament function

  1. New Functions
    - `delete_tournament_completely` - Safely delete tournaments with all related data
  
  2. Security
    - Only admins and developers can delete tournaments
    - Cascading deletes for all related data
    
  3. Related Data Cleanup
    - Tournament registrations
    - Tournament beyblades
    - Tournament beyblade parts
    - Match results
    - Match sessions
*/

-- Create function to delete tournament completely
CREATE OR REPLACE FUNCTION public.delete_tournament_completely(tournament_id_to_delete uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
  deleted_count integer := 0;
BEGIN
  -- Get current user's role
  SELECT role INTO current_user_role
  FROM profiles
  WHERE id = auth.uid();
  
  -- Check if user has permission (admin or developer only)
  IF current_user_role NOT IN ('admin', 'developer') THEN
    RAISE EXCEPTION 'Permission denied. Only admins and developers can delete tournaments.';
  END IF;
  
  -- Check if tournament exists
  IF NOT EXISTS (SELECT 1 FROM tournaments WHERE id = tournament_id_to_delete) THEN
    RAISE EXCEPTION 'Tournament not found.';
  END IF;
  
  -- Delete related data in correct order (respecting foreign key constraints)
  
  -- 1. Delete tournament beyblade parts
  DELETE FROM tournament_beyblade_parts 
  WHERE beyblade_id IN (
    SELECT tb.id 
    FROM tournament_beyblades tb 
    JOIN tournament_registrations tr ON tb.registration_id = tr.id 
    WHERE tr.tournament_id = tournament_id_to_delete
  );
  
  -- 2. Delete tournament beyblades
  DELETE FROM tournament_beyblades 
  WHERE registration_id IN (
    SELECT id FROM tournament_registrations 
    WHERE tournament_id = tournament_id_to_delete
  );
  
  -- 3. Delete match results
  DELETE FROM match_results WHERE tournament_id = tournament_id_to_delete;
  
  -- 4. Delete match sessions
  DELETE FROM match_sessions WHERE tournament_id = tournament_id_to_delete;
  
  -- 5. Delete tournament registrations
  DELETE FROM tournament_registrations WHERE tournament_id = tournament_id_to_delete;
  
  -- 6. Finally delete the tournament itself
  DELETE FROM tournaments WHERE id = tournament_id_to_delete;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Return success response
  RETURN json_build_object(
    'success', true,
    'message', 'Tournament deleted successfully',
    'tournament_id', tournament_id_to_delete
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error response
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;