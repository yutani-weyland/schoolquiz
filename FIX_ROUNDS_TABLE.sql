-- Fix rounds table - add missing columns
-- Run this in Supabase SQL Editor

-- Check current columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'rounds'
ORDER BY ordinal_position;

-- Add missing columns
DO $$
BEGIN
  -- Add index column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rounds' AND column_name = 'index'
  ) THEN
    ALTER TABLE rounds ADD COLUMN index INTEGER;
    -- Set default values for existing rows
    UPDATE rounds SET index = 0 WHERE index IS NULL;
    -- Make it NOT NULL
    ALTER TABLE rounds ALTER COLUMN index SET NOT NULL;
    RAISE NOTICE 'Added index column to rounds table';
  END IF;
  
  -- Add quizId if missing (should already exist, but check)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rounds' AND column_name = 'quizId'
  ) THEN
    -- Check if quiz_id exists and rename it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'rounds' AND column_name = 'quiz_id'
    ) THEN
      ALTER TABLE rounds DROP CONSTRAINT IF EXISTS rounds_quiz_id_fkey;
      ALTER TABLE rounds RENAME COLUMN quiz_id TO "quizId";
      ALTER TABLE rounds 
      ADD CONSTRAINT rounds_quizId_fkey 
      FOREIGN KEY ("quizId") REFERENCES quizzes(id) ON DELETE CASCADE;
      RAISE NOTICE 'Renamed quiz_id to quizId in rounds table';
    ELSE
      ALTER TABLE rounds ADD COLUMN "quizId" TEXT NOT NULL;
      ALTER TABLE rounds 
      ADD CONSTRAINT rounds_quizId_fkey 
      FOREIGN KEY ("quizId") REFERENCES quizzes(id) ON DELETE CASCADE;
      RAISE NOTICE 'Added quizId column to rounds table';
    END IF;
  END IF;
  
  -- Add categoryId if missing (handle rename only, add in separate block)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rounds' AND column_name = 'categoryId'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'rounds' AND column_name = 'category_id'
    ) THEN
      ALTER TABLE rounds DROP CONSTRAINT IF EXISTS rounds_category_id_fkey;
      ALTER TABLE rounds RENAME COLUMN category_id TO "categoryId";
      ALTER TABLE rounds 
      ADD CONSTRAINT rounds_categoryId_fkey 
      FOREIGN KEY ("categoryId") REFERENCES categories(id);
      RAISE NOTICE 'Renamed category_id to categoryId in rounds table';
    END IF;
  END IF;
  
  -- Add title if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rounds' AND column_name = 'title'
  ) THEN
    ALTER TABLE rounds ADD COLUMN title TEXT;
    RAISE NOTICE 'Added title column to rounds table';
  END IF;
  
  -- Add blurb if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rounds' AND column_name = 'blurb'
  ) THEN
    ALTER TABLE rounds ADD COLUMN blurb TEXT;
    RAISE NOTICE 'Added blurb column to rounds table';
  END IF;
  
  -- Add targetDifficulty if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rounds' AND column_name = 'targetDifficulty'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'rounds' AND column_name = 'target_difficulty'
    ) THEN
      ALTER TABLE rounds RENAME COLUMN target_difficulty TO "targetDifficulty";
    ELSE
      ALTER TABLE rounds ADD COLUMN "targetDifficulty" DOUBLE PRECISION;
    END IF;
    RAISE NOTICE 'Fixed targetDifficulty column in rounds table';
  END IF;
  
  -- Add isPeoplesRound if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rounds' AND column_name = 'isPeoplesRound'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'rounds' AND column_name = 'is_peoples_round'
    ) THEN
      ALTER TABLE rounds RENAME COLUMN is_peoples_round TO "isPeoplesRound";
    ELSE
      ALTER TABLE rounds ADD COLUMN "isPeoplesRound" BOOLEAN DEFAULT false;
    END IF;
    RAISE NOTICE 'Fixed isPeoplesRound column in rounds table';
  END IF;
  
  -- Add unique constraint on (quizId, index) if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'rounds_quizId_index_key'
  ) THEN
    ALTER TABLE rounds ADD CONSTRAINT rounds_quizId_index_key UNIQUE("quizId", index);
    RAISE NOTICE 'Added unique constraint on (quizId, index)';
  END IF;
END $$;

-- Add categoryId column separately if it doesn't exist at all
DO $$
DECLARE
  default_category_id TEXT;
  default_teacher_id TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rounds' AND column_name = 'categoryId'
  ) THEN
    -- Get or create a default category
    SELECT id INTO default_category_id FROM categories LIMIT 1;
    
    IF default_category_id IS NULL THEN
      -- Get or create a default teacher
      SELECT id INTO default_teacher_id FROM teachers LIMIT 1;
      
      IF default_teacher_id IS NULL THEN
        RAISE EXCEPTION 'No teachers found. Please create a teacher first.';
      END IF;
      
      -- Create default category
      INSERT INTO categories (id, name, "createdBy", "createdAt", "updatedAt")
      VALUES ('default-category-' || extract(epoch from now())::text, 'General Knowledge', default_teacher_id, NOW(), NOW())
      RETURNING id INTO default_category_id;
    END IF;
    
    -- Add categoryId column
    ALTER TABLE rounds ADD COLUMN "categoryId" TEXT;
    UPDATE rounds SET "categoryId" = default_category_id WHERE "categoryId" IS NULL;
    ALTER TABLE rounds ALTER COLUMN "categoryId" SET NOT NULL;
    ALTER TABLE rounds 
    ADD CONSTRAINT rounds_categoryId_fkey 
    FOREIGN KEY ("categoryId") REFERENCES categories(id);
    
    RAISE NOTICE 'Added categoryId column to rounds table';
  END IF;
END $$;

-- Verify result
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'rounds'
ORDER BY ordinal_position;

