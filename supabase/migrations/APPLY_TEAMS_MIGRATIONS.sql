-- ============================================================================
-- Combined Migration: Add Teams Feature and Teams to Private Leagues
-- ============================================================================
-- This file combines migrations 017 and 018
-- Apply this entire file in Supabase SQL Editor
-- ============================================================================

-- Migration 017: Add Teams feature for premium users
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

-- ============================================================================
-- Migration 018: Add Teams support to Private Leagues
-- This migration adds the ability for leagues to contain teams instead of just individual users
-- ============================================================================

-- Create private_league_teams junction table
CREATE TABLE IF NOT EXISTS private_league_teams (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "leagueId" TEXT NOT NULL REFERENCES private_leagues(id) ON DELETE CASCADE,
  "teamId" TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  "addedByUserId" TEXT REFERENCES users(id) ON DELETE SET NULL,
  "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "leftAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("leagueId", "teamId")
);

-- Create indexes for private_league_teams
CREATE INDEX IF NOT EXISTS idx_private_league_teams_league_id ON private_league_teams("leagueId");
CREATE INDEX IF NOT EXISTS idx_private_league_teams_team_id ON private_league_teams("teamId");
CREATE INDEX IF NOT EXISTS idx_private_league_teams_league_left ON private_league_teams("leagueId", "leftAt");
CREATE INDEX IF NOT EXISTS idx_private_league_teams_team_left ON private_league_teams("teamId", "leftAt");

-- Add teamId to private_league_stats (nullable for backward compatibility)
-- This allows stats to be tracked per team OR per user
ALTER TABLE private_league_stats 
  ADD COLUMN IF NOT EXISTS "teamId" TEXT REFERENCES teams(id) ON DELETE SET NULL;

-- Create index for teamId in stats
CREATE INDEX IF NOT EXISTS idx_private_league_stats_team_id ON private_league_stats("teamId");

-- Update unique constraint to include teamId (allowing both user and team stats)
-- Drop old constraint/index if it exists
DO $$ 
BEGIN
  -- Drop the old unique constraint/index
  DROP INDEX IF EXISTS private_league_stats_leagueId_userId_quizSlug_key;
  ALTER TABLE private_league_stats DROP CONSTRAINT IF EXISTS private_league_stats_leagueId_userId_quizSlug_key;
  
  -- Create new unique indexes that allow both userId and teamId (but not both)
  -- We'll use a partial unique index approach
  -- For user-based stats (teamId is NULL)
  CREATE UNIQUE INDEX IF NOT EXISTS private_league_stats_leagueId_userId_quizSlug_key 
    ON private_league_stats("leagueId", "userId", COALESCE("quizSlug", ''))
    WHERE "teamId" IS NULL AND "userId" IS NOT NULL;
    
  -- For team-based stats (userId is NULL, teamId is NOT NULL)
  CREATE UNIQUE INDEX IF NOT EXISTS private_league_stats_leagueId_teamId_quizSlug_key 
    ON private_league_stats("leagueId", "teamId", COALESCE("quizSlug", ''))
    WHERE "teamId" IS NOT NULL AND "userId" IS NULL;
END $$;

-- Create index for team-based ranking queries
CREATE INDEX IF NOT EXISTS idx_private_league_stats_league_team_quiz_score 
  ON private_league_stats("leagueId", "teamId", "quizSlug", score)
  WHERE "teamId" IS NOT NULL;

-- Analyze tables to update query planner statistics
ANALYZE private_league_teams;
ANALYZE private_league_stats;

-- ============================================================================
-- Migration Complete!
-- ============================================================================
-- After applying this migration:
-- 1. Prisma client has already been regenerated (done automatically)
-- 2. Try creating a league with teams - it should work now!
-- ============================================================================
