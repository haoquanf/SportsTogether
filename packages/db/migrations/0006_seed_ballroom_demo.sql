-- Demo data: two Boston ballroom groups with practice sessions.
-- The earliest member account (you) becomes admin. Safe to run more than once.

do $$
declare
  owner uuid;
  gid uuid;
  g record;
  base date := (now() at time zone 'America/New_York')::date;
  d date;
  i int;
begin
  select id into owner from public.profiles order by created_at limit 1;
  if owner is null then raise exception 'Sign up on the site first, then run this file.'; end if;
  if exists (select 1 from public.groups where name = 'Boston Social Ballroom') then
    raise notice 'Ballroom demo groups already exist, nothing to do.';
    return;
  end if;

  for g in
    select * from (values
      ('Boston Social Ballroom', 'Relaxed Waltz, Foxtrot and Rumba practice for new and returning dancers. Come with or without a partner; we rotate. The first half hour is the Bronze Waltz basics.',
       'Back Bay', 42.3488, -71.0826, 'beginner'::skill_level, 0, 'Back Bay dance studio', 'beginner'::skill_level, 'improver'::skill_level, 20, 'Waltz and Foxtrot practice'),
      ('Cambridge Bronze Medalists', 'For dancers working on the Bronze American Smooth and Rhythm syllabus, with an eye on closed-syllabus competitions. Ask to join with your level.',
       'Cambridge', 42.3656, -71.1040, 'intermediate'::skill_level, 3, 'Cambridge community ballroom', 'improver'::skill_level, 'advanced'::skill_level, 16, 'Bronze syllabus practice')
    ) as t(name, description, area, lat, lng, skill, dow, venue, min_skill, max_skill, capacity, title)
  loop
    insert into public.groups (name, description, sport, city, area, lat, lng, visibility, skill_level, created_by)
    values (g.name, g.description, 'ballroom', 'Boston, MA', g.area, g.lat, g.lng,
            case when g.dow = 3 then 'approval' else 'public' end, g.skill, owner)
    returning id into gid;

    d := base + ((g.dow - extract(dow from base)::int + 7) % 7);
    if d = base then d := d + 7; end if;
    for i in 0..1 loop
      insert into public.events (group_id, title, notes, venue_name, lat, lng, starts_at, ends_at, timezone,
                                 capacity, min_skill, max_skill, created_by)
      values (gid, g.title, 'Demo session. Smooth-soled shoes recommended. No partner needed.',
              g.venue, g.lat + 0.001, g.lng - 0.001,
              ((d + i * 7) + time '18:30') at time zone 'America/New_York',
              ((d + i * 7) + time '20:30') at time zone 'America/New_York',
              'America/New_York', g.capacity, g.min_skill, g.max_skill, owner);
    end loop;
  end loop;
end;
$$;
