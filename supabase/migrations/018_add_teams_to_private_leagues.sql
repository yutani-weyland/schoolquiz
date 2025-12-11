-- Migration: Add Teams support to Private Leagues
-- This migration adds the ability for leagues to contain teams instead of just individual users

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
