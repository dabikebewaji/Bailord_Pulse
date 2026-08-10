-- Notification + app preferences were previously local-only React state in
-- Settings.tsx with no backend at all — toggles visually flipped but reset
-- on every reload. These columns give them somewhere real to live.
ALTER TABLE users
  ADD COLUMN notify_email TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN notify_project_updates TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN notify_messages TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN notify_weekly_reports TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN pref_compact_view TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN pref_auto_save TINYINT(1) NOT NULL DEFAULT 1;
