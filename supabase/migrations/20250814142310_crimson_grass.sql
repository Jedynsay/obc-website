/*
  # Fix payment status update permissions

  1. Security
    - Allow admins and developers to update payment status in tournament_registrations
    - Add proper RLS policy for payment status updates

  2. Changes
    - Add UPDATE policy for payment_status field
    - Ensure only authorized users can modify payment information
*/

-- Add policy to allow admins and developers to update payment status
CREATE POLICY "Admins and developers can update payment status"
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

-- Update existing policy to be more specific about what can be updated
DROP POLICY IF EXISTS "Only admins can update tournament registrations" ON tournament_registrations;

CREATE POLICY "Only admins can update tournament registrations"
  ON tournament_registrations
  FOR UPDATE
  TO public
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