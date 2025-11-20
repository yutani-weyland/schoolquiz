-- Create an admin user for initial access
-- Run this in Supabase SQL Editor

-- First, ensure we have a school (create if doesn't exist)
DO $$
DECLARE
  admin_school_id TEXT;
  admin_teacher_id TEXT;
BEGIN
  -- Get or create a default school
  SELECT id INTO admin_school_id FROM schools LIMIT 1;
  
  IF admin_school_id IS NULL THEN
    INSERT INTO schools (id, name, "createdAt")
    VALUES ('admin-school-1', 'Admin School', NOW())
    RETURNING id INTO admin_school_id;
  END IF;

  -- Check if admin teacher already exists
  SELECT id INTO admin_teacher_id 
  FROM teachers 
  WHERE email = 'admin@schoolquiz.com' OR role = 'PlatformAdmin' OR role = 'admin'
  LIMIT 1;

  -- Create admin teacher if doesn't exist
  IF admin_teacher_id IS NULL THEN
    INSERT INTO teachers (id, email, name, role, "schoolId")
    VALUES (
      'admin-teacher-1',
      'admin@schoolquiz.com',
      'Platform Admin',
      'PlatformAdmin',
      admin_school_id
    )
    RETURNING id INTO admin_teacher_id;
    
    RAISE NOTICE '✅ Created admin user: admin@schoolquiz.com (ID: %)', admin_teacher_id;
  ELSE
    -- Update existing teacher to be PlatformAdmin
    UPDATE teachers
    SET role = 'PlatformAdmin'
    WHERE id = admin_teacher_id;
    
    RAISE NOTICE '✅ Updated existing user to PlatformAdmin (ID: %)', admin_teacher_id;
  END IF;
END $$;

-- Verify the admin user was created
SELECT id, email, name, role, "schoolId" 
FROM teachers 
WHERE role IN ('PlatformAdmin', 'admin')
ORDER BY role DESC;

