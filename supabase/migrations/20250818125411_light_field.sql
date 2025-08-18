/*
  # Add Tournament Password System

  1. Schema Changes
    - Add `password` column to `tournaments` table
    - Password is optional and only used for match tracker access
    - Viewing and registration remain open without password

  2. Security
    - Password is stored as plain text (simple system for tournament organizers)
    - Only affects match tracking functionality
    - No impact on viewing analytics or tournament registration

  3. Usage
    - Tournament organizers can set passwords for their tournaments
    - Match tracker will require password verification before allowing match data entry
    - All other features remain accessible without password
*/

-- Add password column to tournaments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tournaments' AND column_name = 'password'
  ) THEN
    ALTER TABLE tournaments ADD COLUMN password text;
  END IF;
END $$;

-- Add comment to explain the password column usage
COMMENT ON COLUMN tournaments.password IS 'Optional password for match tracker access. Not required for viewing or registration.';