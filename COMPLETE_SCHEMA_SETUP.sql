-- Complete Database Schema Setup for SchoolQuiz
-- Run this in Supabase SQL Editor to create all base tables
-- This must be run BEFORE seeding quizzes

-- ============================================================================
-- Core Tables (must be created first)
-- ============================================================================

-- Schools table
CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'teacher',
  "lastLoginAt" TIMESTAMP,
  FOREIGN KEY ("schoolId") REFERENCES schools(id) ON DELETE CASCADE
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  "parentId" TEXT,
  description TEXT,
  "seasonalTag" TEXT,
  "difficultyMin" DOUBLE PRECISION DEFAULT 0,
  "difficultyMax" DOUBLE PRECISION DEFAULT 1,
  "isActive" BOOLEAN DEFAULT true,
  "usageCount" INTEGER DEFAULT 0,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("parentId") REFERENCES categories(id)
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  "categoryId" TEXT NOT NULL,
  text TEXT NOT NULL,
  answer TEXT NOT NULL,
  explanation TEXT,
  difficulty DOUBLE PRECISION NOT NULL,
  tags TEXT DEFAULT '',
  status TEXT DEFAULT 'draft',
  "createdBy" TEXT NOT NULL,
  "isPeopleQuestion" BOOLEAN DEFAULT false,
  "usageCount" INTEGER DEFAULT 0,
  "lastUsedAt" TIMESTAMP,
  "isUsed" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("categoryId") REFERENCES categories(id),
  FOREIGN KEY ("createdBy") REFERENCES teachers(id)
);

-- Quizzes table (with slug and weekISO)
CREATE TABLE IF NOT EXISTS quizzes (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT,
  slug TEXT UNIQUE,
  "weekISO" TEXT,
  title TEXT NOT NULL,
  blurb TEXT,
  audience TEXT,
  "difficultyBand" TEXT,
  theme TEXT,
  "seasonalTag" TEXT,
  "publicationDate" TIMESTAMP,
  status TEXT DEFAULT 'draft',
  "colorHex" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  "pdfUrl" TEXT,
  "pdfStatus" TEXT,
  FOREIGN KEY ("schoolId") REFERENCES schools(id),
  FOREIGN KEY ("createdBy") REFERENCES teachers(id)
);

-- Rounds table
CREATE TABLE IF NOT EXISTS rounds (
  id TEXT PRIMARY KEY,
  "quizId" TEXT NOT NULL,
  index INTEGER NOT NULL,
  "categoryId" TEXT NOT NULL,
  title TEXT,
  blurb TEXT,
  "targetDifficulty" DOUBLE PRECISION,
  "isPeoplesRound" BOOLEAN DEFAULT false,
  FOREIGN KEY ("quizId") REFERENCES quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY ("categoryId") REFERENCES categories(id),
  UNIQUE("quizId", index)
);

-- Quiz Round Questions (junction table)
CREATE TABLE IF NOT EXISTS quiz_round_questions (
  id TEXT PRIMARY KEY,
  "roundId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  FOREIGN KEY ("roundId") REFERENCES rounds(id) ON DELETE CASCADE,
  FOREIGN KEY ("questionId") REFERENCES questions(id),
  UNIQUE("roundId", "questionId")
);

-- Runs table
CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  "quizId" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "startedAt" TIMESTAMP DEFAULT NOW(),
  "finishedAt" TIMESTAMP,
  "audienceSize" INTEGER DEFAULT 0,
  notes TEXT,
  source TEXT DEFAULT 'projected',
  FOREIGN KEY ("quizId") REFERENCES quizzes(id),
  FOREIGN KEY ("schoolId") REFERENCES schools(id),
  FOREIGN KEY ("teacherId") REFERENCES teachers(id)
);

-- Run Question Stats
CREATE TABLE IF NOT EXISTS run_question_stats (
  id TEXT PRIMARY KEY,
  "runId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "shownOrder" INTEGER NOT NULL,
  correct INTEGER DEFAULT 0,
  incorrect INTEGER DEFAULT 0,
  skipped INTEGER DEFAULT 0,
  "avgSecs" DOUBLE PRECISION,
  FOREIGN KEY ("runId") REFERENCES runs(id) ON DELETE CASCADE,
  FOREIGN KEY ("questionId") REFERENCES questions(id),
  UNIQUE("runId", "questionId")
);

-- ============================================================================
-- User & Organisation Tables (simplified for now)
-- ============================================================================

-- Users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  name TEXT,
  "passwordHash" TEXT,
  "signupCode" TEXT,
  "signupMethod" TEXT DEFAULT 'email',
  "freeTrialStartedAt" TIMESTAMP,
  "freeTrialEndsAt" TIMESTAMP,
  "subscriptionStatus" TEXT DEFAULT 'FREE_TRIAL',
  "subscriptionPlan" TEXT,
  "subscriptionEndsAt" TIMESTAMP,
  tier TEXT DEFAULT 'basic',
  "platformRole" TEXT,
  "referralCode" TEXT UNIQUE,
  "referredBy" TEXT,
  "referralCount" INTEGER DEFAULT 0,
  "freeTrialUntil" TIMESTAMP,
  "emailVerified" BOOLEAN DEFAULT false,
  "emailVerificationToken" TEXT,
  "emailVerificationExpires" TIMESTAMP,
  "phoneVerified" BOOLEAN DEFAULT false,
  "phoneVerificationCode" TEXT,
  "phoneVerificationExpires" TIMESTAMP,
  "profileVisibility" TEXT DEFAULT 'PUBLIC',
  "teamName" TEXT,
  bio TEXT,
  "profileColorScheme" TEXT,
  avatar TEXT,
  "lastLoginAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("referredBy") REFERENCES users(id)
);

-- User Question Submissions
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
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY ("approvedQuestionId") REFERENCES questions(id) ON DELETE SET NULL
);

-- ============================================================================
-- Indexes (create with error handling - will skip if columns don't exist)
-- ============================================================================

-- Quiz indexes
CREATE INDEX IF NOT EXISTS "quizzes_slug_idx" ON quizzes(slug);
CREATE UNIQUE INDEX IF NOT EXISTS "quizzes_slug_key" ON quizzes(slug) WHERE slug IS NOT NULL;

-- Question indexes (wrap in DO block to catch errors gracefully)
DO $$
BEGIN
  BEGIN
    CREATE INDEX IF NOT EXISTS "questions_status_updatedAt_idx" ON questions(status, "updatedAt");
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    CREATE INDEX IF NOT EXISTS "questions_categoryId_idx" ON questions("categoryId");
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    CREATE INDEX IF NOT EXISTS "questions_isUsed_idx" ON questions("isUsed");
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- User Question Submissions indexes
DO $$
BEGIN
  BEGIN
    CREATE INDEX IF NOT EXISTS "user_question_submissions_status_createdAt_idx" 
      ON user_question_submissions(status, "createdAt");
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    CREATE INDEX IF NOT EXISTS "user_question_submissions_userId_idx" 
      ON user_question_submissions("userId");
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- Run indexes
DO $$
BEGIN
  BEGIN
    CREATE INDEX IF NOT EXISTS "runs_schoolId_startedAt_idx" ON runs("schoolId", "startedAt");
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    CREATE INDEX IF NOT EXISTS "run_question_stats_questionId_idx" ON run_question_stats("questionId");
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- Category indexes
DO $$
BEGIN
  BEGIN
    CREATE INDEX IF NOT EXISTS "categories_parentId_idx" ON categories("parentId");
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- User indexes
DO $$
BEGIN
  BEGIN
    CREATE INDEX IF NOT EXISTS "users_email_idx" ON users(email);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    CREATE INDEX IF NOT EXISTS "users_phone_idx" ON users(phone);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    CREATE INDEX IF NOT EXISTS "users_tier_idx" ON users(tier);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Database schema setup complete! All base tables created.';
END $$;

