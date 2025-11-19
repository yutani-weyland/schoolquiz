-- Fix createdBy column for categories table
-- Run this AFTER ensuring teachers table exists and has at least one teacher

DO $$
DECLARE
  default_teacher_id TEXT;
  default_school_id TEXT;
BEGIN
  -- Check if createdBy column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'createdBy'
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
    ALTER TABLE categories ADD COLUMN "createdBy" TEXT;
    
    -- Set default value for existing rows
    UPDATE categories SET "createdBy" = default_teacher_id WHERE "createdBy" IS NULL;
    
    -- Make it NOT NULL
    ALTER TABLE categories ALTER COLUMN "createdBy" SET NOT NULL;
    
    -- Add foreign key constraint
    ALTER TABLE categories 
    ADD CONSTRAINT categories_createdBy_fkey 
    FOREIGN KEY ("createdBy") REFERENCES teachers(id);
    
    RAISE NOTICE 'Added createdBy column to categories table';
  ELSE
    RAISE NOTICE 'createdBy column already exists';
  END IF;
END $$;

