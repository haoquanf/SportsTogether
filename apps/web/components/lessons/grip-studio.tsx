"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const GripViewer3D = dynamic(() => import("./grip-viewer-3d").then((m) => m.GripViewer3D), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-slate-400">Loading 3D hand…</div>,
});

export type GripTab = {
  id: string;
  label: string;
  kind: "grip" | "technique" | "mistake";
  title: string;
  when: string;
  cues: string[];
  pressure: number; // out of 10
  animated?: boolean;
};

export function GripStudio({ tabs }: { tabs: GripTab[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const tab = tabs.find((t) => t.id === active)!;
  const tone = { grip: "bg-brand-500", technique: "bg-blue-500", mistake: "bg-red-500" }[tab.kind];

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-3xl bg-[#06110c] text-white ring-1 ring-white/10">
      <div role="tablist" aria-label="Grips" className="flex gap-2 overflow-x-auto border-b border-white/10 p-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === active}
            onClick={() => setActive(t.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              t.id === active ? "bg-white text-ink" : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            {t.kind === "mistake" ? "✕ " : ""}{t.label}
          </button>
        ))}
      </div>
      <div className="grid min-w-0 grid-cols-1 lg:grid-cols-[1.35fr_1fr]">
        <div className="relative min-w-0 h-[380px] bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.18),transparent_65%)] sm:h-[460px]">
          <GripViewer3D grip={tab.id} className="h-full w-full cursor-grab active:cursor-grabbing" />
          <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2 text-xs">
            <span className={`rounded-full px-2.5 py-1 font-semibold ${tone}`}>
              {tab.kind === "mistake" ? "Common mistake" : tab.kind === "technique" ? "Technique" : "Grip"}
            </span>
            {tab.animated && <span className="rounded-full bg-white/10 px-2.5 py-1">▶ Animated</span>}
          </div>
          <p className="pointer-events-none absolute bottom-3 right-4 text-right text-xs text-slate-400">Drag to rotate · scroll or pinch to zoom · right-handed player</p>
        </div>
        <div className="min-w-0 border-t border-white/10 p-6 lg:border-l lg:border-t-0">
          <h3 className="text-2xl font-bold">{tab.title}</h3>
          <p className="mt-1 text-sm text-slate-400">{tab.when}</p>
          <ol className="mt-5 space-y-3">
            {tab.cues.map((c, i) => (
              <li key={c} className="flex gap-3">
                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${tab.kind === "mistake" && i === 0 ? "bg-red-500/20 text-red-300" : "bg-white/10 text-brand-400"}`}>{i + 1}</span>
                <span className="text-slate-200">{c}</span>
              </li>
            ))}
          </ol>
          <div className="mt-6">
            <div className="mb-1 flex justify-between text-xs text-slate-400"><span>Grip pressure</span><span>{tab.pressure}/10</span></div>
            <div className="h-2 rounded-full bg-white/10">
              <div className={`h-2 rounded-full transition-all ${tab.pressure >= 8 ? "bg-red-400" : "bg-brand-400"}`} style={{ width: `${tab.pressure * 10}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
