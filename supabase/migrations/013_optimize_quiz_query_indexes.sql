-- Migration: Optimize Quiz Query Indexes
-- Purpose: Add composite indexes for quiz queries to improve performance
-- Date: 2025-01-27

-- ============================================================================
-- Indexes for Official Quizzes Query
-- Query: SELECT * FROM quizzes WHERE quizType='OFFICIAL' AND status='published' AND slug IS NOT NULL ORDER BY weekISO DESC, createdAt DESC
-- ============================================================================

-- Composite index for official quizzes ordered by weekISO
-- This covers the WHERE clause (quizType, status) and ORDER BY (weekISO)
CREATE INDEX IF NOT EXISTS "quizzes_official_published_weekISO_idx" 
ON quizzes("quizType", "status", "weekISO" DESC NULLS LAST)
WHERE "quizType" = 'OFFICIAL' AND "status" = 'published' AND "slug" IS NOT NULL;

-- Index for createdAt fallback ordering
CREATE INDEX IF NOT EXISTS "quizzes_official_published_createdAt_idx"
ON quizzes("quizType", "status", "createdAt" DESC)
WHERE "quizType" = 'OFFICIAL' AND "status" = 'published' AND "slug" IS NOT NULL;

-- ============================================================================
-- Indexes for Custom Quizzes Query
-- Query: SELECT * FROM quizzes WHERE quizType='CUSTOM' AND createdByUserId=? ORDER BY createdAt DESC
-- ============================================================================

-- Composite index for custom quizzes (already exists, but verify)
-- Migration 008 already creates: quizzes_quizType_createdByUserId_idx
-- This covers the WHERE clause efficiently

-- Add createdAt to the composite index for better ORDER BY performance
DROP INDEX IF EXISTS "quizzes_quizType_createdByUserId_createdAt_idx";
CREATE INDEX IF NOT EXISTS "quizzes_quizType_createdByUserId_createdAt_idx"
ON quizzes("quizType", "createdByUserId", "createdAt" DESC)
WHERE "quizType" = 'CUSTOM';

-- ============================================================================
-- Indexes for Completion Queries
-- Query: SELECT * FROM quiz_completions WHERE userId=? ORDER BY completedAt DESC LIMIT 20
-- ============================================================================

-- Composite index for completion queries ordered by date
CREATE INDEX IF NOT EXISTS "quiz_completions_userId_completedAt_idx"
ON quiz_completions("userId", "completedAt" DESC);

-- ============================================================================
-- Index for Finding Newest Quiz
-- Query: SELECT slug FROM quizzes WHERE quizType='OFFICIAL' AND status='published' AND slug IS NOT NULL ORDER BY weekISO DESC, createdAt DESC LIMIT 1
-- ============================================================================

-- This is already covered by quizzes_official_published_weekISO_idx above

-- ============================================================================
-- Index for Quiz Lookup by Slug (if not exists)
-- Query: SELECT * FROM quizzes WHERE slug=?
-- ============================================================================

-- Slug already has UNIQUE constraint which creates an index automatically
-- But let's verify it exists for completeness
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'quizzes' 
    AND indexname LIKE '%slug%'
  ) THEN
    -- If no slug index exists (shouldn't happen due to UNIQUE), create one
    CREATE INDEX IF NOT EXISTS "quizzes_slug_idx" ON quizzes("slug");
  END IF;
END $$;

-- ============================================================================
-- ANALYZE tables to update query planner statistics
-- ============================================================================

ANALYZE quizzes;
ANALYZE quiz_completions;







