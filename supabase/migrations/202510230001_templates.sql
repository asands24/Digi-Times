-- Templates table and policies

create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  html text not null,
  css text default '',
  is_system boolean default false,
  owner uuid references auth.users(id) on delete cascade,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

alter table templates
  add column if not exists owner uuid references auth.users(id) on delete cascade;

alter table templates enable row level security;

drop policy if exists "read system templates" on templates;
create policy "read system templates"
  on templates for select
  using (is_system = true);

drop policy if exists "read own templates" on templates;
create policy "read own templates"
  on templates for select
  using (owner = auth.uid());

drop policy if exists "create own templates" on templates;
create policy "create own templates"
  on templates for insert
  with check (owner = auth.uid() and coalesce(is_system, false) = false);

drop policy if exists "update own templates" on templates;
create policy "update own templates"
  on templates for update
  using (owner = auth.uid() and coalesce(is_system, false) = false);

drop policy if exists "delete own templates" on templates;
create policy "delete own templates"
  on templates for delete
  using (owner = auth.uid() and coalesce(is_system, false) = false);

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_templates_updated_at on templates;
create trigger trg_templates_updated_at
before update on templates
for each row execute procedure update_updated_at_column();

alter publication supabase_realtime add table templates;

alter table story_archives
  add column if not exists template_id uuid references templates(id) on delete set null;

create index if not exists idx_story_archives_template_id
  on story_archives (template_id);
