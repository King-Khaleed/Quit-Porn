-- Cleanup: drop unused tables from initial schema

-- user_blocklist was part of the removed blocking feature
drop table if exists public.user_blocklist;

-- relapse_logs was never used in the app
drop table if exists public.relapse_logs;

-- Note: journal_entries is kept — it has the right schema for future cloud sync
