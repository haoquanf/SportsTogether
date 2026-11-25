import Link from "next/link";
import { redirect } from "next/navigation";
import { SKILL_LEVELS } from "@sportsapp/shared";
import { requireUser } from "@/lib/auth";
import { myUpcomingEvents } from "@/lib/groups";
import { formatEventTime } from "@/lib/time";
import { Badge } from "@/components/avatar";

const NEXT_UP = [
  { icon: "📍", title: "Groups near you", text: "Find badminton groups in your city and RSVP to sessions.", status: "Open", href: "/groups" },
  { icon: "🎥", title: "Lessons", text: "Short coach-filmed lessons, starting with the forehand clear.", status: "Coming soon" },
  { icon: "🤖", title: "AI coach", text: "Upload a clip and see your technique next to the coach's.", status: "Coming soon" },
];

export default async function HomePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { user, profile } = await requireUser();
  if (!profile?.onboarded) redirect("/onboarding");
  const { welcome } = await searchParams;
  const level = SKILL_LEVELS.find((l) => l.id === profile.skill_level)?.label;
  const firstName = profile.display_name.split(" ")[0];
  const upcoming = await myUpcomingEvents(user.id);

  return (
    <div className="space-y-8">
      {welcome ? (
        <section className="rounded-3xl bg-gradient-to-br from-brand-600 to-emerald-800 px-6 py-10 text-white sm:px-10">
          <p className="text-4xl" aria-hidden>🎉</p>
          <h1 className="mt-2 text-3xl font-bold">You&apos;re all set, {firstName}!</h1>
          <p className="mt-2 text-brand-50">
            Your profile is saved: {level} badminton player in {profile.city}.
          </p>
          <Link href="/profile" className="btn mt-5 bg-white text-brand-700 hover:bg-brand-50">View my profile</Link>
        </section>
      ) : (
        <section>
          <h1 className="text-3xl font-bold">Hi {firstName} 👋</h1>
          <p className="mt-1 text-slate-600">{level} · {profile.city} · <Link href="/profile" className="font-medium text-brand-700">View profile</Link></p>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xl font-semibold">Your upcoming sessions</h2>
        {upcoming.length === 0 ? (
          <div className="card text-slate-600">
            Nothing booked yet. <Link href="/groups" className="font-medium text-brand-700">Find a group near you</Link> and RSVP to a session.
          </div>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((e) => (
              <li key={e.id}>
                <Link href={`/events/${e.id}`} className="card flex items-center justify-between gap-3 transition hover:border-brand-500">
                  <div>
                    <p className="text-sm font-medium text-brand-700">{formatEventTime(e.starts_at, e.ends_at, e.timezone)}</p>
                    <p className="font-semibold">{e.title}</p>
                    <p className="text-sm text-slate-600">{e.groups?.name} · {e.venue_name}</p>
                  </div>
                  <Badge tone={e.status === "going" ? "green" : "amber"}>{e.status === "going" ? "Going" : "Waitlist"}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {NEXT_UP.map((c) => {
          const inner = (
            <>
            <div className="flex items-start justify-between">
              <span className="text-3xl" aria-hidden>{c.icon}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.status === "Open" ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-600"}`}>{c.status}</span>
            </div>
            <h2 className="mt-3 text-lg font-semibold">{c.title}</h2>
            <p className="mt-1 text-slate-600">{c.text}</p>
            </>
          );
          return "href" in c && c.href ? (
            <Link key={c.title} href={c.href} className="card block transition hover:border-brand-500">{inner}</Link>
          ) : (
            <div key={c.title} className="card">{inner}</div>
          );
        })}
      </section>

      <p className="text-sm text-slate-500">
        Want to change your details? <Link href="/profile/edit" className="font-medium text-brand-700">Edit your profile</Link>
      </p>
    </div>
  );
}
