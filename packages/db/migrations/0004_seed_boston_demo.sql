-- Demo data for the investor demo: 6 Boston-area badminton groups with upcoming sessions.
-- The earliest member account (you) becomes admin of every demo group.
-- Venue names are generic placeholders; swap in real partner clubs once they agree.
-- Run after 0003. Running it again adds nothing if the demo groups already exist.

do $$
declare
  owner uuid;
  g record;
  gid uuid;
  base date := (now() at time zone 'America/New_York')::date;
  d date;
  i int;
begin
  select id into owner from public.profiles order by created_at limit 1;
  if owner is null then
    raise exception 'Sign up on the site first, then run this file.';
  end if;
  if exists (select 1 from public.groups where name = 'Tuesday Night Doubles') then
    raise notice 'Demo groups already exist, nothing to do.';
    return;
  end if;

  for g in
    select * from (values
      ('Tuesday Night Doubles', 'Friendly doubles every Tuesday and Thursday evening. Rotating partners, shuttles provided. All we ask is good vibes and non-marking shoes.',
       'Cambridge', 42.3736, -71.1097, 'public', 'intermediate'::skill_level, 2, 'Cambridge community gym', 'intermediate'::skill_level, 'advanced'::skill_level, 12),
      ('Brookline Beginners Club', 'New to badminton or coming back after a long break? We start each session with 20 minutes of coached drills, then play relaxed doubles.',
       'Brookline', 42.3318, -71.1212, 'public', 'beginner'::skill_level, 6, 'Brookline recreation centre', 'beginner'::skill_level, 'improver'::skill_level, 10),
      ('Somerville Smashers', 'Competitive singles and doubles for strong club players. Ladder matches every other week. Ask to join and tell us where you have played.',
       'Somerville', 42.3876, -71.0995, 'approval', 'advanced'::skill_level, 3, 'Somerville sports hall', 'intermediate'::skill_level, 'advanced'::skill_level, 8),
      ('Allston Lunchtime Badminton', 'A quick hour of games over lunch for students and people working nearby. Drop in, play, get back to work.',
       'Allston', 42.3539, -71.1337, 'public', null, 1, 'Allston campus gym', null, null, 8),
      ('Quincy Family Badminton', 'Weekend mornings for families and casual players of all ages. Racquets available to borrow.',
       'Quincy', 42.2529, -71.0023, 'public', 'beginner'::skill_level, 6, 'Quincy community centre', null, null, 16),
      ('Back Bay After Work', 'Doubles right after work for improvers and intermediates. Short warm-up, then games to 21.',
       'Back Bay', 42.3503, -71.0810, 'public', 'improver'::skill_level, 3, 'Back Bay fitness club', 'improver'::skill_level, 'intermediate'::skill_level, 8)
    ) as t(name, description, area, lat, lng, visibility, skill, dow, venue, min_skill, max_skill, capacity)
  loop
    insert into public.groups (name, description, sport, city, area, lat, lng, visibility, skill_level, created_by)
    values (g.name, g.description, 'badminton', 'Boston, MA', g.area, g.lat, g.lng, g.visibility, g.skill, owner)
    returning id into gid;

    -- Next two sessions on the group's weekday (0 = Sunday), 7 pm Boston time (10 am on weekends, noon for lunchtime).
    d := base + ((g.dow - extract(dow from base)::int + 7) % 7);
    if d = base then d := d + 7; end if;
    for i in 0..1 loop
      insert into public.events (group_id, title, notes, venue_name, lat, lng, starts_at, ends_at, timezone,
                                 capacity, min_skill, max_skill, created_by)
      values (
        gid,
        case when g.dow = 6 then 'Weekend morning games' when g.dow = 1 then 'Lunchtime games' else 'Evening doubles' end,
        'Demo session. Court fee about $8, shuttles provided.',
        g.venue, g.lat + 0.002, g.lng - 0.002,
        ((d + i * 7) + case when g.dow = 6 then time '10:00' when g.dow = 1 then time '12:00' else time '19:00' end) at time zone 'America/New_York',
        ((d + i * 7) + case when g.dow = 6 then time '12:00' when g.dow = 1 then time '13:00' else time '21:00' end) at time zone 'America/New_York',
        'America/New_York', g.capacity, g.min_skill, g.max_skill, owner
      );
    end loop;
  end loop;
end;
$$;
