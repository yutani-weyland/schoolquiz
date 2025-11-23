-- Database Indexes for Performance Optimization
-- Run this in Supabase SQL Editor to add indexes on foreign keys and frequently queried columns
-- This script handles both camelCase (Prisma default) and snake_case column names

-- Helper function to create index only if column exists
DO $$
BEGIN
    -- Quiz indexes
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'slug') THEN
        CREATE INDEX IF NOT EXISTS "quizzes_slug_idx" ON "quizzes"("slug");
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS "quizzes_status_idx" ON "quizzes"("status");
    END IF;
    
    -- Handle both camelCase and snake_case for publicationDate
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'publicationDate') THEN
        CREATE INDEX IF NOT EXISTS "quizzes_publicationDate_idx" ON "quizzes"("publicationDate");
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'publication_date') THEN
        CREATE INDEX IF NOT EXISTS "quizzes_publication_date_idx" ON "quizzes"("publication_date");
    END IF;
    
    -- Handle both camelCase and snake_case for createdAt
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'createdAt') THEN
        CREATE INDEX IF NOT EXISTS "quizzes_createdAt_idx" ON "quizzes"("createdAt");
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'created_at') THEN
        CREATE INDEX IF NOT EXISTS "quizzes_created_at_idx" ON "quizzes"("created_at");
    END IF;
    
    -- Handle both camelCase and snake_case for schoolId
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'schoolId') THEN
        CREATE INDEX IF NOT EXISTS "quizzes_schoolId_idx" ON "quizzes"("schoolId");
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'school_id') THEN
        CREATE INDEX IF NOT EXISTS "quizzes_school_id_idx" ON "quizzes"("school_id");
    END IF;
    
    -- Handle both camelCase and snake_case for createdBy
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'createdBy') THEN
        CREATE INDEX IF NOT EXISTS "quizzes_createdBy_idx" ON "quizzes"("createdBy");
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'created_by') THEN
        CREATE INDEX IF NOT EXISTS "quizzes_created_by_idx" ON "quizzes"("created_by");
    END IF;
    
    -- Round indexes - Handle both camelCase and snake_case
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rounds' AND column_name = 'quizId') THEN
        CREATE INDEX IF NOT EXISTS "rounds_quizId_idx" ON "rounds"("quizId");
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rounds' AND column_name = 'quiz_id') THEN
        CREATE INDEX IF NOT EXISTS "rounds_quiz_id_idx" ON "rounds"("quiz_id");
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rounds' AND column_name = 'categoryId') THEN
        CREATE INDEX IF NOT EXISTS "rounds_categoryId_idx" ON "rounds"("categoryId");
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rounds' AND column_name = 'category_id') THEN
        CREATE INDEX IF NOT EXISTS "rounds_category_id_idx" ON "rounds"("category_id");
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rounds' AND column_name = 'index') THEN
        CREATE INDEX IF NOT EXISTS "rounds_index_idx" ON "rounds"("index");
    END IF;
END $$;

-- Question indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'categoryId') THEN
        CREATE INDEX IF NOT EXISTS "questions_categoryId_idx" ON "questions"("categoryId");
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'category_id') THEN
        CREATE INDEX IF NOT EXISTS "questions_category_id_idx" ON "questions"("category_id");
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS "questions_status_idx" ON "questions"("status");
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'createdBy') THEN
        CREATE INDEX IF NOT EXISTS "questions_createdBy_idx" ON "questions"("createdBy");
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'created_by') THEN
        CREATE INDEX IF NOT EXISTS "questions_created_by_idx" ON "questions"("created_by");
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'isUsed') THEN
        CREATE INDEX IF NOT EXISTS "questions_isUsed_idx" ON "questions"("isUsed");
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'is_used') THEN
        CREATE INDEX IF NOT EXISTS "questions_is_used_idx" ON "questions"("is_used");
    END IF;
END $$;

-- QuizRoundQuestion indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_round_questions' AND column_name = 'roundId') THEN
        CREATE INDEX IF NOT EXISTS "quiz_round_questions_roundId_idx" ON "quiz_round_questions"("roundId");
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_round_questions' AND column_name = 'round_id') THEN
        CREATE INDEX IF NOT EXISTS "quiz_round_questions_round_id_idx" ON "quiz_round_questions"("round_id");
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_round_questions' AND column_name = 'questionId') THEN
        CREATE INDEX IF NOT EXISTS "quiz_round_questions_questionId_idx" ON "quiz_round_questions"("questionId");
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_round_questions' AND column_name = 'question_id') THEN
        CREATE INDEX IF NOT EXISTS "quiz_round_questions_question_id_idx" ON "quiz_round_questions"("question_id");
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_round_questions' AND column_name = 'order') THEN
        CREATE INDEX IF NOT EXISTS "quiz_round_questions_order_idx" ON "quiz_round_questions"("order");
    END IF;
END $$;

-- Run indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'runs' AND column_name = 'quizId') THEN
        CREATE INDEX IF NOT EXISTS "runs_quizId_idx" ON "runs"("quizId");
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'runs' AND column_name = 'quiz_id') THEN
        CREATE INDEX IF NOT EXISTS "runs_quiz_id_idx" ON "runs"("quiz_id");
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'runs' AND column_name = 'startedAt') THEN
        CREATE INDEX IF NOT EXISTS "runs_startedAt_idx" ON "runs"("startedAt");
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'runs' AND column_name = 'started_at') THEN
        CREATE INDEX IF NOT EXISTS "runs_started_at_idx" ON "runs"("started_at");
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'runs' AND column_name = 'finishedAt') THEN
        CREATE INDEX IF NOT EXISTS "runs_finishedAt_idx" ON "runs"("finishedAt");
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'runs' AND column_name = 'finished_at') THEN
        CREATE INDEX IF NOT EXISTS "runs_finished_at_idx" ON "runs"("finished_at");
    END IF;
END $$;

-- QuizCompletion indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_completions' AND column_name = 'userId') THEN
        CREATE INDEX IF NOT EXISTS "quiz_completions_userId_idx" ON "quiz_completions"("userId");
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_completions' AND column_name = 'user_id') THEN
        CREATE INDEX IF NOT EXISTS "quiz_completions_user_id_idx" ON "quiz_completions"("user_id");
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_completions' AND column_name = 'quizId') THEN
        CREATE INDEX IF NOT EXISTS "quiz_completions_quizId_idx" ON "quiz_completions"("quizId");
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_completions' AND column_name = 'quiz_id') THEN
        CREATE INDEX IF NOT EXISTS "quiz_completions_quiz_id_idx" ON "quiz_completions"("quiz_id");
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_completions' AND column_name = 'completedAt') THEN
        CREATE INDEX IF NOT EXISTS "quiz_completions_completedAt_idx" ON "quiz_completions"("completedAt");
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_completions' AND column_name = 'completed_at') THEN
        CREATE INDEX IF NOT EXISTS "quiz_completions_completed_at_idx" ON "quiz_completions"("completed_at");
    END IF;
END $$;

-- UserAchievement indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_achievements' AND column_name = 'userId') THEN
        CREATE INDEX IF NOT EXISTS "user_achievements_userId_idx" ON "user_achievements"("userId");
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_achievements' AND column_name = 'user_id') THEN
        CREATE INDEX IF NOT EXISTS "user_achievements_user_id_idx" ON "user_achievements"("user_id");
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_achievements' AND column_name = 'achievementId') THEN
        CREATE INDEX IF NOT EXISTS "user_achievements_achievementId_idx" ON "user_achievements"("achievementId");
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_achievements' AND column_name = 'achievement_id') THEN
        CREATE INDEX IF NOT EXISTS "user_achievements_achievement_id_idx" ON "user_achievements"("achievement_id");
    END IF;
END $$;

-- Teacher indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'schoolId') THEN
        CREATE INDEX IF NOT EXISTS "teachers_schoolId_idx" ON "teachers"("schoolId");
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'school_id') THEN
        CREATE INDEX IF NOT EXISTS "teachers_school_id_idx" ON "teachers"("school_id");
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'email') THEN
        CREATE INDEX IF NOT EXISTS "teachers_email_idx" ON "teachers"("email");
    END IF;
END $$;

-- Category indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'parentId') THEN
        CREATE INDEX IF NOT EXISTS "categories_parentId_idx" ON "categories"("parentId");
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'parent_id') THEN
        CREATE INDEX IF NOT EXISTS "categories_parent_id_idx" ON "categories"("parent_id");
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'isActive') THEN
        CREATE INDEX IF NOT EXISTS "categories_isActive_idx" ON "categories"("isActive");
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'is_active') THEN
        CREATE INDEX IF NOT EXISTS "categories_is_active_idx" ON "categories"("is_active");
    END IF;
END $$;

-- Composite indexes for common query patterns
DO $$
BEGIN
    -- Quizzes status + publicationDate
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'status') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'publicationDate') THEN
            CREATE INDEX IF NOT EXISTS "quizzes_status_publicationDate_idx" ON "quizzes"("status", "publicationDate");
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'publication_date') THEN
            CREATE INDEX IF NOT EXISTS "quizzes_status_publication_date_idx" ON "quizzes"("status", "publication_date");
        END IF;
    END IF;
    
    -- Rounds quizId + index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rounds' AND column_name = 'quizId') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rounds' AND column_name = 'index') THEN
        CREATE INDEX IF NOT EXISTS "rounds_quizId_index_idx" ON "rounds"("quizId", "index");
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rounds' AND column_name = 'quiz_id') AND
          EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rounds' AND column_name = 'index') THEN
        CREATE INDEX IF NOT EXISTS "rounds_quiz_id_index_idx" ON "rounds"("quiz_id", "index");
    END IF;
    
    -- Quiz completions userId + completedAt
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_completions' AND column_name = 'userId') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_completions' AND column_name = 'completedAt') THEN
            CREATE INDEX IF NOT EXISTS "quiz_completions_userId_completedAt_idx" ON "quiz_completions"("userId", "completedAt");
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_completions' AND column_name = 'completed_at') THEN
            CREATE INDEX IF NOT EXISTS "quiz_completions_userId_completed_at_idx" ON "quiz_completions"("userId", "completed_at");
        END IF;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_completions' AND column_name = 'user_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_completions' AND column_name = 'completedAt') THEN
            CREATE INDEX IF NOT EXISTS "quiz_completions_user_id_completedAt_idx" ON "quiz_completions"("user_id", "completedAt");
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_completions' AND column_name = 'completed_at') THEN
            CREATE INDEX IF NOT EXISTS "quiz_completions_user_id_completed_at_idx" ON "quiz_completions"("user_id", "completed_at");
        END IF;
    END IF;
END $$;

