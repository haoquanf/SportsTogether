"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { MOVES, phaseAt } from "@/lib/moves";

const BodyViewer3D = dynamic(() => import("./body-viewer-3d").then((m) => m.BodyViewer3D), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-slate-400">Loading 3D player…</div>,
});

const ORDER = ["ready", "split", "lunge", "rear", "clear", "smash", "net"];
const PARTS = [
  ["legs", "🦵", "Legs and feet"],
  ["trunk", "🧍", "Hips and trunk"],
  ["arm", "🏸", "Racket arm"],
  ["other", "✋", "Other arm"],
  ["eyes", "👀", "Head and eyes"],
] as const;
const SPEEDS = [0.25, 0.5, 1];

export function BodyStudio() {
  const [moveId, setMoveId] = useState("clear");
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(0.5);
  const [seek, setSeek] = useState<{ t: number; n: number } | null>(null);
  const [time, setTime] = useState(0);
  const move = MOVES[moveId];
  const phaseIdx = phaseAt(move, time);
  const phase = move.phases[phaseIdx];

  const goTo = useCallback((t: number) => {
    setPlaying(false);
    setTime(t);
    setSeek((s) => ({ t, n: (s?.n ?? 0) + 1 }));
  }, []);

  const pick = (id: string) => {
    setMoveId(id);
    setTime(0);
    setPlaying(true);
  };

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-3xl bg-[#06110c] text-white ring-1 ring-white/10">
      <div role="tablist" aria-label="Moves" className="flex gap-2 overflow-x-auto border-b border-white/10 p-3">
        {ORDER.map((id) => (
          <button
            key={id}
            role="tab"
            aria-selected={id === moveId}
            onClick={() => pick(id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              id === moveId ? "bg-white text-ink" : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            {MOVES[id].label}
          </button>
        ))}
      </div>

      <div className="grid min-w-0 grid-cols-1 lg:grid-cols-[1.35fr_1fr]">
        <div className="min-w-0">
          <div className="relative h-[380px] bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.15),transparent_65%)] sm:h-[480px]">
            <BodyViewer3D move={moveId} playing={playing} speed={speed} seek={seek} onTime={setTime} className="h-full w-full cursor-grab active:cursor-grabbing" />
            <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-brand-500 px-2.5 py-1 font-semibold">{phase.name}</span>
              <span className="rounded-full bg-white/10 px-2.5 py-1">{speed === 1 ? "Full speed" : `${speed}× slow motion`}</span>
            </div>
            <p className="pointer-events-none absolute bottom-3 right-4 text-right text-xs text-slate-400">Drag to rotate · pinch or scroll to zoom · gold line = racket path</p>
          </div>

          {/* Timeline with phase markers */}
          <div className="border-t border-white/10 px-4 pb-4 pt-3">
            <div className="relative h-2 rounded-full bg-white/10">
              <div className="absolute inset-y-0 left-0 rounded-full bg-brand-400" style={{ width: `${Math.min(100, (time / move.duration) * 100)}%` }} />
              {move.phases.map((p, i) => (
                <button
                  key={p.name}
                  onClick={() => goTo(p.t)}
                  aria-label={`Go to ${p.name}`}
                  className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[#06110c] ${i === phaseIdx ? "bg-white" : "bg-slate-500 hover:bg-slate-300"}`}
                  style={{ left: `${(p.t / move.duration) * 100}%` }}
                />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setPlaying((p) => !p)}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-200"
              >
                {playing ? "❚❚ Pause" : "▶ Play"}
              </button>
              <button
                onClick={() => goTo(move.phases[Math.max(0, phaseIdx - 1)].t)}
                className="rounded-full bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
                aria-label="Previous phase"
              >
                ◀ Step
              </button>
              <button
                onClick={() => goTo(move.phases[Math.min(move.phases.length - 1, phaseIdx + (playing ? 0 : 1))].t)}
                className="rounded-full bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
                aria-label="Next phase"
              >
                Step ▶
              </button>
              <div className="ml-auto flex gap-1 rounded-full bg-white/5 p-1" role="group" aria-label="Speed">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    aria-pressed={s === speed}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${s === speed ? "bg-white text-ink" : "text-slate-300 hover:bg-white/10"}`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 border-t border-white/10 p-6 lg:border-l lg:border-t-0">
          <h3 className="text-2xl font-bold">{move.label}</h3>
          <p className="mt-1 text-sm text-slate-400">{move.summary}</p>

          <ol className="mt-4 flex flex-wrap gap-2 text-xs">
            {move.phases.map((p, i) => (
              <li key={p.name}>
                <button
                  onClick={() => goTo(p.t)}
                  className={`rounded-full px-3 py-1.5 font-medium transition ${i === phaseIdx ? "bg-brand-500 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}
                >
                  {i + 1}. {p.name}
                </button>
              </li>
            ))}
          </ol>

          <dl className="mt-5 space-y-3" aria-live="polite">
            {PARTS.map(([key, icon, label]) => (
              <div key={key} className="flex gap-3 rounded-xl bg-white/5 p-3">
                <span aria-hidden className="text-xl leading-6">{icon}</span>
                <div className="min-w-0">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-brand-400">{label}</dt>
                  <dd className="mt-0.5 text-sm text-slate-200">{phase.cues[key]}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
