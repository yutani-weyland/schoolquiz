-- Migration: Add organisation support to private leagues
-- Creates private leagues tables if they don't exist, then adds organisationId to PrivateLeague and creates PrivateLeagueRequest model

-- Create private_leagues table if it doesn't exist
CREATE TABLE IF NOT EXISTS private_leagues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  "createdByUserId" TEXT NOT NULL,
  "organisationId" TEXT,
  "inviteCode" TEXT UNIQUE NOT NULL,
  "maxMembers" INTEGER NOT NULL DEFAULT 50,
  "deletedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  FOREIGN KEY ("createdByUserId") REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for private_leagues if they don't exist
CREATE INDEX IF NOT EXISTS idx_private_leagues_created_by 
ON private_leagues("createdByUserId");

CREATE INDEX IF NOT EXISTS idx_private_leagues_invite_code 
ON private_leagues("inviteCode");

CREATE INDEX IF NOT EXISTS idx_private_leagues_deleted_at 
ON private_leagues("deletedAt");

-- Create private_league_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS private_league_members (
  id TEXT PRIMARY KEY,
  "leagueId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "invitedByUserId" TEXT,
  "joinedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "leftAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  FOREIGN KEY ("leagueId") REFERENCES private_leagues(id) ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY ("invitedByUserId") REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE("leagueId", "userId")
);

-- Create indexes for private_league_members if they don't exist
CREATE INDEX IF NOT EXISTS idx_private_league_members_user 
ON private_league_members("userId");

CREATE INDEX IF NOT EXISTS idx_private_league_members_league_left 
ON private_league_members("leagueId", "leftAt");

-- Create private_league_stats table if it doesn't exist
CREATE TABLE IF NOT EXISTS private_league_stats (
  id TEXT PRIMARY KEY,
  "leagueId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "quizSlug" TEXT,
  score INTEGER,
  "totalQuestions" INTEGER,
  "completedAt" TIMESTAMP,
  "totalCorrectAnswers" INTEGER NOT NULL DEFAULT 0,
  "bestStreak" INTEGER NOT NULL DEFAULT 0,
  "currentStreak" INTEGER NOT NULL DEFAULT 0,
  "quizzesPlayed" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  FOREIGN KEY ("leagueId") REFERENCES private_leagues(id) ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE("leagueId", "userId", "quizSlug")
);

-- Create indexes for private_league_stats if they don't exist
CREATE INDEX IF NOT EXISTS idx_private_league_stats_league_quiz_score 
ON private_league_stats("leagueId", "quizSlug", score);

CREATE INDEX IF NOT EXISTS idx_private_league_stats_user 
ON private_league_stats("userId");

-- Add organisationId to private_leagues table (nullable - existing leagues won't have org)
ALTER TABLE private_leagues 
ADD COLUMN IF NOT EXISTS "organisationId" TEXT;

-- Add foreign key constraint (check if FK already exists on this column)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    WHERE t.relname = 'private_leagues'
    AND a.attname = 'organisationId'
    AND c.contype = 'f'
  ) THEN
    ALTER TABLE private_leagues
    ADD CONSTRAINT private_leagues_organisationId_fkey 
    FOREIGN KEY ("organisationId") REFERENCES organisations(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added foreign key constraint';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists on organisationId column, skipping...';
  END IF;
END $$;

-- Add index for organisation queries
CREATE INDEX IF NOT EXISTS idx_private_leagues_organisation 
ON private_leagues("organisationId", "deletedAt") 
WHERE "deletedAt" IS NULL;

-- Create private_league_requests table for join requests
CREATE TABLE IF NOT EXISTS private_league_requests (
  id TEXT PRIMARY KEY,
  "leagueId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  "requestedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "respondedAt" TIMESTAMP,
  "respondedByUserId" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  FOREIGN KEY ("leagueId") REFERENCES private_leagues(id) ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY ("respondedByUserId") REFERENCES users(id) ON DELETE SET NULL
);

-- Unique index: One pending request per user per league
-- This ensures a user can only have one pending request per league
CREATE UNIQUE INDEX IF NOT EXISTS idx_league_requests_unique_pending 
ON private_league_requests("leagueId", "userId") 
WHERE status = 'PENDING';

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_league_requests_league 
ON private_league_requests("leagueId", status);

CREATE INDEX IF NOT EXISTS idx_league_requests_user 
ON private_league_requests("userId", status);

CREATE INDEX IF NOT EXISTS idx_league_requests_creator 
ON private_league_requests("leagueId", status, "requestedAt") 
WHERE status = 'PENDING';

