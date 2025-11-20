-- Backfill created_by on story_archives and drop legacy user_id column

alter table if exists public.story_archives
  add column if not exists created_by uuid references profiles(id) on delete cascade;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'story_archives'
      AND column_name = 'user_id'
  ) THEN
    UPDATE public.story_archives
    SET created_by = coalesce(
        created_by,
        nullif(user_id::text, '')::uuid
      )
    WHERE (created_by IS NULL OR created_by::text = '')
      AND user_id IS NOT NULL
      AND user_id::text <> '';
  END IF;
END;
$$;

alter table public.story_archives
  alter column created_by set not null;

drop index if exists idx_story_archives_user_id;
create index if not exists idx_story_archives_created_by
  on public.story_archives (created_by);

alter table public.story_archives
  drop column if exists user_id;
