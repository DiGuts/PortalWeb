-- Quiz in-progress persistence (resume on reload)
CREATE TABLE IF NOT EXISTS `quiz_progress` (
  `user_id`              INT      NOT NULL,
  `quiz_id`              INT      NOT NULL,
  `current_question_idx` INT      NOT NULL DEFAULT 0,
  `answers_json`         LONGTEXT NOT NULL,
  `updated_at`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `quiz_id`),
  KEY `idx_quiz_progress_user` (`user_id`),
  KEY `idx_quiz_progress_quiz` (`quiz_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
