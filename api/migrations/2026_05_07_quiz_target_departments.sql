-- Add per-quiz department targeting. NULL/empty JSON array = visible to everyone.
ALTER TABLE quizzes
  ADD COLUMN target_departments TEXT NULL AFTER end_at;
