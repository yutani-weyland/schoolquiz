-- Populate stats summary tables NOW
-- Run this to populate tables with existing quiz_completions data

-- Step 1: Check source data
SELECT '=== Checking for source data ===' as step;
SELECT 
  COUNT(DISTINCT "userId") as unique_users,
  COUNT(*) as total_completions
FROM quiz_completions;

-- Step 2: Populate all user stats (this will populate user_stats_summary, user_category_stats, and public_stats_summary)
SELECT '=== Populating stats tables ===' as step;
SELECT populate_all_user_stats() as result;

-- Step 3: Verify population
SELECT '=== Verification ===' as step;

SELECT 'user_stats_summary' as table_name, COUNT(*) as record_count
FROM user_stats_summary
UNION ALL
SELECT 'user_category_stats' as table_name, COUNT(*) as record_count
FROM user_category_stats
UNION ALL
SELECT 'public_stats_summary' as table_name, COUNT(*) as record_count
FROM public_stats_summary;

-- Step 4: Show sample data
SELECT '=== Sample user stats ===' as step;
SELECT 
  user_id,
  total_quizzes_played,
  total_questions_attempted,
  total_correct_answers,
  perfect_scores,
  ROUND(average_score::numeric, 2) as average_score,
  current_quiz_streak,
  best_quiz_streak
FROM user_stats_summary
ORDER BY total_quizzes_played DESC
LIMIT 5;







