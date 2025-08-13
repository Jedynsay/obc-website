/*
  # Fix Profile Insert Policy for Signup

  1. Changes
    - Update the "Users can insert own profile" policy on profiles table
    - Change from TO authenticated to TO public
    - This allows new users to create their profile during signup process
    - The auth.uid() check still ensures users can only create their own profile

  2. Security
    - Maintains security by checking auth.uid() = id
    - Only allows profile creation for the authenticated user's own ID
    - Does not compromise data integrity
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Recreate the policy with public access for inserts
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);