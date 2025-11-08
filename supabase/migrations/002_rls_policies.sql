-- Enable Row Level Security
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_stats ENABLE ROW LEVEL SECURITY;

-- Quiz sessions policies
CREATE POLICY "Users can view their own sessions" ON quiz_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" ON quiz_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON quiz_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Teachers can view sessions for their classes
CREATE POLICY "Teachers can view class sessions" ON quiz_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classes c
      JOIN user_organisation uo ON c.organisation_id = uo.organisation_id
      WHERE c.id = quiz_sessions.class_id
        AND uo.user_id = auth.uid()
        AND uo.role IN ('teacher', 'admin')
    )
  );

-- Teachers can create sessions for their classes
CREATE POLICY "Teachers can create class sessions" ON quiz_sessions
  FOR INSERT WITH CHECK (
    class_id IS NULL OR EXISTS (
      SELECT 1 FROM classes c
      JOIN user_organisation uo ON c.organisation_id = uo.organisation_id
      WHERE c.id = class_id
        AND uo.user_id = auth.uid()
        AND uo.role IN ('teacher', 'admin')
    )
  );

-- Quiz scores policies
CREATE POLICY "Users can view scores for their sessions" ON quiz_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiz_sessions qs
      WHERE qs.id = quiz_scores.session_id
        AND (qs.user_id = auth.uid() OR EXISTS (
          SELECT 1 FROM classes c
          JOIN user_organisation uo ON c.organisation_id = uo.organisation_id
          WHERE c.id = qs.class_id
            AND uo.user_id = auth.uid()
            AND uo.role IN ('teacher', 'admin')
        ))
    )
  );

CREATE POLICY "Users can create scores for their sessions" ON quiz_scores
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quiz_sessions qs
      WHERE qs.id = quiz_scores.session_id
        AND (qs.user_id = auth.uid() OR EXISTS (
          SELECT 1 FROM classes c
          JOIN user_organisation uo ON c.organisation_id = uo.organisation_id
          WHERE c.id = qs.class_id
            AND uo.user_id = auth.uid()
            AND uo.role IN ('teacher', 'admin')
        ))
    )
  );

-- Answer stats policies (public read, write only via RPC)
CREATE POLICY "Anyone can view answer stats" ON answer_stats
  FOR SELECT USING (true);

-- No direct insert/update on answer_stats - only via bump_answer_stats RPC
