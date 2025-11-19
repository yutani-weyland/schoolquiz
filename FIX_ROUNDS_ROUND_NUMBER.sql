-- Fix rounds table - check if round_number exists and needs to be renamed to index
-- Run this in Supabase SQL Editor

-- Check current columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'rounds'
ORDER BY ordinal_position;

-- Rename round_number to index if it exists, or add index if missing
DO $$
BEGIN
  -- If round_number exists and index doesn't, rename it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rounds' AND column_name = 'round_number'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rounds' AND column_name = 'index'
  ) THEN
    -- Drop any constraints on round_number first
    ALTER TABLE rounds DROP CONSTRAINT IF EXISTS rounds_round_number_key;
    ALTER TABLE rounds DROP CONSTRAINT IF EXISTS rounds_quizId_round_number_key;
    
    -- Rename the column
    ALTER TABLE rounds RENAME COLUMN round_number TO index;
    RAISE NOTICE 'Renamed round_number to index in rounds table';
  -- If both exist, drop round_number (keep index)
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rounds' AND column_name = 'round_number'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rounds' AND column_name = 'index'
  ) THEN
    ALTER TABLE rounds DROP COLUMN round_number;
    RAISE NOTICE 'Dropped round_number column (index already exists)';
  -- If index doesn't exist, add it
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rounds' AND column_name = 'index'
  ) THEN
    ALTER TABLE rounds ADD COLUMN index INTEGER;
    -- Set default values for existing rows
    UPDATE rounds SET index = 0 WHERE index IS NULL;
    ALTER TABLE rounds ALTER COLUMN index SET NOT NULL;
    RAISE NOTICE 'Added index column to rounds table';
  ELSE
    RAISE NOTICE 'index column already exists in rounds table';
  END IF;
END $$;

-- Verify result
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'rounds'
ORDER BY ordinal_position;

