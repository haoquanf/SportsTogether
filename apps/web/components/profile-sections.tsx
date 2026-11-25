import Link from "next/link";
import { AVAILABILITY, FREE_ANALYSES_PER_MONTH, HANDEDNESS, PLAY_FORMATS, PREMIUM_ANALYSES_PER_MONTH, SKILL_LEVELS, SPORTS } from "@sportsapp/shared";
import type { Profile } from "@/lib/auth";
import { LAUNCH_TZ } from "@/lib/time";
import { Avatar, Badge } from "./avatar";

export const label = <T extends { id: string; label: string }>(list: readonly T[], id: string | null | undefined) =>
  list.find((x) => x.id === id)?.label;

export function ProfileHeader({ profile, actions }: { profile: Profile; actions?: React.ReactNode }) {
  const level = label(SKILL_LEVELS, profile.skill_level);
  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={profile.display_name} url={profile.avatar_url} size={72} />
          <div>
            <h1 className="text-2xl font-bold">{profile.display_name}</h1>
            <p className="text-slate-600">
              {level} · {[profile.home_area, profile.city].filter(Boolean).join(", ")}
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              {profile.is_coach && <Badge tone="blue">Coach</Badge>}
              {profile.plan === "premium" && <Badge tone="amber">Premium</Badge>}
              {profile.handedness && <Badge>{label(HANDEDNESS, profile.handedness)}</Badge>}
              {profile.play_format !== "any" && <Badge>Prefers {label(PLAY_FORMATS, profile.play_format)?.toLowerCase()}</Badge>}
            </div>
          </div>
        </div>
        {actions}
      </div>
      {profile.bio && <p className="mt-4 whitespace-pre-wrap text-slate-700">{profile.bio}</p>}
    </section>
  );
}

export function DetailList({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="divide-y divide-slate-100">
      {rows.map(([k, v]) => (
        <div key={k} className="grid gap-1 py-3 sm:grid-cols-3">
          <dt className="text-sm font-medium text-slate-500">{k}</dt>
          <dd className="sm:col-span-2">{v || <span className="text-slate-400">Not set</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

export function gameRows(profile: Profile): [string, React.ReactNode][] {
  return [
    ["Sports", profile.sports.map((id) => label(SPORTS, id) ?? id).join(", ")],
    ["Skill level", label(SKILL_LEVELS, profile.skill_level)],
    ["Racket hand", label(HANDEDNESS, profile.handedness)],
    ["Favourite format", label(PLAY_FORMATS, profile.play_format)],
    ["Usually free", profile.availability.map((a) => label(AVAILABILITY, a)).filter(Boolean).join(", ")],
  ];
}

export function GroupsList({ groups, emptyText }: { groups: { role: string; status: string; groups: { id: string; name: string; area: string } | null }[]; emptyText: React.ReactNode }) {
  if (groups.length === 0) return <p className="text-sm text-slate-500">{emptyText}</p>;
  return (
    <ul className="space-y-2">
      {groups.map((g) => (
        <li key={g.groups!.id} className="flex items-center justify-between gap-2">
          <Link href={`/groups/${g.groups!.id}`} className="font-medium hover:text-brand-700">{g.groups!.name}</Link>
          <span className="flex gap-1">
            {g.role === "admin" && <Badge tone="blue">Admin</Badge>}
            {g.status === "pending" && <Badge tone="amber">Request pending</Badge>}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function MembershipCard({ profile }: { profile: Profile }) {
  const premium = profile.plan === "premium";
  return (
    <section className="card">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Membership</h2>
        <Badge tone={premium ? "amber" : "slate"}>{premium ? "Premium" : "Free plan"}</Badge>
      </div>
      <ul className="mt-3 space-y-1 text-sm text-slate-700">
        <li>✓ Groups, sessions and free lessons</li>
        <li>✓ {premium ? PREMIUM_ANALYSES_PER_MONTH : FREE_ANALYSES_PER_MONTH} AI coach analyses a month</li>
        <li className={premium ? "" : "text-slate-400"}>{premium ? "✓" : "–"} All premium lessons, progress history and side-by-side compare</li>
      </ul>
      {!premium && <p className="mt-3 text-sm text-slate-500">Premium ($9.99 a month) is coming soon.</p>}
    </section>
  );
}

export function CoachHistory() {
  return (
    <section className="card">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">AI coach history</h2>
        <Badge>Coming soon</Badge>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Your analysed clips will appear here with a score for each one, so you can see your progress over time.
      </p>
    </section>
  );
}

export const memberSince = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: LAUNCH_TZ });
