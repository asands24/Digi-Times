create or replace view public.templates_public as
select
  id,
  slug,
  coalesce(title, 'Untitled') as title,
  null::text as description,
  html,
  css,
  is_system,
  owner,
  created_at
from public.templates;

alter view public.templates_public owner to postgres;
alter table public.templates_public enable row level security;

drop policy if exists "templates_public_view_system_read" on public.templates_public;
create policy "templates_public_view_system_read"
on public.templates_public
for select
to public
using (is_system = true);

select pg_notify('pgrst', 'reload schema');
