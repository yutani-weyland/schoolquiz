-- Fix quiz_round_questions table - add/rename missing columns
-- Run this in Supabase SQL Editor

-- Check current columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'quiz_round_questions'
ORDER BY ordinal_position;

-- Fix order column (it's a reserved word in SQL, so Prisma uses it with quotes)
DO $$
BEGIN
  -- If order column doesn't exist, add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_round_questions' AND column_name = 'order'
  ) THEN
    ALTER TABLE quiz_round_questions ADD COLUMN "order" INTEGER;
    -- Set default values for existing rows
    UPDATE quiz_round_questions SET "order" = 0 WHERE "order" IS NULL;
    -- Make it NOT NULL
    ALTER TABLE quiz_round_questions ALTER COLUMN "order" SET NOT NULL;
    RAISE NOTICE 'Added order column to quiz_round_questions table';
  ELSE
    RAISE NOTICE 'order column already exists in quiz_round_questions table';
  END IF;
END $$;

-- Fix roundId column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_round_questions' AND column_name = 'roundId'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'quiz_round_questions' AND column_name = 'round_id'
    ) THEN
      ALTER TABLE quiz_round_questions DROP CONSTRAINT IF EXISTS quiz_round_questions_round_id_fkey;
      ALTER TABLE quiz_round_questions RENAME COLUMN round_id TO "roundId";
      ALTER TABLE quiz_round_questions 
      ADD CONSTRAINT quiz_round_questions_roundId_fkey 
      FOREIGN KEY ("roundId") REFERENCES rounds(id) ON DELETE CASCADE;
      RAISE NOTICE 'Renamed round_id to roundId in quiz_round_questions table';
    ELSE
      RAISE NOTICE 'roundId column missing - need to add manually';
    END IF;
  END IF;
END $$;

-- Fix questionId column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_round_questions' AND column_name = 'questionId'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'quiz_round_questions' AND column_name = 'question_id'
    ) THEN
      ALTER TABLE quiz_round_questions DROP CONSTRAINT IF EXISTS quiz_round_questions_question_id_fkey;
      ALTER TABLE quiz_round_questions RENAME COLUMN question_id TO "questionId";
      ALTER TABLE quiz_round_questions 
      ADD CONSTRAINT quiz_round_questions_questionId_fkey 
      FOREIGN KEY ("questionId") REFERENCES questions(id);
      RAISE NOTICE 'Renamed question_id to questionId in quiz_round_questions table';
    ELSE
      RAISE NOTICE 'questionId column missing - need to add manually';
    END IF;
  END IF;
END $$;

-- Verify result
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'quiz_round_questions'
ORDER BY ordinal_position;

