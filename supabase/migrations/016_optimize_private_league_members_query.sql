-- Migration: Optimize private league members query performance
-- This migration adds critical indexes to make member queries blazing fast

-- CRITICAL: Partial index for active members by leagueId
-- This is the most important index for the /members endpoint query
-- It only indexes rows where leftAt IS NULL, making it much smaller and faster
CREATE INDEX IF NOT EXISTS idx_private_league_members_league_active 
ON private_league_members("leagueId", "leftAt") 
WHERE "leftAt" IS NULL;

-- CRITICAL: Covering index for the membership check query
-- This index includes all columns needed for the access check, avoiding table lookups
CREATE INDEX IF NOT EXISTS idx_private_league_members_league_user_active 
ON private_league_members("leagueId", "userId", "leftAt") 
WHERE "leftAt" IS NULL;

-- CRITICAL: Index for ordering by joinedAt (used in member list queries)
-- This makes ORDER BY joinedAt ASC much faster
CREATE INDEX IF NOT EXISTS idx_private_league_members_league_joined 
ON private_league_members("leagueId", "joinedAt") 
WHERE "leftAt" IS NULL;

-- Ensure users table has proper indexes (id is primary key, but verify)
-- The users table should already have indexes, but we ensure name/email are indexed for joins
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name) WHERE name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Analyze tables to update query planner statistics
ANALYZE private_league_members;
ANALYZE private_leagues;
ANALYZE users;

-- Add comment explaining the optimization
COMMENT ON INDEX idx_private_league_members_league_active IS 
'Partial index for fast queries of active members by league. Only indexes rows where leftAt IS NULL, making it much smaller and faster than a full index.';

COMMENT ON INDEX idx_private_league_members_league_user_active IS 
'Covering index for membership checks. Includes leagueId, userId, and leftAt to avoid table lookups when checking if a user is a member.';

COMMENT ON INDEX idx_private_league_members_league_joined IS 
'Index for ordering members by join date. Optimizes ORDER BY joinedAt queries in member lists.';







