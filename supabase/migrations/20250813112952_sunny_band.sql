/*
  # Fix Profile Creation Trigger with Robust Data Handling

  1. Changes
    - Drop and recreate the handle_new_user function with better error handling
    - Add explicit variable declarations and data validation
    - Ensure role values are properly validated against allowed values
    - Add trimming and fallback logic for all fields

  2. Security
    - Function runs with SECURITY DEFINER (elevated privileges)
    - Validates role against allowed values to prevent constraint violations
    - Uses safe fallbacks for missing or invalid data
*/

-- Drop existing trigger to allow recreation of function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing function to allow recreation
DROP FUNCTION IF EXISTS handle_new_user();

-- Recreate function to handle new user profile creation with more robust data handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _username TEXT;
  _email TEXT;
  _role TEXT;
BEGIN
  -- Safely extract username, trimming and providing a fallback
  _username := TRIM(COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)));

  -- Safely extract email, trimming
  _email := TRIM(NEW.email);

  -- Safely extract role, trimming and ensuring it's one of the allowed values, defaulting to 'user'
  _role := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'role', 'user')));
  
  -- Explicitly check if the role is valid, otherwise default to 'user'
  IF _role NOT IN ('user', 'technical_officer', 'admin', 'developer') THEN
    _role := 'user'; 
  END IF;

  INSERT INTO profiles (
    id,
    username,
    email,
    role
  ) VALUES (
    NEW.id,
    _username,
    _email,
    _role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();