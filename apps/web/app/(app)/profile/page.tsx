import Link from "next/link";
import { redirect } from "next/navigation";
import { PROFILE_VISIBILITY } from "@sportsapp/shared";
import { requireUser } from "@/lib/auth";
import { groupsForUser, myUpcomingEvents, sessionsPlayed } from "@/lib/groups";
import { formatEventTime, LAUNCH_TZ } from "@/lib/time";
import { Badge } from "@/components/avatar";
import { CoachHistory, DetailList, GroupsList, MembershipCard, ProfileHeader, gameRows, label, memberSince } from "@/components/profile-sections";

const NOTICES: Record<string, string> = { profile: "Profile saved.", password: "Password updated." };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ updated?: string }> }) {
  const { user, profile } = await requireUser();
  if (!profile?.onboarded) redirect("/onboarding");
  const { updated } = await searchParams;
  const [groups, upcoming, played] = await Promise.all([groupsForUser(user.id), myUpcomingEvents(user.id), sessionsPlayed(user.id)]);
  const consent = profile.video_consent_at
    ? `Given on ${new Date(profile.video_consent_at).toLocaleDateString("en-US", { dateStyle: "medium", timeZone: LAUNCH_TZ })}`
    : "Not given yet (needed before using the AI coach)";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {updated && NOTICES[updated] && (
        <p role="status" className="rounded-lg bg-brand-50 p-3 font-medium text-brand-700">✓ {NOTICES[updated]}</p>
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

      <div className="grid gap-6 md:grid-cols-2">
        <CoachHistory />
        <MembershipCard profile={profile} />
      </div>

      <section className="card">
        <h2 className="mb-1 text-lg font-semibold">Privacy and your data</h2>
        <DetailList
          rows={[
            ["Profile visible to", label(PROFILE_VISIBILITY, profile.show_profile_to)],
            ["AI coach video consent", consent],
            ["Your videos", "Private to you unless you choose to share them"],
            ["Download your data", <a key="dl" href="/profile/export" className="font-medium text-brand-700">Download everything as a file</a>],
          ]}
        />
      </section>
    </div>
  );
}
