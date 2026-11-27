-- 0008: members can ask to change their membership plan.
-- Until card payments (Stripe) are connected, a request is recorded here and the
-- owner switches the plan. Requests also show on /admin. Needs 0007 first.
-- Safe to run more than once.

create table if not exists public.plan_requests (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  plan text not null check (plan in ('free', 'premium')),
  billing text check (billing in ('monthly', 'yearly')),
  created_at timestamptz not null default now()
);
alter table public.plan_requests enable row level security;
drop policy if exists "own plan request" on public.plan_requests;
create policy "own plan request" on public.plan_requests for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.plan_requests to authenticated;

-- admin_stats() now also counts plan requests.
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
    'upgrade_requests', (select count(*) from plan_requests where plan = 'premium'),
    'upgrade_requests_yearly', (select count(*) from plan_requests where plan = 'premium' and billing = 'yearly'),
    'downgrade_requests', (select count(*) from plan_requests where plan = 'free'),
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
