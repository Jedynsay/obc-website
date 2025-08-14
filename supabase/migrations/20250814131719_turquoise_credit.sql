/*
  # Fix User Deletion Policies

  1. Security Updates
    - Add proper DELETE policy for profiles table
    - Allow admins and developers to delete user profiles
    - Ensure proper role-based access control

  2. Changes
    - Add DELETE policy for profiles table
    - Update existing policies if needed
*/

-- Add DELETE policy for profiles table to allow admins and developers to delete users
CREATE POLICY "Admins and developers can delete profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS current_user_profile
      WHERE current_user_profile.id = auth.uid()
      AND current_user_profile.role IN ('admin', 'developer')
    )
  );

-- Also ensure we have proper UPDATE policy for role changes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Admins and developers can update profiles'
  ) THEN
    CREATE POLICY "Admins and developers can update profiles"
      ON profiles
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles AS current_user_profile
          WHERE current_user_profile.id = auth.uid()
          AND current_user_profile.role IN ('admin', 'developer')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles AS current_user_profile
          WHERE current_user_profile.id = auth.uid()
          AND current_user_profile.role IN ('admin', 'developer')
        )
      );
  END IF;
END $$;