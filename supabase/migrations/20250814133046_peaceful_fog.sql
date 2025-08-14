/*
  # Fix user deletion to properly remove auth users

  1. Database Function
    - Create a function that can delete both profile and auth user
    - Use security definer to allow admin operations
  
  2. Security
    - Only allow admins and developers to call this function
    - Proper error handling and validation
*/

-- Create a function to properly delete users (both profile and auth)
CREATE OR REPLACE FUNCTION delete_user_completely(user_id_to_delete UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Get the current user's role from profiles
  SELECT role INTO current_user_role
  FROM profiles
  WHERE id = auth.uid();
  
  -- Check if current user is admin or developer
  IF current_user_role NOT IN ('admin', 'developer') THEN
    RAISE EXCEPTION 'Only admins and developers can delete users';
  END IF;
  
  -- Don't allow users to delete themselves
  IF user_id_to_delete = auth.uid() THEN
    RAISE EXCEPTION 'Users cannot delete themselves';
  END IF;
  
  -- Delete from profiles table first (this will cascade to related tables)
  DELETE FROM profiles WHERE id = user_id_to_delete;
  
  -- Delete from auth.users table
  DELETE FROM auth.users WHERE id = user_id_to_delete;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and re-raise
    RAISE EXCEPTION 'Failed to delete user: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users (the function itself handles authorization)
GRANT EXECUTE ON FUNCTION delete_user_completely(UUID) TO authenticated;