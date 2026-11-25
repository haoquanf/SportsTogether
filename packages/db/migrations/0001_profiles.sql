-- Phase 1: user profiles.
-- Run in the Supabase SQL editor (or `supabase db push`).

create extension if not exists postgis;

create type skill_level as enum ('beginner', 'improver', 'intermediate', 'advanced');

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar_url   text,
  city         text,
  home_location geography(point, 4326),
  sports       text[] not null default '{badminton}',
  skill_level  skill_level not null default 'beginner',
  birth_year   int check (birth_year between 1900 and 2100),
  video_consent_at timestamptz,
  role         text not null default 'member' check (role in ('member', 'site_admin')),
  onboarded    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Anyone signed in can see basic profiles (needed for "who is going" lists).
create policy "profiles are readable by signed-in users"
  on public.profiles for select to authenticated using (true);

-- Members can only change their own profile, and cannot promote themselves.
create policy "members update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select p.role from public.profiles p where p.id = auth.uid()));

-- Create an empty profile automatically when someone signs up.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Lets a member delete their own account (requirement F1).
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
