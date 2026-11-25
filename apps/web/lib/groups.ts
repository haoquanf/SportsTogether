import "server-only";
import { createClient } from "./supabase/server";

export type Group = {
  id: string;
  name: string;
  description: string;
  sport: string;
  city: string;
  area: string;
  lat: number;
  lng: number;
  visibility: "public" | "approval";
  skill_level: string | null;
  created_at: string;
};

export type EventRow = {
  id: string;
  group_id: string;
  title: string;
  notes: string;
  venue_name: string;
  venue_address: string;
  lat: number;
  lng: number;
  starts_at: string;
  ends_at: string;
  timezone: string;
  capacity: number;
  min_skill: string | null;
  max_skill: string | null;
};

export type Person = { id: string; display_name: string; avatar_url: string | null; skill_level: string };

const GROUP_COLS = "id, name, description, sport, city, area, lat, lng, visibility, skill_level, created_at";
const EVENT_COLS = "id, group_id, title, notes, venue_name, venue_address, lat, lng, starts_at, ends_at, timezone, capacity, min_skill, max_skill";

export async function listGroups() {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const [{ data: groups }, { data: members }, { data: events }] = await Promise.all([
    supabase.from("groups").select(GROUP_COLS).order("created_at"),
    supabase.from("group_members").select("group_id").eq("status", "active"),
    supabase.from("events").select("group_id, starts_at").gte("starts_at", now).order("starts_at"),
  ]);
  return ((groups ?? []) as Group[]).map((g) => ({
    ...g,
    memberCount: (members ?? []).filter((m) => m.group_id === g.id).length,
    nextEvent: (events ?? []).find((e) => e.group_id === g.id)?.starts_at ?? null,
  }));
}

export async function getGroup(id: string, userId: string) {
  const supabase = await createClient();
  const { data: group } = await supabase.from("groups").select(GROUP_COLS).eq("id", id).maybeSingle<Group>();
  if (!group) return null;
  const now = new Date().toISOString();
  const [{ data: members }, { data: events }, { data: rsvps }] = await Promise.all([
    supabase
      .from("group_members")
      .select("user_id, role, status, joined_at, profiles(id, display_name, avatar_url, skill_level)")
      .eq("group_id", id)
      .order("joined_at"),
    supabase.from("events").select(EVENT_COLS).eq("group_id", id).gte("ends_at", now).order("starts_at").limit(20),
    supabase.from("rsvps").select("event_id, user_id, status"),
  ]);
  type M = { user_id: string; role: string; status: string; profiles: Person | null };
  const all = (members ?? []) as unknown as M[];
  const me = all.find((m) => m.user_id === userId);
  const evs = (events ?? []) as EventRow[];
  return {
    group,
    members: all.filter((m) => m.status === "active"),
    pending: all.filter((m) => m.status === "pending"),
    myRole: me?.role ?? null,
    myStatus: me?.status ?? null,
    events: evs.map((e) => {
      const r = (rsvps ?? []).filter((x) => x.event_id === e.id);
      return {
        ...e,
        going: r.filter((x) => x.status === "going").length,
        waitlist: r.filter((x) => x.status === "waitlist").length,
        mine: r.find((x) => x.user_id === userId)?.status ?? null,
      };
    }),
  };
}

export async function getEvent(id: string, userId: string) {
  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select(EVENT_COLS).eq("id", id).maybeSingle<EventRow>();
  if (!event) return null;
  const [{ data: group }, { data: rsvps }, { data: membership }] = await Promise.all([
    supabase.from("groups").select(GROUP_COLS).eq("id", event.group_id).single<Group>(),
    supabase
      .from("rsvps")
      .select("user_id, status, created_at, profiles(id, display_name, avatar_url, skill_level)")
      .eq("event_id", id)
      .order("created_at"),
    supabase.from("group_members").select("role, status").eq("group_id", event.group_id).eq("user_id", userId).maybeSingle(),
  ]);
  type R = { user_id: string; status: string; profiles: Person | null };
  const all = (rsvps ?? []) as unknown as R[];
  return {
    event,
    group: group!,
    going: all.filter((r) => r.status === "going"),
    waitlist: all.filter((r) => r.status === "waitlist"),
    mine: all.find((r) => r.user_id === userId)?.status ?? null,
    myRole: membership?.status === "active" ? membership.role : null,
    myStatus: membership?.status ?? null,
    started: new Date(event.starts_at).getTime() < Date.now(),
  };
}

export type CommentRow = { id: string; body: string; created_at: string; user_id: string; profiles: Person | null };

export async function listComments(scope: { groupId: string; eventId?: string }) {
  const supabase = await createClient();
  let q = supabase
    .from("comments")
    .select("id, body, created_at, user_id, profiles(id, display_name, avatar_url, skill_level)")
    .eq("group_id", scope.groupId)
    .order("created_at", { ascending: true })
    .limit(100);
  q = scope.eventId ? q.eq("event_id", scope.eventId) : q.is("event_id", null);
  const { data } = await q;
  return (data ?? []) as unknown as CommentRow[];
}

export async function myUpcomingEvents(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rsvps")
    .select(`status, events!inner(${EVENT_COLS}, groups(name))`)
    .eq("user_id", userId)
    .gte("events.ends_at", new Date().toISOString());
  type Row = { status: string; events: EventRow & { groups: { name: string } | null } };
  return ((data ?? []) as unknown as Row[])
    .map((r) => ({ ...r.events, status: r.status }))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}

export async function groupsForUser(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("group_members")
    .select("role, status, groups(id, name, area)")
    .eq("user_id", userId)
    .order("joined_at");
  type Row = { role: string; status: string; groups: { id: string; name: string; area: string } | null };
  return ((data ?? []) as unknown as Row[]).filter((r) => r.groups);
}

export async function sessionsPlayed(userId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("rsvps")
    .select("event_id, events!inner(ends_at)", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "going")
    .lt("events.ends_at", new Date().toISOString());
  return count ?? 0;
}
