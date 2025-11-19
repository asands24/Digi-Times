-- Backfill created_by on story_archives and drop legacy user_id column

alter table if exists public.story_archives
  add column if not exists created_by uuid references profiles(id) on delete cascade;

update public.story_archives
set created_by = coalesce(created_by, user_id)
where (created_by is null or created_by = '')
  and user_id is not null;

alter table public.story_archives
  alter column created_by set not null;

drop index if exists idx_story_archives_user_id;
create index if not exists idx_story_archives_created_by
  on public.story_archives (created_by);

alter table public.story_archives
  drop column if exists user_id;
