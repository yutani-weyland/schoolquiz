-- Quick check to see if tables exist and have the right columns
-- Run this in Supabase SQL Editor to verify the schema was applied

-- Check if teachers table exists and has schoolId column
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'teachers'
ORDER BY ordinal_position;

-- Check all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

