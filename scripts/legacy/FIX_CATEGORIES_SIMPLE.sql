-- Simple fix for categories table - add missing columns or rename existing ones
-- Run this in Supabase SQL Editor

-- First, let's see what we have
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- Add parentId if it doesn't exist (as nullable)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'parentId'
  ) THEN
    -- Check if parent_id exists and rename it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name = 'parent_id'
    ) THEN
      ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_parent_id_fkey;
      ALTER TABLE categories RENAME COLUMN parent_id TO "parentId";
      ALTER TABLE categories 
      ADD CONSTRAINT categories_parentId_fkey 
      FOREIGN KEY ("parentId") REFERENCES categories(id);
      RAISE NOTICE 'Renamed parent_id to parentId';
    ELSE
      -- Add the column if it doesn't exist at all
      ALTER TABLE categories ADD COLUMN "parentId" TEXT;
      ALTER TABLE categories 
      ADD CONSTRAINT categories_parentId_fkey 
      FOREIGN KEY ("parentId") REFERENCES categories(id);
      RAISE NOTICE 'Added parentId column';
    END IF;
  ELSE
    RAISE NOTICE 'parentId already exists';
  END IF;
END $$;

-- Add other required columns if missing
DO $$
BEGIN
  -- seasonalTag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'seasonalTag'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name = 'seasonal_tag'
    ) THEN
      ALTER TABLE categories RENAME COLUMN seasonal_tag TO "seasonalTag";
    ELSE
      ALTER TABLE categories ADD COLUMN "seasonalTag" TEXT;
    END IF;
    RAISE NOTICE 'Fixed seasonalTag';
  END IF;
  
  -- difficultyMin
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'difficultyMin'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name = 'difficulty_min'
    ) THEN
      ALTER TABLE categories RENAME COLUMN difficulty_min TO "difficultyMin";
    ELSE
      ALTER TABLE categories ADD COLUMN "difficultyMin" DOUBLE PRECISION DEFAULT 0;
    END IF;
    RAISE NOTICE 'Fixed difficultyMin';
  END IF;
  
  -- difficultyMax
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'difficultyMax'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name = 'difficulty_max'
    ) THEN
      ALTER TABLE categories RENAME COLUMN difficulty_max TO "difficultyMax";
    ELSE
      ALTER TABLE categories ADD COLUMN "difficultyMax" DOUBLE PRECISION DEFAULT 1;
    END IF;
    RAISE NOTICE 'Fixed difficultyMax';
  END IF;
  
  -- isActive
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'isActive'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name = 'is_active'
    ) THEN
      ALTER TABLE categories RENAME COLUMN is_active TO "isActive";
    ELSE
      ALTER TABLE categories ADD COLUMN "isActive" BOOLEAN DEFAULT true;
    END IF;
    RAISE NOTICE 'Fixed isActive';
  END IF;
  
  -- usageCount
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'usageCount'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name = 'usage_count'
    ) THEN
      ALTER TABLE categories RENAME COLUMN usage_count TO "usageCount";
    ELSE
      ALTER TABLE categories ADD COLUMN "usageCount" INTEGER DEFAULT 0;
    END IF;
    RAISE NOTICE 'Fixed usageCount';
  END IF;
  
  -- createdBy
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'createdBy'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name = 'created_by'
    ) THEN
      ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_created_by_fkey;
      ALTER TABLE categories RENAME COLUMN created_by TO "createdBy";
      ALTER TABLE categories 
      ADD CONSTRAINT categories_createdBy_fkey 
      FOREIGN KEY ("createdBy") REFERENCES teachers(id);
    ELSE
      -- Column doesn't exist, we'll add it in a separate block
      RAISE NOTICE 'createdBy column missing - will need to add manually or ensure teachers exist first';
    END IF;
    RAISE NOTICE 'Fixed createdBy';
  END IF;
  
  -- createdAt
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'createdAt'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name = 'created_at'
    ) THEN
      ALTER TABLE categories RENAME COLUMN created_at TO "createdAt";
    ELSE
      ALTER TABLE categories ADD COLUMN "createdAt" TIMESTAMP DEFAULT NOW();
    END IF;
    RAISE NOTICE 'Fixed createdAt';
  END IF;
  
  -- updatedAt
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'updatedAt'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name = 'updated_at'
    ) THEN
      ALTER TABLE categories RENAME COLUMN updated_at TO "updatedAt";
    ELSE
      ALTER TABLE categories ADD COLUMN "updatedAt" TIMESTAMP DEFAULT NOW();
    END IF;
    RAISE NOTICE 'Fixed updatedAt';
  END IF;
END $$;

-- Verify result
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'categories'
ORDER BY ordinal_position;

