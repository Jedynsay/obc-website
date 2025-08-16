/*
  # Add password system to tournaments

  1. Changes
    - Add `password` column to `tournaments` table for match tracker access
    - Password is optional (nullable) for backwards compatibility
    - Only required for match tracker functionality, not for viewing or registration

  2. Security
    - Passwords are stored as plain text for simplicity (tournament organizer sets simple passwords)
    - No additional RLS policies needed as existing policies already handle tournament access
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

-- Add comment to explain the password usage
COMMENT ON COLUMN tournaments.password IS 'Optional password for match tracker access. Not required for viewing or registration.';