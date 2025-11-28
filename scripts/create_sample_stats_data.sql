-- Create sample quiz completions and populate stats summary tables
-- This simulates a user completing multiple quizzes for testing

-- Step 1: Get a user ID (use the first user or create a test scenario)
DO $$
DECLARE
  v_user_id TEXT;
  v_quiz_slug TEXT;
  v_quiz_count INTEGER;
  v_completion_date TIMESTAMPTZ;
  v_score INTEGER;
  v_total_questions INTEGER;
  v_weeks_ago INTEGER;
BEGIN
  -- Get first user (or you can replace with a specific user ID)
  SELECT id INTO v_user_id FROM users LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No users found. Please create a user first.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Using user ID: %', v_user_id;
  
  -- Check if user already has completions
  SELECT COUNT(*) INTO v_quiz_count FROM quiz_completions WHERE "userId" = v_user_id;
  
  IF v_quiz_count > 0 THEN
    RAISE NOTICE 'User already has % completions. Skipping sample data creation.', v_quiz_count;
  ELSE
    RAISE NOTICE 'Creating sample quiz completions...';
    
    -- Create completions for the last 20 weeks (simulating weekly quiz completion)
    FOR v_weeks_ago IN 0..19 LOOP
      -- Calculate completion date (weeks ago)
      v_completion_date := NOW() - (v_weeks_ago * INTERVAL '7 days');
      
      -- Use quiz slug based on week number (or use existing quiz slugs)
      -- Try to find an existing quiz slug, or use a pattern
      SELECT slug INTO v_quiz_slug 
      FROM quizzes 
      WHERE status = 'published' 
      ORDER BY "createdAt" DESC 
      LIMIT 1 
      OFFSET (v_weeks_ago % 10); -- Cycle through available quizzes
      
      -- If no quiz found, use a pattern
      IF v_quiz_slug IS NULL THEN
        v_quiz_slug := (v_weeks_ago + 1)::TEXT;
      END IF;
      
      -- Simulate scores: 60-100% accuracy (realistic range)
      v_total_questions := 25; -- Standard quiz size
      v_score := FLOOR(RANDOM() * 11 + 15)::INTEGER; -- 15-25 correct (60-100%)
      
      -- Insert completion
      INSERT INTO quiz_completions (
        id,
        "userId",
        "quizSlug",
        "quizType",
        score,
        "totalQuestions",
        "completedAt",
        "timeSeconds"
      ) VALUES (
        'sample_' || v_user_id || '_' || v_weeks_ago,
        v_user_id,
        v_quiz_slug,
        'OFFICIAL',
        v_score,
        v_total_questions,
        v_completion_date,
        FLOOR(RANDOM() * 300 + 120)::INTEGER -- 2-7 minutes
      )
      ON CONFLICT (id) DO NOTHING;
      
      -- Add some perfect scores (every 4th quiz)
      IF v_weeks_ago % 4 = 0 THEN
        UPDATE quiz_completions 
        SET score = "totalQuestions"
        WHERE id = 'sample_' || v_user_id || '_' || v_weeks_ago;
      END IF;
    END LOOP;
    
    RAISE NOTICE 'Created 20 sample quiz completions for user %', v_user_id;
  END IF;
END $$;

-- Step 2: Populate summary tables from the completions
SELECT '=== Populating summary tables ===' as step;
SELECT populate_all_user_stats() as result;

-- Step 3: Verify the data
SELECT '=== Verification ===' as step;

SELECT 
  'user_stats_summary' as table_name,
  COUNT(*) as record_count,
  SUM(total_quizzes_played) as total_quizzes,
  SUM(total_questions_attempted) as total_questions
FROM user_stats_summary
UNION ALL
SELECT 
  'user_category_stats' as table_name,
  COUNT(*) as record_count,
  NULL::bigint,
  NULL::bigint
FROM user_category_stats
UNION ALL
SELECT 
  'public_stats_summary' as table_name,
  COUNT(*) as record_count,
  total_quizzes_played,
  total_questions_attempted
FROM public_stats_summary WHERE id = 'global';

-- Step 4: Show populated user stats
SELECT '=== Sample user stats (first user) ===' as step;
SELECT 
  user_id,
  total_quizzes_played,
  total_questions_attempted,
  total_correct_answers,
  perfect_scores,
  ROUND(average_score::numeric, 2) as average_score,
  current_question_streak,
  best_question_streak,
  current_quiz_streak,
  best_quiz_streak,
  last_completed_at
FROM user_stats_summary
ORDER BY total_quizzes_played DESC
LIMIT 5;

-- Step 5: Show category stats
SELECT '=== Sample category stats ===' as step;
SELECT 
  user_id,
  category_name,
  correct_answers,
  total_questions,
  quizzes_count,
  ROUND(percentage::numeric, 2) as percentage
FROM user_category_stats
ORDER BY percentage DESC
LIMIT 10;

