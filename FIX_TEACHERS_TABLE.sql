-- Fix teachers table - add missing schoolId column if it doesn't exist
-- Run this in Supabase SQL Editor

-- First, check what columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'teachers'
ORDER BY ordinal_position;

-- Add schoolId column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' 
    AND column_name = 'schoolId'
  ) THEN
    -- Add the column
    ALTER TABLE teachers ADD COLUMN "schoolId" TEXT;
    
    -- If there are existing teachers, we need to create a default school first
    -- Then update existing teachers to reference it
    DO $$
    DECLARE
      default_school_id TEXT;
    BEGIN
      -- Get or create a default school
      SELECT id INTO default_school_id FROM schools LIMIT 1;
      
      IF default_school_id IS NULL THEN
        -- Create a default school
        INSERT INTO schools (id, name, region, "createdAt")
        VALUES ('default-school-' || extract(epoch from now())::text, 'Default School', 'NSW', NOW())
        RETURNING id INTO default_school_id;
      END IF;
      
      -- Update all teachers without a schoolId
      UPDATE teachers 
      SET "schoolId" = default_school_id 
      WHERE "schoolId" IS NULL;
      
      -- Now make it NOT NULL
      ALTER TABLE teachers ALTER COLUMN "schoolId" SET NOT NULL;
    END $$;
    
    -- Add foreign key constraint
    ALTER TABLE teachers 
    ADD CONSTRAINT teachers_schoolId_fkey 
    FOREIGN KEY ("schoolId") REFERENCES schools(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added schoolId column to teachers table';
  ELSE
    RAISE NOTICE 'schoolId column already exists in teachers table';
  END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'teachers'
ORDER BY ordinal_position;

