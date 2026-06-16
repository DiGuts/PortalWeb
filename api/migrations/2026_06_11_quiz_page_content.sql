ALTER TABLE quizzes
  ADD COLUMN IF NOT EXISTS page_content LONGTEXT NULL AFTER description,
  ADD COLUMN IF NOT EXISTS page_questions LONGTEXT NULL AFTER page_content;
