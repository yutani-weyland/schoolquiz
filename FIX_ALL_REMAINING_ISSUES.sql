-- COMPREHENSIVE FIX: All remaining database column issues
-- Run this in Supabase SQL Editor to fix everything at once
-- This handles all the column name mismatches and missing columns

-- ============================================================================
-- QUIZ_ROUND_QUESTIONS TABLE
-- ============================================================================

-- Fix order column (rename from question_number if it exists)
DO $$
BEGIN
  -- If question_number exists, rename it to order
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_round_questions' AND column_name = 'question_number'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_round_questions' AND column_name = 'order'
  ) THEN
    ALTER TABLE quiz_round_questions RENAME COLUMN question_number TO "order";
    RAISE NOTICE 'Renamed question_number to order in quiz_round_questions';
  -- If order doesn't exist at all, add it
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_round_questions' AND column_name = 'order'
  ) THEN
    ALTER TABLE quiz_round_questions ADD COLUMN "order" INTEGER;
    UPDATE quiz_round_questions SET "order" = 0 WHERE "order" IS NULL;
    ALTER TABLE quiz_round_questions ALTER COLUMN "order" SET NOT NULL;
    RAISE NOTICE 'Added order column to quiz_round_questions';
  -- If both exist, drop question_number
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_round_questions' AND column_name = 'question_number'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_round_questions' AND column_name = 'order'
  ) THEN
    ALTER TABLE quiz_round_questions DROP COLUMN question_number;
    RAISE NOTICE 'Dropped question_number column (order already exists)';
  ELSE
    RAISE NOTICE 'order column already exists in quiz_round_questions';
  END IF;
END $$;

-- Fix roundId
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_round_questions' AND column_name = 'round_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_round_questions' AND column_name = 'roundId'
  ) THEN
    ALTER TABLE quiz_round_questions DROP CONSTRAINT IF EXISTS quiz_round_questions_round_id_fkey;
    ALTER TABLE quiz_round_questions RENAME COLUMN round_id TO "roundId";
    ALTER TABLE quiz_round_questions 
    ADD CONSTRAINT quiz_round_questions_roundId_fkey 
    FOREIGN KEY ("roundId") REFERENCES rounds(id) ON DELETE CASCADE;
    RAISE NOTICE 'Fixed quiz_round_questions.roundId';
  END IF;
END $$;

-- Fix questionId
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_round_questions' AND column_name = 'question_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_round_questions' AND column_name = 'questionId'
  ) THEN
    ALTER TABLE quiz_round_questions DROP CONSTRAINT IF EXISTS quiz_round_questions_question_id_fkey;
    ALTER TABLE quiz_round_questions RENAME COLUMN question_id TO "questionId";
    ALTER TABLE quiz_round_questions 
    ADD CONSTRAINT quiz_round_questions_questionId_fkey 
    FOREIGN KEY ("questionId") REFERENCES questions(id);
    RAISE NOTICE 'Fixed quiz_round_questions.questionId';
  END IF;
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'All remaining column fixes complete!';
END $$;

-- Verify quiz_round_questions
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'quiz_round_questions'
ORDER BY ordinal_position;

