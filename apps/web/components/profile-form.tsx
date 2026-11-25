"use client";

import { useActionState } from "react";
import { SKILL_LEVELS, SPORTS } from "@sportsapp/shared";
import { saveProfile } from "@/app/profile/actions";
import type { Profile } from "@/lib/auth";

export function ProfileForm({ profile, submitLabel }: { profile: Profile | null; submitLabel: string }) {
  const [state, action, pending] = useActionState(saveProfile, {});
  const v = state.values;
  const values = {
    display_name: (v?.display_name as string) ?? profile?.display_name ?? "",
    city: (v?.city as string) ?? profile?.city ?? "",
    birth_year: (v?.birth_year as string) ?? (profile?.birth_year ? String(profile.birth_year) : ""),
    skill_level: (v?.skill_level as string) || profile?.skill_level || "beginner",
    sports: (v?.sports as string[]) ?? profile?.sports ?? ["badminton"],
    video_consent: v ? v.video_consent === "on" : Boolean(profile?.video_consent_at),
  };
  return (
    <form key={JSON.stringify(v ?? null)} action={action} className="space-y-5">
      <div>
        <label htmlFor="display_name" className="label">Name</label>
        <input id="display_name" name="display_name" defaultValue={values.display_name} required className="input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="city" className="label">City</label>
          <input id="city" name="city" defaultValue={values.city} placeholder="e.g. Seattle" required className="input" />
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
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button className="btn-primary w-full sm:w-auto" disabled={pending}>{pending ? "Saving…" : submitLabel}</button>
    </form>
  );
}
