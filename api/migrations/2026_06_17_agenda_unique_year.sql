-- Fix UNIQUE KEY to include year so same-title events can exist across different years.
ALTER TABLE agenda_events DROP INDEX IF EXISTS uq_event;
ALTER TABLE agenda_events ADD UNIQUE KEY IF NOT EXISTS uq_event (title, day, month, year);
