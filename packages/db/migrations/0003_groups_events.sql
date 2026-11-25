-- Phase 3: groups, events, RSVPs with waitlist, comments, reports.
-- Run after 0001 and 0002. Safe to run once on a fresh project.

-- ---------- Tables ----------

create table public.groups (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 3 and 80),
  description  text not null default '' check (char_length(description) <= 2000),
  sport        text not null default 'badminton',
  city         text not null,
  area         text not null default '',          -- neighbourhood shown on cards, e.g. "Cambridge"
  lat          double precision not null check (lat between -90 and 90),
  lng          double precision not null check (lng between -180 and 180),
  visibility   text not null default 'public' check (visibility in ('public', 'approval')),
  skill_level  skill_level,                        -- typical level, null = all levels
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

create table public.group_members (
  group_id  uuid not null references public.groups (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  role      text not null default 'member' check (role in ('member', 'admin')),
  status    text not null default 'active' check (status in ('active', 'pending')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index on public.group_members (user_id);

create table public.events (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.groups (id) on delete cascade,
  title        text not null check (char_length(title) between 3 and 100),
  notes        text not null default '' check (char_length(notes) <= 2000),
  venue_name   text not null,
  venue_address text not null default '',
  lat          double precision not null,
  lng          double precision not null,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  timezone     text not null default 'America/New_York',
  capacity     int not null check (capacity between 2 and 200),
  min_skill    skill_level,
  max_skill    skill_level,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index on public.events (group_id, starts_at);
create index on public.events (starts_at);

create table public.rsvps (
  event_id   uuid not null references public.events (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  status     text not null check (status in ('going', 'waitlist')),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
create index on public.rsvps (user_id);

create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups (id) on delete cascade,
  event_id   uuid references public.events (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index on public.comments (group_id, created_at);
create index on public.comments (event_id, created_at);

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  comment_id  uuid references public.comments (id) on delete set null,
  user_id     uuid references public.profiles (id) on delete set null,
  reason      text not null default '',
  created_at  timestamptz not null default now()
);

-- ---------- Helpers ----------

create function public.is_group_admin(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from group_members
    where group_id = gid and user_id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create function public.is_group_member(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from group_members
    where group_id = gid and user_id = auth.uid() and status = 'active'
  );
$$;

-- The creator of a group becomes its admin.
create function public.add_group_creator() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.created_by is not null then
    insert into group_members (group_id, user_id, role, status)
    values (new.id, new.created_by, 'admin', 'active')
    on conflict do nothing;
  end if;
  return new;
end;
$$;
create trigger groups_add_creator after insert on public.groups
  for each row execute function public.add_group_creator();

-- ---------- Actions (called from the app) ----------

-- Join a public group, or ask to join an approval-required one.
create function public.join_group(gid uuid) returns text
language plpgsql security definer set search_path = public as $$
declare v text; s text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select visibility into v from groups where id = gid;
  if v is null then raise exception 'group not found'; end if;
  s := case when v = 'public' then 'active' else 'pending' end;
  insert into group_members (group_id, user_id, role, status)
  values (gid, auth.uid(), 'member', s)
  on conflict (group_id, user_id) do nothing;
  select status into s from group_members where group_id = gid and user_id = auth.uid();
  return s;
end;
$$;

create function public.leave_group(gid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from group_members where group_id = gid and role = 'admin' and status = 'active') = 1
     and public.is_group_admin(gid) then
    raise exception 'You are the only admin. Make someone else an admin before leaving.';
  end if;
  delete from rsvps r using events e
    where r.event_id = e.id and e.group_id = gid and r.user_id = auth.uid() and e.starts_at > now();
  delete from group_members where group_id = gid and user_id = auth.uid();
end;
$$;

create function public.answer_join_request(gid uuid, member uuid, approve boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_group_admin(gid) then raise exception 'only group admins can do this'; end if;
  if approve then
    update group_members set status = 'active', joined_at = now()
      where group_id = gid and user_id = member and status = 'pending';
  else
    delete from group_members where group_id = gid and user_id = member and status = 'pending';
  end if;
end;
$$;

-- RSVP: take a spot if one is free, otherwise join the waitlist.
create function public.rsvp_event(eid uuid) returns text
language plpgsql security definer set search_path = public as $$
declare ev events%rowtype; going int; s text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select * into ev from events where id = eid for update;  -- serialises RSVPs per event
  if not found then raise exception 'event not found'; end if;
  if ev.starts_at < now() then raise exception 'This session has already started.'; end if;
  if not public.is_group_member(ev.group_id) then raise exception 'Join the group to RSVP.'; end if;
  select status into s from rsvps where event_id = eid and user_id = auth.uid();
  if s is not null then return s; end if;
  select count(*) into going from rsvps where event_id = eid and status = 'going';
  s := case when going < ev.capacity then 'going' else 'waitlist' end;
  insert into rsvps (event_id, user_id, status) values (eid, auth.uid(), s);
  return s;
end;
$$;

-- Cancel: if a spot opens, the first person on the waitlist moves up.
create function public.cancel_rsvp(eid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare ev events%rowtype; was text; going int; nxt uuid;
begin
  select * into ev from events where id = eid for update;
  delete from rsvps where event_id = eid and user_id = auth.uid() returning status into was;
  if was = 'going' then
    select count(*) into going from rsvps where event_id = eid and status = 'going';
    if going < ev.capacity then
      select user_id into nxt from rsvps where event_id = eid and status = 'waitlist'
        order by created_at limit 1;
      if nxt is not null then
        update rsvps set status = 'going' where event_id = eid and user_id = nxt;
      end if;
    end if;
  end if;
end;
$$;

-- ---------- Row level security ----------

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.events enable row level security;
alter table public.rsvps enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;

create policy "groups readable" on public.groups for select to authenticated using (true);
create policy "members create groups" on public.groups for insert to authenticated
  with check (created_by = auth.uid());
create policy "admins edit groups" on public.groups for update to authenticated
  using (public.is_group_admin(id)) with check (public.is_group_admin(id));
create policy "admins delete groups" on public.groups for delete to authenticated
  using (public.is_group_admin(id));

create policy "memberships readable" on public.group_members for select to authenticated using (true);

create policy "events readable" on public.events for select to authenticated using (true);
create policy "admins create events" on public.events for insert to authenticated
  with check (public.is_group_admin(group_id) and created_by = auth.uid());
create policy "admins edit events" on public.events for update to authenticated
  using (public.is_group_admin(group_id)) with check (public.is_group_admin(group_id));
create policy "admins delete events" on public.events for delete to authenticated
  using (public.is_group_admin(group_id));

create policy "rsvps readable" on public.rsvps for select to authenticated using (true);

create policy "comments readable" on public.comments for select to authenticated using (true);
create policy "members comment" on public.comments for insert to authenticated
  with check (user_id = auth.uid() and public.is_group_member(group_id));
create policy "authors or admins delete comments" on public.comments for delete to authenticated
  using (user_id = auth.uid() or public.is_group_admin(group_id));

create policy "members report" on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());

-- ---------- Access for the app ----------

grant select, insert, update, delete on public.groups, public.events to authenticated;
grant select on public.group_members, public.rsvps to authenticated;
grant select, insert, delete on public.comments to authenticated;
grant insert on public.reports to authenticated;
grant execute on function public.join_group(uuid), public.leave_group(uuid),
  public.answer_join_request(uuid, uuid, boolean), public.rsvp_event(uuid), public.cancel_rsvp(uuid),
  public.is_group_admin(uuid), public.is_group_member(uuid)
  to authenticated;
