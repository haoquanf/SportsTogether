"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SKILL_LEVELS } from "@sportsapp/shared";
import { Map } from "@/components/map";
import { Badge } from "@/components/avatar";
import { distanceKm, formatKm, type LatLng } from "@/lib/geo";
import { LAUNCH_CITY, LAUNCH_TZ } from "@/lib/time";
import { skillLabel } from "@/lib/skill";

type G = {
  id: string; name: string; description: string; area: string; lat: number; lng: number;
  visibility: string; skill_level: string | null; memberCount: number; nextEvent: string | null;
};

const RADII = [
  { km: 5, label: "3 mi" },
  { km: 16, label: "10 mi" },
  { km: 40, label: "25 mi" },
  { km: 0, label: "Any distance" },
];

export function GroupFinder({ groups, mySkill }: { groups: G[]; mySkill: string | null }) {
  const [origin, setOrigin] = useState<LatLng>(LAUNCH_CITY);
  const [usingGps, setUsingGps] = useState(false);
  const [radius, setRadius] = useState(16);
  const [skill, setSkill] = useState<string>("");
  const [locError, setLocError] = useState("");

  const shown = useMemo(
    () =>
      groups
        .map((g) => ({ ...g, km: distanceKm(origin, g) }))
        .filter((g) => !radius || g.km <= radius)
        .filter((g) => !skill || !g.skill_level || g.skill_level === skill)
        .sort((a, b) => a.km - b.km),
    [groups, origin, radius, skill],
  );

  function nearMe() {
    setLocError("");
    if (!navigator.geolocation) return setLocError("Your browser can't share your location.");
    navigator.geolocation.getCurrentPosition(
      (p) => { setOrigin({ lat: p.coords.latitude, lng: p.coords.longitude }); setUsingGps(true); },
      () => setLocError("Location permission was denied, so we're showing groups near downtown Boston."),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={nearMe} className="btn-secondary py-1.5">📍 {usingGps ? "Near me" : "Use my location"}</button>
        <label className="sr-only" htmlFor="radius">Distance</label>
        <select id="radius" value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="input w-auto py-1.5">
          {RADII.map((r) => <option key={r.km} value={r.km}>{r.label}</option>)}
        </select>
        <label className="sr-only" htmlFor="skill">Level</label>
        <select id="skill" value={skill} onChange={(e) => setSkill(e.target.value)} className="input w-auto py-1.5">
          <option value="">All levels</option>
          {SKILL_LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}{l.id === mySkill ? " (you)" : ""}</option>)}
        </select>
        <span className="text-sm text-slate-500">{shown.length} group{shown.length === 1 ? "" : "s"}</span>
      </div>
      {locError && <p className="text-sm text-amber-700">{locError}</p>}

      <Map
        center={origin}
        zoom={radius && radius <= 5 ? 13 : 11}
        you={usingGps ? origin : null}
        radiusKm={usingGps ? radius : undefined}
        markers={shown.map((g) => ({ id: g.id, lat: g.lat, lng: g.lng, title: g.name, subtitle: g.area, href: `/groups/${g.id}` }))}
      />

      {shown.length === 0 ? (
        <div className="card text-center text-slate-600">
          No groups match. Try a bigger distance, or <Link href="/groups/new" className="font-medium text-brand-700">start one</Link>.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {shown.map((g) => (
            <li key={g.id}>
              <Link href={`/groups/${g.id}`} className="card block h-full transition hover:border-brand-500">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold">{g.name}</h2>
                  <span className="shrink-0 text-sm text-slate-500">{formatKm(g.km)}</span>
                </div>
                <p className="text-sm text-slate-500">{g.area}</p>
                <p className="mt-2 line-clamp-2 text-slate-700">{g.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone={g.skill_level && g.skill_level === mySkill ? "green" : "slate"}>{skillLabel(g.skill_level)}</Badge>
                  <Badge>{g.memberCount} member{g.memberCount === 1 ? "" : "s"}</Badge>
                  {g.visibility === "approval" && <Badge tone="amber">Approval needed</Badge>}
                  {g.nextEvent && (
                    <Badge tone="blue">
                      Next: {new Date(g.nextEvent).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: LAUNCH_TZ })}
                    </Badge>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
