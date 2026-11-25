"use client";

import { useState } from "react";
import { Map } from "./map";
import { LAUNCH_CITY } from "@/lib/time";
import type { LatLng } from "@/lib/geo";

/** Click the map to drop a pin; the coordinates go into hidden form fields. */
export function LocationPicker({ initial, label = "Location" }: { initial?: LatLng | null; label?: string }) {
  const [picked, setPicked] = useState<LatLng | null>(initial ?? null);
  return (
    <div>
      <span className="label">{label}</span>
      <p className="mb-2 text-sm text-slate-500">Click the map to drop a pin on the venue.</p>
      <Map center={initial ?? LAUNCH_CITY} zoom={12} picked={picked} onPick={setPicked} className="h-72" />
      <input type="hidden" name="lat" value={picked?.lat ?? ""} />
      <input type="hidden" name="lng" value={picked?.lng ?? ""} />
      {picked && <p className="mt-1 text-xs text-slate-500">Pin set at {picked.lat.toFixed(4)}, {picked.lng.toFixed(4)}</p>}
    </div>
  );
}
