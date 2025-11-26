-- Script to verify the quiz migration ran successfully
-- Run this in Supabase SQL Editor to check if quizzes were created

-- Check if quizzes with slugs 1-12 exist
SELECT 
  slug, 
  title, 
  status, 
  "quizType",
  "weekISO",
  "colorHex"
FROM quizzes 
WHERE slug IN ('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12')
  AND "quizType" = 'OFFICIAL'
ORDER BY slug::integer DESC;

-- Count total official published quizzes
SELECT 
  COUNT(*) as total_official_published,
  COUNT(CASE WHEN slug IS NOT NULL THEN 1 END) as with_slugs
FROM quizzes
WHERE "quizType" = 'OFFICIAL' AND status = 'published';

-- Show all official quizzes (to see what's actually in the database)
SELECT 
  slug,
  title,
  status,
  "quizType",
  "createdAt"
FROM quizzes
WHERE "quizType" = 'OFFICIAL'
ORDER BY "createdAt" DESC
LIMIT 20;

