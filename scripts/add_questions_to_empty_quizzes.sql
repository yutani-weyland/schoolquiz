-- SQL script to add sample questions to ALL quizzes that have no questions
-- This script automatically finds and uses the first available category and teacher
-- Just run this script - no manual editing required!

DO $$
DECLARE
    v_category_id TEXT;
    v_teacher_id TEXT;
    v_quiz RECORD;
    v_round_id TEXT;
    v_question_id TEXT;
    v_qrq_id TEXT;
    v_round_index INT;
    v_question_order INT;
    v_round_count INT;
    v_questions_added INT;
    v_round_record RECORD;
    v_is_finale BOOLEAN;
    v_questions_per_round INT;
BEGIN
    -- Automatically find first available category (try subcategory first, then top-level)
    SELECT id INTO v_category_id
    FROM categories
    WHERE "parentId" IS NOT NULL
    ORDER BY id
    LIMIT 1;
    
    -- If no subcategory found, try top-level category
    IF v_category_id IS NULL THEN
        SELECT id INTO v_category_id
        FROM categories
        WHERE "parentId" IS NULL
        ORDER BY id
        LIMIT 1;
    END IF;
    
    -- If still no category found, raise error
    IF v_category_id IS NULL THEN
        RAISE EXCEPTION 'No category found. Please create at least one category first.';
    END IF;
    
    RAISE NOTICE 'Using category ID: %', v_category_id;
    
    -- Automatically find first available teacher
    SELECT id INTO v_teacher_id
    FROM teachers
    ORDER BY id
    LIMIT 1;
    
    IF v_teacher_id IS NULL THEN
        RAISE EXCEPTION 'No teacher found. Please create at least one teacher first.';
    END IF;
    
    RAISE NOTICE 'Using teacher ID: %', v_teacher_id;
    RAISE NOTICE '';
    
    -- Process each quiz without questions
    FOR v_quiz IN 
        SELECT 
            q.id, 
            q.slug, 
            q.title, 
            COUNT(DISTINCT r.id) as round_count
        FROM quizzes q
        LEFT JOIN rounds r ON r."quizId" = q.id
        LEFT JOIN quiz_round_questions qrq ON qrq."roundId" = r.id
        GROUP BY q.id, q.slug, q.title
        HAVING COUNT(DISTINCT qrq.id) = 0
        ORDER BY q."createdAt" DESC
    LOOP
        RAISE NOTICE 'Processing quiz: % (%)', v_quiz.title, v_quiz.slug;
        
        v_round_count := v_quiz.round_count;
        v_questions_added := 0;

        -- If quiz has rounds but no questions, add questions to existing rounds
        IF v_round_count > 0 THEN
            RAISE NOTICE '  Found % existing round(s), adding questions...', v_round_count;
            
            -- Loop through existing rounds
            FOR v_round_record IN 
                SELECT id, index, "isPeoplesRound"
                FROM rounds
                WHERE "quizId" = v_quiz.id
                ORDER BY index
            LOOP
                v_round_id := v_round_record.id;
                v_is_finale := v_round_record."isPeoplesRound" OR (v_round_record.index = 4);
                v_questions_per_round := CASE WHEN v_is_finale THEN 1 ELSE 6 END;
                
                -- Add questions to this round
                FOR v_question_order IN 0..(v_questions_per_round - 1) LOOP
                    -- Generate CUID-like ID for question
                    v_question_id := 'c' || to_char(extract(epoch from now())::bigint, 'FM999999999999999999') || 
                                    substr(md5(random()::text || v_quiz.id || v_round_record.index::text || v_question_order::text), 1, 9);
                    
                    -- Create question (use ON CONFLICT to handle duplicates)
                    INSERT INTO questions (
                        id, "categoryId", text, answer, difficulty, status, "createdBy", 
                        "isCustom", "isPeopleQuestion", "createdAt", "updatedAt"
                    )
                    VALUES (
                        v_question_id,
                        v_category_id,
                        format('Sample question %s.%s for %s', v_round_record.index + 1, v_question_order + 1, v_quiz.title),
                        format('Sample answer %s.%s', v_round_record.index + 1, v_question_order + 1),
                        0.5,
                        'published',
                        v_teacher_id,
                        false,
                        v_is_finale,
                        NOW(),
                        NOW()
                    )
                    ON CONFLICT (id) DO NOTHING;
                    
                    -- Generate CUID-like ID for quiz_round_question link
                    v_qrq_id := 'c' || to_char(extract(epoch from now())::bigint, 'FM999999999999999999') || 
                               substr(md5(random()::text || v_quiz.id || v_round_id || v_question_order::text), 1, 9);
                    
                    -- Link question to round
                    INSERT INTO quiz_round_questions (id, "roundId", "questionId", "order")
                    VALUES (
                        v_qrq_id,
                        v_round_id,
                        v_question_id,
                        v_question_order
                    )
                    ON CONFLICT (id) DO NOTHING;
                    
                    v_questions_added := v_questions_added + 1;
                END LOOP;
            END LOOP;
            
            RAISE NOTICE '  ✅ Added % questions to existing rounds', v_questions_added;
        ELSE
            -- Create 4 standard rounds with 6 questions each
            RAISE NOTICE '  Creating 4 standard rounds with 6 questions each...';
            
            FOR v_round_index IN 0..3 LOOP
                -- Generate CUID-like ID for round
                v_round_id := 'c' || to_char(extract(epoch from now())::bigint, 'FM999999999999999999') || 
                              substr(md5(random()::text || v_quiz.id || v_round_index::text), 1, 9);
                
                INSERT INTO rounds (id, "quizId", index, "categoryId", title, "isPeoplesRound")
                VALUES (
                    v_round_id,
                    v_quiz.id,
                    v_round_index,
                    v_category_id,
                    format('Round %s', v_round_index + 1),
                    false
                )
                ON CONFLICT (id) DO NOTHING;
                
                -- Create 6 questions for this round
                FOR v_question_order IN 0..5 LOOP
                    -- Generate CUID-like ID for question
                    v_question_id := 'c' || to_char(extract(epoch from now())::bigint, 'FM999999999999999999') || 
                                    substr(md5(random()::text || v_quiz.id || v_round_index::text || v_question_order::text), 1, 9);
                    
                    INSERT INTO questions (
                        id, "categoryId", text, answer, difficulty, status, "createdBy", 
                        "isCustom", "isPeopleQuestion", "createdAt", "updatedAt"
                    )
                    VALUES (
                        v_question_id,
                        v_category_id,
                        format('Sample question %s.%s for %s', v_round_index + 1, v_question_order + 1, v_quiz.title),
                        format('Sample answer %s.%s', v_round_index + 1, v_question_order + 1),
                        0.5,
                        'published',
                        v_teacher_id,
                        false,
                        false,
                        NOW(),
                        NOW()
                    )
                    ON CONFLICT (id) DO NOTHING;
                    
                    -- Generate CUID-like ID for quiz_round_question link
                    v_qrq_id := 'c' || to_char(extract(epoch from now())::bigint, 'FM999999999999999999') || 
                               substr(md5(random()::text || v_quiz.id || v_round_id || v_question_order::text), 1, 9);
                    
                    INSERT INTO quiz_round_questions (id, "roundId", "questionId", "order")
                    VALUES (
                        v_qrq_id,
                        v_round_id,
                        v_question_id,
                        v_question_order
                    )
                    ON CONFLICT (id) DO NOTHING;
                    
                    v_questions_added := v_questions_added + 1;
                END LOOP;
            END LOOP;
            
            -- Create finale round with 1 question
            v_round_id := 'c' || to_char(extract(epoch from now())::bigint, 'FM999999999999999999') || 
                          substr(md5(random()::text || v_quiz.id || '4'), 1, 9);
            
            INSERT INTO rounds (id, "quizId", index, "categoryId", title, "isPeoplesRound")
            VALUES (
                v_round_id,
                v_quiz.id,
                4,
                v_category_id,
                'Finale',
                true
            )
            ON CONFLICT (id) DO NOTHING;
            
            -- Create finale question
            v_question_id := 'c' || to_char(extract(epoch from now())::bigint, 'FM999999999999999999') || 
                            substr(md5(random()::text || v_quiz.id || 'finale'), 1, 9);
            
            INSERT INTO questions (
                id, "categoryId", text, answer, difficulty, status, "createdBy", 
                "isCustom", "isPeopleQuestion", "createdAt", "updatedAt"
            )
            VALUES (
                v_question_id,
                v_category_id,
                format('Sample finale question for %s', v_quiz.title),
                'Sample finale answer',
                0.5,
                'published',
                v_teacher_id,
                false,
                true,
                NOW(),
                NOW()
            )
            ON CONFLICT (id) DO NOTHING;
            
            v_qrq_id := 'c' || to_char(extract(epoch from now())::bigint, 'FM999999999999999999') || 
                       substr(md5(random()::text || v_quiz.id || v_round_id || 'finale'), 1, 9);
            
            INSERT INTO quiz_round_questions (id, "roundId", "questionId", "order")
            VALUES (
                v_qrq_id,
                v_round_id,
                v_question_id,
                0
            )
            ON CONFLICT (id) DO NOTHING;
            
            v_questions_added := v_questions_added + 1;
            RAISE NOTICE '  ✅ Created 5 rounds with % questions total', v_questions_added;
        END IF;
        
        RAISE NOTICE '';
    END LOOP;
    
    RAISE NOTICE '🎉 Finished processing all quizzes!';
END $$;
