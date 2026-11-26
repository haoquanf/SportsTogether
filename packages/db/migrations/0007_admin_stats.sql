-- 0007: simple analytics for the owner.
--  * profiles.is_admin marks who may see /admin (members can't set it themselves).
--  * click_events stores one row per click on a link or button (no personal data).
--  * admin_stats() returns sign-up and click counts, only to admins.
-- Safe to run more than once.

alter table public.profiles add column if not exists is_admin boolean not null default false;

create or replace function public.protect_profile_fields() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.role := old.role;
    new.is_coach := old.is_coach;
    new.plan := old.plan;
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

create table if not exists public.click_events (
  id bigserial primary key,
  name text not null check (char_length(name) between 1 and 80),
  path text not null default '/' check (char_length(path) <= 200),
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists click_events_created_at on public.click_events (created_at);

alter table public.click_events enable row level security;
drop policy if exists "anyone can record a click" on public.click_events;
create policy "anyone can record a click" on public.click_events for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());
-- No select policy: only admin_stats() can read clicks.
grant insert on public.click_events to anon, authenticated;
grant usage on sequence public.click_events_id_seq to anon, authenticated;

create or replace function public.admin_stats(days int default 30) returns json
language plpgsql stable security definer set search_path = public as $$
declare
  tz constant text := 'America/New_York';
  since timestamptz := now() - make_interval(days => greatest(1, least(days, 365)));
  result json;
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  select json_build_object(
    'users_total', (select count(*) from auth.users),
    'users_7d', (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'users_period', (select count(*) from auth.users where created_at > since),
    'profiles_completed', (select count(*) from profiles where onboarded),
    'signups_by_day', coalesce((
      select json_agg(json_build_object('day', d, 'n', n) order by d)
      from (select (created_at at time zone tz)::date d, count(*) n from auth.users
            where created_at > since group by 1) s), '[]'::json),
    'clicks_total', (select count(*) from click_events),
    'clicks_period', (select count(*) from click_events where created_at > since),
    'clicks_by_day', coalesce((
      select json_agg(json_build_object('day', d, 'n', n) order by d)
      from (select (created_at at time zone tz)::date d, count(*) n from click_events
            where created_at > since group by 1) s), '[]'::json),
    'top_clicks', coalesce((
      select json_agg(json_build_object('name', name, 'n', n) order by n desc)
      from (select name, count(*) n from click_events where created_at > since
            group by name order by 2 desc limit 15) s), '[]'::json),
    'top_pages', coalesce((
      select json_agg(json_build_object('path', path, 'n', n) order by n desc)
      from (select path, count(*) n from click_events where created_at > since
            group by path order by 2 desc limit 10) s), '[]'::json)
  ) into result;
  return result;
end;
$$;
revoke all on function public.admin_stats(int) from public;
grant execute on function public.admin_stats(int) to authenticated;
