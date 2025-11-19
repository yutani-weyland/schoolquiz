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

