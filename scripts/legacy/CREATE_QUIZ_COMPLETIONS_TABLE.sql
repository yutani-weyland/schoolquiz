-- Create quiz_completions table if it doesn't exist
-- Run this in Supabase SQL Editor

DO $$
BEGIN
  -- Create table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quiz_completions') THEN
    CREATE TABLE "quiz_completions" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "quizSlug" TEXT NOT NULL,
      "score" INTEGER NOT NULL,
      "totalQuestions" INTEGER NOT NULL,
      "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "timeSeconds" INTEGER,
      CONSTRAINT "quiz_completions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    -- Create indexes
    CREATE UNIQUE INDEX "quiz_completions_userId_quizSlug_key" ON "quiz_completions"("userId", "quizSlug");
    CREATE INDEX "quiz_completions_userId_completedAt_idx" ON "quiz_completions"("userId", "completedAt");
    CREATE INDEX "quiz_completions_quizSlug_idx" ON "quiz_completions"("quizSlug");

    RAISE NOTICE '✅ Created quiz_completions table and indexes';
  ELSE
    RAISE NOTICE 'ℹ️ quiz_completions table already exists';
  END IF;
END $$;

-- Verify the table was created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'quiz_completions'
ORDER BY ordinal_position;

