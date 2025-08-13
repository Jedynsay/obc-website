/*
  # Simplify Authentication System

  1. Changes
    - Remove email confirmation requirement
    - Create simple profile creation trigger
    - Everyone signs up as 'user' role by default
    - Create a developer account for admin access

  2. Security
    - Simplified RLS policies
    - Default user role for all signups
    - Admin can change roles through database interface
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create simple profile creation function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (
    id,
    username,
    email,
    role
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.email,
    'user'  -- Everyone starts as user
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update profiles table policies to be more permissive
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create simplified policies
CREATE POLICY "Anyone can read profiles"
  ON profiles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert profiles during signup"
  ON profiles
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create developer account (you'll need to sign up with this email first)
-- This is just a placeholder - you'll create the actual account through signup
INSERT INTO profiles (id, username, email, role, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'developer',
  'dev@example.com',
  'developer',
  now()
) ON CONFLICT (id) DO NOTHING;