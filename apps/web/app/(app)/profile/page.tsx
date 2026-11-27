import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MembershipPlans, type PlanRequest } from "@/components/membership-plans";
import { groupsForUser, myUpcomingEvents, sessionsPlayed } from "@/lib/groups";
import { formatEventTime, LAUNCH_TZ } from "@/lib/time";
import { Badge } from "@/components/avatar";
import { CoachHistory, DetailList, GroupsList, ProfileHeader, gameRows, memberSince } from "@/components/profile-sections";

const NOTICES: Record<string, string> = {
  profile: "Profile saved.",
  password: "Password updated.",
  plan: "Plan change requested.",
  plan_cancelled: "Plan change request cancelled.",
  plan_error: "We couldn't save your plan request. Please try again later.",
};

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ updated?: string }> }) {
  const { user, profile } = await requireUser();
  if (!profile?.onboarded) redirect("/onboarding");
  const { updated } = await searchParams;
  const [groups, upcoming, played] = await Promise.all([groupsForUser(user.id), myUpcomingEvents(user.id), sessionsPlayed(user.id)]);
  const { data: planRequest } = await (await createClient())
    .from("plan_requests")
    .select("plan, billing, created_at")
    .eq("user_id", user.id)
    .maybeSingle<NonNullable<PlanRequest>>();
  const requestedOn = planRequest
    ? new Date(planRequest.created_at).toLocaleDateString("en-US", { dateStyle: "medium", timeZone: LAUNCH_TZ })
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {updated && NOTICES[updated] && (
        <p role="status" className={`rounded-lg p-3 font-medium ${updated.endsWith("error") ? "bg-red-50 text-red-700" : "bg-brand-50 text-brand-700"}`}>
          {updated.endsWith("error") ? "" : "✓ "}{NOTICES[updated]}
        </p>
      )}

      <ProfileHeader
        profile={profile}
        actions={
          <div className="flex gap-2">
            <Link href={`/members/${user.id}`} className="btn-secondary">See what others see</Link>
            <Link href="/profile/edit" className="btn-primary">Edit profile</Link>
          </div>
        }
      />

      <section className="grid grid-cols-3 gap-4 text-center">
        {[
          [groups.filter((g) => g.status === "active").length, "Groups"],
          [upcoming.length, "Upcoming sessions"],
          [played, "Sessions played"],
        ].map(([n, l]) => (
          <div key={l} className="card p-4">
            <p className="text-3xl font-bold text-brand-700">{n}</p>
            <p className="text-sm text-slate-600">{l}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card">
          <h2 className="mb-1 text-lg font-semibold">Your game</h2>
          <DetailList rows={gameRows(profile)} />
        </section>
        <section className="card">
          <h2 className="mb-1 text-lg font-semibold">Account</h2>
          <DetailList
            rows={[
              ["Name", profile.display_name],
              ["Email", user.email],
              ["City", profile.city],
              ["Neighbourhood", profile.home_area],
              ["Birth year", profile.birth_year],
              ["Member since", memberSince(profile.created_at)],
            ]}
          />
        </section>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card">
          <h2 className="mb-3 text-lg font-semibold">My groups</h2>
          <GroupsList groups={groups} emptyText={<>Not in any groups yet. <Link href="/groups" className="text-brand-700">Find one</Link>.</>} />
        </section>
        <section className="card">
          <h2 className="mb-3 text-lg font-semibold">Upcoming sessions</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing booked yet.</p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((e) => (
                <li key={e.id}>
                  <Link href={`/events/${e.id}`} className="block hover:text-brand-700">
                    <span className="block text-sm text-brand-700">{formatEventTime(e.starts_at, e.ends_at, e.timezone)}</span>
                    <span className="font-medium">{e.title}</span> <span className="text-sm text-slate-500">· {e.groups?.name}</span>
                    {e.status === "waitlist" && <> <Badge tone="amber">Waitlist</Badge></>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <CoachHistory />

      <MembershipPlans plan={profile.plan} request={planRequest ?? null} requestedOn={requestedOn} />

    </div>
  );
}
