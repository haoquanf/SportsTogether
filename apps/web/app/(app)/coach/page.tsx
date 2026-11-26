import Link from "next/link";
import { Badge } from "@/components/avatar";
import { CoachStudio } from "@/components/coach/coach-studio";

export const metadata = { title: "AI coach · Smash check · ZeniSports" };

const FILMING = [
  ["📐", "From your racket-arm side", "Phone level and side-on to you, on the same side as your racket arm (your right if you are right-handed), so it sees you in profile as you hit."],
  ["📏", "3 to 5 metres away", "Your whole body, from feet to racket at full stretch, stays in the frame the whole time."],
  ["💡", "Good light, one smash", "Bright, even light. One smash per clip, from getting ready to the follow-through: 2 to 6 seconds."],
];

const STEPS = [
  ["Finds your body", "A body-tracking model finds 33 points (shoulders, elbows, wrists, hips, knees, ankles…) in every frame, on your own device."],
  ["Lines you up with the coach", "Your swing is stretched or squeezed in time to match the coach's, moment by moment, so a faster or slower swing still compares fairly."],
  ["Measures each phase", "Knee bend while loading, trunk rotation, elbow height and arm extension at contact, and the follow-through."],
  ["Explains what to fix", "Your score out of 100 and the three changes that would help most, in plain words, with the joints highlighted in the replay."],
];

export default function CoachPage() {
  return (
    <article className="space-y-10">
      <header>
        <div className="flex flex-wrap gap-2">
          <Badge tone="green">🏸 Badminton</Badge>
          <Badge tone="blue">Beta</Badge>
          <Badge>Forehand overhead smash</Badge>
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">AI coach: check your smash</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">
          Film one smash from the side. In under a minute you get a score, the three things to fix first, and a replay of your skeleton next to the coach&apos;s with the problem joints lit up.
        </p>
        <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <span aria-hidden>🔒</span> Your video stays on your phone or computer. Only the analysis runs; nothing is uploaded.
        </p>
      </header>

      <CoachStudio />

      <section className="card">
        <h2 className="text-2xl font-bold">How to film for the best result</h2>
        <ul className="mt-5 grid gap-4 md:grid-cols-3">
          {FILMING.map(([icon, t, d]) => (
            <li key={t} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-2xl" aria-hidden>{icon}</p>
              <p className="mt-2 font-semibold">{t}</p>
              <p className="mt-1 text-sm text-slate-600">{d}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold">How it works</h2>
        <ol className="mt-5 grid gap-4 md:grid-cols-4">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="card">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink font-bold text-white">{i + 1}</span>
              <h3 className="mt-3 font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-slate-600">{d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-slate-600">
          New to the smash? Watch it in 3D first in the <Link href="/lessons/badminton-movement" className="font-medium text-brand-700 hover:underline">footwork and full-body lesson</Link>.
        </p>
      </section>

      <p className="text-xs text-slate-500">
        Beta. Coaches can build a reference from their own clips on the <Link href="/coach/reference" className="underline">reference builder</Link>. Body tracking by MediaPipe Pose (Apache 2.0).
      </p>
    </article>
  );
}
