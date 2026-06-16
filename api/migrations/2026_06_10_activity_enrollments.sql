-- Migration: activity_enrollments
-- Tracks individual user enrolments for activities (confirmed / waitlist / cancelled).
-- Run manually: mysql -u dev_app -p <dbname> < api/migrations/2026_06_10_activity_enrollments.sql

CREATE TABLE IF NOT EXISTS `activity_enrollments` (
  `id`          INT       NOT NULL AUTO_INCREMENT,
  `activity_id` INT       NOT NULL,
  `user_id`     INT       NOT NULL,
  `enrolled_at` DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status`      ENUM('confirmed','waitlist','cancelled') NOT NULL DEFAULT 'confirmed',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_activity_user` (`activity_id`, `user_id`),
  KEY `idx_activity` (`activity_id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
