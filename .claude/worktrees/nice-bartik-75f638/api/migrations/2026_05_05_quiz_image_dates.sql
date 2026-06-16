-- Add image, start_at, end_at to quizzes
ALTER TABLE quizzes
  ADD COLUMN image     VARCHAR(500) NULL AFTER description,
  ADD COLUMN start_at  DATETIME     NULL AFTER active,
  ADD COLUMN end_at    DATETIME     NULL AFTER start_at;
