"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SKILL_LEVELS, SPORTS } from "@sportsapp/shared";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LAUNCH_TZ, zonedInputToDate } from "@/lib/time";
import type { FormState } from "@/app/(app)/auth/actions";

const isSkill = (s: string) => SKILL_LEVELS.some((l) => l.id === s);
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

function readLatLng(f: FormData) {
  const lat = Number(f.get("lat"));
  const lng = Number(f.get("lng"));
  if (!f.get("lat") || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function friendly(message: string) {
  // Our database functions raise readable messages; hide anything technical.
  return /^[A-Z][^_]*\.$/.test(message) ? message : "Something went wrong. Please try again.";
}

export async function createGroup(_: FormState, f: FormData): Promise<FormState> {
  const { user, profile } = await requireUser();
  const name = str(f, "name");
  const loc = readLatLng(f);
  const skill = str(f, "skill_level");
  if (name.length < 3) return { error: "Give the group a name of at least 3 characters." };
  if (!loc) return { error: "Click the map to set where the group usually plays." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("groups")
    .insert({
      name,
      description: str(f, "description"),
      sport: SPORTS.some((s) => s.id === str(f, "sport") && s.launched) ? str(f, "sport") : "badminton",
      area: str(f, "area"),
      city: profile?.city || "Boston, MA",
      lat: loc.lat,
      lng: loc.lng,
      visibility: f.get("visibility") === "approval" ? "approval" : "public",
      skill_level: isSkill(skill) ? skill : null,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) return { error: `Couldn't create the group (${error.message}).` };
  revalidatePath("/groups");
  redirect(`/groups/${data.id}`);
}

export async function joinGroup(groupId: string) {
  await requireUser();
  const supabase = await createClient();
  await supabase.rpc("join_group", { gid: groupId });
  revalidatePath(`/groups/${groupId}`);
}

export async function leaveGroup(groupId: string): Promise<FormState> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("leave_group", { gid: groupId });
  revalidatePath(`/groups/${groupId}`);
  return error ? { error: friendly(error.message) } : {};
}

export async function answerRequest(groupId: string, memberId: string, approve: boolean) {
  await requireUser();
  const supabase = await createClient();
  await supabase.rpc("answer_join_request", { gid: groupId, member: memberId, approve });
  revalidatePath(`/groups/${groupId}`);
}

export async function createEvent(groupId: string, _: FormState, f: FormData): Promise<FormState> {
  const { user } = await requireUser();
  const title = str(f, "title");
  const venue = str(f, "venue_name");
  const loc = readLatLng(f);
  const start = zonedInputToDate(str(f, "starts_at"), LAUNCH_TZ);
  const hours = Number(f.get("duration") ?? 2);
  const capacity = Number(f.get("capacity"));
  const min = str(f, "min_skill");
  const max = str(f, "max_skill");
  if (title.length < 3) return { error: "Give the session a title." };
  if (!venue) return { error: "Add the venue name." };
  if (!loc) return { error: "Click the map to pin the venue." };
  if (!start) return { error: "Pick a date and start time." };
  if (start.getTime() < Date.now()) return { error: "The start time is in the past." };
  if (!Number.isInteger(capacity) || capacity < 2 || capacity > 200) return { error: "Capacity must be between 2 and 200." };
  const order = SKILL_LEVELS.map((l) => l.id) as string[];
  if (isSkill(min) && isSkill(max) && order.indexOf(min) > order.indexOf(max)) {
    return { error: "The lowest level can't be above the highest level." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .insert({
      group_id: groupId,
      title,
      notes: str(f, "notes"),
      venue_name: venue,
      venue_address: str(f, "venue_address"),
      lat: loc.lat,
      lng: loc.lng,
      starts_at: start.toISOString(),
      ends_at: new Date(start.getTime() + Math.max(0.5, Math.min(hours, 8)) * 3600_000).toISOString(),
      timezone: LAUNCH_TZ,
      capacity,
      min_skill: isSkill(min) ? min : null,
      max_skill: isSkill(max) ? max : null,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) return { error: `Couldn't create the session (${error.message}).` };
  revalidatePath(`/groups/${groupId}`);
  redirect(`/events/${data.id}`);
}

export async function rsvp(eventId: string): Promise<FormState> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("rsvp_event", { eid: eventId });
  revalidatePath(`/events/${eventId}`);
  if (error) return { error: friendly(error.message) };
  return { message: data === "going" ? "You're going! See you on court." : "The session is full, so you're on the waitlist. You'll move up automatically if a spot opens." };
}

export async function cancelRsvp(eventId: string): Promise<FormState> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_rsvp", { eid: eventId });
  revalidatePath(`/events/${eventId}`);
  return error ? { error: friendly(error.message) } : { message: "You're no longer going." };
}

export async function addComment(groupId: string, eventId: string | null, _: FormState, f: FormData): Promise<FormState> {
  const { user } = await requireUser();
  const body = str(f, "body");
  if (!body) return {};
  if (body.length > 1000) return { error: "Keep comments under 1,000 characters." };
  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({ group_id: groupId, event_id: eventId, user_id: user.id, body });
  if (error) return { error: "Only group members can comment. Join the group first." };
  revalidatePath(eventId ? `/events/${eventId}` : `/groups/${groupId}`);
  return { message: "posted" };
}

export async function deleteComment(commentId: string, path: string) {
  await requireUser();
  const supabase = await createClient();
  await supabase.from("comments").delete().eq("id", commentId);
  revalidatePath(path);
}

export async function reportComment(commentId: string, authorId: string) {
  const { user } = await requireUser();
  const supabase = await createClient();
  await supabase.from("reports").insert({ reporter_id: user.id, comment_id: commentId, user_id: authorId, reason: "comment" });
}
