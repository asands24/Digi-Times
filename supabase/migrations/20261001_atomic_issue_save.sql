-- Additive RPC: the issue and ordered memberships commit together, under existing RLS.
-- SECURITY INVOKER preserves the caller's permissions; ownership comes from auth.uid().
create or replace function public.create_issue_with_stories(
  p_title text,
  p_story_ids uuid[],
  p_description text default null,
  p_request_id uuid default null
) returns public.issues
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
  v_issue public.issues;
  v_id uuid := coalesce(p_request_id, gen_random_uuid());
  v_existing_ids uuid[];
begin
  if v_owner is null then
    raise exception 'Sign in to save an issue' using errcode = '42501';
  end if;
  if nullif(btrim(p_title), '') is null or char_length(btrim(p_title)) > 120 then
    raise exception 'Issue title must contain between 1 and 120 characters' using errcode = '22023';
  end if;
  if coalesce(cardinality(p_story_ids), 0) = 0 or cardinality(p_story_ids) > 1000
     or array_position(p_story_ids, null) is not null
     or (select count(distinct id) from unnest(p_story_ids) as selected(id)) <> cardinality(p_story_ids) then
    raise exception 'Select distinct available stories for the issue' using errcode = '22023';
  end if;
  if (select count(*) from public.story_archives where id = any(p_story_ids) and created_by = v_owner) <> cardinality(p_story_ids) then
    raise exception 'An issue can only contain your available stories' using errcode = '42501';
  end if;

  -- Retry the same request safely after a lost response, without a duplicate issue.
  select * into v_issue from public.issues where id = v_id and created_by = v_owner;
  if found then
    select array_agg(story_id order by position) into v_existing_ids from public.issue_stories where issue_id = v_id;
    if v_issue.title = btrim(p_title) and v_issue.description is not distinct from p_description and v_existing_ids = p_story_ids then
      return v_issue;
    end if;
    raise exception 'This save request already exists with different contents' using errcode = '22023';
  end if;

  insert into public.issues(id, title, description, created_by)
  values(v_id, btrim(p_title), p_description, v_owner) returning * into v_issue;
  insert into public.issue_stories(issue_id, story_id, position)
  select v_issue.id, id, (ordinality - 1)::integer from unnest(p_story_ids) with ordinality as selected(id, ordinality);
  return v_issue;
end;
$$;
revoke all on function public.create_issue_with_stories(text, uuid[], text, uuid) from public, anon;
grant execute on function public.create_issue_with_stories(text, uuid[], text, uuid) to authenticated;
notify pgrst, 'reload schema';
