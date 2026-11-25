-- Fix: newer Supabase projects don't give the app access to new tables automatically.
-- Safe to run more than once.

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant usage on type public.skill_level to authenticated;

-- Members may create their own profile row (only as a plain member).
drop policy if exists "members insert own profile" on public.profiles;
create policy "members insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id and role = 'member');

-- Create profiles for anyone who signed up before the profiles table existed.
insert into public.profiles (id, display_name, avatar_url)
select u.id,
       coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', ''),
       u.raw_user_meta_data ->> 'avatar_url'
from auth.users u
on conflict (id) do nothing;
