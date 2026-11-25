"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SKILL_LEVELS, SPORTS } from "@sportsapp/shared";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { FormState } from "@/app/auth/actions";

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

  if (!displayName) return { error: "Please enter your name." };
  if (!city) return { error: "Please enter your city so we can show nearby groups." };
  if (!SKILL_LEVELS.some((l) => l.id === skill)) return { error: "Please pick your skill level." };
  if (sports.length === 0) return { error: "Pick at least one sport." };
  const thisYear = new Date().getFullYear();
  if (!Number.isInteger(birthYear) || birthYear < 1900 || birthYear > thisYear) return { error: "Please enter a valid birth year." };
  if (thisYear - birthYear < MIN_AGE) {
    return { error: `You need to be at least ${MIN_AGE} to join. Parent-supervised accounts are coming later.` };
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
    });
  if (error) {
    console.error("saveProfile failed", error);
    return { error: `We couldn't save your profile (${error.code ?? "unknown"}: ${error.message}). Please try again.` };
  }

  revalidatePath("/", "layout");
  redirect(profile?.onboarded ? "/profile?updated=profile" : "/home?welcome=1");
}

export async function deleteAccount(formData: FormData) {
  await requireUser();
  if (formData.get("confirm") !== "DELETE") redirect("/profile?error=confirm");
  const supabase = await createClient();
  await supabase.rpc("delete_my_account");
  await supabase.auth.signOut();
  redirect("/?deleted=1");
}
