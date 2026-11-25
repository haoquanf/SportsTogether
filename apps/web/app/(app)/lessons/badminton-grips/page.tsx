import Link from "next/link";
import { Badge } from "@/components/avatar";
import { GripStudio, type GripTab } from "@/components/lessons/grip-studio";

export const metadata = { title: "Grip and finger technique · Badminton lesson · Rally" };

const TABS: GripTab[] = [
  {
    id: "forehand", label: "Forehand grip", kind: "grip", title: "Forehand grip",
    when: "Your default grip: clears, smashes, drops and forehand drives.",
    pressure: 3,
    cues: [
      "Hold the racket by its shaft with your other hand, frame edge pointing up.",
      "Shake hands with the handle: your palm is parallel to the strings.",
      "The V between your thumb and index finger sits on the top edge of the handle.",
      "Separate your index finger slightly, like a trigger.",
      "Hold near the end of the handle, with a little gap between palm and handle.",
    ],
  },
  {
    id: "backhand", label: "Backhand thumb grip", kind: "grip", title: "Backhand thumb grip",
    when: "Backhand drives, blocks, lifts and backhand clears.",
    pressure: 3,
    cues: [
      "Start from the forehand grip.",
      "Turn the handle slightly so your thumb lands on the wide flat back of the handle (gold in the 3D view).",
      "Press the pad of your thumb flat along the handle. Don't wrap it around.",
      "Let your fingers slide down a little and stay relaxed.",
      "Push with the thumb at contact for power.",
    ],
  },
  {
    id: "smash", label: "Finger power (smash)", kind: "technique", animated: true, title: "Finger power on the smash",
    when: "Where real smash power comes from: a late squeeze, not a tight grip.",
    pressure: 9,
    cues: [
      "Stay loose while you prepare, at about 2 or 3 out of 10.",
      "Just before contact, squeeze hard with your middle, ring and little fingers.",
      "At the same moment, rotate your forearm (pronation). The 3D view shows both together.",
      "Relax straight after the hit, ready for the next shot.",
      "Power comes from squeeze plus rotation, not from flicking the wrist.",
    ],
  },
  {
    id: "net", label: "Net-shot finesse", kind: "technique", animated: true, title: "Net-shot finesse",
    when: "Spinning net shots, tumbles and gentle lifts.",
    pressure: 1,
    cues: [
      "Hold the handle in your fingers, not your palm, a little higher up for control.",
      "Use very light pressure, as if holding a pen.",
      "Steer with your thumb and index finger. Small finger pushes, no arm swing.",
      "Keep the racket head up and meet the shuttle early, close to the tape.",
    ],
  },
  {
    id: "panhandle", label: "Panhandle grip", kind: "mistake", title: "Mistake: the panhandle grip",
    when: "Holding the racket like a frying pan, strings facing forward.",
    pressure: 5,
    cues: [
      "What it looks like: the V of thumb and index sits on the wide back of the handle, strings face the net.",
      "Why it hurts: it blocks forearm rotation, so clears fall short and smashes are flat.",
      "Fix it: turn the handle a quarter turn and shake hands again.",
      "It's only useful for flat net kills and some front-court pushes.",
    ],
  },
  {
    id: "fist", label: "Death grip", kind: "mistake", title: "Mistake: the death grip",
    when: "Squeezing tight all the time, with the handle deep in the palm.",
    pressure: 10,
    cues: [
      "What it looks like: a fist around the handle with no gap in the palm.",
      "Why it hurts: tired forearm, slow reactions, and no room left to squeeze for power.",
      "Fix it: hold at 3 out of 10 between shots. A partner should be able to pull the racket out.",
      "Keep a finger's width of space between your palm and the handle.",
    ],
  },
];

const MISTAKES = [
  ["Panhandle (frying-pan) grip", "Shake hands with the handle; strings parallel to your palm."],
  ["Squeezing all the time", "Relax to 3/10 between shots; squeeze only at contact."],
  ["Thumb wrapped round on the backhand", "Press the thumb pad flat on the wide back bevel."],
  ["Holding high up the handle for power shots", "Hold near the end for clears and smashes; move up only at the net."],
  ["Handle buried in the palm", "Hold in the fingers with a small gap so they can squeeze."],
  ["Flicking the wrist for power", "Rotate the forearm and squeeze the fingers instead."],
];

const DRILLS = [
  ["Grip switch", "Hold your forehand grip. A partner calls “forehand” or “backhand” and you switch without looking. 3 sets of 30 calls."],
  ["Squeeze and release", "Hold loosely, squeeze hard for an instant, relax. Feel the racket head kick. 3 sets of 20."],
  ["Wall taps", "Stand 2 m from a wall and tap the shuttle using only finger squeeze and forearm rotation. 2 minutes each grip."],
  ["Net tumbles", "With a fingertip grip, play 50 gentle net shots, steering only with thumb and index finger."],
];

export default function GripLessonPage() {
  return (
    <article className="space-y-10">
      <Link href="/lessons" className="text-sm text-slate-600 hover:text-brand-700">← All lessons</Link>

      <header>
        <div className="flex flex-wrap gap-2">
          <Badge tone="green">🏸 Badminton · Demo lesson</Badge>
          <Badge>All levels</Badge>
          <Badge>10 min</Badge>
          <Badge tone="blue">Interactive 3D</Badge>
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">Grip and fingers: the hidden power in badminton</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">
          Most players look at their arm for power. Coaches look at the hand. How you hold the racket, and when you squeeze it, decides how hard you hit, how fast you react and how delicate your net play can be.
          Pick a grip below and turn the 3D hand around to see it from any angle.
        </p>
      </header>

      <GripStudio tabs={TABS} />

      <section className="grid gap-6 md:grid-cols-3">
        {[
          ["Hold loose, hit tight", "Between shots grip at about 3 out of 10. The squeeze happens only in the instant of contact."],
          ["Fingers, not fist", "Keep the handle in your fingers with a small gap in the palm. That gap is your power reserve."],
          ["Switch without thinking", "Good players change between forehand and backhand grips in a fraction of a second. Drill it until it's automatic."],
        ].map(([t, d]) => (
          <div key={t} className="card">
            <h2 className="text-lg font-semibold">{t}</h2>
            <p className="mt-1 text-slate-600">{d}</p>
          </div>
        ))}
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

      <section className="card">
        <h2 className="text-2xl font-bold">Check yourself</h2>
        <ul className="mt-4 space-y-2 text-slate-700">
          <li>☐ While waiting, could a partner slide the racket out of your hand? (They should be able to.)</li>
          <li>☐ Can you fit a fingertip between your palm and the handle?</li>
          <li>☐ In your forehand grip, are the strings parallel to your palm?</li>
          <li>☐ On the backhand, is your thumb flat on the back of the handle, not wrapped round it?</li>
          <li>☐ Can you switch grips 10 times in 10 seconds without looking?</li>
        </ul>
      </section>

      <section className="relative overflow-hidden rounded-3xl bg-[#06110c] px-8 py-10 text-white">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.25),transparent_60%)]" />
        <div className="relative max-w-2xl">
          <Badge tone="blue">Coming to the AI coach</Badge>
          <h2 className="mt-3 text-2xl font-bold">Grip check from a close-up clip</h2>
          <p className="mt-2 text-slate-300">
            We&apos;re adding hand tracking (21 points per hand) to the AI coach. Film a 5-second close-up of your grip and it will tell you if your thumb, V and finger gap match the coach&apos;s.
          </p>
        </div>
      </section>

      <p className="text-xs text-slate-500">
        Demo lesson based on standard badminton coaching practice. 3D hand and racket are original models built for Rally. Grips shown for a right-handed player; left-handers mirror everything.
      </p>
    </article>
  );
}
