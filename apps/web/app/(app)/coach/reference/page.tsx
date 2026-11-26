import Link from "next/link";
import { Badge } from "@/components/avatar";
import { ReferenceBuilder } from "@/components/coach/reference-builder";

export const metadata = { title: "Build the coach reference · AI coach · ZeniSports", robots: { index: false } };

const BRIEF = [
  ["Camera", "Phone on a tripod or a steady shelf at about chest height, held still, landscape or portrait (keep it the same for every clip)."],
  ["Position", "Side-on to the coach, 3 to 5 metres away, level with where they hit. Film from the coach's racket-arm side (their right if right-handed), so the hitting arm is never hidden behind the body."],
  ["Frame", "Whole body in view the whole time: feet on the floor and the racket at full stretch above the head, with a little space around."],
  ["Clips", "5 to 10 separate clips, each with one smash from the ready position to the end of the follow-through (2 to 6 seconds). Same stroke every time: a forehand overhead smash."],
  ["Light and clothes", "Bright, even light with no strong window behind. Fitted clothes in a colour that stands out from the wall."],
  ["Settings", "30 or 60 frames per second, normal (not slow-motion) mode. On iPhone, set Camera format to Most Compatible so clips save as MP4."],
];

export default function ReferenceBuilderPage() {
  return (
    <article className="space-y-8">
      <Link href="/coach" className="text-sm text-slate-600 hover:text-brand-700">← AI coach</Link>
      <header>
        <div className="flex flex-wrap gap-2">
          <Badge tone="amber">For coaches</Badge>
          <Badge>Forehand overhead smash</Badge>
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Build the coach reference</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Every member&apos;s smash is compared with this reference. It is the average of the coach&apos;s clips, so the more consistent the clips, the fairer the scores.
        </p>
      </header>

      <section className="card">
        <h2 className="text-xl font-bold">What to film</h2>
        <dl className="mt-4 grid gap-3 md:grid-cols-2">
          {BRIEF.map(([t, d]) => (
            <div key={t} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <dt className="font-semibold">{t}</dt>
              <dd className="mt-1 text-sm text-slate-600">{d}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm text-slate-500">Get a signed release from the coach before their clip is shown to members.</p>
      </section>

      <ReferenceBuilder />
    </article>
  );
}
