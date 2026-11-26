import Link from "next/link";
import { notFound } from "next/navigation";
import { getLesson, LESSONS, NDCA_SOURCE } from "@/lib/lessons";
import { Badge } from "@/components/avatar";
import { Couple } from "@/components/lessons/couple";
import { StepDiagram } from "@/components/lessons/step-diagram";

export function generateStaticParams() {
  return LESSONS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const lesson = getLesson((await params).slug);
  return { title: lesson ? `${lesson.title} · ZeniSports` : "Lesson · ZeniSports" };
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const lesson = getLesson((await params).slug);
  if (!lesson) notFound();

  return (
    <article className="space-y-8">
      <Link href="/lessons" className="text-sm text-slate-600 hover:text-brand-700">← All lessons</Link>

      <header className="relative overflow-hidden rounded-3xl bg-[#06110c] px-6 py-10 text-white sm:px-10">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(244,114,182,0.25),transparent_55%)]" />
        <div className="relative grid items-center gap-8 md:grid-cols-[1.5fr_1fr]">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="green">Ballroom dance · Demo lesson</Badge>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{lesson.level}</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{lesson.minutes} min</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{lesson.title}</h1>
            {lesson.intro.map((p) => <p key={p} className="mt-3 max-w-2xl text-slate-300">{p}</p>)}
          </div>
          <Couple className="mx-auto w-48 md:w-full md:max-w-[240px]" />
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card">
          <h2 className="mb-3 text-lg font-semibold">At a glance</h2>
          <dl className="divide-y divide-slate-100">
            {lesson.atAGlance.map(([k, v]) => (
              <div key={k} className="grid grid-cols-3 gap-2 py-2"><dt className="text-sm font-medium text-slate-500">{k}</dt><dd className="col-span-2">{v}</dd></div>
            ))}
          </dl>
        </section>
        <section className="card">
          <h2 className="mb-3 text-lg font-semibold">Getting into hold</h2>
          <ol className="list-inside list-decimal space-y-2 text-slate-700">
            {lesson.hold.map((h) => <li key={h}>{h}</li>)}
          </ol>
        </section>
      </div>

      {lesson.figures.map((f, i) => (
        <section key={f.id} className="card" aria-labelledby={`fig-${f.id}`}>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">Figure {i + 1} of {lesson.figures.length}</p>
          <h2 id={`fig-${f.id}`} className="mt-1 text-2xl font-bold">{f.name}</h2>
          <p className="text-sm text-slate-500">NDCA name: {f.ndcaName}</p>
          <p className="mt-2 max-w-3xl text-slate-700">{f.summary}</p>
          <div className="mt-6"><StepDiagram figure={f} /></div>
          <div className="mt-6 rounded-xl bg-amber-50 p-4">
            <p className="mb-1 font-semibold text-amber-900">Coach&apos;s tips</p>
            <ul className="list-inside list-disc space-y-1 text-amber-900">{f.tips.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        </section>
      ))}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card">
          <h2 className="mb-3 text-lg font-semibold">Put it together</h2>
          <ol className="list-inside list-decimal space-y-2 text-slate-700">{lesson.practice.map((p) => <li key={p}>{p}</li>)}</ol>
        </section>
        <section className="card">
          <h2 className="mb-1 text-lg font-semibold">Bronze competition rules</h2>
          <p className="mb-3 text-sm text-slate-500">Summarised from the NDCA closed-syllabus rules for Bronze American Smooth Waltz.</p>
          <ul className="list-inside list-disc space-y-2 text-slate-700">{lesson.rules.map((r) => <li key={r}>{r}</li>)}</ul>
        </section>
      </div>

      <section className="card">
        <h2 className="mb-1 text-lg font-semibold">Your Bronze Waltz roadmap</h2>
        <p className="mb-4 text-sm text-slate-500">Figures allowed at Bronze level on the NDCA syllabus. The ones in this lesson are ticked.</p>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {lesson.syllabus.map((s) => (
            <li key={s.name} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${s.inLesson ? "bg-brand-50 font-medium text-brand-800" : "bg-slate-50 text-slate-600"}`}>
              <span aria-hidden>{s.inLesson ? "✓" : "○"}</span>{s.name}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-brand-600 to-emerald-700 px-8 py-8 text-white">
        <div>
          <h2 className="text-2xl font-bold">Ready to dance with people?</h2>
          <p className="text-brand-50">Find a ballroom group or start one, and post a practice session.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/groups" className="btn bg-white text-brand-700 hover:bg-brand-50">Find a group</Link>
          <Link href="/groups/new" className="btn border border-white/40 text-white hover:bg-white/10">Start a group</Link>
        </div>
      </section>

      <p className="text-xs text-slate-500">
        Figure names and Bronze rules are summarised from the{" "}
        <a href={NDCA_SOURCE.url} target="_blank" rel="noreferrer" className="underline">{NDCA_SOURCE.title}</a>.
        Step-by-step descriptions and diagrams are our own and simplified for beginners. This is a demo lesson and is not endorsed by the NDCA.
      </p>
    </article>
  );
}
