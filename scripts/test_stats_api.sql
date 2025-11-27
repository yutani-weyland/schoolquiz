-- Script to test that stats API is using pre-computed tables
-- This helps verify the optimization is working

-- Test 1: Check if a specific user's stats exist in summary table
-- Replace 'USER_ID_HERE' with an actual user ID from your database
SELECT 'Test 1: Check user stats in summary table' as test;
SELECT 
  user_id,
  total_quizzes_played,
  total_questions_attempted,
  average_score,
  current_quiz_streak,
  best_quiz_streak,
  updated_at
FROM user_stats_summary
WHERE user_id IN (
  SELECT DISTINCT user_id FROM quiz_completions LIMIT 1
)
LIMIT 1;

-- Test 2: Compare summary table vs direct aggregation (should match)
SELECT 'Test 2: Compare summary vs aggregation' as test;
WITH summary_stats AS (
  SELECT 
    user_id,
    total_quizzes_played,
    total_questions_attempted,
    total_correct_answers,
    average_score
  FROM user_stats_summary
  WHERE user_id IN (
    SELECT DISTINCT user_id FROM quiz_completions LIMIT 1
  )
),
aggregated_stats AS (
  SELECT 
    user_id,
    COUNT(*)::INTEGER as total_quizzes,
    SUM(total_questions)::INTEGER as total_questions,
    SUM(score)::INTEGER as total_correct,
    CASE 
      WHEN SUM(total_questions) > 0 
      THEN ROUND((SUM(score)::DECIMAL / SUM(total_questions)) * 100, 2)
      ELSE 0
    END as avg_score
  FROM quiz_completions
  WHERE user_id IN (
    SELECT DISTINCT user_id FROM quiz_completions LIMIT 1
  )
  GROUP BY user_id
)
SELECT 
  s.user_id,
  s.total_quizzes_played as summary_quizzes,
  a.total_quizzes as aggregated_quizzes,
  s.total_questions_attempted as summary_questions,
  a.total_questions as aggregated_questions,
  s.average_score as summary_avg,
  a.avg_score as aggregated_avg,
  CASE 
    WHEN s.total_quizzes_played = a.total_quizzes 
      AND s.total_questions_attempted = a.total_questions
    THEN 'MATCH ✓'
    ELSE 'MISMATCH ✗'
  END as status
FROM summary_stats s
JOIN aggregated_stats a ON s.user_id = a.user_id;

-- Test 3: Check category stats exist
SELECT 'Test 3: Check category stats' as test;
SELECT 
  user_id,
  COUNT(*) as categories_count,
  SUM(quizzes_count) as total_quizzes,
  ROUND(AVG(percentage), 2) as avg_percentage
FROM user_category_stats
GROUP BY user_id
ORDER BY categories_count DESC
LIMIT 5;

-- Test 4: Check public stats
SELECT 'Test 4: Check public stats' as test;
SELECT 
  'Summary table' as source,
  total_users,
  total_quizzes_played,
  average_score,
  updated_at
FROM public_stats_summary
WHERE id = 'global'
UNION ALL
SELECT 
  'Direct count' as source,
  COUNT(DISTINCT user_id)::INTEGER as total_users,
  COUNT(*)::INTEGER as total_quizzes,
  CASE 
    WHEN SUM(total_questions) > 0
    THEN ROUND((SUM(score)::DECIMAL / SUM(total_questions)) * 100, 2)
    ELSE 0
  END as average_score,
  NOW() as updated_at
FROM quiz_completions;

-- Test 5: Performance test - compare query times
-- Run these queries and compare execution times
SELECT 'Test 5: Performance comparison' as test;
SELECT 'Query 1: Pre-computed table (should be fast)' as query_type;
EXPLAIN ANALYZE
SELECT * FROM user_stats_summary WHERE user_id IN (
  SELECT DISTINCT user_id FROM quiz_completions LIMIT 1
);

SELECT 'Query 2: Direct aggregation (should be slower)' as query_type;
EXPLAIN ANALYZE
SELECT 
  user_id,
  COUNT(*) as total_quizzes,
  SUM(total_questions) as total_questions,
  SUM(score) as total_correct
FROM quiz_completions
WHERE user_id IN (
  SELECT DISTINCT user_id FROM quiz_completions LIMIT 1
)
GROUP BY user_id;

