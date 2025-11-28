-- Fix stats summary functions to use correct column names
-- Run this to update the functions in your database

-- Fix trigger function
CREATE OR REPLACE FUNCTION trigger_update_user_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update user stats for the affected user
  -- Note: quiz_completions uses camelCase column names ("userId")
  PERFORM update_user_stats_summary(COALESCE(NEW."userId", OLD."userId"));
  
  -- Also update public stats (can be debounced in production)
  PERFORM update_public_stats_summary();
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fix update_user_stats_summary function
CREATE OR REPLACE FUNCTION update_user_stats_summary(p_user_id TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_summary RECORD;
  v_streaks RECORD;
BEGIN
  -- Calculate summary stats
  -- Note: quiz_completions uses camelCase column names
  SELECT 
    COUNT(*)::INTEGER as total_quizzes,
    COALESCE(SUM("totalQuestions"), 0)::INTEGER as total_questions,
    COALESCE(SUM(score), 0)::INTEGER as total_correct,
    COUNT(*) FILTER (WHERE score = "totalQuestions")::INTEGER as perfect_scores,
    CASE 
      WHEN COALESCE(SUM("totalQuestions"), 0) > 0 
      THEN ROUND((COALESCE(SUM(score), 0)::DECIMAL / COALESCE(SUM("totalQuestions"), 1)) * 100, 2)
      ELSE 0
    END as avg_score,
    MAX("completedAt") as last_completed
  INTO v_summary
  FROM quiz_completions
  WHERE "userId" = p_user_id;
  
  -- Calculate streaks (simplified - can be enhanced)
  SELECT 
    COALESCE(MAX(current_streak), 0)::INTEGER as current_q_streak,
    COALESCE(MAX(best_streak), 0)::INTEGER as best_q_streak,
    COALESCE(MAX(current_quiz_streak), 0)::INTEGER as current_quiz_streak,
    COALESCE(MAX(best_quiz_streak), 0)::INTEGER as best_quiz_streak
  INTO v_streaks
  FROM (
    -- This is a simplified streak calculation
    -- For production, you'd want a more sophisticated algorithm
    SELECT 
      0 as current_streak,
      0 as best_streak,
      0 as current_quiz_streak,
      0 as best_quiz_streak
  ) sub;
  
  -- Upsert user stats summary
  INSERT INTO user_stats_summary (
    user_id,
    total_quizzes_played,
    total_questions_attempted,
    total_correct_answers,
    perfect_scores,
    average_score,
    current_question_streak,
    best_question_streak,
    current_quiz_streak,
    best_quiz_streak,
    last_completed_at,
    updated_at
  ) VALUES (
    p_user_id,
    COALESCE(v_summary.total_quizzes, 0),
    COALESCE(v_summary.total_questions, 0),
    COALESCE(v_summary.total_correct, 0),
    COALESCE(v_summary.perfect_scores, 0),
    COALESCE(v_summary.avg_score, 0),
    COALESCE(v_streaks.current_q_streak, 0),
    COALESCE(v_streaks.best_q_streak, 0),
    COALESCE(v_streaks.current_quiz_streak, 0),
    COALESCE(v_streaks.best_quiz_streak, 0),
    v_summary.last_completed,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_quizzes_played = EXCLUDED.total_quizzes_played,
    total_questions_attempted = EXCLUDED.total_questions_attempted,
    total_correct_answers = EXCLUDED.total_correct_answers,
    perfect_scores = EXCLUDED.perfect_scores,
    average_score = EXCLUDED.average_score,
    current_question_streak = EXCLUDED.current_question_streak,
    best_question_streak = EXCLUDED.best_question_streak,
    current_quiz_streak = EXCLUDED.current_quiz_streak,
    best_quiz_streak = EXCLUDED.best_quiz_streak,
    last_completed_at = EXCLUDED.last_completed_at,
    updated_at = NOW();
END;
$$;

-- Fix update_user_category_stats function
CREATE OR REPLACE FUNCTION update_user_category_stats(p_user_id TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete existing stats for this user
  DELETE FROM user_category_stats WHERE user_id = p_user_id;
  
  -- Recalculate category stats from quiz completions and quiz structure
  -- This is a simplified version - in production you'd join with rounds/questions
  INSERT INTO user_category_stats (
    user_id,
    category_id,
    category_name,
    correct_answers,
    total_questions,
    quizzes_count,
    percentage
  )
  SELECT 
    qc."userId" as user_id,
    c.id as category_id,
    c.name as category_name,
    -- Estimate: distribute score evenly across categories
    -- In production, you'd calculate actual category performance
    SUM(qc.score / 5)::INTEGER as correct_answers,
    SUM(qc."totalQuestions" / 5)::INTEGER as total_questions,
    COUNT(DISTINCT qc."quizSlug")::INTEGER as quizzes_count,
    CASE 
      WHEN SUM(qc."totalQuestions" / 5) > 0
      THEN ROUND((SUM(qc.score / 5)::DECIMAL / SUM(qc."totalQuestions" / 5)) * 100, 2)
      ELSE 0
    END as percentage
  FROM quiz_completions qc
  CROSS JOIN LATERAL (
    -- Get first 5 categories (simplified - in production use actual quiz structure)
    SELECT id, name FROM categories LIMIT 5
  ) c
  WHERE qc."userId" = p_user_id
  GROUP BY qc."userId", c.id, c.name;
END;
$$;

-- Fix update_public_stats_summary function
CREATE OR REPLACE FUNCTION update_public_stats_summary()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_stats RECORD;
BEGIN
  SELECT 
    COUNT(DISTINCT "userId")::INTEGER as total_users,
    COUNT(*)::INTEGER as total_quizzes,
    COALESCE(SUM("totalQuestions"), 0)::INTEGER as total_questions,
    COALESCE(SUM(score), 0)::INTEGER as total_correct,
    CASE 
      WHEN COALESCE(SUM("totalQuestions"), 0) > 0 
      THEN ROUND((COALESCE(SUM(score), 0)::DECIMAL / COALESCE(SUM("totalQuestions"), 1)) * 100, 2)
      ELSE 0
    END as avg_score
  INTO v_stats
  FROM quiz_completions;
  
  UPDATE public_stats_summary SET
    total_users = v_stats.total_users,
    total_quizzes_played = v_stats.total_quizzes,
    total_questions_attempted = v_stats.total_questions,
    total_correct_answers = v_stats.total_correct,
    average_score = v_stats.avg_score,
    updated_at = NOW()
  WHERE id = 'global';
END;
$$;

-- Fix populate_all_user_stats function
CREATE OR REPLACE FUNCTION populate_all_user_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id TEXT;
BEGIN
  FOR v_user_id IN SELECT DISTINCT "userId" FROM quiz_completions
  LOOP
    PERFORM update_user_stats_summary(v_user_id);
    PERFORM update_user_category_stats(v_user_id);
  END LOOP;
  
  PERFORM update_public_stats_summary();
END;
$$;

SELECT 'Functions updated successfully!' as status;

