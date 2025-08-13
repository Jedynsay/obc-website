/*
  # Spring cleaning - Remove redundant tables

  1. Tables to Remove
    - `users` table (redundant with `profiles`)
    - `matches` table (redundant with `match_results`)
  
  2. Security
    - Clean up any policies associated with removed tables
  
  3. Notes
    - This migration removes unused tables to simplify the database schema
    - All functionality now uses `profiles` instead of `users`
    - All functionality now uses `match_results` instead of `matches`
*/

-- Drop the redundant users table (we use profiles instead)
DROP TABLE IF EXISTS users CASCADE;

-- Drop the redundant matches table (we use match_results instead)  
DROP TABLE IF EXISTS matches CASCADE;