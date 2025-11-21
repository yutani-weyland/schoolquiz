-- Performance Indexes Migration
-- Adds indexes for frequently queried fields to improve query performance

-- Quiz model indexes
-- Status is frequently filtered in list queries
CREATE INDEX IF NOT EXISTS "quizzes_status_idx" ON "quizzes"("status");

-- CreatedAt is frequently used for ordering
CREATE INDEX IF NOT EXISTS "quizzes_createdAt_idx" ON "quizzes"("createdAt");

-- Composite index for filtered + ordered queries (status filter + createdAt order)
CREATE INDEX IF NOT EXISTS "quizzes_status_createdAt_idx" ON "quizzes"("status", "createdAt" DESC);

-- Run model indexes
-- quizId is frequently filtered when fetching runs for a specific quiz
CREATE INDEX IF NOT EXISTS "runs_quizId_idx" ON "runs"("quizId");

-- User model indexes
-- lastLoginAt is used for active users queries (last 30 days)
CREATE INDEX IF NOT EXISTS "users_lastLoginAt_idx" ON "users"("lastLoginAt");

-- QuizCompletion model indexes
-- completedAt is used for date range queries (e.g., "last 30 days")
CREATE INDEX IF NOT EXISTS "quiz_completions_completedAt_idx" ON "quiz_completions"("completedAt");

-- Organisation model indexes
-- Simple status index for status-only filters (composite index exists but simple one helps too)
CREATE INDEX IF NOT EXISTS "organisations_status_idx" ON "organisations"("status");

