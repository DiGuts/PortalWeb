-- Add mandatory flag to quizzes (internal formacions)
ALTER TABLE quizzes
  ADD COLUMN IF NOT EXISTS mandatory TINYINT(1) NOT NULL DEFAULT 0 AFTER passing_score;
