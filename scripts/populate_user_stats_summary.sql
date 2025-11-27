-- Script to populate user stats summary tables with existing data
-- Run this after migration 016 has been applied

-- Step 1: Populate all user stats summaries
SELECT 'Populating user stats summaries...' as status;
SELECT populate_all_user_stats();

-- Step 2: Verify data was populated
SELECT 'Verifying user stats summaries...' as status;
SELECT 
  COUNT(*) as total_users_with_stats,
  SUM(total_quizzes_played) as total_quizzes,
  SUM(total_questions_attempted) as total_questions,
  ROUND(AVG(average_score), 2) as avg_average_score
FROM user_stats_summary;

-- Step 3: Show sample data
SELECT 'Sample user stats:' as status;
SELECT 
  user_id,
  total_quizzes_played,
  total_questions_attempted,
  total_correct_answers,
  perfect_scores,
  average_score,
  current_quiz_streak,
  best_quiz_streak
FROM user_stats_summary
ORDER BY total_quizzes_played DESC
LIMIT 5;

-- Step 4: Verify category stats
SELECT 'Verifying category stats...' as status;
SELECT 
  COUNT(DISTINCT user_id) as users_with_category_stats,
  COUNT(*) as total_category_stat_records
FROM user_category_stats;

-- Step 5: Verify public stats
SELECT 'Verifying public stats...' as status;
SELECT * FROM public_stats_summary WHERE id = 'global';

-- Step 6: Compare with source data (should match)
SELECT 'Comparing with source data...' as status;
SELECT 
  'Summary table' as source,
  COUNT(*) as total_users,
  SUM(total_quizzes_played) as total_quizzes
FROM user_stats_summary
UNION ALL
SELECT 
  'Source data' as source,
  COUNT(DISTINCT user_id) as total_users,
  COUNT(*) as total_quizzes
FROM quiz_completions;

