-- Migration: fix SECURITY DEFINER view `templates_public`
-- Date: 2026-06-16
--
-- Purpose:
--   The `public.templates_public` view is flagged by Supabase's database linter
--   ("Security Definer View"). A view created without security_invoker runs with
--   the privileges of the view *owner* (typically a superuser/postgres role),
--   which bypasses the Row Level Security policies of the querying user.
--
--   Setting `security_invoker = true` makes the view evaluate underlying table
--   access with the privileges and RLS context of the *caller* instead, so the
--   anon/authenticated user only sees rows their own RLS policies permit.
--
-- Requirements:
--   security_invoker on views requires PostgreSQL 15+ (Supabase projects qualify).
--
-- Notes:
--   The SELECT body of `templates_public` is not stored in this repository (the
--   view was created directly in the database), so this migration only flips the
--   security flag on the existing view rather than re-creating it. If you later
--   move the full view definition into source control, prefer:
--     CREATE OR REPLACE VIEW public.templates_public
--       WITH (security_invoker = true) AS <select ...>;

do $$
begin
  if exists (
    select 1
    from pg_views
    where schemaname = 'public'
      and viewname = 'templates_public'
  ) then
    alter view public.templates_public set (security_invoker = true);
  else
    raise notice 'View public.templates_public does not exist; nothing to alter.';
  end if;
end
$$;
