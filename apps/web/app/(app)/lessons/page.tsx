import Link from "next/link";
import { BADMINTON_COMING, LESSONS } from "@/lib/lessons";
import { Badge } from "@/components/avatar";
import { Couple } from "@/components/lessons/couple";

export const metadata = { title: "Lessons · Rally" };

export default function LessonsPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Lessons</h1>
        <p className="text-slate-600">Short, step-by-step lessons from coaches. Free to try.</p>
      </div>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold"><span aria-hidden>💃</span> Ballroom dance</h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {LESSONS.filter((l) => l.sport === "ballroom").map((l) => (
            <li key={l.slug}>
              <Link href={`/lessons/${l.slug}`} className="card grid h-full grid-cols-[1fr_110px] items-center gap-4 transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md">
                <div>
                  <div className="flex flex-wrap gap-2"><Badge tone="green">Demo lesson</Badge><Badge>{l.level}</Badge><Badge>{l.minutes} min</Badge></div>
                  <h3 className="mt-3 text-lg font-semibold">{l.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{l.summary}</p>
                  <p className="mt-3 text-sm font-medium text-brand-700">Start lesson →</p>
                </div>
                <div className="rounded-2xl bg-[#06110c] p-2"><Couple className="w-full" /></div>
              </Link>
            </li>
          ))}
          <li className="card flex flex-col justify-center border-dashed text-slate-500">
            <p className="font-medium text-slate-700">Coming next</p>
            <p className="text-sm">Waltz: right box and closed finish · Foxtrot basics · Rumba box · Cha cha basic</p>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold"><span aria-hidden>🏸</span> Badminton</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BADMINTON_COMING.map((l) => (
            <li key={l.title} className="card opacity-75">
              <div className="flex flex-wrap gap-2"><Badge>{l.level}</Badge><Badge>Filming soon</Badge></div>
              <h3 className="mt-3 font-semibold">{l.title}</h3>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
