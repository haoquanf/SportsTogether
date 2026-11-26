import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// "Download my data" (privacy requirement): everything we hold about the member, as JSON.
export async function GET(request: NextRequest) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.redirect(new URL("/login", request.url));
  const supabase = await createClient();
  const id = current.user.id;
  const [memberships, rsvps, comments, groupsCreated] = await Promise.all([
    supabase.from("group_members").select("group_id, role, status, joined_at, groups(name)").eq("user_id", id),
    supabase.from("rsvps").select("event_id, status, created_at, events(title, starts_at, venue_name)").eq("user_id", id),
    supabase.from("comments").select("id, group_id, event_id, body, created_at").eq("user_id", id),
    supabase.from("groups").select("id, name, created_at").eq("created_by", id),
  ]);
  const body = {
    exported_at: new Date().toISOString(),
    account: { id, email: current.user.email, created_at: current.user.created_at },
    profile: current.profile,
    group_memberships: memberships.data ?? [],
    groups_created: groupsCreated.data ?? [],
    rsvps: rsvps.data ?? [],
    comments: comments.data ?? [],
  };
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="zenisports-my-data.json"`,
    },
  });
}
