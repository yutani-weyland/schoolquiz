-- Fix questions table - add/rename missing columns
-- Run this in Supabase SQL Editor

-- Check current columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'questions'
ORDER BY ordinal_position;

-- Fix isPeopleQuestion column
DO $$
BEGIN
  -- If is_people_question exists, rename it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'is_people_question'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'isPeopleQuestion'
  ) THEN
    ALTER TABLE questions RENAME COLUMN is_people_question TO "isPeopleQuestion";
    RAISE NOTICE 'Renamed is_people_question to isPeopleQuestion in questions table';
  -- If it doesn't exist at all, add it
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'isPeopleQuestion'
  ) THEN
    ALTER TABLE questions ADD COLUMN "isPeopleQuestion" BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added isPeopleQuestion column to questions table';
  ELSE
    RAISE NOTICE 'isPeopleQuestion column already exists in questions table';
  END IF;
END $$;

-- Fix other question columns that might be missing
DO $$
BEGIN
  -- categoryId
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'categoryId'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'questions' AND column_name = 'category_id'
    ) THEN
      ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_category_id_fkey;
      ALTER TABLE questions RENAME COLUMN category_id TO "categoryId";
      ALTER TABLE questions 
      ADD CONSTRAINT questions_categoryId_fkey 
      FOREIGN KEY ("categoryId") REFERENCES categories(id);
      RAISE NOTICE 'Renamed category_id to categoryId in questions table';
    END IF;
  END IF;
  
  -- createdBy
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'createdBy'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'questions' AND column_name = 'created_by'
    ) THEN
      ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_created_by_fkey;
      ALTER TABLE questions RENAME COLUMN created_by TO "createdBy";
      ALTER TABLE questions 
      ADD CONSTRAINT questions_createdBy_fkey 
      FOREIGN KEY ("createdBy") REFERENCES teachers(id);
      RAISE NOTICE 'Renamed created_by to createdBy in questions table';
    END IF;
  END IF;
  
  -- usageCount
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'usageCount'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'questions' AND column_name = 'usage_count'
    ) THEN
      ALTER TABLE questions RENAME COLUMN usage_count TO "usageCount";
    ELSE
      ALTER TABLE questions ADD COLUMN "usageCount" INTEGER DEFAULT 0;
    END IF;
    RAISE NOTICE 'Fixed usageCount column in questions table';
  END IF;
  
  -- lastUsedAt
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'lastUsedAt'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'questions' AND column_name = 'last_used_at'
    ) THEN
      ALTER TABLE questions RENAME COLUMN last_used_at TO "lastUsedAt";
    ELSE
      ALTER TABLE questions ADD COLUMN "lastUsedAt" TIMESTAMP;
    END IF;
    RAISE NOTICE 'Fixed lastUsedAt column in questions table';
  END IF;
  
  -- isUsed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'isUsed'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'questions' AND column_name = 'is_used'
    ) THEN
      ALTER TABLE questions RENAME COLUMN is_used TO "isUsed";
    ELSE
      ALTER TABLE questions ADD COLUMN "isUsed" BOOLEAN DEFAULT false;
    END IF;
    RAISE NOTICE 'Fixed isUsed column in questions table';
  END IF;
  
  -- createdAt
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'createdAt'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'questions' AND column_name = 'created_at'
    ) THEN
      ALTER TABLE questions RENAME COLUMN created_at TO "createdAt";
    ELSE
      ALTER TABLE questions ADD COLUMN "createdAt" TIMESTAMP DEFAULT NOW();
    END IF;
    RAISE NOTICE 'Fixed createdAt column in questions table';
  END IF;
  
  -- updatedAt
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'updatedAt'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'questions' AND column_name = 'updated_at'
    ) THEN
      ALTER TABLE questions RENAME COLUMN updated_at TO "updatedAt";
    ELSE
      ALTER TABLE questions ADD COLUMN "updatedAt" TIMESTAMP DEFAULT NOW();
    END IF;
    RAISE NOTICE 'Fixed updatedAt column in questions table';
  END IF;
END $$;

-- Verify result
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'questions'
ORDER BY ordinal_position;

