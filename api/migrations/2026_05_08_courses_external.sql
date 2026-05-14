-- 2026-05-08: External courses support (url, is_external, departments)
ALTER TABLE `courses` ADD COLUMN IF NOT EXISTS `url`         TEXT    NOT NULL DEFAULT '';
ALTER TABLE `courses` ADD COLUMN IF NOT EXISTS `is_external` TINYINT NOT NULL DEFAULT 0;
ALTER TABLE `courses` ADD COLUMN IF NOT EXISTS `departments` TEXT    NOT NULL DEFAULT '';
