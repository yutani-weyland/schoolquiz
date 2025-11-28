-- Seed Achievements Table
-- Run this script to populate the achievements table with all available achievements
-- For PostgreSQL with Prisma (cuid() IDs)
-- 
-- Usage:
--   psql $DATABASE_URL -f scripts/seed_achievements.sql
--   Or run via Supabase SQL Editor
--
-- Note: Generating cuid-like IDs using a simple function
-- Prisma's cuid() format: 'cl' + base36 timestamp + base36 random

-- Function to generate unique IDs compatible with Prisma
-- Using cuid-like format: 'cl' prefix + random string
CREATE OR REPLACE FUNCTION generate_cuid() RETURNS TEXT AS $$
BEGIN
  -- Generate cuid-like ID: 'cl' + random hex string (22 chars total)
  RETURN 'cl' || LOWER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', '') || REPLACE(gen_random_uuid()::TEXT, '-', '') FROM 1 FOR 20));
END;
$$ LANGUAGE plpgsql;

-- Optional: Clear existing achievements (uncomment if needed)
-- TRUNCATE TABLE achievements CASCADE;

-- Create a function to generate cuid-like IDs (if needed)
-- Or use gen_random_uuid()::text and let Prisma handle it
-- For simplicity, we'll let the database generate IDs by omitting them or using a function

-- Common Achievements (Free + Premium)
INSERT INTO achievements (id, slug, name, "shortDescription", "longDescription", category, rarity, "isPremiumOnly", "iconKey", "unlockConditionType", "unlockConditionConfig", "isActive", "createdAt", "updatedAt")
VALUES
  (generate_cuid(), 'hail-caesar', 'HAIL, CAESAR!', 'Get 5/5 in a History round', 'Achieve a perfect score in a round focused on historical topics', 'performance', 'common', false, '/achievements/hail-caesar.png', 'score_5_of_5', '{"category":"history","requiredScore":5}', true, NOW(), NOW()),
  (generate_cuid(), 'addicted', 'Addicted', 'Play 3 quizzes in a single day', 'Complete three quizzes within 24 hours', 'engagement', 'common', false, 'addicted', 'play_n_quizzes', '{"count":3,"timeWindow":"day"}', true, NOW(), NOW()),
  (generate_cuid(), 'time-traveller', 'Time Traveller', 'Complete a quiz from 3+ weeks ago', 'Revisit and complete a quiz that was originally published at least 3 weeks earlier', 'engagement', 'common', false, 'time-traveller', 'time_window', '{"weeksAgo":3}', true, NOW(), NOW()),
  (generate_cuid(), 'deja-vu', 'Déjà Vu', 'Complete the same quiz twice', 'Play and complete a quiz you have already completed before', 'engagement', 'common', false, 'deja-vu', 'repeat_quiz', '{"minCompletions":2}', true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Uncommon Achievements (Free + Premium)
INSERT INTO achievements (id, slug, name, "shortDescription", "longDescription", category, rarity, "isPremiumOnly", "iconKey", "unlockConditionType", "unlockConditionConfig", "isActive", "createdAt", "updatedAt")
VALUES
  (generate_cuid(), 'blitzkrieg', 'Blitzkrieg!', 'Get 5/5 in a History round under 2 minutes', 'Complete a history-themed round perfectly in less than 2 minutes - lightning fast!', 'performance', 'uncommon', false, '/achievements/blitzkreig.png', 'time_limit', '{"category":"history","maxSeconds":120,"requiredScore":5}', true, NOW(), NOW()),
  (generate_cuid(), 'doppelganger', 'Doppelganger', 'Get the same score 2 weeks in a row', 'Achieve the exact same score in consecutive weeks - a true doppelganger performance!', 'performance', 'rare', false, '/achievements/doppelganger.png', 'same_score_consecutive_weeks', '{"weeks":2}', true, NOW(), NOW()),
  (generate_cuid(), 'clutch', 'Clutch', 'Get the last question correct to beat the average', 'Get the final question right after previous mistakes, putting your score above the average public score for that round', 'performance', 'uncommon', false, 'clutch', 'clutch_play', '{"lastQuestionCorrect":true,"aboveAverage":true}', true, NOW(), NOW()),
  (generate_cuid(), 'routine-genius', 'Routine Genius', 'Play for 4 consecutive weeks', 'Maintain a weekly quiz playing streak for 4 weeks', 'engagement', 'uncommon', false, 'routine-genius', 'streak', '{"weeks":4}', true, NOW(), NOW()),
  (generate_cuid(), 'hat-trick', 'Hat Trick', 'Win 3 sports rounds', 'Achieve perfect scores in three different sports-themed rounds', 'performance', 'uncommon', false, 'hat-trick', 'score_5_of_5', '{"category":"sports","count":3}', true, NOW(), NOW()),
  (generate_cuid(), 'quiz-enthusiast', 'Quiz Enthusiast', 'Play 25 quizzes', 'Complete 25 quizzes to show your dedication to learning', 'engagement', 'uncommon', false, 'quiz-enthusiast', 'play_n_quizzes_total', '{"count":25}', true, NOW(), NOW()),
  (generate_cuid(), 'perfectionist', 'Perfectionist', 'Get 5 perfect scores', 'Achieve perfect scores on 5 different quizzes', 'performance', 'uncommon', false, 'perfectionist', 'perfect_scores_total', '{"count":5,"minQuestions":5}', true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Rare Achievements (Some Premium Only)
INSERT INTO achievements (id, slug, name, "shortDescription", "longDescription", category, rarity, "isPremiumOnly", "iconKey", "unlockConditionType", "unlockConditionConfig", "seasonTag", "isActive", "createdAt", "updatedAt")
VALUES
  (generate_cuid(), 'ace', 'Ace', 'Get 5/5 in a sports-themed round', 'Perfect score in a round focused on sports knowledge', 'performance', 'rare', true, 'ace', 'score_5_of_5', '{"category":"sports","requiredScore":5}', NULL, true, NOW(), NOW()),
  (generate_cuid(), 'olympiad', 'Olympiad', 'Get 5/5 in an Olympics round', 'Perfect score in a special Olympics-themed quiz round', 'event', 'rare', true, 'olympiad', 'score_5_of_5', '{"seasonTag":"olympics-2026","requiredScore":5}', 'olympics-2026', true, NOW(), NOW()),
  (generate_cuid(), 'torchbearer', 'Torchbearer', 'Play in a special Olympic event week', 'Participate in a quiz during a special Olympics event period', 'event', 'rare', true, 'torchbearer', 'event_round', '{"eventTag":"olympics-2026"}', 'olympics-2026', true, NOW(), NOW()),
  (generate_cuid(), 'quiz-master-50', 'Quiz Master', 'Play 50 quizzes', 'Complete 50 quizzes to demonstrate your commitment to learning', 'engagement', 'rare', false, 'quiz-master', 'play_n_quizzes_total', '{"count":50}', NULL, true, NOW(), NOW()),
  (generate_cuid(), 'perfect-ten', 'Perfect Ten', 'Get 10 perfect scores', 'Achieve perfect scores on 10 different quizzes', 'performance', 'rare', false, 'perfect-ten', 'perfect_scores_total', '{"count":10,"minQuestions":5}', NULL, true, NOW(), NOW()),
  (generate_cuid(), 'all-rounder', 'All Rounder', 'Get a perfect score in 4 or more round types', 'Achieve a perfect score in 4 or more different round types', 'performance', 'epic', false, 'all-rounder', 'perfect_score_multiple_categories', '{"minCategories":4,"requiredScore":5}', NULL, true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Epic Achievements (Some Premium Only, Seasonal)
INSERT INTO achievements (id, slug, name, "shortDescription", "longDescription", category, rarity, "isPremiumOnly", "iconKey", "unlockConditionType", "unlockConditionConfig", "seasonTag", "isActive", "createdAt", "updatedAt")
VALUES
  (generate_cuid(), 'term-1-champion', 'Term 1 Champion', 'Complete all quizzes in Term 1', 'Play and complete every quiz published during Term 1 of the school year', 'engagement', 'epic', true, 'term-champion', 'season_completion', '{"term":1,"season":"2025"}', '2025-term-1', true, NOW(), NOW()),
  (generate_cuid(), 'all-rounder-2025', '2025 All-Rounder', 'Play at least once every term in 2025', 'Maintain engagement across all four terms of the 2025 school year', 'engagement', 'epic', true, 'all-rounder', 'season_engagement', '{"season":"2025","minPerTerm":1}', '2025', true, NOW(), NOW()),
  (generate_cuid(), 'quiz-veteran', 'Quiz Veteran', 'Play 100 quizzes', 'Complete 100 quizzes - a true testament to your dedication', 'engagement', 'epic', false, 'quiz-veteran', 'play_n_quizzes_total', '{"count":100}', NULL, true, NOW(), NOW()),
  (generate_cuid(), 'flawless-victory', 'Flawless Victory', 'Get 25 perfect scores', 'Achieve perfect scores on 25 different quizzes', 'performance', 'epic', false, 'flawless-victory', 'perfect_scores_total', '{"count":25,"minQuestions":5}', NULL, true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Legendary Achievements (Some Premium Only)
INSERT INTO achievements (id, slug, name, "shortDescription", "longDescription", category, rarity, "isPremiumOnly", "iconKey", "unlockConditionType", "unlockConditionConfig", "seasonTag", "isActive", "createdAt", "updatedAt")
VALUES
  (generate_cuid(), 'iron-quizzer-2025', '2025 Iron Quizzer', 'Maintain a streak through Term 4', 'Keep your weekly quiz streak alive throughout the entire fourth term', 'engagement', 'legendary', true, 'iron-quizzer', 'streak', '{"term":4,"season":"2025","consecutiveWeeks":10}', '2025-term-4', true, NOW(), NOW()),
  (generate_cuid(), 'perfect-year', 'Perfect Year', 'Complete every quiz in a full school year', 'Play and complete every single quiz published during an entire school year', 'engagement', 'legendary', true, 'perfect-year', 'full_season_completion', '{"allQuizzes":true}', NULL, true, NOW(), NOW()),
  (generate_cuid(), 'quiz-legend', 'Quiz Legend', 'Play 250 quizzes', 'Complete 250 quizzes - join the ranks of the true quiz legends', 'engagement', 'legendary', false, 'quiz-legend', 'play_n_quizzes_total', '{"count":250}', NULL, true, NOW(), NOW()),
  (generate_cuid(), 'perfect-master', 'Perfect Master', 'Get 50 perfect scores', 'Achieve perfect scores on 50 different quizzes - the ultimate display of mastery', 'performance', 'legendary', false, 'perfect-master', 'perfect_scores_total', '{"count":50,"minQuestions":5}', NULL, true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Verify the insertions
SELECT COUNT(*) as total_achievements, 
       COUNT(*) FILTER (WHERE rarity = 'common') as common,
       COUNT(*) FILTER (WHERE rarity = 'uncommon') as uncommon,
       COUNT(*) FILTER (WHERE rarity = 'rare') as rare,
       COUNT(*) FILTER (WHERE rarity = 'epic') as epic,
       COUNT(*) FILTER (WHERE rarity = 'legendary') as legendary
FROM achievements
WHERE "isActive" = true;

-- Expected result: 21 total achievements
-- Common: 4, Uncommon: 7, Rare: 6, Epic: 4, Legendary: 4

-- Clean up the function (optional - comment out if you want to keep it)
DROP FUNCTION IF EXISTS generate_cuid();
