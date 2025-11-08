-- Seed demo quiz data
INSERT INTO quizzes (id, title, slug, week_of, published_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Demo Quiz 001', 'demo-001', '2024-01-15', NOW());

-- Insert categories for demo quiz
INSERT INTO categories (id, quiz_id, title, blurb, accent_color, round_number, type) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Australian History', 'Test your knowledge of Australia''s rich historical past', '#F4A261', 1, 'standard'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Science & Technology', 'Explore the wonders of science and modern technology', '#7FB3FF', 2, 'standard'),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Pop Culture', 'From music to movies, test your pop culture knowledge', '#F7A8C0', 3, 'standard'),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'Sport', 'From cricket to AFL, test your sporting knowledge', '#9EE6B4', 4, 'standard'),
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 'Civics & Government', 'Understanding Australia''s political system and civic responsibilities', '#F7D57A', 5, 'standard');

-- Insert questions for Round 1: Australian History
INSERT INTO questions (id, category_id, question_text, answer, points, "order") VALUES
('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', 'In what year did Captain James Cook first land in Australia?', '1770', 1, 1),
('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440001', 'What was the name of the first British settlement in Australia?', 'Sydney Cove', 1, 2),
('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440001', 'Which gold rush began in 1851 and transformed Victoria?', 'The Victorian Gold Rush', 1, 3),
('550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440001', 'What year did Australia become a federation?', '1901', 1, 4),
('550e8400-e29b-41d4-a716-446655440105', '550e8400-e29b-41d4-a716-446655440001', 'Who was Australia''s first Prime Minister?', 'Edmund Barton', 1, 5);

-- Insert questions for Round 2: Science & Technology
INSERT INTO questions (id, category_id, question_text, answer, points, "order") VALUES
('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440002', 'What is the chemical symbol for gold?', 'Au', 1, 1),
('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440002', 'Which planet is known as the Red Planet?', 'Mars', 1, 2),
('550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440002', 'What does DNA stand for?', 'Deoxyribonucleic Acid', 1, 3),
('550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440002', 'What is the speed of light in a vacuum?', '299,792,458 meters per second', 1, 4),
('550e8400-e29b-41d4-a716-446655440205', '550e8400-e29b-41d4-a716-446655440002', 'Which element has the atomic number 1?', 'Hydrogen', 1, 5);

-- Insert questions for Round 3: Pop Culture
INSERT INTO questions (id, category_id, question_text, answer, points, "order") VALUES
('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440003', 'Which Australian band released the album ''Highway to Hell''?', 'AC/DC', 1, 1),
('550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440003', 'What is the highest-grossing Australian film of all time?', 'Crocodile Dundee', 1, 2),
('550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440003', 'Which Australian actor played Wolverine in the X-Men films?', 'Hugh Jackman', 1, 3),
('550e8400-e29b-41d4-a716-446655440304', '550e8400-e29b-41d4-a716-446655440003', 'What is the name of the Australian soap opera that has been running since 1988?', 'Home and Away', 1, 4),
('550e8400-e29b-41d4-a716-446655440305', '550e8400-e29b-41d4-a716-446655440003', 'Which Australian singer is known as the ''Queen of Pop''?', 'Kylie Minogue', 1, 5);

-- Insert questions for Round 4: Sport
INSERT INTO questions (id, category_id, question_text, answer, points, "order") VALUES
('550e8400-e29b-41d4-a716-446655440401', '550e8400-e29b-41d4-a716-446655440004', 'Which sport is played in the Australian Football League (AFL)?', 'Australian Rules Football', 1, 1),
('550e8400-e29b-41d4-a716-446655440402', '550e8400-e29b-41d4-a716-446655440004', 'How many players are on each team in AFL?', '18', 1, 2),
('550e8400-e29b-41d4-a716-446655440403', '550e8400-e29b-41d4-a716-446655440004', 'Which Australian cricketer is known as ''The Don''?', 'Don Bradman', 1, 3),
('550e8400-e29b-41d4-a716-446655440404', '550e8400-e29b-41d4-a716-446655440004', 'What is the name of the annual tennis tournament held in Melbourne?', 'Australian Open', 1, 4),
('550e8400-e29b-41d4-a716-446655440405', '550e8400-e29b-41d4-a716-446655440004', 'Which Australian swimmer won 5 gold medals at the 2008 Beijing Olympics?', 'Stephanie Rice', 1, 5);

-- Insert questions for Round 5: Civics & Government
INSERT INTO questions (id, category_id, question_text, answer, points, "order") VALUES
('550e8400-e29b-41d4-a716-446655440501', '550e8400-e29b-41d4-a716-446655440005', 'What is the capital city of Australia?', 'Canberra', 1, 1),
('550e8400-e29b-41d4-a716-446655440502', '550e8400-e29b-41d4-a716-446655440005', 'How many states are there in Australia?', '6', 1, 2),
('550e8400-e29b-41d4-a716-446655440503', '550e8400-e29b-41d4-a716-446655440005', 'What is the name of Australia''s national anthem?', 'Advance Australia Fair', 1, 3),
('550e8400-e29b-41d4-a716-446655440504', '550e8400-e29b-41d4-a716-446655440005', 'At what age can Australians vote in federal elections?', '18', 1, 4),
('550e8400-e29b-41d4-a716-446655440505', '550e8400-e29b-41d4-a716-446655440005', 'What is the name of Australia''s upper house of parliament?', 'Senate', 1, 5);
