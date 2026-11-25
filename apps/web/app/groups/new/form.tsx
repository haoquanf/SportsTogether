"use client";

import { useActionState } from "react";
import { SKILL_LEVELS } from "@sportsapp/shared";
import { createGroup } from "@/app/groups/actions";
import { LocationPicker } from "@/components/location-picker";

export function NewGroupForm() {
  const [state, action, pending] = useActionState(createGroup, {});
  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="name" className="label">Group name</label>
        <input id="name" name="name" required minLength={3} maxLength={80} placeholder="e.g. Tuesday Night Doubles" className="input" />
      </div>
      <div>
        <label htmlFor="description" className="label">What is the group about?</label>
        <textarea id="description" name="description" rows={3} maxLength={2000} placeholder="When you play, what level, what to bring…" className="input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="area" className="label">Neighbourhood</label>
          <input id="area" name="area" placeholder="e.g. Cambridge" className="input" />
        </div>
        <div>
          <label htmlFor="skill_level" className="label">Typical level</label>
          <select id="skill_level" name="skill_level" className="input" defaultValue="">
            <option value="">All levels welcome</option>
            {SKILL_LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </div>
      </div>
      <fieldset>
        <legend className="label">Who can join?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex gap-3 rounded-lg border border-slate-300 bg-white p-3 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
            <input type="radio" name="visibility" value="public" defaultChecked className="mt-1" />
            <span><span className="block font-medium">Anyone</span><span className="text-sm text-slate-600">Members join instantly</span></span>
          </label>
          <label className="flex gap-3 rounded-lg border border-slate-300 bg-white p-3 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
            <input type="radio" name="visibility" value="approval" className="mt-1" />
            <span><span className="block font-medium">Approval required</span><span className="text-sm text-slate-600">You approve each request</span></span>
          </label>
        </div>
      </fieldset>
      <LocationPicker label="Where do you usually play?" />
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button className="btn-primary" disabled={pending}>{pending ? "Creating…" : "Create group"}</button>
    </form>
  );
}
