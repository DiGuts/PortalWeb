-- 2026-05-28: Add missing columns to agenda_events (time_end, target_departments, target_users)
ALTER TABLE `agenda_events`
  ADD COLUMN IF NOT EXISTS `time_end`            VARCHAR(20)  NOT NULL DEFAULT '' AFTER `time`,
  ADD COLUMN IF NOT EXISTS `target_departments`  JSON         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `target_users`        JSON         DEFAULT NULL;
