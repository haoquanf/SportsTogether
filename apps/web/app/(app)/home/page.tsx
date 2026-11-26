import Link from "next/link";
import { redirect } from "next/navigation";
import { SKILL_LEVELS } from "@sportsapp/shared";
import { requireUser } from "@/lib/auth";
import { groupsForUser, myUpcomingEvents, upcomingSessions } from "@/lib/groups";
import { formatEventTime } from "@/lib/time";
import { fitsLevel, skillRange } from "@/lib/skill";
import { Avatar, Badge } from "@/components/avatar";
import { CoachScreen, PhoneFrame } from "@/components/landing/screens";

const ACTIONS = [
  { href: "/groups", icon: "📍", title: "Find a game", text: "Groups and sessions near you", live: true },
  { href: "/coach", icon: "🎥", title: "Analyse a clip", text: "AI feedback on your smash", live: true },
  { href: "/lessons", icon: "📚", title: "Lessons", text: "Try the ballroom Waltz demo", live: true },
  { href: "/profile", icon: "👤", title: "My profile", text: "Your game, groups and data", live: true },
];

export default async function HomePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { user, profile } = await requireUser();
  if (!profile?.onboarded) redirect("/onboarding");
  const { welcome } = await searchParams;
  const level = SKILL_LEVELS.find((l) => l.id === profile.skill_level)?.label;
  const firstName = profile.display_name.split(" ")[0];
  const [upcoming, sessions, groups] = await Promise.all([myUpcomingEvents(user.id), upcomingSessions(), groupsForUser(user.id)]);
  const booked = new Set(upcoming.map((e) => e.id));
  const forYou = sessions.filter((e) => !booked.has(e.id) && fitsLevel(profile.skill_level, e.min_skill, e.max_skill)).slice(0, 4);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-[#06110c] px-6 py-10 text-white sm:px-10">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(34,197,94,0.3),transparent_55%)]" />
        <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Avatar name={profile.display_name} url={profile.avatar_url} size={48} />
              <p className="text-sm text-slate-300">{level} · {[profile.home_area, profile.city].filter(Boolean).join(", ")}</p>
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              {welcome ? `You're all set, ${firstName}! 🎉` : `Welcome back, ${firstName}`}
            </h1>
            <p className="mt-2 max-w-md text-slate-300">
              {welcome
                ? "Your profile is saved. Find a session at your level and get on court this week."
                : upcoming.length
                  ? `You have ${upcoming.length} session${upcoming.length === 1 ? "" : "s"} coming up.`
                  : "Nothing booked yet. There are sessions at your level this week."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/groups" className="btn bg-brand-500 text-white hover:bg-brand-600">Find a game</Link>
              <Link href="/profile" className="btn border border-white/25 text-white hover:bg-white/10">View my profile</Link>
            </div>
            <dl className="mt-8 flex gap-8 border-t border-white/10 pt-5">
              {[[groups.filter((g) => g.status === "active").length, "groups"], [upcoming.length, "upcoming"], [0, "clips analysed"]].map(([n, l]) => (
                <div key={l}><dd className="text-2xl font-bold">{n}</dd><dt className="text-sm text-slate-400">{l}</dt></div>
              ))}
            </dl>
          </div>
          <div className="hidden h-64 overflow-hidden md:block">
            <div className="origin-top scale-75"><PhoneFrame><CoachScreen /></PhoneFrame></div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {ACTIONS.map((a) => {
          const inner = (
            <>
              <div className="flex items-start justify-between">
                <span className="text-3xl" aria-hidden>{a.icon}</span>
                {!a.live && <Badge>Coming soon</Badge>}
              </div>
              <p className="mt-3 font-semibold">{a.title}</p>
              <p className="text-sm text-slate-500">{a.text}</p>
            </>
          );
          return a.href ? (
            <Link key={a.title} href={a.href} className="card p-5 transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md">{inner}</Link>
          ) : (
            <div key={a.title} className="card p-5 opacity-70">{inner}</div>
          );
        })}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-xl font-semibold">Your upcoming sessions</h2>
          {upcoming.length === 0 ? (
            <div className="card text-slate-600">
              Nothing booked yet. <Link href="/groups" className="font-medium text-brand-700">Find a group near you</Link> and RSVP.
            </div>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((e) => (
                <li key={e.id}>
                  <Link href={`/events/${e.id}`} className="card flex items-center justify-between gap-3 p-5 transition hover:border-brand-500">
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
        <section>
          <h2 className="mb-3 text-xl font-semibold">Sessions for your level</h2>
          {forYou.length === 0 ? (
            <div className="card text-slate-600">No open sessions for your level in the next two weeks. <Link href="/groups" className="font-medium text-brand-700">Browse all groups</Link>.</div>
          ) : (
            <ul className="space-y-3">
              {forYou.map((e) => (
                <li key={e.id}>
                  <Link href={`/events/${e.id}`} className="card block p-5 transition hover:border-brand-500">
                    <p className="text-sm font-medium text-brand-700">{formatEventTime(e.starts_at, e.ends_at, e.timezone)}</p>
                    <p className="font-semibold">{e.groups?.name}</p>
                    <p className="text-sm text-slate-600">{e.venue_name}{e.groups?.area ? ` · ${e.groups.area}` : ""}</p>
                    <div className="mt-2"><Badge tone="green">{skillRange(e.min_skill, e.max_skill)}</Badge></div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
