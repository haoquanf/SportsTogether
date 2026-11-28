-- 0009: real Premium payments with Stripe.
-- One row per member who has ever started checkout. Only the server (with the
-- secret service key, from the Stripe webhook) writes here; members can read their own row.
-- profiles.plan stays the single source the app checks, and is kept in sync by the server.
-- Needs 0007 and 0008 first. Safe to run more than once.

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique not null,
  stripe_subscription_id text unique,
  status text,                       -- Stripe status: active, trialing, past_due, canceled, unpaid, ...
  billing text check (billing in ('monthly', 'yearly')),
  current_period_end timestamptz,     -- next renewal (or end of access if cancelling)
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
drop policy if exists "read own subscription" on public.subscriptions;
create policy "read own subscription" on public.subscriptions for select to authenticated
  using (user_id = auth.uid());
grant select on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;
grant select, update on public.profiles to service_role;
grant select, delete on public.plan_requests to service_role;

-- admin_stats() also reports paying members.
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
    'premium_members', (select count(*) from profiles where plan = 'premium'),
    'paying_monthly', (select count(*) from subscriptions where status in ('active', 'trialing', 'past_due') and billing = 'monthly'),
    'paying_yearly', (select count(*) from subscriptions where status in ('active', 'trialing', 'past_due') and billing = 'yearly'),
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
