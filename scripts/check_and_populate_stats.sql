-- Step 1: Check if there's any quiz completion data
SELECT 'Step 1: Checking quiz_completions data...' as step;
SELECT 
  COUNT(*) as total_completions,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(completed_at) as earliest_completion,
  MAX(completed_at) as latest_completion
FROM quiz_completions;

-- Step 2: If there's data, populate the summary tables
SELECT 'Step 2: Populating summary tables...' as step;
-- This will populate all user stats, category stats, and public stats
SELECT populate_all_user_stats();

-- Step 3: Verify the data was populated
SELECT 'Step 3: Verifying populated data...' as step;

-- Check user stats summary
SELECT 
  'User Stats Summary' as table_name,
  COUNT(*) as record_count,
  SUM(total_quizzes_played) as total_quizzes,
  SUM(total_questions_attempted) as total_questions,
  ROUND(AVG(average_score), 2) as avg_score
FROM user_stats_summary;

-- Check category stats
SELECT 
  'Category Stats' as table_name,
  COUNT(*) as record_count,
  COUNT(DISTINCT user_id) as users_with_categories
FROM user_category_stats;

-- Check public stats (should now have data)
SELECT 
  'Public Stats' as table_name,
  total_users,
  total_quizzes_played,
  total_questions_attempted,
  total_correct_answers,
  average_score,
  updated_at
FROM public_stats_summary
WHERE id = 'global';

-- Step 4: Show sample user stats
SELECT 'Step 4: Sample user stats...' as step;
SELECT 
  user_id,
  total_quizzes_played,
  total_questions_attempted,
  total_correct_answers,
  perfect_scores,
  ROUND(average_score, 2) as avg_score,
  current_quiz_streak,
  best_quiz_streak,
  updated_at
FROM user_stats_summary
ORDER BY total_quizzes_played DESC
LIMIT 5;







