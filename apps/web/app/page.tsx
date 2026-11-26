import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { FeatureTabs } from "@/components/landing/feature-tabs";
import { Pricing } from "@/components/landing/pricing";
import { CoachScreen, GroupsScreen, LessonScreen, PhoneFrame, ProgressScreen, Skeleton } from "@/components/landing/screens";

const STEPS = [
  { n: "01", title: "Film", text: "Prop your phone up side-on and record a 10-second clip of your clear or smash.", Screen: LessonScreen },
  { n: "02", title: "Get your score", text: "In under a minute you see your skeleton next to the coach's, a score, and what to fix first.", Screen: CoachScreen },
  { n: "03", title: "Practise", text: "Take one tip to your next session. Short lessons show the drill that fixes it.", Screen: ProgressScreen },
  { n: "04", title: "Play", text: "Find a session at your level nearby, RSVP, and put it into practice with people who love the game.", Screen: GroupsScreen },
];

const FAQ = [
  ["Do I need any special equipment?", "No. Any phone camera works. Film from the side, about 3 to 5 metres away, with your whole body in the frame."],
  ["How accurate is the AI coach?", "It tracks 33 body points in every frame and compares your joint angles and timing with a coach doing the same stroke. Every tip comes from those measurements, not guesswork, and if your clip is hard to read, the app tells you instead of guessing."],
  ["Is it only for good players?", "Not at all. Groups, sessions and lessons are tagged from beginner to advanced, and tips are written in plain language, not jargon."],
  ["Who can see my videos?", "Only you. Clips are private by default, used only to analyse your technique, and you can delete them, or your whole account, at any time."],
  ["Which sports can I use it for?", "Badminton and ballroom dance today, with basketball next. Groups and lessons work for every sport; the AI coach starts with badminton and adds ballroom next."],
  ["Which strokes does the AI coach analyse?", "In badminton we're starting with the forehand clear and the smash, and adding the drop shot, backhand clear and serve next."],
  ["Is it only in Boston?", "Groups and sessions launch in the Boston area first. The AI coach and lessons work anywhere."],
];

function Nav({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white"><span aria-hidden>🏸</span> ZeniSports</Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
          <a href="#sports" className="hover:text-white">Sports</a>
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#how" className="hover:text-white">How it works</a>
          <Link href="/lessons" className="hover:text-white">Lessons</Link>
          <a href="#pricing" className="hover:text-white">Pricing</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          {signedIn ? (
            <Link href="/home" className="btn bg-white py-2 text-ink hover:bg-slate-100">Open app</Link>
          ) : (
            <>
              <Link href="/login" className="font-medium text-slate-200 hover:text-white">Log in</Link>
              <Link href="/signup" data-track="Nav: Sign up free" className="btn bg-brand-500 py-2 text-white hover:bg-brand-600">Sign up free</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function SectionHeading({ eyebrow, title, text, dark = false }: { eyebrow: string; title: string; text?: string; dark?: boolean }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className={`text-sm font-semibold uppercase tracking-widest ${dark ? "text-brand-400" : "text-brand-600"}`}>{eyebrow}</p>
      <h2 className={`mt-3 text-3xl font-bold tracking-tight sm:text-5xl ${dark ? "text-white" : "text-ink"}`}>{title}</h2>
      {text && <p className={`mt-4 text-lg ${dark ? "text-slate-300" : "text-slate-600"}`}>{text}</p>}
    </div>
  );
}

export default async function Landing() {
  const signedIn = Boolean(await getCurrentUser());
  return (
    <div className="bg-slate-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#06110c] pb-20 pt-32 text-white sm:pt-40">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(34,197,94,0.25),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.15),transparent_50%)]" />
        <svg aria-hidden className="absolute inset-0 h-full w-full opacity-[0.04]" preserveAspectRatio="none" viewBox="0 0 100 100">
          <rect x="10" y="8" width="80" height="84" fill="none" stroke="white" strokeWidth="0.3" />
          <line x1="10" y1="50" x2="90" y2="50" stroke="white" strokeWidth="0.5" />
          <line x1="50" y1="8" x2="50" y2="92" stroke="white" strokeWidth="0.2" />
          <line x1="10" y1="35" x2="90" y2="35" stroke="white" strokeWidth="0.2" />
          <line x1="10" y1="65" x2="90" y2="65" stroke="white" strokeWidth="0.2" />
        </svg>
        <Nav signedIn={signedIn} />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-slate-300">
              <span className="h-2 w-2 rounded-full bg-brand-400" /> Now in early access in Boston
            </p>
            <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Your coach <span className="bg-gradient-to-r from-brand-400 to-emerald-200 bg-clip-text text-transparent">and crew</span> for the sports you love.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-300">
              Film a badminton stroke and get AI feedback next to a real coach in under a minute. Learn the Waltz step by step. Then find people near you to play or dance with tonight.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={signedIn ? "/home" : "/signup"} data-track={signedIn ? "Hero: Open the app" : "Hero: Get started free"} className="btn bg-brand-500 px-6 py-3 text-base text-white hover:bg-brand-600">
                {signedIn ? "Open the app" : "Get started free"}
              </Link>
              <Link href="/coach" data-track="Hero: Try the AI coach" className="btn border border-white/25 px-6 py-3 text-base text-white hover:bg-white/10">Try the AI coach</Link>
            </div>
            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-6">
              {[["33", "body points tracked"], ["< 60 s", "per analysis"], ["$0", "to get started"]].map(([n, l]) => (
                <div key={l}><dt className="sr-only">{l}</dt><dd className="text-2xl font-bold">{n}</dd><dd className="text-sm text-slate-400">{l}</dd></div>
              ))}
            </dl>
          </div>
          <div className="relative">
            <div aria-hidden className="absolute -inset-10 rounded-full bg-brand-500/20 blur-3xl" />
            <PhoneFrame className="relative rotate-[-3deg]"><CoachScreen /></PhoneFrame>
            <div className="absolute -left-2 top-16 hidden rounded-2xl border border-white/10 bg-slate-900/90 p-3 text-sm shadow-xl backdrop-blur sm:block lg:-left-10">
              <p className="text-xs text-slate-400">Elbow at contact</p>
              <p className="font-bold"><span className="text-amber-300">142°</span> <span className="text-slate-500">vs</span> <span className="text-blue-300">165°</span></p>
            </div>
            <div className="absolute -right-2 bottom-20 hidden rounded-2xl border border-white/10 bg-slate-900/90 p-3 text-sm shadow-xl backdrop-blur sm:block lg:-right-6">
              <p className="text-xs text-slate-400">Thursday doubles · Cambridge</p>
              <p className="font-semibold text-brand-400">✓ You&apos;re going</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sports */}
      <section id="sports" className="scroll-mt-10 mx-auto max-w-6xl px-5 pt-24">
        <SectionHeading eyebrow="One app, many sports" title="Pick your game" text="Start with badminton and ballroom dance in Boston. More sports are on the way." />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <Link href={signedIn ? "/groups" : "/signup"} className="group relative overflow-hidden rounded-3xl bg-[#06110c] p-7 text-white transition hover:-translate-y-1">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(34,197,94,0.35),transparent_60%)]" />
            <div className="relative">
              <p className="text-4xl" aria-hidden>🏸</p>
              <h3 className="mt-4 text-2xl font-bold">Badminton</h3>
              <p className="mt-2 text-slate-300">AI coach for your clear and smash, coach-led lessons, and local groups at every level.</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs">
                {["AI coach", "Lessons", "Groups"].map((t) => <span key={t} className="rounded-full bg-white/10 px-2.5 py-1">{t}</span>)}
              </div>
              <p className="mt-6 font-medium text-brand-400 group-hover:underline">Find a game →</p>
            </div>
          </Link>
          <Link href="/lessons/ballroom-waltz-bronze-basics" data-track="Sports: Waltz lesson" className="group relative overflow-hidden rounded-3xl bg-[#14060f] p-7 text-white transition hover:-translate-y-1">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(244,114,182,0.35),transparent_60%)]" />
            <div className="relative">
              <p className="text-4xl" aria-hidden>💃</p>
              <h3 className="mt-4 text-2xl font-bold">Ballroom dance</h3>
              <p className="mt-2 text-slate-300">Step-by-step lessons with animated footwork for leaders and followers, plus local practice groups.</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs">
                {["Lessons", "Groups", "AI coach soon"].map((t) => <span key={t} className="rounded-full bg-white/10 px-2.5 py-1">{t}</span>)}
              </div>
              <p className="mt-6 font-medium text-pink-300 group-hover:underline">Try the free Waltz lesson →</p>
            </div>
          </Link>
          <div className="relative overflow-hidden rounded-3xl border border-dashed border-slate-300 bg-white p-7">
            <p className="text-4xl" aria-hidden>🏀</p>
            <h3 className="mt-4 text-2xl font-bold">More coming</h3>
            <p className="mt-2 text-slate-600">Basketball is next, followed by more racket sports and dance styles.</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-600">
              {["Basketball", "Tennis", "Latin dance"].map((t) => <span key={t} className="rounded-full bg-slate-100 px-2.5 py-1">{t}</span>)}
            </div>
          </div>
        </div>
      </section>

      {/* Value statement */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 md:grid-cols-2">
        <div className="rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-800 p-8">
          <svg viewBox="0 0 400 230" className="w-full" role="img" aria-label="Your stroke drawn next to the coach's stroke">
            <rect x="0" y="0" width="400" height="230" rx="16" fill="#0f172a" />
            <text x="100" y="24" textAnchor="middle" fill="#4ade80" fontSize="13" fontWeight="600">You</text>
            <text x="300" y="24" textAnchor="middle" fill="#60a5fa" fontSize="13" fontWeight="600">Coach</text>
            <line x1="200" y1="30" x2="200" y2="215" stroke="#334155" strokeDasharray="4 4" />
            <g transform="translate(0 15)"><Skeleton pose={{ head: [100, 58], neck: [100, 74], shR: [108, 80], shL: [90, 82], elR: [124, 64], wrR: [118, 40], elL: [76, 70], wrL: [66, 52], hipR: [104, 128], hipL: [94, 128], knR: [114, 160], anR: [108, 196], knL: [84, 162], anL: [72, 194] }} /></g>
            <g transform="translate(0 15)"><Skeleton dx={200} colour="#60a5fa" /></g>
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">Built around your game</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">Not another generic tutorial.</h2>
          <p className="mt-5 text-lg text-slate-600">
            Videos online show you what a perfect smash looks like. ZeniSports shows you what <em>your</em> smash looks like, measured joint by joint against a local coach, and tells you the one change that will make the biggest difference.
          </p>
          <p className="mt-4 text-lg text-slate-600">
            Then it does what no tutorial can: it puts you on court with people at your level, a few minutes from home.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-10 bg-white py-24">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeading eyebrow="Features" title="The smarter way to get better at your sport" />
          <div className="mt-12"><FeatureTabs /></div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-10 bg-[#06110c] py-24">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeading dark eyebrow="How it works" title="Film. Fix. Play." text="Four steps from your first clip to your next great rally." />
          <ol className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <li key={s.n} className="text-white">
                <div className="relative h-[330px] overflow-hidden">
                  <div className="origin-top scale-[0.82]"><PhoneFrame><s.Screen /></PhoneFrame></div>
                  <div aria-hidden className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#06110c] to-transparent" />
                </div>
                <p className="mt-4 text-sm font-semibold text-brand-400">{s.n}</p>
                <h3 className="mt-1 text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-slate-400">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Community */}
      <section id="community" className="scroll-mt-10 py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">Community</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">Everything is better together.</h2>
            <p className="mt-5 text-lg text-slate-600">
              Join local badminton and ballroom groups, see who&apos;s going this week, and RSVP in one tap. Every session is tagged by level, so you always get a good match.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              {[["📍", "Groups on a map", "Filter by distance and level"], ["🎯", "Level-matched sessions", "Beginner to advanced"], ["⏳", "Smart waitlist", "Move up when a spot opens"], ["💬", "Group chat", "Comments on every session"]].map(([i, t, d]) => (
                <div key={t} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <p className="text-2xl" aria-hidden>{i}</p>
                  <p className="mt-2 font-semibold">{t}</p>
                  <p className="text-sm text-slate-500">{d}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2.5rem] bg-gradient-to-br from-emerald-900 to-slate-900 py-10">
            <PhoneFrame><GroupsScreen /></PhoneFrame>
          </div>
        </div>
      </section>

      {/* Early access (social proof placeholder until real beta numbers exist) */}
      <section className="px-5">
        <div className="mx-auto max-w-6xl rounded-[2.5rem] bg-gradient-to-r from-brand-600 to-emerald-700 px-8 py-14 text-white sm:px-14">
          <div className="grid items-center gap-10 md:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-100">Early access · Boston</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Be one of our founding players and clubs.</h2>
              <p className="mt-4 text-lg text-brand-50">
                We&apos;re launching with a small group of Boston-area players, coaches and clubs. Founding members get in first and help shape what we build next.
              </p>
            </div>
            <div className="space-y-3">
              <Link href="/signup" data-track="Community: Join as a player" className="btn w-full bg-white py-3 text-base text-brand-700 hover:bg-brand-50">Join as a player</Link>
              <Link href="/signup" data-track="Community: Coach or club sign-up" className="btn w-full border border-white/40 py-3 text-base text-white hover:bg-white/10">Sign up as a coach or club</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-10 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeading eyebrow="Pricing" title="Start free. Upgrade when you're ready." text="Groups and sessions are always free. Premium unlocks more AI coaching." />
          <div className="mt-10"><Pricing /></div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-10 bg-white py-24">
        <div className="mx-auto max-w-3xl px-5">
          <SectionHeading eyebrow="FAQ" title="Questions, answered" />
          <div className="mt-12 divide-y divide-slate-200 border-y border-slate-200">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-medium">
                  {q}
                  <span className="ml-4 text-2xl text-slate-400 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-slate-600">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-[#06110c] py-24 text-center text-white">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.25),transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl px-5">
          <h2 className="text-4xl font-bold tracking-tight sm:text-6xl">Stop guessing. Start improving.</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-300">Your first three analyses are free, and so are the games.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={signedIn ? "/home" : "/signup"} className="btn bg-brand-500 px-7 py-3 text-base text-white hover:bg-brand-600">
              {signedIn ? "Open the app" : "Get started free"}
            </Link>
            <Link href={signedIn ? "/groups" : "/login"} className="btn border border-white/25 px-7 py-3 text-base text-white hover:bg-white/10">
              {signedIn ? "Find a game" : "Log in"}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#040b08] py-12 text-sm text-slate-400">
        <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-8 px-5">
          <div>
            <p className="flex items-center gap-2 text-lg font-bold text-white"><span aria-hidden>🏸</span> ZeniSports</p>
            <p className="mt-2 max-w-xs">AI coaching, lessons and local groups for badminton, ballroom dance and more. Made in Boston.</p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-2">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
            <Link href="/groups" className="hover:text-white">Find a group</Link>
            <Link href="/lessons" className="hover:text-white">Lessons</Link>
            <Link href="/signup" className="hover:text-white">Sign up</Link>
          </div>
        </div>
        <div className="mx-auto mt-10 flex max-w-6xl flex-wrap justify-between gap-4 border-t border-white/10 px-5 pt-6">
          <p>© {new Date().getFullYear()} ZeniSports. All rights reserved.</p>
          <p>Privacy policy and terms coming before public launch.</p>
        </div>
      </footer>
    </div>
  );
}
