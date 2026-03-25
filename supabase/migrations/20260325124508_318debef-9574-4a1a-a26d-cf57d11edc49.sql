ALTER TABLE academy_quizzes ADD COLUMN tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE academy_exercises ADD COLUMN tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE academy_practices ADD COLUMN tags text[] NOT NULL DEFAULT '{}';