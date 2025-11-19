-- Simple fix for quizzes table - just rename school_id to schoolId
-- Run this in Supabase SQL Editor

-- Check current state
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'quizzes'
ORDER BY ordinal_position;

-- Fix schoolId
DO $$
BEGIN
  -- If school_id exists, rename it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'school_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'schoolId'
  ) THEN
    -- Drop foreign key if exists
    ALTER TABLE quizzes DROP CONSTRAINT IF EXISTS quizzes_school_id_fkey;
    
    -- Rename column
    ALTER TABLE quizzes RENAME COLUMN school_id TO "schoolId";
    
    -- Re-add foreign key
    ALTER TABLE quizzes 
    ADD CONSTRAINT quizzes_schoolId_fkey 
    FOREIGN KEY ("schoolId") REFERENCES schools(id);
    
    RAISE NOTICE 'Renamed school_id to schoolId in quizzes table';
  -- If neither exists, add schoolId
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'schoolId'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN "schoolId" TEXT;
    ALTER TABLE quizzes 
    ADD CONSTRAINT quizzes_schoolId_fkey 
    FOREIGN KEY ("schoolId") REFERENCES schools(id);
    RAISE NOTICE 'Added schoolId column to quizzes table';
  ELSE
    RAISE NOTICE 'schoolId column already exists in quizzes table';
  END IF;
END $$;

-- Verify result
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'quizzes'
ORDER BY ordinal_position;

