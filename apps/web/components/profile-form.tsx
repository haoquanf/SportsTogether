"use client";

import { useActionState } from "react";
import { AVAILABILITY, HANDEDNESS, PLAY_FORMATS, PROFILE_VISIBILITY, SKILL_LEVELS, SPORTS } from "@sportsapp/shared";
import { saveProfile } from "@/app/profile/actions";
import type { Profile } from "@/lib/auth";
import { AvatarUpload } from "./avatar-upload";

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 border-t border-slate-100 pt-5">
      <legend className="sr-only">{title}</legend>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {hint && <p className="text-sm text-slate-500">{hint}</p>}
      </div>
      {children}
    </fieldset>
  );
}

export function ProfileForm({
  profile,
  userId,
  submitLabel,
  mode = "edit",
}: {
  profile: Profile | null;
  userId: string;
  submitLabel: string;
  mode?: "onboarding" | "edit";
}) {
  const [state, action, pending] = useActionState(saveProfile, {});
  const v = state.values;
  const pick = <T,>(key: string, fallback: T): T => (v && key in v ? (v[key] as T) : fallback);
  const values = {
    display_name: pick("display_name", profile?.display_name ?? ""),
    city: pick("city", profile?.city ?? "Boston, MA"),
    birth_year: pick("birth_year", profile?.birth_year ? String(profile.birth_year) : ""),
    skill_level: pick("skill_level", profile?.skill_level ?? "beginner") || "beginner",
    sports: pick<string[]>("sports", profile?.sports ?? ["badminton"]),
    video_consent: v ? v.video_consent === "on" : Boolean(profile?.video_consent_at),
    bio: pick("bio", profile?.bio ?? ""),
    home_area: pick("home_area", profile?.home_area ?? ""),
    handedness: pick("handedness", profile?.handedness ?? ""),
    play_format: pick("play_format", profile?.play_format ?? "any"),
    availability: pick<string[]>("availability", profile?.availability ?? []),
    show_profile_to: pick("show_profile_to", profile?.show_profile_to ?? "members"),
    avatar_url: pick("avatar_url", profile?.avatar_url ?? ""),
  };

  const extras = (
    <>
      <Section title="Your game" hint="Helps us match you with sessions and partners, and lets the AI coach read your clips correctly.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="handedness" className="label">Racket hand</label>
            <select id="handedness" name="handedness" defaultValue={values.handedness} className="input">
              <option value="">Not set</option>
              {HANDEDNESS.map((h) => <option key={h.id} value={h.id}>{h.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="play_format" className="label">Favourite format</label>
            <select id="play_format" name="play_format" defaultValue={values.play_format} className="input">
              {PLAY_FORMATS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <span className="label">When can you usually play?</span>
          <div className="grid gap-2 sm:grid-cols-3">
            {AVAILABILITY.map((a) => (
              <label key={a.id} className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                <input type="checkbox" name="availability" value={a.id} defaultChecked={values.availability.includes(a.id)} />
                {a.label}
              </label>
            ))}
          </div>
        </div>
      </Section>

      <Section title="About you" hint="Shown on your profile to other members.">
        <AvatarUpload userId={userId} name={values.display_name} initial={values.avatar_url || null} />
        <div>
          <label htmlFor="home_area" className="label">Neighbourhood</label>
          <input id="home_area" name="home_area" defaultValue={values.home_area} placeholder="e.g. Cambridge, Allston, Quincy" className="input" />
        </div>
        <div>
          <label htmlFor="bio" className="label">Short bio</label>
          <textarea id="bio" name="bio" rows={3} maxLength={500} defaultValue={values.bio} placeholder="How long you've played, what you're working on, who you'd like to play with…" className="input" />
        </div>
      </Section>

      <Section title="Privacy">
        <fieldset>
          <legend className="label">Who can see your profile?</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {PROFILE_VISIBILITY.map((o) => (
              <label key={o.id} className="flex gap-3 rounded-lg border border-slate-300 bg-white p-3 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                <input type="radio" name="show_profile_to" value={o.id} defaultChecked={values.show_profile_to === o.id} className="mt-1" />
                <span><span className="block font-medium">{o.label}</span><span className="text-sm text-slate-600">{o.hint}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
      </Section>
    </>
  );

  return (
    <form key={JSON.stringify(v ?? null)} action={action} className="space-y-5">
      <div>
        <label htmlFor="display_name" className="label">Name</label>
        <input id="display_name" name="display_name" defaultValue={values.display_name} required className="input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="city" className="label">City</label>
          <input id="city" name="city" defaultValue={values.city} placeholder="e.g. Boston, MA" required className="input" />
        </div>
        <div>
          <label htmlFor="birth_year" className="label">Birth year</label>
          <input id="birth_year" name="birth_year" type="number" inputMode="numeric" defaultValue={values.birth_year} required className="input" />
        </div>
      </div>
      <fieldset>
        <legend className="label">Sports</legend>
        <div className="flex flex-wrap gap-2">
          {SPORTS.map((s) => (
            <label key={s.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${s.launched ? "border-slate-300 bg-white" : "border-dashed border-slate-200 text-slate-400"}`}>
              <input type="checkbox" name="sports" value={s.id} disabled={!s.launched} defaultChecked={s.launched && values.sports.includes(s.id)} />
              {s.label}{!s.launched && " (coming soon)"}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">Skill level</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {SKILL_LEVELS.map((l) => (
            <label key={l.id} className="flex cursor-pointer gap-3 rounded-lg border border-slate-300 bg-white p-3 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
              <input type="radio" name="skill_level" value={l.id} defaultChecked={values.skill_level === l.id} className="mt-1" />
              <span>
                <span className="block font-medium">{l.label}</span>
                <span className="text-sm text-slate-600">{l.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex gap-3 rounded-lg bg-slate-100 p-3 text-sm">
        <input type="checkbox" name="video_consent" defaultChecked={values.video_consent} className="mt-0.5" />
        <span>
          I agree that clips I upload to the AI coach are processed to analyse my technique. My videos stay private
          unless I choose to share them, and I can delete them at any time.
        </span>
      </label>

      {mode === "onboarding" ? (
        <details className="rounded-lg border border-slate-200 p-4">
          <summary className="cursor-pointer font-medium text-brand-700">Add more about your game (optional, you can do this later)</summary>
          <div className="mt-2 space-y-5">{extras}</div>
        </details>
      ) : (
        extras
      )}

      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button className="btn-primary w-full sm:w-auto" disabled={pending}>{pending ? "Saving…" : submitLabel}</button>
    </form>
  );
}
