-- Migration: Seed 12 official test quizzes
-- This replaces hardcoded quiz data with database records

-- First, ensure we have a default school and teacher for official quizzes
DO $$
DECLARE
  default_school_id TEXT;
  default_teacher_id TEXT;
BEGIN
  -- Get or create default school
  SELECT id INTO default_school_id
  FROM schools
  WHERE name = 'SchoolQuiz Official'
  LIMIT 1;

  IF default_school_id IS NULL THEN
    INSERT INTO schools (id, name, region, "createdAt")
    VALUES ('school_official_seed', 'SchoolQuiz Official', 'NSW', NOW())
    RETURNING id INTO default_school_id;
  END IF;

  -- Get or create default teacher
  SELECT id INTO default_teacher_id
  FROM teachers
  WHERE email = 'official@schoolquiz.com'
  LIMIT 1;

  IF default_teacher_id IS NULL THEN
    INSERT INTO teachers (id, "schoolId", email, name, role, "createdAt", "updatedAt")
    VALUES ('teacher_official_seed', default_school_id, 'official@schoolquiz.com', 'Official Quiz Creator', 'admin', NOW(), NOW())
    RETURNING id INTO default_teacher_id;
  END IF;

  -- Helper function to upsert a quiz (insert or update)
  -- We'll use INSERT ... WHERE NOT EXISTS followed by UPDATE for idempotency

  -- Quiz 12
  INSERT INTO quizzes (id, slug, "weekISO", title, blurb, status, "colorHex", "createdBy", "quizType", "createdAt", "updatedAt")
  SELECT 'quiz_seed_12', '12', '2024-01-15', 
    'Shape Up, Pumpkins, Famous First Words, Crazes, and Next In Sequence.',
    'A weekly selection mixing patterns, pop culture and logic.',
    'published', '#5EEAD4', default_teacher_id, 'OFFICIAL', NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM quizzes WHERE slug = '12');
  
  UPDATE quizzes SET title = 'Shape Up, Pumpkins, Famous First Words, Crazes, and Next In Sequence.',
    blurb = 'A weekly selection mixing patterns, pop culture and logic.',
    "weekISO" = '2024-01-15', status = 'published', "colorHex" = '#5EEAD4', "updatedAt" = NOW()
  WHERE slug = '12';

  -- Quiz 11
  INSERT INTO quizzes (id, slug, "weekISO", title, blurb, status, "colorHex", "createdBy", "quizType", "createdAt", "updatedAt")
  SELECT 'quiz_seed_11', '11', '2024-01-08',
    'Opposite Day, Lights, Common Ground, Robots Etc, and First Ladies.',
    'Wordplay meets trivia.', 'published', '#9B7EDE', default_teacher_id, 'OFFICIAL', NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM quizzes WHERE slug = '11');
  
  UPDATE quizzes SET title = 'Opposite Day, Lights, Common Ground, Robots Etc, and First Ladies.',
    blurb = 'Wordplay meets trivia.', "weekISO" = '2024-01-08', status = 'published', "colorHex" = '#9B7EDE', "updatedAt" = NOW()
  WHERE slug = '11';

  -- Quiz 10
  INSERT INTO quizzes (id, slug, "weekISO", title, blurb, status, "colorHex", "createdBy", "quizType", "createdAt", "updatedAt")
  SELECT 'quiz_seed_10', '10', '2024-01-01',
    'Back to the Past, Name That Nation, Name the Other, Analog Games, and What Does It Stand For?',
    'History, geography and acronyms.', 'published', '#FF6347', default_teacher_id, 'OFFICIAL', NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM quizzes WHERE slug = '10');
  
  UPDATE quizzes SET title = 'Back to the Past, Name That Nation, Name the Other, Analog Games, and What Does It Stand For?',
    blurb = 'History, geography and acronyms.', "weekISO" = '2024-01-01', status = 'published', "colorHex" = '#FF6347', "updatedAt" = NOW()
  WHERE slug = '10';

  -- Quiz 9
  INSERT INTO quizzes (id, slug, "weekISO", title, blurb, status, "colorHex", "createdBy", "quizType", "createdAt", "updatedAt")
  SELECT 'quiz_seed_9', '9', '2023-12-25',
    'Holiday Trivia, Winter Sports, Year End Review, and Festive Fun.',
    'Seasonal mixed bag.', 'published', '#FFD700', default_teacher_id, 'OFFICIAL', NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM quizzes WHERE slug = '9');
  
  UPDATE quizzes SET title = 'Holiday Trivia, Winter Sports, Year End Review, and Festive Fun.',
    blurb = 'Seasonal mixed bag.', "weekISO" = '2023-12-25', status = 'published', "colorHex" = '#FFD700', "updatedAt" = NOW()
  WHERE slug = '9';

  -- Quiz 8
  INSERT INTO quizzes (id, slug, "weekISO", title, blurb, status, "colorHex", "createdBy", "quizType", "createdAt", "updatedAt")
  SELECT 'quiz_seed_8', '8', '2023-12-18',
    'Movie Magic, Tech Trends, Sports Moments, and Pop Culture.',
    'Headlines and highlights.', 'published', '#00CED1', default_teacher_id, 'OFFICIAL', NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM quizzes WHERE slug = '8');
  
  UPDATE quizzes SET title = 'Movie Magic, Tech Trends, Sports Moments, and Pop Culture.',
    blurb = 'Headlines and highlights.', "weekISO" = '2023-12-18', status = 'published', "colorHex" = '#00CED1', "updatedAt" = NOW()
  WHERE slug = '8';

  -- Quiz 7
  INSERT INTO quizzes (id, slug, "weekISO", title, blurb, status, "colorHex", "createdBy", "quizType", "createdAt", "updatedAt")
  SELECT 'quiz_seed_7', '7', '2023-12-11',
    'World Wonders, Historical Events, Science Facts, and Geography.',
    'Curiosities around the world.', 'published', '#FF6B9D', default_teacher_id, 'OFFICIAL', NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM quizzes WHERE slug = '7');
  
  UPDATE quizzes SET title = 'World Wonders, Historical Events, Science Facts, and Geography.',
    blurb = 'Curiosities around the world.', "weekISO" = '2023-12-11', status = 'published', "colorHex" = '#FF6B9D', "updatedAt" = NOW()
  WHERE slug = '7';

  -- Quiz 6
  INSERT INTO quizzes (id, slug, "weekISO", title, blurb, status, "colorHex", "createdBy", "quizType", "createdAt", "updatedAt")
  SELECT 'quiz_seed_6', '6', '2023-12-04',
    'Literature Classics, Music Legends, Art Movements, and Cultural Icons.',
    'Explore the arts and humanities.', 'published', '#4ADE80', default_teacher_id, 'OFFICIAL', NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM quizzes WHERE slug = '6');
  
  UPDATE quizzes SET title = 'Literature Classics, Music Legends, Art Movements, and Cultural Icons.',
    blurb = 'Explore the arts and humanities.', "weekISO" = '2023-12-04', status = 'published', "colorHex" = '#4ADE80', "updatedAt" = NOW()
  WHERE slug = '6';

  -- Quiz 5
  INSERT INTO quizzes (id, slug, "weekISO", title, blurb, status, "colorHex", "createdBy", "quizType", "createdAt", "updatedAt")
  SELECT 'quiz_seed_5', '5', '2023-11-27',
    'Space Exploration, Ocean Depths, Animal Kingdom, and Natural Phenomena.',
    'Discover the wonders of nature.', 'published', '#FDE047', default_teacher_id, 'OFFICIAL', NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM quizzes WHERE slug = '5');
  
  UPDATE quizzes SET title = 'Space Exploration, Ocean Depths, Animal Kingdom, and Natural Phenomena.',
    blurb = 'Discover the wonders of nature.', "weekISO" = '2023-11-27', status = 'published', "colorHex" = '#FDE047', "updatedAt" = NOW()
  WHERE slug = '5';

  -- Quiz 4
  INSERT INTO quizzes (id, slug, "weekISO", title, blurb, status, "colorHex", "createdBy", "quizType", "createdAt", "updatedAt")
  SELECT 'quiz_seed_4', '4', '2023-11-20',
    'Food & Drink, Cooking Techniques, World Cuisines, and Culinary History.',
    'A feast for the mind.', 'published', '#60A5FA', default_teacher_id, 'OFFICIAL', NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM quizzes WHERE slug = '4');
  
  UPDATE quizzes SET title = 'Food & Drink, Cooking Techniques, World Cuisines, and Culinary History.',
    blurb = 'A feast for the mind.', "weekISO" = '2023-11-20', status = 'published', "colorHex" = '#60A5FA', "updatedAt" = NOW()
  WHERE slug = '4';

  -- Quiz 3
  INSERT INTO quizzes (id, slug, "weekISO", title, blurb, status, "colorHex", "createdBy", "quizType", "createdAt", "updatedAt")
  SELECT 'quiz_seed_3', '3', '2023-11-13',
    'Sports Legends, Olympic Moments, World Records, and Athletic Achievements.',
    'Celebrate sporting excellence.', 'published', '#FF8C69', default_teacher_id, 'OFFICIAL', NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM quizzes WHERE slug = '3');
  
  UPDATE quizzes SET title = 'Sports Legends, Olympic Moments, World Records, and Athletic Achievements.',
    blurb = 'Celebrate sporting excellence.', "weekISO" = '2023-11-13', status = 'published', "colorHex" = '#FF8C69', "updatedAt" = NOW()
  WHERE slug = '3';

  -- Quiz 2
  INSERT INTO quizzes (id, slug, "weekISO", title, blurb, status, "colorHex", "createdBy", "quizType", "createdAt", "updatedAt")
  SELECT 'quiz_seed_2', '2', '2023-11-06',
    'Mathematics Puzzles, Logic Problems, Number Patterns, and Brain Teasers.',
    'Exercise your logical mind.', 'published', '#8B5CF6', default_teacher_id, 'OFFICIAL', NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM quizzes WHERE slug = '2');
  
  UPDATE quizzes SET title = 'Mathematics Puzzles, Logic Problems, Number Patterns, and Brain Teasers.',
    blurb = 'Exercise your logical mind.', "weekISO" = '2023-11-06', status = 'published', "colorHex" = '#8B5CF6', "updatedAt" = NOW()
  WHERE slug = '2';

  -- Quiz 1
  INSERT INTO quizzes (id, slug, "weekISO", title, blurb, status, "colorHex", "createdBy", "quizType", "createdAt", "updatedAt")
  SELECT 'quiz_seed_1', '1', '2023-10-30',
    'Famous Inventions, Scientific Discoveries, Medical Breakthroughs, and Innovation.',
    'Celebrate human ingenuity.', 'published', '#4FD1C7', default_teacher_id, 'OFFICIAL', NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM quizzes WHERE slug = '1');
  
  UPDATE quizzes SET title = 'Famous Inventions, Scientific Discoveries, Medical Breakthroughs, and Innovation.',
    blurb = 'Celebrate human ingenuity.', "weekISO" = '2023-10-30', status = 'published', "colorHex" = '#4FD1C7', "updatedAt" = NOW()
  WHERE slug = '1';

END $$;
