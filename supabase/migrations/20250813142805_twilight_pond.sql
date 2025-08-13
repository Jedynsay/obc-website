/*
  # Add blade line columns to match_results table

  1. Schema Changes
    - Add `player1_blade_line` column to store Player 1's Beyblade blade line
    - Add `player2_blade_line` column to store Player 2's Beyblade blade line
    - Both columns are TEXT type and nullable for backward compatibility

  2. Purpose
    - Enable accurate meta analysis parsing by knowing the exact blade line
    - Eliminate guesswork between Basic/Unique/Custom/X-Over blade lines
    - Resolve naming conflicts (e.g., "Rhinohorn" blade vs "Rhino" lockchip)

  3. Backward Compatibility
    - Existing match results will have NULL blade line values
    - New matches will populate these fields from registration data
*/

-- Add blade line columns to match_results table
ALTER TABLE match_results 
ADD COLUMN IF NOT EXISTS player1_blade_line TEXT,
ADD COLUMN IF NOT EXISTS player2_blade_line TEXT;

-- Add helpful comments
COMMENT ON COLUMN match_results.player1_blade_line IS 'Blade line of Player 1''s Beyblade (Basic, Unique, Custom, X-Over)';
COMMENT ON COLUMN match_results.player2_blade_line IS 'Blade line of Player 2''s Beyblade (Basic, Unique, Custom, X-Over)';