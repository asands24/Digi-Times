-- Apply before deploying the multi-photo client. Existing image_path stays valid.
-- Metadata inherits story_archives RLS; no grants or policies are relaxed.
begin;
alter table public.story_archives add column if not exists images jsonb not null default '[]'::jsonb;
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.story_archives'::regclass and conname = 'story_images_array') then
    alter table public.story_archives add constraint story_images_array check (jsonb_typeof(images) = 'array' and jsonb_array_length(images) <= 20) not valid;
  end if;
end $$;
create or replace function public.validate_story_images() returns trigger language plpgsql set search_path = public as $$
declare photo jsonb;
begin
  for photo in select value from jsonb_array_elements(new.images) loop
    if jsonb_typeof(photo) <> 'object' or jsonb_typeof(photo->'path') is distinct from 'string' or
       photo->>'path' not like 'stories/' || new.created_by::text || '/%' or
       photo->>'path' like '%..%' then
      raise exception 'Invalid story photo reference';
    end if;
  end loop;
  return new;
end; $$;
drop trigger if exists validate_story_images on public.story_archives;
create trigger validate_story_images before insert or update of images, created_by on public.story_archives for each row execute function public.validate_story_images();
alter table public.story_archives validate constraint story_images_array;
notify pgrst, 'reload schema';
commit;
