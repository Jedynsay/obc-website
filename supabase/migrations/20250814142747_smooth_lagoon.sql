/*
  # Fix payment status update permissions

  1. Security
    - Add RLS policy to allow admins and developers to update payment status
    - Ensure proper permissions for tournament registration updates
*/

-- Allow admins and developers to update tournament registrations
CREATE POLICY "Admins and developers can update tournament registrations"
  ON tournament_registrations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'developer')
    )
  );