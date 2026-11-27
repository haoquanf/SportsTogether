"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AVAILABILITY, HANDEDNESS, PLAY_FORMATS, PROFILE_VISIBILITY, SKILL_LEVELS, SPORTS } from "@sportsapp/shared";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { FormState } from "@/app/(app)/auth/actions";

const MIN_AGE = 13;

export async function saveProfile(prev: FormState, formData: FormData): Promise<FormState> {
  const state = await saveProfileInner(formData);
  // Send the typed values back so the form keeps them when there is an error.
  return state.error
    ? {
        ...state,
        values: {
          display_name: String(formData.get("display_name") ?? ""),
          city: String(formData.get("city") ?? ""),
          birth_year: String(formData.get("birth_year") ?? ""),
          skill_level: String(formData.get("skill_level") ?? ""),
          video_consent: formData.get("video_consent") === "on" ? "on" : "",
          sports: formData.getAll("sports").map(String),
          bio: String(formData.get("bio") ?? ""),
          home_area: String(formData.get("home_area") ?? ""),
          handedness: String(formData.get("handedness") ?? ""),
          play_format: String(formData.get("play_format") ?? ""),
          availability: formData.getAll("availability").map(String),
          show_profile_to: String(formData.get("show_profile_to") ?? ""),
          avatar_url: String(formData.get("avatar_url") ?? ""),
        },
      }
    : state;
}

async function saveProfileInner(formData: FormData): Promise<FormState> {
  const { user, profile } = await requireUser();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const skill = String(formData.get("skill_level") ?? "");
  const sports = formData.getAll("sports").map(String).filter((s) => SPORTS.some((sp) => sp.id === s));
  const birthYear = Number(formData.get("birth_year"));
  const consent = formData.get("video_consent") === "on";
  const bio = String(formData.get("bio") ?? "").trim();
  const homeArea = String(formData.get("home_area") ?? "").trim();
  const hand = String(formData.get("handedness") ?? "");
  const format = String(formData.get("play_format") ?? "any");
  const availability = formData.getAll("availability").map(String).filter((a) => AVAILABILITY.some((x) => x.id === a));
  const visibility = String(formData.get("show_profile_to") ?? "members");
  const avatar = String(formData.get("avatar_url") ?? "").trim();

  if (!displayName) return { error: "Please enter your name." };
  if (!city) return { error: "Please enter your city so we can show nearby groups." };
  if (!SKILL_LEVELS.some((l) => l.id === skill)) return { error: "Please pick your skill level." };
  if (sports.length === 0) return { error: "Pick at least one sport." };
  const thisYear = new Date().getFullYear();
  if (!Number.isInteger(birthYear) || birthYear < 1900 || birthYear > thisYear) return { error: "Please enter a valid birth year." };
  if (thisYear - birthYear < MIN_AGE) {
    return { error: `You need to be at least ${MIN_AGE} to join. Parent-supervised accounts are coming later.` };
  }

  if (bio.length > 500) return { error: "Keep your bio under 500 characters." };
  if (avatar && !avatar.startsWith(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${user.id}/`) && avatar !== profile?.avatar_url) {
    return { error: "That photo couldn't be used. Please upload it again." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      display_name: displayName,
      city,
      skill_level: skill,
      sports,
      birth_year: birthYear,
      video_consent_at: consent ? (profile?.video_consent_at ?? new Date().toISOString()) : null,
      onboarded: true,
      bio,
      home_area: homeArea,
      handedness: HANDEDNESS.some((h) => h.id === hand) ? hand : null,
      play_format: PLAY_FORMATS.some((p) => p.id === format) ? format : "any",
      availability,
      show_profile_to: PROFILE_VISIBILITY.some((v) => v.id === visibility) ? visibility : "members",
      avatar_url: avatar || null,
    });
  if (error) {
    console.error("saveProfile failed", error);
    return { error: `We couldn't save your profile (${error.code ?? "unknown"}: ${error.message}). Please try again.` };
  }

  revalidatePath("/", "layout");
  redirect(profile?.onboarded ? "/profile?updated=profile" : "/home?welcome=1");
}
