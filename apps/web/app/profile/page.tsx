import Link from "next/link";
import { redirect } from "next/navigation";
import { SKILL_LEVELS, SPORTS } from "@sportsapp/shared";
import { requireUser } from "@/lib/auth";
import { deleteAccount } from "./actions";

const NOTICES: Record<string, string> = { profile: "Profile saved.", password: "Password updated." };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ updated?: string; error?: string }> }) {
  const { user, profile } = await requireUser();
  if (!profile?.onboarded) redirect("/onboarding");
  const { updated, error } = await searchParams;
  const level = SKILL_LEVELS.find((l) => l.id === profile.skill_level);
  const sports = profile.sports.map((id) => SPORTS.find((s) => s.id === id)?.label ?? id).join(", ");
  const consentDate = profile.video_consent_at
    ? new Date(profile.video_consent_at).toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "America/New_York" })
    : null;

  const rows: [string, React.ReactNode][] = [
    ["Name", profile.display_name],
    ["Email", user.email],
    ["City", profile.city],
    ["Birth year", profile.birth_year],
    ["Sports", sports],
    ["Skill level", level ? <>{level.label} <span className="text-slate-500">· {level.hint}</span></> : "Not set"],
    ["AI coach video consent", consentDate ? `Given on ${consentDate}` : "Not given yet"],
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {updated && NOTICES[updated] && (
        <p role="status" className="rounded-lg bg-brand-50 p-3 font-medium text-brand-700">✓ {NOTICES[updated]}</p>
      )}
      <section className="card">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                profile.display_name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{profile.display_name}</h1>
              <p className="text-slate-600">{level?.label} · {profile.city}</p>
            </div>
          </div>
          <Link href="/profile/edit" className="btn-primary">Edit profile</Link>
        </div>

        <dl className="mt-6 divide-y divide-slate-100 border-t border-slate-100">
          {rows.map(([label, value]) => (
            <div key={label} className="grid gap-1 py-3 sm:grid-cols-3">
              <dt className="text-sm font-medium text-slate-500">{label}</dt>
              <dd className="sm:col-span-2">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <details className="card border-red-200" open={error === "confirm"}>
        <summary className="cursor-pointer text-sm font-medium text-slate-500">Delete my account</summary>
        <h2 className="mt-4 text-lg font-semibold text-red-700">Delete account</h2>
        <p className="mt-1 mb-4 text-sm text-slate-600">This removes your profile and all your videos for good. Type DELETE to confirm.</p>
        {error === "confirm" && <p role="alert" className="mb-2 text-sm text-red-600">Please type DELETE exactly.</p>}
        <form action={deleteAccount} className="flex gap-2">
          <input name="confirm" aria-label="Type DELETE to confirm" className="input max-w-40" autoComplete="off" />
          <button className="btn border border-red-300 text-red-700 hover:bg-red-50">Delete my account</button>
        </form>
      </details>
    </div>
  );
}
