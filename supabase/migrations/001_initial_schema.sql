-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create quizzes table
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  week_of DATE NOT NULL,
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  blurb TEXT NOT NULL,
  accent_color TEXT NOT NULL,
  round_number INTEGER NOT NULL CHECK (round_number >= 1 AND round_number <= 5),
  type TEXT NOT NULL DEFAULT 'standard' CHECK (type IN ('standard', 'quick-fire', 'people')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(quiz_id, round_number)
);

-- Create questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  answer TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, "order")
);

-- Create organisations table
CREATE TABLE organisations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_organisation table
CREATE TABLE user_organisation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organisation_id)
);

-- Create classes table
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quiz_sessions table
CREATE TABLE quiz_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('individual', 'class')),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (mode = 'individual' AND user_id IS NOT NULL AND class_id IS NULL) OR
    (mode = 'class' AND class_id IS NOT NULL)
  )
);

-- Create quiz_scores table
CREATE TABLE quiz_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0),
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create answer_stats table
CREATE TABLE answer_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  correct_attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(quiz_id, question_id)
);

-- Create view for answer statistics percentage
CREATE VIEW answer_stats_pct AS
SELECT 
  quiz_id,
  question_id,
  CASE 
    WHEN total_attempts = 0 THEN 0
    ELSE ROUND((correct_attempts::DECIMAL / total_attempts) * 100, 1)
  END as percentage_correct
FROM answer_stats;

-- Create function to bump answer statistics
CREATE OR REPLACE FUNCTION bump_answer_stats(
  p_quiz_id UUID,
  p_question_id UUID,
  p_is_correct BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO answer_stats (quiz_id, question_id, total_attempts, correct_attempts)
  VALUES (p_quiz_id, p_question_id, 1, CASE WHEN p_is_correct THEN 1 ELSE 0 END)
  ON CONFLICT (quiz_id, question_id)
  DO UPDATE SET
    total_attempts = answer_stats.total_attempts + 1,
    correct_attempts = answer_stats.correct_attempts + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    updated_at = NOW();
END;
$$;

-- Create function to publish due quizzes
CREATE OR REPLACE FUNCTION publish_due_quizzes()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update quizzes that should be published (Monday 07:00 Australia/Sydney)
  UPDATE quizzes 
  SET published_at = NOW()
  WHERE published_at IS NULL 
    AND week_of <= CURRENT_DATE
    AND archived_at IS NULL;
END;
$$;

-- Create trigger to enforce 5x5 structure on publish
CREATE OR REPLACE FUNCTION enforce_five_by_five()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  standard_categories INTEGER;
  finale_categories INTEGER;
  standard_questions INTEGER;
  finale_questions INTEGER;
BEGIN
  -- Count standard rounds (1-4) and people's question finale (round 5)
  SELECT 
    COALESCE(SUM(CASE WHEN round_number BETWEEN 1 AND 4 THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN round_number = 5 THEN 1 ELSE 0 END), 0)
  INTO standard_categories, finale_categories
  FROM categories 
  WHERE quiz_id = NEW.id;
  
  -- Count questions in standard rounds and finale
  SELECT 
    COALESCE(SUM(CASE WHEN c.round_number BETWEEN 1 AND 4 THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN c.round_number = 5 THEN 1 ELSE 0 END), 0)
  INTO standard_questions, finale_questions
  FROM questions q
  JOIN categories c ON q.category_id = c.id
  WHERE c.quiz_id = NEW.id;
  
  -- Enforce structure: 4 standard rounds, 1 finale
  IF standard_categories != 4 THEN
    RAISE EXCEPTION 'Quiz must have exactly 4 standard rounds, found %', standard_categories;
  END IF;
  
  IF finale_categories != 1 THEN
    RAISE EXCEPTION 'Quiz must include exactly 1 people''s question finale, found %', finale_categories;
  END IF;
  
  -- Enforce question totals: 6 each across 4 rounds + 1 finale
  IF standard_questions != 24 THEN
    RAISE EXCEPTION 'Standard rounds must contain 24 questions in total (6 per round), found %', standard_questions;
  END IF;
  
  IF finale_questions != 1 THEN
    RAISE EXCEPTION 'People''s question finale must contain exactly 1 question, found %', finale_questions;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_five_by_five_trigger
  BEFORE UPDATE OF published_at ON quizzes
  FOR EACH ROW
  WHEN (NEW.published_at IS NOT NULL AND OLD.published_at IS NULL)
  EXECUTE FUNCTION enforce_five_by_five();

-- Create indexes for performance
CREATE INDEX idx_quizzes_published ON quizzes(published_at) WHERE published_at IS NOT NULL;
CREATE INDEX idx_quizzes_week_of ON quizzes(week_of);
CREATE INDEX idx_categories_quiz_id ON categories(quiz_id);
CREATE INDEX idx_questions_category_id ON questions(category_id);
CREATE INDEX idx_quiz_sessions_quiz_id ON quiz_sessions(quiz_id);
CREATE INDEX idx_quiz_sessions_user_id ON quiz_sessions(user_id);
CREATE INDEX idx_quiz_sessions_class_id ON quiz_sessions(class_id);
CREATE INDEX idx_answer_stats_quiz_id ON answer_stats(quiz_id);
CREATE INDEX idx_answer_stats_question_id ON answer_stats(question_id);
