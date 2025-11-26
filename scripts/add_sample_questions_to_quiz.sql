-- Add sample questions to a quiz that has no questions
-- 
-- USAGE: Replace the placeholders below:
--   - {QUIZ_ID}: The ID of the quiz to add questions to
--   - {CATEGORY_ID}: A category ID to use for questions (you can get one from: SELECT id, name FROM categories LIMIT 1;)
--   - {TEACHER_ID}: A teacher ID (you can get one from: SELECT id FROM teachers LIMIT 1;)
--
-- This script creates:
--   4 rounds with 6 questions each (24 questions total)
--   Plus 1 finale question (25 questions total)
--
-- You may need to adjust category IDs and teacher IDs based on your database.

-- Step 1: Get a quiz ID that needs questions (uncomment and run separately first)
-- SELECT id, slug, title FROM quizzes WHERE id NOT IN (
--     SELECT DISTINCT q.id
--     FROM quizzes q
--     INNER JOIN rounds r ON r."quizId" = q.id
--     INNER JOIN quiz_round_questions qrq ON qrq."roundId" = r.id
-- ) LIMIT 5;

-- Step 2: Get a category ID (uncomment and run separately first)
-- SELECT id, name FROM categories LIMIT 5;

-- Step 3: Get a teacher ID (uncomment and run separately first)
-- SELECT id FROM teachers LIMIT 1;

-- ============================================
-- MAIN SCRIPT - Replace placeholders below
-- ============================================

-- NOTE: This script uses Prisma's default CUID generation by omitting the 'id' field
-- If your database doesn't support default CUID generation, you'll need to use Prisma Client
-- or a Node.js script instead. See add_questions_via_prisma.ts for an alternative approach.

-- For Supabase/Postgres with Prisma, IDs will be generated automatically via @default(cuid())
-- If you're using raw SQL and CUID generation isn't working, use the Prisma-based script instead.

DO $$
DECLARE
    v_quiz_id TEXT := '{QUIZ_ID}'; -- Replace with actual quiz ID
    v_category_id TEXT := '{CATEGORY_ID}'; -- Replace with actual category ID  
    v_teacher_id TEXT := '{TEACHER_ID}'; -- Replace with actual teacher ID
    v_round_id TEXT;
    v_question_id TEXT;
    v_round_index INT;
    v_question_order INT;
    v_question_text TEXT;
    v_question_answer TEXT;
    v_qrq_id TEXT;
BEGIN
    -- Create 4 standard rounds
    FOR v_round_index IN 0..3 LOOP
        -- Generate CUID-like ID for round (simple version)
        v_round_id := 'c' || to_char(extract(epoch from now())::bigint, 'FM999999999999999999') || 
                      substr(md5(random()::text), 1, 9);
        
        INSERT INTO rounds (id, "quizId", index, "categoryId", title, "isPeoplesRound")
        VALUES (
            v_round_id,
            v_quiz_id,
            v_round_index,
            v_category_id,
            'Round ' || (v_round_index + 1),
            false
        );

        -- Create 6 questions for this round
        FOR v_question_order IN 0..5 LOOP
            -- Generate CUID-like ID for question
            v_question_id := 'c' || to_char(extract(epoch from now())::bigint, 'FM999999999999999999') || 
                            substr(md5(random()::text), 1, 9);
            
            v_question_text := 'Sample question ' || (v_round_index + 1) || '.' || (v_question_order + 1);
            v_question_answer := 'Sample answer ' || (v_round_index + 1) || '.' || (v_question_order + 1);

            -- Create question
            INSERT INTO questions (
                id, "categoryId", text, answer, difficulty, status, "createdBy", "isCustom", "isPeopleQuestion"
            )
            VALUES (
                v_question_id,
                v_category_id,
                v_question_text,
                v_question_answer,
                0.5,
                'published',
                v_teacher_id,
                false,
                false
            );

            -- Generate CUID-like ID for quiz_round_question link
            v_qrq_id := 'c' || to_char(extract(epoch from now())::bigint, 'FM999999999999999999') || 
                       substr(md5(random()::text), 1, 9);

            -- Link question to round
            INSERT INTO quiz_round_questions (id, "roundId", "questionId", "order")
            VALUES (
                v_qrq_id,
                v_round_id,
                v_question_id,
                v_question_order
            );
        END LOOP;
    END LOOP;

    -- Create finale round (People's Question)
    v_round_id := 'c' || to_char(extract(epoch from now())::bigint, 'FM999999999999999999') || 
                  substr(md5(random()::text), 1, 9);
    
    INSERT INTO rounds (id, "quizId", index, "categoryId", title, "isPeoplesRound")
    VALUES (
        v_round_id,
        v_quiz_id,
        4,
        v_category_id,
        'Finale',
        true
    );

    -- Create finale question
    v_question_id := 'c' || to_char(extract(epoch from now())::bigint, 'FM999999999999999999') || 
                    substr(md5(random()::text), 1, 9);
    
    INSERT INTO questions (
        id, "categoryId", text, answer, difficulty, status, "createdBy", "isCustom", "isPeopleQuestion"
    )
    VALUES (
        v_question_id,
        v_category_id,
        'Sample finale question',
        'Sample finale answer',
        0.5,
        'published',
        v_teacher_id,
        false,
        true
    );

    -- Link finale question to round
    v_qrq_id := 'c' || to_char(extract(epoch from now())::bigint, 'FM999999999999999999') || 
               substr(md5(random()::text), 1, 9);

    INSERT INTO quiz_round_questions (id, "roundId", "questionId", "order")
    VALUES (
        v_qrq_id,
        v_round_id,
        v_question_id,
        0
    );

    RAISE NOTICE 'Successfully added 25 questions (4 rounds x 6 questions + 1 finale) to quiz %', v_quiz_id;
END $$;

