import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

const FEATURES = [
  { icon: "📍", title: "Find local games", text: "Join badminton groups near you and RSVP to sessions that match your level." },
  { icon: "🎥", title: "Learn from coaches", text: "Short lessons with on-screen annotations, filmed by real local coaches." },
  { icon: "🤖", title: "AI coach", text: "Upload a 10-second clip and see your skeleton next to the coach's, with clear tips." },
];

export default async function Home() {
  const current = await getCurrentUser();
  return (
    <div className="space-y-12">
      <section className="rounded-3xl bg-gradient-to-br from-brand-600 to-emerald-800 px-6 py-14 text-white sm:px-12">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-100">Badminton, made social</p>
        <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
          Play more, play better, with people near you.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-brand-50">
          Find a doubles night, learn the forehand clear, and get AI feedback on your own technique.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {current ? (
            <Link href="/home" className="btn bg-white text-brand-700 hover:bg-brand-50">Go to my home</Link>
          ) : (
            <>
              <Link href="/signup" className="btn bg-white text-brand-700 hover:bg-brand-50">Get started free</Link>
              <Link href="/login" className="btn border border-white/50 text-white hover:bg-white/10">Log in</Link>
            </>
          )}
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card">
            <div className="text-3xl" aria-hidden>{f.icon}</div>
            <h2 className="mt-3 text-lg font-semibold">{f.title}</h2>
            <p className="mt-1 text-slate-600">{f.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
