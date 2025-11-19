-- Speed up archive feed queries by supporting
-- created_by filtering + created_at DESC ordering.
create index if not exists idx_story_archives_created_by_created_at_desc
  on public.story_archives (created_by, created_at desc);
