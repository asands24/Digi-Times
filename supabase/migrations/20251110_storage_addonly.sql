do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'photos_public_read'
  ) then
    execute $policy$
      create policy "photos_public_read"
      on storage.objects for select to public
      using (bucket_id = 'photos');
    $policy$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'photos_anon_insert'
  ) then
    execute $policy$
      create policy "photos_anon_insert"
      on storage.objects for insert to anon
      with check (bucket_id = 'photos');
    $policy$;
  end if;
end
$$;
