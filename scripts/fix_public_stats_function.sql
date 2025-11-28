-- Quick fix for update_public_stats_summary function
-- This fixes the column name reference issue

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

SELECT 'update_public_stats_summary function fixed!' as status;

