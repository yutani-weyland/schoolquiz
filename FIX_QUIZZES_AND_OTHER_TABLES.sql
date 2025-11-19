-- Fix quizzes table and other tables with column name mismatches
-- Run this in Supabase SQL Editor

-- ============================================================================
-- QUIZZES TABLE
-- ============================================================================

-- Rename school_id to schoolId
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'school_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'schoolId'
  ) THEN
    ALTER TABLE quizzes DROP CONSTRAINT IF EXISTS quizzes_school_id_fkey;
    ALTER TABLE quizzes RENAME COLUMN school_id TO "schoolId";
    ALTER TABLE quizzes 
    ADD CONSTRAINT quizzes_schoolId_fkey 
    FOREIGN KEY ("schoolId") REFERENCES schools(id);
    RAISE NOTICE 'Fixed quizzes.schoolId';
  END IF;
END $$;

-- Rename other quiz columns
DO $$
BEGIN
  -- week_iso to weekISO
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'week_iso'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'weekISO'
  ) THEN
    ALTER TABLE quizzes RENAME COLUMN week_iso TO "weekISO";
    RAISE NOTICE 'Fixed quizzes.weekISO';
  END IF;
  
  -- difficulty_band to difficultyBand
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'difficulty_band'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'difficultyBand'
  ) THEN
    ALTER TABLE quizzes RENAME COLUMN difficulty_band TO "difficultyBand";
    RAISE NOTICE 'Fixed quizzes.difficultyBand';
  END IF;
  
  -- seasonal_tag to seasonalTag
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'seasonal_tag'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'seasonalTag'
  ) THEN
    ALTER TABLE quizzes RENAME COLUMN seasonal_tag TO "seasonalTag";
    RAISE NOTICE 'Fixed quizzes.seasonalTag';
  END IF;
  
  -- publication_date to publicationDate
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'publication_date'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'publicationDate'
  ) THEN
    ALTER TABLE quizzes RENAME COLUMN publication_date TO "publicationDate";
    RAISE NOTICE 'Fixed quizzes.publicationDate';
  END IF;
  
  -- color_hex to colorHex
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'color_hex'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'colorHex'
  ) THEN
    ALTER TABLE quizzes RENAME COLUMN color_hex TO "colorHex";
    RAISE NOTICE 'Fixed quizzes.colorHex';
  END IF;
  
  -- created_by to createdBy
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'created_by'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'createdBy'
  ) THEN
    ALTER TABLE quizzes DROP CONSTRAINT IF EXISTS quizzes_created_by_fkey;
    ALTER TABLE quizzes RENAME COLUMN created_by TO "createdBy";
    ALTER TABLE quizzes 
    ADD CONSTRAINT quizzes_createdBy_fkey 
    FOREIGN KEY ("createdBy") REFERENCES teachers(id);
    RAISE NOTICE 'Fixed quizzes.createdBy';
  END IF;
  
  -- created_at to createdAt
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'created_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE quizzes RENAME COLUMN created_at TO "createdAt";
    RAISE NOTICE 'Fixed quizzes.createdAt';
  END IF;
  
  -- updated_at to updatedAt
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'updated_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE quizzes RENAME COLUMN updated_at TO "updatedAt";
    RAISE NOTICE 'Fixed quizzes.updatedAt';
  END IF;
  
  -- pdf_url to pdfUrl
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'pdf_url'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'pdfUrl'
  ) THEN
    ALTER TABLE quizzes RENAME COLUMN pdf_url TO "pdfUrl";
    RAISE NOTICE 'Fixed quizzes.pdfUrl';
  END IF;
  
  -- pdf_status to pdfStatus
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'pdf_status'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'pdfStatus'
  ) THEN
    ALTER TABLE quizzes RENAME COLUMN pdf_status TO "pdfStatus";
    RAISE NOTICE 'Fixed quizzes.pdfStatus';
  END IF;
END $$;

-- ============================================================================
-- ROUNDS TABLE
-- ============================================================================

DO $$
BEGIN
  -- quiz_id to quizId
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rounds' AND column_name = 'quiz_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rounds' AND column_name = 'quizId'
  ) THEN
    ALTER TABLE rounds DROP CONSTRAINT IF EXISTS rounds_quiz_id_fkey;
    ALTER TABLE rounds RENAME COLUMN quiz_id TO "quizId";
    ALTER TABLE rounds 
    ADD CONSTRAINT rounds_quizId_fkey 
    FOREIGN KEY ("quizId") REFERENCES quizzes(id) ON DELETE CASCADE;
    RAISE NOTICE 'Fixed rounds.quizId';
  END IF;
  
  -- category_id to categoryId
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rounds' AND column_name = 'category_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rounds' AND column_name = 'categoryId'
  ) THEN
    ALTER TABLE rounds DROP CONSTRAINT IF EXISTS rounds_category_id_fkey;
    ALTER TABLE rounds RENAME COLUMN category_id TO "categoryId";
    ALTER TABLE rounds 
    ADD CONSTRAINT rounds_categoryId_fkey 
    FOREIGN KEY ("categoryId") REFERENCES categories(id);
    RAISE NOTICE 'Fixed rounds.categoryId';
  END IF;
  
  -- target_difficulty to targetDifficulty
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rounds' AND column_name = 'target_difficulty'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rounds' AND column_name = 'targetDifficulty'
  ) THEN
    ALTER TABLE rounds RENAME COLUMN target_difficulty TO "targetDifficulty";
    RAISE NOTICE 'Fixed rounds.targetDifficulty';
  END IF;
  
  -- is_peoples_round to isPeoplesRound
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rounds' AND column_name = 'is_peoples_round'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rounds' AND column_name = 'isPeoplesRound'
  ) THEN
    ALTER TABLE rounds RENAME COLUMN is_peoples_round TO "isPeoplesRound";
    RAISE NOTICE 'Fixed rounds.isPeoplesRound';
  END IF;
END $$;

-- ============================================================================
-- QUESTIONS TABLE
-- ============================================================================

DO $$
BEGIN
  -- category_id to categoryId
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'category_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'categoryId'
  ) THEN
    ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_category_id_fkey;
    ALTER TABLE questions RENAME COLUMN category_id TO "categoryId";
    ALTER TABLE questions 
    ADD CONSTRAINT questions_categoryId_fkey 
    FOREIGN KEY ("categoryId") REFERENCES categories(id);
    RAISE NOTICE 'Fixed questions.categoryId';
  END IF;
  
  -- created_by to createdBy
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'created_by'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'createdBy'
  ) THEN
    ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_created_by_fkey;
    ALTER TABLE questions RENAME COLUMN created_by TO "createdBy";
    ALTER TABLE questions 
    ADD CONSTRAINT questions_createdBy_fkey 
    FOREIGN KEY ("createdBy") REFERENCES teachers(id);
    RAISE NOTICE 'Fixed questions.createdBy';
  END IF;
  
  -- is_people_question to isPeopleQuestion
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'is_people_question'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'isPeopleQuestion'
  ) THEN
    ALTER TABLE questions RENAME COLUMN is_people_question TO "isPeopleQuestion";
    RAISE NOTICE 'Fixed questions.isPeopleQuestion';
  END IF;
  
  -- usage_count to usageCount
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'usage_count'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'usageCount'
  ) THEN
    ALTER TABLE questions RENAME COLUMN usage_count TO "usageCount";
    RAISE NOTICE 'Fixed questions.usageCount';
  END IF;
  
  -- last_used_at to lastUsedAt
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'last_used_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'lastUsedAt'
  ) THEN
    ALTER TABLE questions RENAME COLUMN last_used_at TO "lastUsedAt";
    RAISE NOTICE 'Fixed questions.lastUsedAt';
  END IF;
  
  -- is_used to isUsed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'is_used'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'isUsed'
  ) THEN
    ALTER TABLE questions RENAME COLUMN is_used TO "isUsed";
    RAISE NOTICE 'Fixed questions.isUsed';
  END IF;
  
  -- created_at to createdAt
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'created_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE questions RENAME COLUMN created_at TO "createdAt";
    RAISE NOTICE 'Fixed questions.createdAt';
  END IF;
  
  -- updated_at to updatedAt
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'updated_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE questions RENAME COLUMN updated_at TO "updatedAt";
    RAISE NOTICE 'Fixed questions.updatedAt';
  END IF;
END $$;

-- ============================================================================
-- QUIZ_ROUND_QUESTIONS TABLE
-- ============================================================================

DO $$
BEGIN
  -- round_id to roundId
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
  
  -- question_id to questionId
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
  RAISE NOTICE 'All table column name fixes complete!';
END $$;

