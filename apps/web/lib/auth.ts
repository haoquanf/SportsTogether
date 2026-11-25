import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/env";
import type { SkillLevel } from "@sportsapp/shared";

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  city: string | null;
  sports: string[];
  skill_level: SkillLevel;
  birth_year: number | null;
  video_consent_at: string | null;
  onboarded: boolean;
};

/** The signed-in user and profile, or null. */
export async function getCurrentUser() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, city, sports, skill_level, birth_year, video_consent_at, onboarded")
    .eq("id", data.user.id)
    .single<Profile>();
  return { user: data.user, profile };
}

export async function requireUser() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  return current;
}
