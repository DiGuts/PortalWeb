-- Add must_change_password flag to users
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `must_change_password` TINYINT NOT NULL DEFAULT 0 AFTER `is_head`;
