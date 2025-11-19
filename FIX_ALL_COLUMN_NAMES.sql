-- Comprehensive fix for all column name mismatches: snake_case to camelCase
-- Run this in Supabase SQL Editor
-- This script fixes all tables to match Prisma schema expectations

-- ============================================================================
-- TEACHERS TABLE
-- ============================================================================

-- Rename school_id to schoolId
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' AND column_name = 'school_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' AND column_name = 'schoolId'
  ) THEN
    ALTER TABLE teachers DROP CONSTRAINT IF EXISTS teachers_school_id_fkey;
    ALTER TABLE teachers RENAME COLUMN school_id TO "schoolId";
    ALTER TABLE teachers 
    ADD CONSTRAINT teachers_schoolId_fkey 
    FOREIGN KEY ("schoolId") REFERENCES schools(id) ON DELETE CASCADE;
    RAISE NOTICE 'Fixed teachers.schoolId';
  END IF;
END $$;

-- Rename created_at to createdAt
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' AND column_name = 'created_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE teachers RENAME COLUMN created_at TO "createdAt";
    RAISE NOTICE 'Fixed teachers.createdAt';
  END IF;
END $$;

-- Rename updated_at to updatedAt
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' AND column_name = 'updated_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE teachers RENAME COLUMN updated_at TO "updatedAt";
    RAISE NOTICE 'Fixed teachers.updatedAt';
  END IF;
END $$;

-- Add or rename lastLoginAt
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' AND column_name = 'last_login_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' AND column_name = 'lastLoginAt'
  ) THEN
    ALTER TABLE teachers RENAME COLUMN last_login_at TO "lastLoginAt";
    RAISE NOTICE 'Fixed teachers.lastLoginAt (renamed)';
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' AND column_name = 'lastLoginAt'
  ) THEN
    ALTER TABLE teachers ADD COLUMN "lastLoginAt" TIMESTAMP;
    RAISE NOTICE 'Fixed teachers.lastLoginAt (added)';
  END IF;
END $$;

-- Make schoolId NOT NULL
DO $$
DECLARE
  default_school_id TEXT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' 
    AND column_name = 'schoolId' 
    AND is_nullable = 'YES'
  ) THEN
    SELECT id INTO default_school_id FROM schools LIMIT 1;
    IF default_school_id IS NULL THEN
      INSERT INTO schools (id, name, region, "createdAt")
      VALUES ('default-school-' || extract(epoch from now())::text, 'Default School', 'NSW', NOW())
      RETURNING id INTO default_school_id;
    END IF;
    UPDATE teachers SET "schoolId" = default_school_id WHERE "schoolId" IS NULL;
    ALTER TABLE teachers ALTER COLUMN "schoolId" SET NOT NULL;
    RAISE NOTICE 'Made teachers.schoolId NOT NULL';
  END IF;
END $$;

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================

-- Rename parent_id to parentId
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'parent_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'parentId'
  ) THEN
    ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_parent_id_fkey;
    ALTER TABLE categories RENAME COLUMN parent_id TO "parentId";
    ALTER TABLE categories 
    ADD CONSTRAINT categories_parentId_fkey 
    FOREIGN KEY ("parentId") REFERENCES categories(id);
    RAISE NOTICE 'Fixed categories.parentId';
  END IF;
END $$;

-- Rename other category columns
DO $$
BEGIN
  -- seasonal_tag to seasonalTag
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'seasonal_tag'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'seasonalTag'
  ) THEN
    ALTER TABLE categories RENAME COLUMN seasonal_tag TO "seasonalTag";
    RAISE NOTICE 'Fixed categories.seasonalTag';
  END IF;
  
  -- difficulty_min to difficultyMin
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'difficulty_min'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'difficultyMin'
  ) THEN
    ALTER TABLE categories RENAME COLUMN difficulty_min TO "difficultyMin";
    RAISE NOTICE 'Fixed categories.difficultyMin';
  END IF;
  
  -- difficulty_max to difficultyMax
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'difficulty_max'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'difficultyMax'
  ) THEN
    ALTER TABLE categories RENAME COLUMN difficulty_max TO "difficultyMax";
    RAISE NOTICE 'Fixed categories.difficultyMax';
  END IF;
  
  -- is_active to isActive
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'is_active'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'isActive'
  ) THEN
    ALTER TABLE categories RENAME COLUMN is_active TO "isActive";
    RAISE NOTICE 'Fixed categories.isActive';
  END IF;
  
  -- usage_count to usageCount
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'usage_count'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'usageCount'
  ) THEN
    ALTER TABLE categories RENAME COLUMN usage_count TO "usageCount";
    RAISE NOTICE 'Fixed categories.usageCount';
  END IF;
  
  -- created_by to createdBy
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'created_by'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'createdBy'
  ) THEN
    ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_created_by_fkey;
    ALTER TABLE categories RENAME COLUMN created_by TO "createdBy";
    ALTER TABLE categories 
    ADD CONSTRAINT categories_createdBy_fkey 
    FOREIGN KEY ("createdBy") REFERENCES teachers(id);
    RAISE NOTICE 'Fixed categories.createdBy';
  END IF;
  
  -- created_at to createdAt
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'created_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE categories RENAME COLUMN created_at TO "createdAt";
    RAISE NOTICE 'Fixed categories.createdAt';
  END IF;
  
  -- updated_at to updatedAt
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'updated_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE categories RENAME COLUMN updated_at TO "updatedAt";
    RAISE NOTICE 'Fixed categories.updatedAt';
  END IF;
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Column name fixes complete!';
END $$;

-- Verify teachers table
SELECT 'teachers' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'teachers'
ORDER BY ordinal_position;

-- Verify categories table
SELECT 'categories' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'categories'
ORDER BY ordinal_position;

