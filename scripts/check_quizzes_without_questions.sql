-- Check which quizzes have no questions
-- This helps identify quizzes that need questions added

SELECT 
    q.id,
    q.slug,
    q.title,
    q.status,
    q."quizType",
    COUNT(DISTINCT r.id) as round_count,
    COUNT(DISTINCT qrq.id) as question_count
FROM quizzes q
LEFT JOIN rounds r ON r."quizId" = q.id
LEFT JOIN quiz_round_questions qrq ON qrq."roundId" = r.id
GROUP BY q.id, q.slug, q.title, q.status, q."quizType"
HAVING COUNT(DISTINCT qrq.id) = 0
ORDER BY q."createdAt" DESC;







