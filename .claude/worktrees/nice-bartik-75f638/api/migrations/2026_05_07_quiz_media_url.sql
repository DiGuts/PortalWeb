-- Per-question media URL (image / video) for slide-type questions.
ALTER TABLE quiz_questions
  ADD COLUMN media_url TEXT NULL AFTER position;
