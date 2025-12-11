-- Migration: Add Teams feature for premium users
-- This migration adds the teams table and updates quiz_completions to support teams

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("userId", name)
);

-- Add indexes for teams
CREATE INDEX IF NOT EXISTS idx_teams_user_id ON teams("userId");
CREATE INDEX IF NOT EXISTS idx_teams_user_default ON teams("userId", "isDefault");

-- Add teamId column to quiz_completions (nullable for backward compatibility)
ALTER TABLE quiz_completions 
  ADD COLUMN IF NOT EXISTS "teamId" TEXT REFERENCES teams(id) ON DELETE SET NULL;

-- Create index for teamId
CREATE INDEX IF NOT EXISTS idx_quiz_completions_team_id ON quiz_completions("teamId");

-- Drop the old unique constraint if it exists (we'll recreate it with teamId)
-- Note: This might fail if the constraint doesn't exist, which is fine
DO $$ 
BEGIN
  ALTER TABLE quiz_completions DROP CONSTRAINT IF EXISTS quiz_completions_userId_quizSlug_key;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create new unique constraint that includes teamId
-- This allows one completion per user+quiz+team combination
-- teamId can be NULL for backward compatibility (legacy completions)
CREATE UNIQUE INDEX IF NOT EXISTS quiz_completions_userId_quizSlug_teamId_key 
  ON quiz_completions("userId", "quizSlug", COALESCE("teamId", ''));

-- Analyze tables to update query planner statistics
ANALYZE teams;
ANALYZE quiz_completions;
