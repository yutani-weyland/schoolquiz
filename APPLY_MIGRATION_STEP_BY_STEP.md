# Apply Migration Step by Step

## Issue
The `user_question_submissions` table doesn't exist yet, so we need to create it first.

## Solution: Two-Step Process

### Step 1: Create the Missing Table

1. **Go to Supabase SQL Editor**
2. **Run this SQL first:**

```sql
-- Create user_question_submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_question_submissions (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "approvedQuestionId" TEXT UNIQUE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  explanation TEXT,
  category TEXT,
  status TEXT DEFAULT 'PENDING',
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP,
  notes TEXT,
  "teacherName" TEXT,
  "schoolName" TEXT,
  "consentForShoutout" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "user_question_submissions_status_createdAt_idx" 
  ON user_question_submissions(status, "createdAt");
CREATE INDEX IF NOT EXISTS "user_question_submissions_userId_idx" 
  ON user_question_submissions("userId");
```

3. **Click "Run"** - Should see "Success"

### Step 2: Apply the Migration

Now run the original migration SQL (the one that adds slug and weekISO to quizzes):

```sql
-- AlterTable: Add slug and weekISO fields to Quiz model
ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "weekISO" TEXT;

-- CreateIndex: Add index on slug for faster lookups
CREATE INDEX IF NOT EXISTS "quizzes_slug_idx" ON "quizzes"("slug");

-- CreateIndex: Add unique constraint on slug (nullable, but unique when set)
CREATE UNIQUE INDEX IF NOT EXISTS "quizzes_slug_key" ON "quizzes"("slug") WHERE "slug" IS NOT NULL;

-- AlterTable: Fix UserQuestionSubmission relation issue
-- Add approvedQuestionId field if it doesn't exist (already done in Step 1, but safe to run)
ALTER TABLE "user_question_submissions" ADD COLUMN IF NOT EXISTS "approvedQuestionId" TEXT;

-- CreateIndex: Add unique constraint on approvedQuestionId for one-to-one relation
CREATE UNIQUE INDEX IF NOT EXISTS "user_question_submissions_approvedQuestionId_key" ON "user_question_submissions"("approvedQuestionId") WHERE "approvedQuestionId" IS NOT NULL;

-- AddForeignKey: Link approvedQuestionId to questions table (only if questions table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questions') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'user_question_submissions_approvedQuestionId_fkey'
        ) THEN
            ALTER TABLE "user_question_submissions" 
            ADD CONSTRAINT "user_question_submissions_approvedQuestionId_fkey" 
            FOREIGN KEY ("approvedQuestionId") 
            REFERENCES "questions"("id") 
            ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;
```

4. **Click "Run"** - Should see "Success"

## After Both Steps

Once both SQL scripts have run successfully, let me know and I'll:
1. Verify the connection works
2. Test querying the database
3. Mark the migration as complete

