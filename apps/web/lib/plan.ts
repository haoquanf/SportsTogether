import { createClient } from "@/lib/supabase/server";
import { LAUNCH_TZ } from "@/lib/time";
import type { PlanRequest } from "@/components/membership-plans";

/** The member's pending plan-change request, if any (null if none or not set up yet). */
export async function getPlanRequest(userId: string) {
  const { data } = await (await createClient())
    .from("plan_requests")
    .select("plan, billing, created_at")
    .eq("user_id", userId)
    .maybeSingle<NonNullable<PlanRequest>>();
  const requestedOn = data
    ? new Date(data.created_at).toLocaleDateString("en-US", { dateStyle: "medium", timeZone: LAUNCH_TZ })
    : null;
  return { request: data ?? null, requestedOn };
}
