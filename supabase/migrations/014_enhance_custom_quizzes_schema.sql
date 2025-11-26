-- Migration: Enhance Custom Quizzes Schema for Full Feature Set
-- Adds: status system, org-wide sharing, metadata fields, enhanced sharing model
-- Date: 2025-01-27

-- ============================================================================
-- 1. Enhance Quiz Model - Add Custom Quiz Metadata Fields
-- ============================================================================

-- Add isOrgWide flag (for organisation-wide quizzes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'isOrgWide'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN "isOrgWide" BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add isTemplate flag (for template quizzes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'isTemplate'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN "isTemplate" BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add roundCount (denormalized for performance - updated via triggers or app logic)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'roundCount'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN "roundCount" INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add questionCount (denormalized for performance - updated via triggers or app logic)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'questionCount'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN "questionCount" INTEGER DEFAULT 0;
  END IF;
END $$;

-- Update status to support 'archived' and 'template' (extend existing enum-like behavior)
-- Note: status is TEXT, so we can add new values without enum changes
-- Valid values: 'draft', 'scheduled', 'published', 'archived', 'template'

-- ============================================================================
-- 2. Enhance CustomQuizShare Model - Support Groups and Organisation Sharing
-- ============================================================================

-- Add targetType field ('user' | 'group' | 'organisation')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'custom_quiz_shares' AND column_name = 'targetType'
  ) THEN
    ALTER TABLE custom_quiz_shares ADD COLUMN "targetType" TEXT DEFAULT 'user';
  END IF;
END $$;

-- Add targetId field (userId or groupId; null for organisation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'custom_quiz_shares' AND column_name = 'targetId'
  ) THEN
    ALTER TABLE custom_quiz_shares ADD COLUMN "targetId" TEXT;
  END IF;
END $$;

-- Add permission field ('view' | 'run' | 'edit')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'custom_quiz_shares' AND column_name = 'permission'
  ) THEN
    ALTER TABLE custom_quiz_shares ADD COLUMN permission TEXT DEFAULT 'view';
  END IF;
END $$;

-- Migrate existing shares: set targetType='user' and targetId=userId
UPDATE custom_quiz_shares 
SET "targetType" = 'user', "targetId" = "userId", permission = 'view'
WHERE "targetType" IS NULL OR "targetId" IS NULL OR permission IS NULL;

-- ============================================================================
-- 3. Update Unique Constraint for CustomQuizShare
-- ============================================================================

-- Drop old unique constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'custom_quiz_shares_quizId_userId_key'
  ) THEN
    ALTER TABLE custom_quiz_shares DROP CONSTRAINT "custom_quiz_shares_quizId_userId_key";
  END IF;
END $$;

-- Add new unique constraint: quizId + targetType + targetId
-- This allows same quiz to be shared to user AND group, but prevents duplicates
-- Note: For organisation shares (targetId IS NULL), we use a separate constraint
CREATE UNIQUE INDEX IF NOT EXISTS "custom_quiz_shares_quiz_target_unique" 
ON custom_quiz_shares("quizId", "targetType", COALESCE("targetId", '')) 
WHERE "targetId" IS NOT NULL;

-- For organisation shares (targetId IS NULL), only one org share per quiz
CREATE UNIQUE INDEX IF NOT EXISTS "custom_quiz_shares_quiz_org_unique" 
ON custom_quiz_shares("quizId") 
WHERE "targetType" = 'organisation' AND "targetId" IS NULL;

-- ============================================================================
-- 4. Add Indexes for Performance
-- ============================================================================

-- Index for filtering by status (excluding archived)
CREATE INDEX IF NOT EXISTS idx_quizzes_custom_status 
ON quizzes("quizType", status, "updatedAt" DESC) 
WHERE "quizType" = 'CUSTOM' AND status != 'archived';

-- Index for org-wide quizzes
CREATE INDEX IF NOT EXISTS idx_quizzes_custom_orgWide 
ON quizzes("quizType", "isOrgWide", "updatedAt" DESC) 
WHERE "quizType" = 'CUSTOM' AND "isOrgWide" = true;

-- Index for template quizzes
CREATE INDEX IF NOT EXISTS idx_quizzes_custom_template 
ON quizzes("quizType", "isTemplate", "updatedAt" DESC) 
WHERE "quizType" = 'CUSTOM' AND "isTemplate" = true;

-- Index for custom quiz shares by target type and ID (for group/user lookups)
CREATE INDEX IF NOT EXISTS idx_custom_quiz_shares_target 
ON custom_quiz_shares("targetType", "targetId") 
WHERE "targetId" IS NOT NULL;

-- Index for group shares specifically
CREATE INDEX IF NOT EXISTS idx_custom_quiz_shares_group 
ON custom_quiz_shares("targetType", "targetId") 
WHERE "targetType" = 'group';

-- Index for organisation shares
CREATE INDEX IF NOT EXISTS idx_custom_quiz_shares_org 
ON custom_quiz_shares("targetType", "quizId") 
WHERE "targetType" = 'organisation';

-- Index for permission-based queries
CREATE INDEX IF NOT EXISTS idx_custom_quiz_shares_permission 
ON custom_quiz_shares("quizId", permission);

-- ============================================================================
-- 5. Populate Metadata Fields (roundCount, questionCount) for Existing Quizzes
-- ============================================================================

-- Update roundCount for existing custom quizzes
UPDATE quizzes q
SET "roundCount" = (
  SELECT COUNT(*)::INTEGER
  FROM rounds r
  WHERE r."quizId" = q.id
)
WHERE q."quizType" = 'CUSTOM' AND (q."roundCount" IS NULL OR q."roundCount" = 0);

-- Update questionCount for existing custom quizzes
UPDATE quizzes q
SET "questionCount" = (
  SELECT COUNT(*)::INTEGER
  FROM questions qu
  WHERE qu."quizId" = q.id AND qu."isCustom" = true
)
WHERE q."quizType" = 'CUSTOM' AND (q."questionCount" IS NULL OR q."questionCount" = 0);

-- ============================================================================
-- 6. Create Database Function to Auto-Update Counts (Optional but Recommended)
-- ============================================================================

-- Function to update roundCount and questionCount when rounds/questions change
-- This keeps denormalized fields in sync automatically
CREATE OR REPLACE FUNCTION update_quiz_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'rounds' THEN
    UPDATE quizzes
    SET "roundCount" = (
      SELECT COUNT(*)::INTEGER
      FROM rounds
      WHERE "quizId" = COALESCE(NEW."quizId", OLD."quizId")
    )
    WHERE id = COALESCE(NEW."quizId", OLD."quizId");
  ELSIF TG_TABLE_NAME = 'questions' THEN
    UPDATE quizzes
    SET "questionCount" = (
      SELECT COUNT(*)::INTEGER
      FROM questions
      WHERE "quizId" = COALESCE(NEW."quizId", OLD."quizId")
        AND "isCustom" = true
    )
    WHERE id = COALESCE(NEW."quizId", OLD."quizId");
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update counts
DROP TRIGGER IF EXISTS update_quiz_round_count ON rounds;
CREATE TRIGGER update_quiz_round_count
  AFTER INSERT OR UPDATE OR DELETE ON rounds
  FOR EACH ROW EXECUTE FUNCTION update_quiz_counts();

DROP TRIGGER IF EXISTS update_quiz_question_count ON questions;
CREATE TRIGGER update_quiz_question_count
  AFTER INSERT OR UPDATE OR DELETE ON questions
  FOR EACH ROW 
  WHEN (NEW."isCustom" = true OR OLD."isCustom" = true)
  EXECUTE FUNCTION update_quiz_counts();

-- ============================================================================
-- 6. Add Comments for Documentation
-- ============================================================================

COMMENT ON COLUMN quizzes."isOrgWide" IS 'If true, quiz is available to all teachers in the organisation';
COMMENT ON COLUMN quizzes."isTemplate" IS 'If true, quiz is a template that can be cloned';
COMMENT ON COLUMN quizzes."roundCount" IS 'Denormalized count of rounds (updated via app logic)';
COMMENT ON COLUMN quizzes."questionCount" IS 'Denormalized count of questions (updated via app logic)';
COMMENT ON COLUMN custom_quiz_shares."targetType" IS 'Type of sharing target: user, group, or organisation';
COMMENT ON COLUMN custom_quiz_shares."targetId" IS 'ID of target (userId or groupId; null for organisation)';
COMMENT ON COLUMN custom_quiz_shares.permission IS 'Permission level: view (see), run (play), or edit (modify)';

-- ============================================================================
-- 7. Analyze Tables for Query Optimization
-- ============================================================================

ANALYZE quizzes;
ANALYZE custom_quiz_shares;

