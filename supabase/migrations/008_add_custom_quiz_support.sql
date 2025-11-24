-- Migration: Add Custom Quiz Creation Support for Premium Users
-- Changes:
-- 1. Add quizType, createdByUserId, and branding fields to quizzes table
-- 2. Add quizId, isCustom, createdByUserId to questions table (make categoryId nullable)
-- 3. Add quizType and quizId to quiz_completions table
-- 4. Create custom_quiz_shares table for sharing
-- 5. Create custom_quiz_usage table for monthly limits
--
-- This migration is idempotent and safe to run multiple times

-- ============================================================================
-- 1. Update quizzes table
-- ============================================================================
DO $$
BEGIN
  -- Add quizType column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'quizType'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN "quizType" TEXT DEFAULT 'OFFICIAL';
    -- Set all existing quizzes to OFFICIAL
    UPDATE quizzes SET "quizType" = 'OFFICIAL' WHERE "quizType" IS NULL;
    ALTER TABLE quizzes ALTER COLUMN "quizType" SET NOT NULL;
  END IF;

  -- Add createdByUserId column (nullable)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'createdByUserId'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN "createdByUserId" TEXT;
    -- Add foreign key constraint
    ALTER TABLE quizzes ADD CONSTRAINT "quizzes_createdByUserId_fkey" 
      FOREIGN KEY ("createdByUserId") REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  -- Add branding fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'schoolLogoUrl'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN "schoolLogoUrl" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'brandHeading'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN "brandHeading" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'brandSubheading'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN "brandSubheading" TEXT;
  END IF;

  -- Create indexes
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'quizzes' AND indexname = 'quizzes_quizType_idx'
  ) THEN
    CREATE INDEX "quizzes_quizType_idx" ON quizzes("quizType");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'quizzes' AND indexname = 'quizzes_createdByUserId_idx'
  ) THEN
    CREATE INDEX "quizzes_createdByUserId_idx" ON quizzes("createdByUserId");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'quizzes' AND indexname = 'quizzes_quizType_createdByUserId_idx'
  ) THEN
    CREATE INDEX "quizzes_quizType_createdByUserId_idx" ON quizzes("quizType", "createdByUserId");
  END IF;
END $$;

-- ============================================================================
-- 2. Update questions table
-- ============================================================================
DO $$
BEGIN
  -- Make categoryId nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' 
    AND column_name = 'categoryId' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE questions ALTER COLUMN "categoryId" DROP NOT NULL;
  END IF;

  -- Make createdBy nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' 
    AND column_name = 'createdBy' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE questions ALTER COLUMN "createdBy" DROP NOT NULL;
  END IF;

  -- Add createdByUserId column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'createdByUserId'
  ) THEN
    ALTER TABLE questions ADD COLUMN "createdByUserId" TEXT;
    -- Add foreign key constraint
    ALTER TABLE questions ADD CONSTRAINT "questions_createdByUserId_fkey" 
      FOREIGN KEY ("createdByUserId") REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  -- Add quizId column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'quizId'
  ) THEN
    ALTER TABLE questions ADD COLUMN "quizId" TEXT;
    -- Add foreign key constraint
    ALTER TABLE questions ADD CONSTRAINT "questions_quizId_fkey" 
      FOREIGN KEY ("quizId") REFERENCES quizzes(id) ON DELETE CASCADE;
  END IF;

  -- Add isCustom column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'isCustom'
  ) THEN
    ALTER TABLE questions ADD COLUMN "isCustom" BOOLEAN DEFAULT false;
  END IF;

  -- Create indexes
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'questions' AND indexname = 'questions_quizId_idx'
  ) THEN
    CREATE INDEX "questions_quizId_idx" ON questions("quizId");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'questions' AND indexname = 'questions_isCustom_idx'
  ) THEN
    CREATE INDEX "questions_isCustom_idx" ON questions("isCustom");
  END IF;
END $$;

-- ============================================================================
-- 3. Update quiz_completions table
-- ============================================================================
DO $$
BEGIN
  -- Add quizType column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_completions' AND column_name = 'quizType'
  ) THEN
    ALTER TABLE quiz_completions ADD COLUMN "quizType" TEXT DEFAULT 'OFFICIAL';
    -- Set all existing completions to OFFICIAL
    UPDATE quiz_completions SET "quizType" = 'OFFICIAL' WHERE "quizType" IS NULL;
    ALTER TABLE quiz_completions ALTER COLUMN "quizType" SET NOT NULL;
  END IF;

  -- Add quizId column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_completions' AND column_name = 'quizId'
  ) THEN
    ALTER TABLE quiz_completions ADD COLUMN "quizId" TEXT;
  END IF;

  -- Create indexes
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'quiz_completions' AND indexname = 'quiz_completions_quizType_idx'
  ) THEN
    CREATE INDEX "quiz_completions_quizType_idx" ON quiz_completions("quizType");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'quiz_completions' AND indexname = 'quiz_completions_quizId_idx'
  ) THEN
    CREATE INDEX "quiz_completions_quizId_idx" ON quiz_completions("quizId");
  END IF;
END $$;

-- ============================================================================
-- 4. Create custom_quiz_shares table
-- ============================================================================
CREATE TABLE IF NOT EXISTS custom_quiz_shares (
  id TEXT PRIMARY KEY,
  "quizId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sharedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT "custom_quiz_shares_quizId_fkey" 
    FOREIGN KEY ("quizId") REFERENCES quizzes(id) ON DELETE CASCADE,
  CONSTRAINT "custom_quiz_shares_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT "custom_quiz_shares_sharedBy_fkey" 
    FOREIGN KEY ("sharedBy") REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT "custom_quiz_shares_quizId_userId_key" UNIQUE ("quizId", "userId")
);

-- Create indexes for custom_quiz_shares
CREATE INDEX IF NOT EXISTS "custom_quiz_shares_userId_idx" ON custom_quiz_shares("userId");
CREATE INDEX IF NOT EXISTS "custom_quiz_shares_quizId_idx" ON custom_quiz_shares("quizId");
CREATE INDEX IF NOT EXISTS "custom_quiz_shares_sharedBy_idx" ON custom_quiz_shares("sharedBy");

-- ============================================================================
-- 5. Create custom_quiz_usage table
-- ============================================================================
CREATE TABLE IF NOT EXISTS custom_quiz_usage (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "monthYear" TEXT NOT NULL,
  "quizzesCreated" INTEGER DEFAULT 0,
  "quizzesShared" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT "custom_quiz_usage_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT "custom_quiz_usage_userId_monthYear_key" UNIQUE ("userId", "monthYear")
);

-- Create indexes for custom_quiz_usage
CREATE INDEX IF NOT EXISTS "custom_quiz_usage_userId_monthYear_idx" 
  ON custom_quiz_usage("userId", "monthYear");

-- ============================================================================
-- 6. Update organisations table - Add branding fields
-- ============================================================================
DO $$
BEGIN
  -- Add logoUrl column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organisations' AND column_name = 'logoUrl'
  ) THEN
    ALTER TABLE organisations ADD COLUMN "logoUrl" TEXT;
  END IF;

  -- Add brandHeading column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organisations' AND column_name = 'brandHeading'
  ) THEN
    ALTER TABLE organisations ADD COLUMN "brandHeading" TEXT;
  END IF;

  -- Add brandSubheading column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organisations' AND column_name = 'brandSubheading'
  ) THEN
    ALTER TABLE organisations ADD COLUMN "brandSubheading" TEXT;
  END IF;
END $$;

