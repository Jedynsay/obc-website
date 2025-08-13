/*
  # Automatic Profile Creation on User Signup

  1. New Function
    - `handle_new_user()` - Creates profile automatically when user signs up
    - Extracts username, email, and role from user metadata
    - Uses default values if metadata is missing

  2. New Trigger
    - Triggers after INSERT on auth.users
    - Automatically creates corresponding profile entry
    - Bypasses RLS issues by running with elevated privileges

  3. Security
    - Function runs with SECURITY DEFINER (elevated privileges)
    - Only creates profile for newly inserted users
    - Uses safe default values for missing data
*/

-- Create function to handle new user profile creation
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
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();