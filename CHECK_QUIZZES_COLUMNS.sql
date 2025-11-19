-- Check what columns quizzes table actually has
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'quizzes'
ORDER BY ordinal_position;

