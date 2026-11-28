import Link from "next/link";
import { FeatureTabs } from "@/components/landing/feature-tabs";
import { CompareScreen, PhoneFrame, ProgressScreen, Skeleton } from "@/components/landing/screens";
import { Couple } from "@/components/lessons/couple";
import { InviteCard } from "@/components/invite-card";

type Pt = [number, number];
const LUNGE: Record<string, Pt> = {
  head: [96, 62], neck: [98, 78], shR: [106, 84], shL: [90, 86], elR: [132, 84], wrR: [156, 80],
  elL: [72, 98], wrL: [56, 108], hipR: [102, 130], hipL: [94, 130], knR: [136, 150], anR: [138, 192],
  knL: [72, 162], anL: [44, 190],
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">{children}</p>;
}

/** Promotional sections for signed-in members, so Home also shows off what ZeniSports can do. */
export function HomeShowcase({ premium }: { premium: boolean }) {
  return (
    <div className="space-y-14 pt-6">
      {/* 3D lessons */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Eyebrow>New · interactive 3D</Eyebrow>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Learn it from every angle</h2>
            <p className="mt-1 text-slate-600">Turn the player around, slow it down and step through each phase.</p>
          </div>
          <Link href="/lessons" className="text-sm font-medium text-brand-700 hover:underline">All lessons →</Link>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <Link href="/lessons/badminton-movement" data-track="Home: Footwork lesson" className="group overflow-hidden rounded-3xl bg-[#06110c] text-white transition hover:-translate-y-1">
            <div className="relative h-44 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.3),transparent_65%)]">
              <svg viewBox="20 30 170 180" className="mx-auto h-full" aria-hidden><Skeleton pose={LUNGE} /></svg>
              <span className="absolute left-4 top-4 rounded-full bg-brand-500 px-2.5 py-1 text-xs font-semibold">3D</span>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-400">🏸 Badminton · 15 min</p>
              <h3 className="mt-1 text-lg font-semibold">Footwork and full-body technique</h3>
              <p className="mt-1 text-sm text-slate-300">Split step, lunge, clear and jump smash, with cues for legs, trunk and both arms.</p>
              <p className="mt-4 text-sm font-medium text-brand-400 group-hover:underline">Start lesson →</p>
            </div>
          </Link>
          <Link href="/lessons/badminton-grips" data-track="Home: Grip lesson" className="group overflow-hidden rounded-3xl bg-[#0b1220] text-white transition hover:-translate-y-1">
            <div className="relative flex h-44 items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.3),transparent_65%)]">
              <span className="text-7xl" aria-hidden>✋</span>
              <span className="absolute left-4 top-4 rounded-full bg-blue-500 px-2.5 py-1 text-xs font-semibold">3D</span>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-400">🏸 Badminton · 10 min</p>
              <h3 className="mt-1 text-lg font-semibold">Grip and finger power</h3>
              <p className="mt-1 text-sm text-slate-300">The hidden source of a fast smash and a delicate net shot, on a 3D hand.</p>
              <p className="mt-4 text-sm font-medium text-blue-300 group-hover:underline">Start lesson →</p>
            </div>
          </Link>
          <Link href="/lessons/ballroom-waltz-bronze-basics" data-track="Home: Waltz lesson" className="group overflow-hidden rounded-3xl bg-[#14060f] text-white transition hover:-translate-y-1">
            <div className="relative flex h-44 items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(244,114,182,0.3),transparent_65%)] p-6">
              <Couple className="h-full" />
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-400">💃 Ballroom · 12 min</p>
              <h3 className="mt-1 text-lg font-semibold">Waltz: your first steps</h3>
              <p className="mt-1 text-sm text-slate-300">Animated footwork for leader and follower, count by count.</p>
              <p className="mt-4 text-sm font-medium text-pink-300 group-hover:underline">Start lesson →</p>
            </div>
          </Link>
        </div>
      </section>

      {/* AI coach */}
      <section className="relative overflow-hidden rounded-3xl bg-[#06110c] px-6 py-10 text-white sm:px-10">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(34,197,94,0.28),transparent_60%)]" />
        <div className="relative grid items-center gap-10 md:grid-cols-2">
          <div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">Coming soon to your account</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight">Your AI coach is almost here</h2>
            <p className="mt-3 text-slate-300">
              Film a 10-second clip of your clear or smash. ZeniSports tracks 33 points on your body, lines your swing up next to a local coach, and tells you the one change that will help most.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-slate-200">
              <li>✓ A score out of 100 for every clip</li>
              <li>✓ Side-by-side compare with the coach, synced at contact</li>
              <li>✓ Progress history, so you can see yourself improve</li>
            </ul>
            <p className="mt-6 text-sm text-slate-400">You&apos;re signed up, so you&apos;ll be among the first to try it.</p>
          </div>
          <div className="flex justify-center gap-4">
            <div className="h-[380px] w-[200px] overflow-hidden"><div className="origin-top-left scale-[0.77]"><PhoneFrame><CompareScreen /></PhoneFrame></div></div>
            <div className="hidden h-[380px] w-[200px] translate-y-8 overflow-hidden sm:block"><div className="origin-top-left scale-[0.77]"><PhoneFrame><ProgressScreen /></PhoneFrame></div></div>
          </div>
        </div>
      </section>

      {/* Everything in one app */}
      <section className="rounded-3xl bg-white px-4 py-10 ring-1 ring-slate-200 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Everything in one app</Eyebrow>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">What you can do with ZeniSports</h2>
        </div>
        <div className="mt-8"><FeatureTabs /></div>
      </section>

      <div className={`grid gap-5 ${premium ? "" : "md:grid-cols-2"}`}>
        {!premium && (
          <section className="relative overflow-hidden rounded-3xl bg-ink p-7 text-white">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.25),transparent_60%)]" />
            <div className="relative">
              <span className="rounded-full bg-amber-400 px-2.5 py-1 text-xs font-semibold text-ink">Premium</span>
              <h2 className="mt-4 text-2xl font-bold">Get 10× more coaching</h2>
              <p className="mt-2 text-slate-300">30 AI analyses a month instead of 3, side-by-side compare, full progress history and every premium lesson.</p>
              <p className="mt-4"><span className="text-3xl font-bold">$6.58</span> <span className="text-slate-400">/ month, billed yearly</span></p>
              <Link href="/profile#membership" data-track="Home: See Premium" className="btn mt-5 bg-amber-400 font-semibold text-ink hover:bg-amber-300">See Premium</Link>
            </div>
          </section>
        )}
        <InviteCard />
      </div>
    </div>
  );
}
