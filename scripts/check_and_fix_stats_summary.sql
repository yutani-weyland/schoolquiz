-- Diagnostic script to check and fix stats summary tables
-- This checks if tables are populated and populates them if needed

-- ============================================
-- STEP 1: Check if tables exist and have data
-- ============================================
SELECT '=== Checking user_stats_summary ===' as step;

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'EMPTY - Needs population'
    ELSE 'POPULATED - ' || COUNT(*) || ' users'
  END as status,
  COUNT(*) as user_count,
  SUM(total_quizzes_played) as total_quizzes,
  SUM(total_questions_attempted) as total_questions
FROM user_stats_summary;

SELECT '=== Checking user_category_stats ===' as step;
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'EMPTY - Needs population'
    ELSE 'POPULATED - ' || COUNT(*) || ' records'
  END as status,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_records
FROM user_category_stats;

SELECT '=== Checking public_stats_summary ===' as step;
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'EMPTY - Needs population'
    ELSE 'POPULATED'
  END as status,
  id,
  total_users,
  total_quizzes_played,
  total_questions_attempted,
  total_correct_answers,
  average_score,
  updated_at
FROM public_stats_summary WHERE id = 'global';

-- ============================================
-- STEP 2: Check if there's source data to populate from
-- ============================================
SELECT '=== Checking source data (quiz_completions) ===' as step;
SELECT 
  COUNT(DISTINCT "userId") as unique_users_with_completions,
  COUNT(*) as total_completions
FROM quiz_completions;

-- ============================================
-- STEP 3: Populate if tables are empty but source data exists
-- ============================================
DO $$
DECLARE
  v_user_count INTEGER;
  v_completion_count INTEGER;
BEGIN
  -- Check if summary table is empty
  SELECT COUNT(*) INTO v_user_count FROM user_stats_summary;
  
  -- Check if there's source data
  SELECT COUNT(*) INTO v_completion_count FROM quiz_completions;
  
  IF v_user_count = 0 AND v_completion_count > 0 THEN
    RAISE NOTICE 'Summary tables are empty but source data exists. Populating...';
    PERFORM populate_all_user_stats();
    RAISE NOTICE 'Population complete!';
  ELSIF v_user_count = 0 AND v_completion_count = 0 THEN
    RAISE NOTICE 'No source data to populate from. Tables will populate automatically when users complete quizzes.';
  ELSE
    RAISE NOTICE 'Summary tables already populated. No action needed.';
  END IF;
END $$;

-- ============================================
-- STEP 4: Verify triggers are set up
-- ============================================
SELECT '=== Checking triggers ===' as step;
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'quiz_completions'
  AND trigger_name LIKE '%stats%';

-- ============================================
-- STEP 5: Final verification
-- ============================================
SELECT '=== Final verification ===' as step;

SELECT 
  'user_stats_summary'::text as table_name,
  COUNT(*)::bigint as record_count
FROM user_stats_summary
UNION ALL
SELECT 
  'user_category_stats'::text as table_name,
  COUNT(*)::bigint as record_count
FROM user_category_stats
UNION ALL
SELECT 
  'public_stats_summary'::text as table_name,
  COUNT(*)::bigint as record_count
FROM public_stats_summary;

