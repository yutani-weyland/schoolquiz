-- Migration: Question Submissions & Attribution
-- Adds support for community-submitted questions with attribution

-- Create question_submissions table for pending submissions
CREATE TABLE question_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submitter_name TEXT NOT NULL,
  submitter_type TEXT NOT NULL CHECK (submitter_type IN ('teacher', 'student')),
  school_name TEXT NOT NULL,
  region TEXT,
  submitted_for_week DATE, -- Which quiz week this is intended for
  question_text TEXT NOT NULL,
  answer TEXT NOT NULL,
  suggested_category_id UUID REFERENCES categories(id), -- Optional: let them suggest category
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published')),
  notes TEXT, -- Internal notes for reviewers
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) -- If authenticated
);

-- Add submission tracking to questions table
ALTER TABLE questions 
ADD COLUMN submission_id UUID REFERENCES question_submissions(id),
ADD COLUMN submitted_by TEXT, -- Display name: "Miss Shannon, Loretto Kiribilli NSW" or "Steve G Year 9"
ADD COLUMN submission_display_style TEXT DEFAULT 'full' CHECK (submission_display_style IN ('full', 'first_name', 'anonymous'));

-- Create indexes
CREATE INDEX idx_question_submissions_status ON question_submissions(status);
CREATE INDEX idx_question_submissions_week ON question_submissions(submitted_for_week);
CREATE INDEX idx_questions_submission_id ON questions(submission_id);

-- Function to update submission status when question is used in a quiz
CREATE OR REPLACE FUNCTION update_submission_on_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- When a quiz is published, mark all associated submissions as 'published'
  IF NEW.published_at IS NOT NULL AND OLD.published_at IS NULL THEN
    UPDATE question_submissions
    SET status = 'published',
        updated_at = NOW()
    WHERE id IN (
      SELECT DISTINCT q.submission_id
      FROM questions q
      JOIN categories c ON q.category_id = c.id
      WHERE c.quiz_id = NEW.id
        AND q.submission_id IS NOT NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-update submissions on quiz publish
CREATE TRIGGER update_submission_status_on_publish
  AFTER UPDATE OF published_at ON quizzes
  FOR EACH ROW
  WHEN (NEW.published_at IS NOT NULL AND OLD.published_at IS NULL)
  EXECUTE FUNCTION update_submission_on_publish();

-- Create view for displaying submission attribution nicely
CREATE VIEW question_attributions AS
SELECT
  q.id AS question_id,
  q.submitted_by AS display_name,
  CASE 
    WHEN q.submission_display_style = 'anonymous' THEN 'submitted by a community member'
    WHEN q.submission_display_style = 'first_name' THEN CONCAT('submitted by ', SPLIT_PART(q.submitted_by, ' ', 1))
    ELSE CONCAT('submitted by ', q.submitted_by)
  END AS attribution_text,
  qs.submitter_type,
  qs.school_name,
  qs.region
FROM questions q
LEFT JOIN question_submissions qs ON q.submission_id = qs.id
WHERE q.submission_id IS NOT NULL;

-- Add helpful comments
COMMENT ON TABLE question_submissions IS 'Community-submitted questions awaiting review';
COMMENT ON COLUMN questions.submission_id IS 'Links question back to original submission';
COMMENT ON COLUMN questions.submitted_by IS 'Display text for attribution (formatted by admin)';
COMMENT ON COLUMN questions.submission_display_style IS 'Controls how attribution is shown to users';






