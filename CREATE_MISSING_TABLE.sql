-- Create user_question_submissions table if it doesn't exist
-- Run this FIRST in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_question_submissions (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "approvedQuestionId" TEXT UNIQUE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  explanation TEXT,
  category TEXT,
  status TEXT DEFAULT 'PENDING',
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP,
  notes TEXT,
  "teacherName" TEXT,
  "schoolName" TEXT,
  "consentForShoutout" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS "user_question_submissions_status_createdAt_idx" 
  ON user_question_submissions(status, "createdAt");
CREATE INDEX IF NOT EXISTS "user_question_submissions_userId_idx" 
  ON user_question_submissions("userId");

-- Note: Foreign keys will be added in the next step if the referenced tables exist

