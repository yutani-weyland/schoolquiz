-- Fix column name mismatch: database has snake_case, Prisma expects camelCase
-- Run this in Supabase SQL Editor

-- Rename school_id to schoolId in teachers table
DO $$
BEGIN
  -- Check if school_id exists and schoolId doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' AND column_name = 'school_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' AND column_name = 'schoolId'
  ) THEN
    -- Drop foreign key constraint if it exists
    ALTER TABLE teachers DROP CONSTRAINT IF EXISTS teachers_school_id_fkey;
    
    -- Rename the column
    ALTER TABLE teachers RENAME COLUMN school_id TO "schoolId";
    
    -- Re-add foreign key constraint with correct column name
    ALTER TABLE teachers 
    ADD CONSTRAINT teachers_schoolId_fkey 
    FOREIGN KEY ("schoolId") REFERENCES schools(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Renamed school_id to schoolId in teachers table';
  ELSE
    RAISE NOTICE 'Column already has correct name or does not exist';
  END IF;
END $$;

-- Also check and fix other potential mismatches
-- Rename created_at to createdAt if needed
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
    RAISE NOTICE 'Renamed created_at to createdAt in teachers table';
  END IF;
END $$;

-- Rename updated_at to updatedAt if needed
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
    RAISE NOTICE 'Renamed updated_at to updatedAt in teachers table';
  END IF;
END $$;

-- Rename last_login_at to lastLoginAt if needed, or add it if it doesn't exist
DO $$
BEGIN
  -- If it exists as last_login_at, rename it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' AND column_name = 'last_login_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' AND column_name = 'lastLoginAt'
  ) THEN
    ALTER TABLE teachers RENAME COLUMN last_login_at TO "lastLoginAt";
    RAISE NOTICE 'Renamed last_login_at to lastLoginAt in teachers table';
  -- If it doesn't exist at all, add it as nullable
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' AND column_name = 'lastLoginAt'
  ) THEN
    ALTER TABLE teachers ADD COLUMN "lastLoginAt" TIMESTAMP;
    RAISE NOTICE 'Added lastLoginAt column to teachers table';
  END IF;
END $$;

-- Make schoolId NOT NULL if it's currently nullable
DO $$
DECLARE
  default_school_id TEXT;
BEGIN
  -- First, ensure all teachers have a schoolId
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' 
    AND column_name = 'schoolId' 
    AND is_nullable = 'YES'
  ) THEN
    -- Create a default school if needed
    SELECT id INTO default_school_id FROM schools LIMIT 1;
    
    IF default_school_id IS NULL THEN
      INSERT INTO schools (id, name, region, "createdAt")
      VALUES ('default-school-' || extract(epoch from now())::text, 'Default School', 'NSW', NOW())
      RETURNING id INTO default_school_id;
    END IF;
    
    -- Update NULL schoolIds
    UPDATE teachers 
    SET "schoolId" = default_school_id 
    WHERE "schoolId" IS NULL;
    
    -- Now make it NOT NULL
    ALTER TABLE teachers ALTER COLUMN "schoolId" SET NOT NULL;
    RAISE NOTICE 'Made schoolId NOT NULL in teachers table';
  END IF;
END $$;

-- Verify the result
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'teachers'
ORDER BY ordinal_position;

