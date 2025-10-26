-- Create database tables for The School Quiz
-- Run this in your Supabase SQL Editor

-- Schools table
CREATE TABLE schools (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    region TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teachers table
CREATE TABLE teachers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'teacher',
    school_id TEXT REFERENCES schools(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE questions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    text TEXT NOT NULL,
    answer TEXT NOT NULL,
    difficulty DECIMAL(3,2) DEFAULT 0.5,
    explanation TEXT,
    tags TEXT,
    category_id TEXT REFERENCES categories(id),
    created_by TEXT REFERENCES teachers(id),
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quizzes table
CREATE TABLE quizzes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft',
    created_by TEXT REFERENCES teachers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rounds table
CREATE TABLE rounds (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    quiz_id TEXT REFERENCES quizzes(id),
    category_id TEXT REFERENCES categories(id),
    round_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz Round Questions table
CREATE TABLE quiz_round_questions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    quiz_id TEXT REFERENCES quizzes(id),
    round_id TEXT REFERENCES rounds(id),
    question_id TEXT REFERENCES questions(id),
    question_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Runs table (quiz executions)
CREATE TABLE runs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    quiz_id TEXT REFERENCES quizzes(id),
    school_id TEXT REFERENCES schools(id),
    teacher_id TEXT REFERENCES teachers(id),
    status TEXT DEFAULT 'in_progress',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Run Question Stats table
CREATE TABLE run_question_stats (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    run_id TEXT REFERENCES runs(id),
    question_id TEXT REFERENCES questions(id),
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data
INSERT INTO schools (id, name, region) VALUES 
('school-1', 'Melbourne High School', 'Victoria'),
('school-2', 'Sydney Grammar School', 'NSW');

INSERT INTO teachers (id, email, name, school_id) VALUES 
('teacher-1', 'john.smith@melbournehigh.vic.edu.au', 'John Smith', 'school-1'),
('teacher-2', 'sarah.jones@sydneygrammar.nsw.edu.au', 'Sarah Jones', 'school-2');

INSERT INTO categories (id, name, description) VALUES 
('cat-1', 'Science & Nature', 'Questions about science, nature, and the natural world'),
('cat-2', 'History & Geography', 'Questions about historical events and geographical locations'),
('cat-3', 'Pop Culture', 'Questions about movies, music, TV shows, and celebrities'),
('cat-4', 'Sports', 'Questions about various sports and athletes'),
('cat-5', 'Current Affairs', 'Questions about recent news and current events');

INSERT INTO questions (id, text, answer, difficulty, category_id, created_by, status) VALUES 
('q-1', 'What is the chemical symbol for gold?', 'Au', 0.6, 'cat-1', 'teacher-1', 'published'),
('q-2', 'Which country is known as the "Land of the Rising Sun"?', 'Japan', 0.5, 'cat-2', 'teacher-1', 'published'),
('q-3', 'What streaming service created "Stranger Things"?', 'Netflix', 0.4, 'cat-3', 'teacher-2', 'published'),
('q-4', 'Who won the FIFA World Cup in 2022?', 'Argentina', 0.7, 'cat-4', 'teacher-1', 'published'),
('q-5', 'What is the capital of Australia?', 'Canberra', 0.5, 'cat-2', 'teacher-2', 'published');

INSERT INTO quizzes (id, title, description, created_by, status) VALUES 
('quiz-1', 'Weekly Quiz #1', 'First weekly quiz for high school students', 'teacher-1', 'published'),
('quiz-2', 'Science Focus Quiz', 'Quiz focused on science and nature questions', 'teacher-2', 'draft');

-- Enable Row Level Security (RLS)
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_round_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE run_question_stats ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - you can restrict later)
CREATE POLICY "Allow all operations" ON schools FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON teachers FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON questions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON quizzes FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON rounds FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON quiz_round_questions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON runs FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON run_question_stats FOR ALL USING (true);

