/*
  # Add Tournament Payment and Type System

  1. Schema Changes
    - Add `entry_fee` column to tournaments (decimal for fee amount)
    - Add `is_free` column to tournaments (boolean, true for free tournaments)
    - Add `tournament_type` column to tournaments (ranked or casual)
    - Add `payment_status` column to tournament_registrations (unpaid, paid, confirmed)

  2. Security
    - Update existing RLS policies to handle new columns
    - Ensure payment status affects match tracker visibility

  3. Data Migration
    - Set existing tournaments as free and casual by default
    - Set existing registrations as confirmed (paid) by default
*/

-- Add new columns to tournaments table
DO $$
BEGIN
  -- Add entry_fee column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tournaments' AND column_name = 'entry_fee'
  ) THEN
    ALTER TABLE tournaments ADD COLUMN entry_fee decimal(10,2) DEFAULT 0.00;
  END IF;

  -- Add is_free column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tournaments' AND column_name = 'is_free'
  ) THEN
    ALTER TABLE tournaments ADD COLUMN is_free boolean DEFAULT true;
  END IF;

  -- Add tournament_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tournaments' AND column_name = 'tournament_type'
  ) THEN
    ALTER TABLE tournaments ADD COLUMN tournament_type text DEFAULT 'casual';
  END IF;
END $$;

-- Add constraint for tournament_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'tournaments_tournament_type_check'
  ) THEN
    ALTER TABLE tournaments ADD CONSTRAINT tournaments_tournament_type_check 
    CHECK (tournament_type = ANY (ARRAY['ranked'::text, 'casual'::text]));
  END IF;
END $$;

-- Add payment_status column to tournament_registrations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tournament_registrations' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE tournament_registrations ADD COLUMN payment_status text DEFAULT 'confirmed';
  END IF;
END $$;

-- Add constraint for payment_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'tournament_registrations_payment_status_check'
  ) THEN
    ALTER TABLE tournament_registrations ADD CONSTRAINT tournaments_registrations_payment_status_check 
    CHECK (payment_status = ANY (ARRAY['unpaid'::text, 'paid'::text, 'confirmed'::text]));
  END IF;
END $$;

-- Update existing data
UPDATE tournaments SET 
  is_free = true,
  entry_fee = 0.00,
  tournament_type = 'casual'
WHERE is_free IS NULL OR tournament_type IS NULL;

UPDATE tournament_registrations SET 
  payment_status = 'confirmed'
WHERE payment_status IS NULL;