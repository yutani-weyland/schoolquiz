-- Add missing columns to quizzes table
-- Run this in Supabase SQL Editor

-- Check current columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'quizzes'
ORDER BY ordinal_position;

-- Add missing columns
DO $$
BEGIN
  -- Add blurb if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'blurb'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN blurb TEXT;
    RAISE NOTICE 'Added blurb column to quizzes table';
  END IF;
  
  -- Add audience if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'audience'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN audience TEXT;
    RAISE NOTICE 'Added audience column to quizzes table';
  END IF;
  
  -- Add theme if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'theme'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN theme TEXT;
    RAISE NOTICE 'Added theme column to quizzes table';
  END IF;
  
  -- Add status if missing (should have default)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'status'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN status TEXT DEFAULT 'draft';
    RAISE NOTICE 'Added status column to quizzes table';
  END IF;
  
  -- Add slug if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'slug'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN slug TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS quizzes_slug_key ON quizzes(slug) WHERE slug IS NOT NULL;
    CREATE INDEX IF NOT EXISTS quizzes_slug_idx ON quizzes(slug);
    RAISE NOTICE 'Added slug column to quizzes table';
  END IF;
  
  -- Add weekISO if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'weekISO'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN "weekISO" TEXT;
    RAISE NOTICE 'Added weekISO column to quizzes table';
  END IF;
  
  -- Add difficultyBand if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'difficultyBand'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN "difficultyBand" TEXT;
    RAISE NOTICE 'Added difficultyBand column to quizzes table';
  END IF;
  
  -- Add seasonalTag if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'seasonalTag'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN "seasonalTag" TEXT;
    RAISE NOTICE 'Added seasonalTag column to quizzes table';
  END IF;
  
  -- Add publicationDate if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'publicationDate'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN "publicationDate" TIMESTAMP;
    RAISE NOTICE 'Added publicationDate column to quizzes table';
  END IF;
  
  -- Add colorHex if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'colorHex'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN "colorHex" TEXT;
    RAISE NOTICE 'Added colorHex column to quizzes table';
  END IF;
  
  -- Add createdBy if missing (handle in separate block to avoid nested DECLARE)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'createdBy'
  ) THEN
    RAISE NOTICE 'createdBy column missing - will need to add manually or ensure teachers exist first';
  END IF;
END $$;

-- Add createdBy column separately to avoid nested DECLARE
DO $$
DECLARE
  default_teacher_id TEXT;
  default_school_id TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'createdBy'
  ) THEN
    -- Get or create a default teacher
    SELECT id INTO default_teacher_id FROM teachers LIMIT 1;
    
    IF default_teacher_id IS NULL THEN
      -- Create default school first
      SELECT id INTO default_school_id FROM schools LIMIT 1;
      
      IF default_school_id IS NULL THEN
        INSERT INTO schools (id, name, region, "createdAt")
        VALUES ('default-school-' || extract(epoch from now())::text, 'Default School', 'NSW', NOW())
        RETURNING id INTO default_school_id;
      END IF;
      
      -- Create default teacher
      INSERT INTO teachers (id, "schoolId", email, name, role)
      VALUES ('default-teacher-' || extract(epoch from now())::text, default_school_id, 'admin@schoolquiz.com', 'Admin Teacher', 'admin')
      RETURNING id INTO default_teacher_id;
    END IF;
    
    -- Add createdBy column
    ALTER TABLE quizzes ADD COLUMN "createdBy" TEXT;
    UPDATE quizzes SET "createdBy" = default_teacher_id WHERE "createdBy" IS NULL;
    ALTER TABLE quizzes ALTER COLUMN "createdBy" SET NOT NULL;
    ALTER TABLE quizzes 
    ADD CONSTRAINT quizzes_createdBy_fkey 
    FOREIGN KEY ("createdBy") REFERENCES teachers(id);
    
    RAISE NOTICE 'Added createdBy column to quizzes table';
  END IF;
END $$;

-- Continue with other columns
DO $$
BEGIN
  
  -- Add createdAt if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN "createdAt" TIMESTAMP DEFAULT NOW();
    RAISE NOTICE 'Added createdAt column to quizzes table';
  END IF;
  
  -- Add updatedAt if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN "updatedAt" TIMESTAMP DEFAULT NOW();
    RAISE NOTICE 'Added updatedAt column to quizzes table';
  END IF;
  
  -- Add pdfUrl if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'pdfUrl'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN "pdfUrl" TEXT;
    RAISE NOTICE 'Added pdfUrl column to quizzes table';
  END IF;
  
  -- Add pdfStatus if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'pdfStatus'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN "pdfStatus" TEXT;
    RAISE NOTICE 'Added pdfStatus column to quizzes table';
  END IF;
END $$;

-- Verify result
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'quizzes'
ORDER BY ordinal_position;

