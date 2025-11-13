do $$
declare
  pol text;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and (policyname ilike '%group%' or policyname ilike '%member%')
  loop
    execute format('drop policy if exists %I on storage.objects;', pol);
  end loop;
end$$;

drop policy if exists "photos_public_read" on storage.objects;
drop policy if exists "photos_anon_insert" on storage.objects;
drop policy if exists "photos_no_update_delete_for_anon" on storage.objects;
drop policy if exists "photos_no_delete_for_anon" on storage.objects;

create policy "photos_public_read"
on storage.objects
for select
to public
using (bucket_id = 'photos');

create policy "photos_anon_insert"
on storage.objects
for insert
to anon
with check (bucket_id = 'photos');

create policy "photos_no_update_delete_for_anon"
on storage.objects
for update
to anon
using (false)
with check (false);

create policy "photos_no_delete_for_anon"
on storage.objects
for delete
to anon
using (false);

select pg_notify('pgrst', 'reload schema');
