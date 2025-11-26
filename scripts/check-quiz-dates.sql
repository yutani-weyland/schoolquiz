-- Check weekISO dates for all quizzes to understand ordering
SELECT 
  slug,
  title,
  "weekISO",
  "createdAt",
  status
FROM quizzes
WHERE "quizType" = 'OFFICIAL' 
  AND status = 'published'
  AND slug IS NOT NULL
ORDER BY 
  CASE 
    WHEN "weekISO" IS NULL THEN 1 
    ELSE 0 
  END,
  "weekISO" DESC,
  "createdAt" DESC;

