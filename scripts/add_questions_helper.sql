-- Helper script to find quizzes without questions and get IDs needed for adding questions
-- Run this first to get the values you need for add_sample_questions_to_quiz.sql

-- 1. Find quizzes without questions
SELECT 
    q.id as quiz_id,
    q.slug,
    q.title,
    q.status,
    q."quizType"
FROM quizzes q
WHERE q.id NOT IN (
    SELECT DISTINCT q2.id
    FROM quizzes q2
    INNER JOIN rounds r ON r."quizId" = q2.id
    INNER JOIN quiz_round_questions qrq ON qrq."roundId" = r.id
)
ORDER BY q."createdAt" DESC
LIMIT 10;

-- 2. Get available categories (pick one for your questions)
SELECT id, name, "parentId" 
FROM categories 
WHERE "parentId" IS NOT NULL -- Use subcategories
LIMIT 10;

-- 3. Get available teachers (pick one)
SELECT id, name, email 
FROM teachers 
LIMIT 5;

-- Example: To add questions to a quiz, use the values from above in add_sample_questions_to_quiz.sql
-- Replace:
--   {QUIZ_ID} with quiz_id from query 1
--   {CATEGORY_ID} with id from query 2
--   {TEACHER_ID} with id from query 3







