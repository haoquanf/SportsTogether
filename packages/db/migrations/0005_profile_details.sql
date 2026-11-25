-- Richer profiles: photo, bio, playing details, availability, privacy, coach badge, plan.
-- Run after 0003 (it uses the group tables).

alter table public.profiles
  add column if not exists bio          text not null default '' check (char_length(bio) <= 500),
  add column if not exists home_area    text not null default '',
  add column if not exists handedness   text check (handedness in ('right', 'left')),
  add column if not exists play_format  text not null default 'any' check (play_format in ('singles', 'doubles', 'mixed', 'any')),
  add column if not exists availability text[] not null default '{}',
  add column if not exists show_profile_to text not null default 'members' check (show_profile_to in ('members', 'groups')),
  add column if not exists is_coach     boolean not null default false,  -- set by a site admin only
  add column if not exists plan         text not null default 'free' check (plan in ('free', 'premium'));  -- set by payments only

-- Members can't give themselves admin, coach or Premium status.
create or replace function public.protect_profile_fields() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.role := old.role;
    new.is_coach := old.is_coach;
    new.plan := old.plan;
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- Privacy: a profile set to "groups" is only visible to people who share a group.
create or replace function public.shares_group_with(other uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from group_members a join group_members b on a.group_id = b.group_id
    where a.user_id = auth.uid() and b.user_id = other and a.status = 'active' and b.status = 'active'
  );
$$;
grant execute on function public.shares_group_with(uuid) to authenticated;

drop policy if exists "profiles are readable by signed-in users" on public.profiles;
drop policy if exists "profiles readable per privacy setting" on public.profiles;
create policy "profiles readable per privacy setting" on public.profiles for select to authenticated
  using (id = auth.uid() or show_profile_to = 'members' or public.shares_group_with(id));

-- Profile photos: public bucket, each member writes only inside their own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "avatar upload own folder" on storage.objects;
create policy "avatar upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatar update own folder" on storage.objects;
create policy "avatar update own folder" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatar delete own folder" on storage.objects;
create policy "avatar delete own folder" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
