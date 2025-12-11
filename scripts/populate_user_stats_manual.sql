-- Manual population script for user stats summary tables
-- Run this if tables are empty but you have quiz_completions data

-- Step 1: Check if there's source data
SELECT '=== Checking source data ===' as step;
SELECT 
  COUNT(DISTINCT "userId") as unique_users,
  COUNT(*) as total_completions
FROM quiz_completions;

-- Step 2: Populate all user stats (this may take a while if you have many users/completions)
SELECT '=== Populating user stats ===' as step;
SELECT populate_all_user_stats();

-- Step 3: Verify population
SELECT '=== Verification ===' as step;
SELECT 
  COUNT(*) as user_stats_count,
  SUM(total_quizzes_played) as total_quizzes,
  SUM(total_questions_attempted) as total_questions
FROM user_stats_summary;

SELECT 
  COUNT(DISTINCT user_id) as users_with_category_stats,
  COUNT(*) as total_category_records
FROM user_category_stats;







