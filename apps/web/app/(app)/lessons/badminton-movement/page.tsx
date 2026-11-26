import Link from "next/link";
import { Badge } from "@/components/avatar";
import { BodyStudio } from "@/components/lessons/body-studio";

export const metadata = { title: "Footwork and full-body technique · Badminton lesson · ZeniSports" };

const CHAIN = [
  ["🦵", "Legs", "Every shot starts from the floor. Bent knees and a push from the right foot give you speed and power."],
  ["🧍", "Hips and trunk", "Turn side-on, then rotate the hips first and the chest after. This passes the power up the body."],
  ["🏸", "Racket arm", "Elbow leads, forearm rotates, fingers squeeze. The arm is the last link, not the engine."],
  ["✋", "Other arm", "Points at the shuttle, then pulls down to speed up the rotation and keep your balance."],
];

const MISTAKES = [
  ["Standing flat-footed", "Stay on the balls of your feet and split step every time your opponent hits."],
  ["Reaching with the arm instead of the legs", "Take one more step or a longer lunge so you hit in front, not beside you."],
  ["Front knee past the toes in the lunge", "Land heel first with the knee over the ankle. It protects the knee and lets you push back."],
  ["Crossing the feet going backwards", "Chassé: the back foot moves, the front foot closes towards it, without crossing."],
  ["Hitting overheads square to the net", "Turn side-on before you swing so the hips and trunk can rotate into the shot."],
  ["Watching your own shot", "Recover to the middle straight after hitting and watch your opponent."],
];

const DRILLS = [
  ["Split-step timing", "A partner mimes a hit; you split step at the moment of their swing. 3 sets of 20, then add a push-off in the direction they point."],
  ["Six-corner shadow", "From the middle, move to each corner, play the shot without a shuttle, and return. 6 rounds of 30 seconds, 30 seconds rest."],
  ["Lunge and recover", "10 lunges to each front corner, holding each for one second, then push back to base. Keep your chest up."],
  ["Chassé and jump", "Chassé back to the forehand corner, jump and scissor as you play a shadow smash, then chassé back. 3 sets of 10."],
];

export default function MovementLessonPage() {
  return (
    <article className="space-y-10">
      <Link href="/lessons" className="text-sm text-slate-600 hover:text-brand-700">← All lessons</Link>

      <header>
        <div className="flex flex-wrap gap-2">
          <Badge tone="green">🏸 Badminton · Demo lesson</Badge>
          <Badge>All levels</Badge>
          <Badge>15 min</Badge>
          <Badge tone="blue">Interactive 3D</Badge>
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">Footwork and full-body technique</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">
          Good badminton is played with the whole body. Pick a move, watch it in slow motion and turn the player around. At every phase you&apos;ll see what the legs, trunk, racket arm, other arm and eyes should be doing.
        </p>
      </header>

      <BodyStudio />

      <section>
        <h2 className="text-2xl font-bold">Power travels from the floor up</h2>
        <p className="mt-1 text-slate-600">Coaches call it the kinetic chain. Each part hands its speed to the next one.</p>
        <ol className="mt-5 grid gap-4 md:grid-cols-4">
          {CHAIN.map(([icon, t, d], i) => (
            <li key={t} className="card">
              <p className="text-2xl" aria-hidden>{icon}</p>
              <h3 className="mt-2 font-semibold">{i + 1}. {t}</h3>
              <p className="mt-1 text-sm text-slate-600">{d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-slate-600">
          The last link, the hand, has its own lesson: <Link href="/lessons/badminton-grips" className="font-medium text-brand-700 hover:underline">grip and finger power</Link>.
        </p>
      </section>

      <section className="card">
        <h2 className="text-2xl font-bold">Common mistakes and quick fixes</h2>
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {MISTAKES.map(([m, f]) => (
            <li key={m} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="font-medium text-red-700">✕ {m}</p>
              <p className="mt-1 text-slate-700"><span className="font-medium text-brand-700">✓ Fix:</span> {f}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="text-2xl font-bold">Drills to make it stick</h2>
        <ol className="mt-5 grid gap-4 md:grid-cols-2">
          {DRILLS.map(([t, d], i) => (
            <li key={t} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink font-bold text-white">{i + 1}</span>
              <div><p className="font-semibold">{t}</p><p className="text-slate-600">{d}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="relative overflow-hidden rounded-3xl bg-[#06110c] px-8 py-10 text-white">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(34,197,94,0.25),transparent_60%)]" />
        <div className="relative max-w-2xl">
          <Badge tone="blue">How the AI coach uses this</Badge>
          <h2 className="mt-3 text-2xl font-bold">Compare your clip to the coach, joint by joint</h2>
          <p className="mt-2 text-slate-300">
            The AI coach tracks the same body points you see here (shoulders, elbows, wrists, hips, knees and ankles) in a phone clip. It lines your swing up with a coach&apos;s clip, phase by phase, and points out the biggest difference, such as a front knee past the toes or a square-on stance.
          </p>
        </div>
      </section>

      <p className="text-xs text-slate-500">
        Demo lesson based on standard badminton coaching practice. The 3D player is an original model built for ZeniSports and is simplified; real movement varies with the shot and the player. Shown for a right-handed player; left-handers mirror everything.
      </p>
    </article>
  );
}
