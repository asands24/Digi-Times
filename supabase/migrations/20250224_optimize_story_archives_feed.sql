-- Speed up archive feed queries by supporting
-- user_id filtering + created_at DESC ordering.
create index if not exists idx_story_archives_user_created_at_desc
  on public.story_archives (user_id, created_at desc);
