"use client";

import { useActionState } from "react";
import { SKILL_LEVELS } from "@sportsapp/shared";
import { createEvent } from "@/app/(app)/groups/actions";
import { LocationPicker } from "@/components/location-picker";
import type { LatLng } from "@/lib/geo";

export function NewEventForm({ groupId, groupLocation }: { groupId: string; groupLocation: LatLng }) {
  const [state, action, pending] = useActionState(createEvent.bind(null, groupId), {});
  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="title" className="label">Title</label>
        <input id="title" name="title" required placeholder="e.g. Thursday doubles" className="input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label htmlFor="starts_at" className="label">Date and start time (Boston time)</label>
          <input id="starts_at" name="starts_at" type="datetime-local" required className="input" />
        </div>
        <div>
          <label htmlFor="duration" className="label">Length</label>
          <select id="duration" name="duration" defaultValue="2" className="input">
            {[1, 1.5, 2, 2.5, 3].map((h) => <option key={h} value={h}>{h} hours</option>)}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="capacity" className="label">Spots</label>
          <input id="capacity" name="capacity" type="number" min={2} max={200} defaultValue={8} required className="input" />
        </div>
        <div>
          <label htmlFor="min_skill" className="label">Lowest level</label>
          <select id="min_skill" name="min_skill" defaultValue="" className="input">
            <option value="">Any</option>
            {SKILL_LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="max_skill" className="label">Highest level</label>
          <select id="max_skill" name="max_skill" defaultValue="" className="input">
            <option value="">Any</option>
            {SKILL_LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="venue_name" className="label">Venue</label>
          <input id="venue_name" name="venue_name" required placeholder="e.g. MIT Zesiger Center" className="input" />
        </div>
        <div>
          <label htmlFor="venue_address" className="label">Address (optional)</label>
          <input id="venue_address" name="venue_address" className="input" />
        </div>
      </div>
      <LocationPicker initial={groupLocation} label="Venue on the map" />
      <div>
        <label htmlFor="notes" className="label">Notes (optional)</label>
        <textarea id="notes" name="notes" rows={3} placeholder="Shuttles provided, court fee $8, bring non-marking shoes…" className="input" />
      </div>
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button className="btn-primary" disabled={pending}>{pending ? "Posting…" : "Post session"}</button>
    </form>
  );
}
