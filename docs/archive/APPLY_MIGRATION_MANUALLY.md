# Apply Migration Manually

## Issue
Prisma migrations don't work with transaction poolers (they need prepared statements). We need to apply the migration SQL directly.

## Solution: Use Supabase SQL Editor

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and paste this SQL:**

```sql
-- AlterTable: Add slug and weekISO fields to Quiz model
ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "weekISO" TEXT;

-- CreateIndex: Add index on slug for faster lookups
CREATE INDEX IF NOT EXISTS "quizzes_slug_idx" ON "quizzes"("slug");

-- CreateIndex: Add unique constraint on slug (nullable, but unique when set)
CREATE UNIQUE INDEX IF NOT EXISTS "quizzes_slug_key" ON "quizzes"("slug") WHERE "slug" IS NOT NULL;

-- AlterTable: Fix UserQuestionSubmission relation issue
-- Add approvedQuestionId field if it doesn't exist
ALTER TABLE "user_question_submissions" ADD COLUMN IF NOT EXISTS "approvedQuestionId" TEXT;

-- CreateIndex: Add unique constraint on approvedQuestionId for one-to-one relation
CREATE UNIQUE INDEX IF NOT EXISTS "user_question_submissions_approvedQuestionId_key" ON "user_question_submissions"("approvedQuestionId") WHERE "approvedQuestionId" IS NOT NULL;

-- AddForeignKey: Link approvedQuestionId to questions table
DO $$ 
BEGIN
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
END $$;
```

4. **Click "Run"** (or press Cmd/Ctrl + Enter)

5. **Verify it worked** - You should see "Success. No rows returned"

## After Migration

Once the migration is applied, we can:
1. Mark the migration as applied in Prisma
2. Test the connection
3. Start using the database!

Let me know when you've run the SQL and I'll help verify everything works!

