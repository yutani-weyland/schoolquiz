-- Migration: Optimize indexes for private league member lookups
-- This speeds up queries that find leagues by user membership

-- Composite index for finding active members by userId
-- This is critical for the "leagues where user is a member" query
CREATE INDEX IF NOT EXISTS idx_private_league_members_user_active 
ON private_league_members("userId", "leftAt") 
WHERE "leftAt" IS NULL;

-- Composite index for finding leagues by creator (already exists but ensure it's optimized)
-- This helps with the "leagues where user is creator" query
CREATE INDEX IF NOT EXISTS idx_private_leagues_creator_deleted 
ON private_leagues("createdByUserId", "deletedAt") 
WHERE "deletedAt" IS NULL;







