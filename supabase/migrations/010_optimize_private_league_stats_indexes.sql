-- Migration: Optimize indexes for private league stats queries
-- Adds covering indexes to speed up stats queries

-- Index for overall stats queries (where quizSlug IS NULL)
-- This covers queries that filter by leagueId and quizSlug IS NULL
CREATE INDEX IF NOT EXISTS idx_private_league_stats_league_overall 
ON private_league_stats("leagueId", "totalCorrectAnswers" DESC, "bestStreak" DESC)
WHERE "quizSlug" IS NULL;

-- Index for leagueId-only lookups (used in groupBy and general filtering)
-- This helps with the quiz slugs query
CREATE INDEX IF NOT EXISTS idx_private_league_stats_league_id 
ON private_league_stats("leagueId", "quizSlug")
WHERE "quizSlug" IS NOT NULL;

-- Composite index for quiz-specific queries (optimized for ordering)
-- This improves queries that filter by leagueId and specific quizSlug
CREATE INDEX IF NOT EXISTS idx_private_league_stats_league_quiz_optimized 
ON private_league_stats("leagueId", "quizSlug", score DESC NULLS LAST, "completedAt" ASC NULLS LAST)
WHERE "quizSlug" IS NOT NULL;







