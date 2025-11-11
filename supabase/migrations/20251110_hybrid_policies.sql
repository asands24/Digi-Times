alter table public.story_archives
  add column if not exists is_public boolean default false;

alter table public.story_archives enable row level security;

drop policy if exists "story_archives_owner_all" on public.story_archives;
create policy "story_archives_owner_all"
on public.story_archives
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "story_archives_public_read" on public.story_archives;
create policy "story_archives_public_read"
on public.story_archives
for select
to public
using (is_public = true);
