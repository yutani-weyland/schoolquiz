-- Additional Database Indexes for Performance Optimization
-- Run this on your Supabase database to improve query performance
-- Note: Column names use camelCase as per Prisma schema mapping

-- ============================================================================
-- QUIZ PLAY PAGE OPTIMIZATION INDEXES
-- ============================================================================
-- These indexes optimize the quiz play page queries for maximum performance

-- Index for finding quiz by slug (most common query)
CREATE INDEX IF NOT EXISTS idx_quizzes_slug_lookup ON quizzes(slug) WHERE slug IS NOT NULL;

-- Composite index for finding newest quiz (quizType + status + weekISO + createdAt)
CREATE INDEX IF NOT EXISTS idx_quizzes_newest_lookup ON quizzes("quizType", status, "weekISO" DESC, "createdAt" DESC) 
WHERE "quizType" = 'OFFICIAL' AND status = 'published' AND slug IS NOT NULL;

-- Index for rounds lookup by quizId (with index ordering)
CREATE INDEX IF NOT EXISTS idx_rounds_quiz_index ON rounds("quizId", index);

-- Index for quiz_round_questions lookup (roundId + order)
CREATE INDEX IF NOT EXISTS idx_quiz_round_questions_round_order ON quiz_round_questions("roundId", "order");

-- Composite index for questions lookup (used in quiz play)
CREATE INDEX IF NOT EXISTS idx_questions_id_lookup ON questions(id);

-- Index for category lookup (used in rounds)
CREATE INDEX IF NOT EXISTS idx_categories_id_lookup ON categories(id);

-- ============================================================================

-- Enable pg_trgm extension for text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Text search indexes for Command Palette search (requires pg_trgm extension)
-- These dramatically speed up ILIKE/contains queries with insensitive mode
DO $$
BEGIN
  -- Quiz text search indexes
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'title') THEN
    CREATE INDEX IF NOT EXISTS idx_quizzes_title_trgm ON quizzes USING gin(title gin_trgm_ops);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'blurb') THEN
    CREATE INDEX IF NOT EXISTS idx_quizzes_blurb_trgm ON quizzes USING gin(blurb gin_trgm_ops);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'slug') THEN
    CREATE INDEX IF NOT EXISTS idx_quizzes_slug_trgm ON quizzes USING gin(slug gin_trgm_ops);
  END IF;
  
  -- Achievement text search indexes
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'name') THEN
    CREATE INDEX IF NOT EXISTS idx_achievements_name_trgm ON achievements USING gin(name gin_trgm_ops);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'slug') THEN
    CREATE INDEX IF NOT EXISTS idx_achievements_slug_trgm ON achievements USING gin(slug gin_trgm_ops);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'shortDescription') THEN
    CREATE INDEX IF NOT EXISTS idx_achievements_short_description_trgm ON achievements USING gin("shortDescription" gin_trgm_ops);
  END IF;
  
  -- Organisation text search indexes
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organisations' AND column_name = 'name') THEN
    CREATE INDEX IF NOT EXISTS idx_organisations_name_trgm ON organisations USING gin(name gin_trgm_ops);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organisations' AND column_name = 'emailDomain') THEN
    CREATE INDEX IF NOT EXISTS idx_organisations_email_domain_trgm ON organisations USING gin("emailDomain" gin_trgm_ops);
  END IF;
  
  -- User text search indexes
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') THEN
    CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON users USING gin(name gin_trgm_ops);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN
    CREATE INDEX IF NOT EXISTS idx_users_email_trgm ON users USING gin(email gin_trgm_ops);
  END IF;
END $$;

-- Quiz indexes (for admin queries)
-- Check if columns exist before creating indexes
DO $$
BEGIN
  -- Index on status and createdAt (if createdAt exists)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'createdAt') THEN
    CREATE INDEX IF NOT EXISTS idx_quizzes_status_created_at ON quizzes(status, "createdAt" DESC);
  END IF;
  
  -- Index on status and publicationDate (if publicationDate exists)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'publicationDate') THEN
    CREATE INDEX IF NOT EXISTS idx_quizzes_status_publication_date ON quizzes(status, "publicationDate" DESC) WHERE "publicationDate" IS NOT NULL;
  END IF;
  
  -- Index on createdBy and status (if createdBy exists)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'createdBy') THEN
    CREATE INDEX IF NOT EXISTS idx_quizzes_created_by_status ON quizzes("createdBy", status);
  END IF;
END $$;

-- Question indexes (for question bank)
DO $$
BEGIN
  -- Index on categoryId, status, and createdAt
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'categoryId') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'createdAt') THEN
    CREATE INDEX IF NOT EXISTS idx_questions_category_status_created ON questions("categoryId", status, "createdAt" DESC);
  END IF;
  
  -- Index on createdBy and status
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'createdBy') THEN
    CREATE INDEX IF NOT EXISTS idx_questions_created_by_status ON questions("createdBy", status);
  END IF;
  
  -- Index on status and usageCount
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'usageCount') THEN
    CREATE INDEX IF NOT EXISTS idx_questions_status_usage_count ON questions(status, "usageCount" DESC) WHERE status = 'published';
  END IF;
END $$;

-- Quiz completion indexes (for stats/analytics)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_completions' AND column_name = 'userId') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_completions' AND column_name = 'completedAt') THEN
    CREATE INDEX IF NOT EXISTS idx_quiz_completions_user_completed ON quiz_completions("userId", "completedAt" DESC);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_completions' AND column_name = 'quizSlug') THEN
    CREATE INDEX IF NOT EXISTS idx_quiz_completions_quiz_score ON quiz_completions("quizSlug", score DESC);
  END IF;
END $$;

-- Leaderboard member indexes (for leaderboard queries)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leaderboard_members' AND column_name = 'leaderboardId') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leaderboard_members' AND column_name = 'leftAt') THEN
    CREATE INDEX IF NOT EXISTS idx_leaderboard_members_leaderboard_active ON leaderboard_members("leaderboardId", "leftAt") WHERE "leftAt" IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leaderboard_members' AND column_name = 'userId') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leaderboard_members' AND column_name = 'leftAt') THEN
    CREATE INDEX IF NOT EXISTS idx_leaderboard_members_user_active ON leaderboard_members("userId", "leftAt") WHERE "leftAt" IS NULL;
  END IF;
END $$;

-- Private league indexes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'private_league_members' AND column_name = 'leagueId') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'private_league_members' AND column_name = 'leftAt') THEN
    CREATE INDEX IF NOT EXISTS idx_private_league_members_league_active ON private_league_members("leagueId", "leftAt") WHERE "leftAt" IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'private_league_stats' AND column_name = 'leagueId') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'private_league_stats' AND column_name = 'quizSlug') THEN
    CREATE INDEX IF NOT EXISTS idx_private_league_stats_league_quiz ON private_league_stats("leagueId", "quizSlug", score DESC) WHERE "quizSlug" IS NOT NULL;
  END IF;
END $$;

-- User achievement indexes (for profile pages)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_achievements' AND column_name = 'userId') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_achievements' AND column_name = 'unlockedAt') THEN
    CREATE INDEX IF NOT EXISTS idx_user_achievements_user_unlocked ON user_achievements("userId", "unlockedAt" DESC);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_achievements' AND column_name = 'achievementId') THEN
    CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_count ON user_achievements("achievementId");
  END IF;
END $$;

-- Round indexes (for quiz loading)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rounds' AND column_name = 'quizId') THEN
    CREATE INDEX IF NOT EXISTS idx_rounds_quiz_index ON rounds("quizId", index);
  END IF;
END $$;

-- Quiz round question indexes (for quiz loading)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_round_questions' AND column_name = 'roundId') THEN
    CREATE INDEX IF NOT EXISTS idx_quiz_round_questions_round_order ON quiz_round_questions("roundId", "order");
  END IF;
END $$;

-- Run indexes (for analytics)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'runs' AND column_name = 'quizId') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'runs' AND column_name = 'startedAt') THEN
    CREATE INDEX IF NOT EXISTS idx_runs_quiz_started ON runs("quizId", "startedAt" DESC);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'runs' AND column_name = 'teacherId') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'runs' AND column_name = 'startedAt') THEN
    CREATE INDEX IF NOT EXISTS idx_runs_teacher_started ON runs("teacherId", "startedAt" DESC);
  END IF;
END $$;

-- User question submission indexes (for admin review)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_question_submissions' AND column_name = 'createdAt') THEN
    CREATE INDEX IF NOT EXISTS idx_user_question_submissions_status_created ON user_question_submissions(status, "createdAt" DESC) WHERE status = 'PENDING';
  END IF;
END $$;

-- Organisation member indexes (for org queries)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organisation_members' AND column_name = 'organisationId') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organisation_members' AND column_name = 'deletedAt') THEN
    CREATE INDEX IF NOT EXISTS idx_organisation_members_org_active ON organisation_members("organisationId", status) WHERE "deletedAt" IS NULL;
  END IF;
END $$;

-- ============================================
-- STATS & ANALYSIS PERFORMANCE INDEXES
-- ============================================

-- Quiz completion lookups (most common stats query)
-- Used for: summary stats, streaks, performance over time
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quiz_completions') THEN
    -- User completions ordered by date (for streaks and performance over time)
    CREATE INDEX IF NOT EXISTS idx_quiz_completion_user_date 
    ON quiz_completions(user_id, completed_at DESC);
    
    -- User completions ordered by score (for perfect scores query)
    CREATE INDEX IF NOT EXISTS idx_quiz_completion_user_score 
    ON quiz_completions(user_id, score DESC, total_questions DESC);
    
    -- Perfect scores lookup (score = total_questions)
    CREATE INDEX IF NOT EXISTS idx_quiz_completion_perfect 
    ON quiz_completions(user_id, completed_at DESC) 
    WHERE score = total_questions;
    
    -- Public stats aggregation (all users)
    CREATE INDEX IF NOT EXISTS idx_quiz_completion_public_stats 
    ON quiz_completions(completed_at DESC);
  END IF;
END $$;

-- League stats lookups (for league comparisons)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'private_league_stats') THEN
    -- League stats by league and user (for user stats lookup)
    CREATE INDEX IF NOT EXISTS idx_league_stats_league_user 
    ON private_league_stats(league_id, user_id, quiz_slug);
    
    -- League ranking queries (for user rank calculation)
    CREATE INDEX IF NOT EXISTS idx_league_stats_ranking 
    ON private_league_stats(league_id, quiz_slug, total_correct_answers DESC);
    
    -- League aggregate queries (for league average)
    CREATE INDEX IF NOT EXISTS idx_league_stats_aggregate 
    ON private_league_stats(league_id, quiz_slug) 
    WHERE quiz_slug IS NULL;
  END IF;
END $$;

-- Season stats lookup
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'season_stats') THEN
    CREATE INDEX IF NOT EXISTS idx_season_stats_user_season 
    ON season_stats(user_id, season_id);
  END IF;
END $$;

-- Private league member lookups (for league comparisons)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'private_league_members') THEN
    -- User's active league memberships
    CREATE INDEX IF NOT EXISTS idx_league_member_user_active 
    ON private_league_members(user_id, left_at) 
    WHERE left_at IS NULL;
  END IF;
END $$;

-- Quiz lookups for category performance (if needed)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quizzes') THEN
    -- Quiz slug lookup for category performance
    CREATE INDEX IF NOT EXISTS idx_quizzes_slug_for_stats 
    ON quizzes(slug) 
    WHERE slug IS NOT NULL;
  END IF;
END $$;

-- Note: These indexes will slightly slow down INSERT/UPDATE operations
-- but significantly speed up SELECT queries. Monitor your database performance
-- and remove any indexes that aren't being used.

