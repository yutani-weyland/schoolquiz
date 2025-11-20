-- Check actual column names in the database
-- Run this first to see what the actual column names are

SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('quizzes', 'rounds', 'questions', 'quiz_round_questions', 'runs', 'quiz_completions', 'user_achievements', 'teachers', 'categories')
ORDER BY table_name, ordinal_position;

