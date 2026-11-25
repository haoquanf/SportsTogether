"use client";

import { useEffect, useMemo, useState } from "react";
import type { Figure } from "@/lib/lessons";

type Role = "leader" | "follower";
const BEAT_MS = 700; // a slow social waltz, about 86 beats a minute

function FootPrint({ x, y, label, facingUp, tone }: { x: number; y: number; label: string; facingUp: boolean; tone: "active" | "stance" | "ghost" }) {
  const fill = tone === "active" ? "#16a34a" : tone === "stance" ? "#0f172a" : "#e2e8f0";
  const text = tone === "ghost" ? "#94a3b8" : "#ffffff";
  return (
    <g transform={`translate(${x} ${y}) rotate(${facingUp ? 0 : 180})`}>
      <path d="M0 -15 C 7 -15 8 -6 7 1 C 6 8 5 14 0 15 C -5 14 -6 8 -7 1 C -8 -6 -7 -15 0 -15 Z" fill={fill} />
      <text y="4" textAnchor="middle" fontSize="9" fontWeight="700" fill={text} transform={facingUp ? "" : "rotate(180)"}>{label}</text>
    </g>
  );
}

export function StepDiagram({ figure }: { figure: Figure }) {
  const [role, setRole] = useState<Role>("leader");
  const [step, setStep] = useState(0); // 0 = starting position, n = after step n
  const [playing, setPlaying] = useState(false);
  const total = figure.steps.length;

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      setStep((s) => {
        if (s >= total) { setPlaying(false); return s; }
        return s + 1;
      });
    }, step === 0 ? 400 : BEAT_MS);
    return () => clearTimeout(t);
  }, [playing, step, total]);

  // Stance after each step. The follower dances the mirror image on the same spots with the other foot, facing the leader.
  const stances = useMemo(() => {
    const out = [{ L: figure.start.L, R: figure.start.R }];
    for (const s of figure.steps) {
      const prev = out[out.length - 1];
      out.push({ ...prev, [s.move.foot]: [s.move.x, s.move.y] as [number, number] });
    }
    return out;
  }, [figure]);

  const swap = (f: "L" | "R") => (role === "leader" ? f : f === "L" ? "R" : "L");
  const facingUp = role === "leader";
  const xs = stances.flatMap((s) => [s.L[0], s.R[0]]);
  const ys = stances.flatMap((s) => [s.L[1], s.R[1]]);
  const pad = 40;
  const vb = [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) - Math.min(...xs) + pad * 2, Math.max(...ys) - Math.min(...ys) + pad * 2];
  const current = stances[step];
  const active = step > 0 ? figure.steps[step - 1] : null;

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <div role="tablist" aria-label="Role" className="flex rounded-full bg-slate-200 p-1 text-sm font-medium">
            {(["leader", "follower"] as Role[]).map((r) => (
              <button key={r} role="tab" aria-selected={role === r} onClick={() => setRole(r)} className={`rounded-full px-3 py-1 capitalize ${role === r ? "bg-white shadow" : "text-slate-600"}`}>
                {r}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500">{facingUp ? "You face up the page ↑" : "You face down the page ↓"}</span>
        </div>
        <svg viewBox={vb.join(" ")} style={{ height: Math.min(440, Math.max(260, vb[3] * 1.8)) }} className="mx-auto mt-3 w-full" role="img" aria-label={`Floor diagram for ${figure.name}, ${role}`}>
          {/* ghost prints for every step, numbered */}
          {figure.steps.map((s, i) => (
            <g key={i} opacity={i < step ? 0.9 : 0.6}>
              <FootPrint x={s.move.x} y={s.move.y} label={swap(s.move.foot)} facingUp={facingUp} tone="ghost" />
              <text x={s.move.x + (s.move.foot === "L" ? -20 : 20)} y={s.move.y + 4} textAnchor="middle" fontSize="10" fill="#64748b">{i + 1}</text>
            </g>
          ))}
          <FootPrint x={figure.start.L[0]} y={figure.start.L[1]} label="" facingUp={facingUp} tone="ghost" />
          <FootPrint x={figure.start.R[0]} y={figure.start.R[1]} label="" facingUp={facingUp} tone="ghost" />
          {(["L", "R"] as const).map((f) => (
            <FootPrint
              key={f}
              x={current[f][0]}
              y={current[f][1]}
              label={swap(f)}
              facingUp={facingUp}
              tone={active && active.move.foot === f ? "active" : "stance"}
            />
          ))}
        </svg>
        <div className="mt-3 flex items-center justify-between gap-2">
          <button onClick={() => { setPlaying(false); setStep((s) => Math.max(0, s - 1)); }} className="btn-secondary px-3 py-1.5" aria-label="Previous step">←</button>
          <button
            onClick={() => { if (step >= total) setStep(0); setPlaying((p) => !p); }}
            className="btn-primary flex-1 py-1.5"
          >
            {playing ? "Pause" : step >= total ? "Replay" : step === 0 ? "▶ Play with count" : "▶ Continue"}
          </button>
          <button onClick={() => { setPlaying(false); setStep((s) => Math.min(total, s + 1)); }} className="btn-secondary px-3 py-1.5" aria-label="Next step">→</button>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink text-3xl font-bold text-white" aria-live="polite">
            {active ? active.count : "–"}
          </div>
          <div>
            <p className="text-sm text-slate-500">{step === 0 ? "Starting position" : `Step ${step} of ${total}`}</p>
            <p className="text-lg font-semibold">{active ? active[role] : "Feet together, weight on your " + (role === "leader" ? "right foot." : "left foot.")}</p>
          </div>
        </div>
        <ol className="space-y-1.5">
          {figure.steps.map((s, i) => (
            <li key={i}>
              <button
                onClick={() => { setPlaying(false); setStep(i + 1); }}
                className={`flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition ${step === i + 1 ? "bg-brand-50 ring-1 ring-brand-500" : "hover:bg-slate-100"}`}
              >
                <span className="w-6 shrink-0 font-mono text-sm font-bold text-brand-700">{s.count}</span>
                <span className="text-slate-800">{s[role]}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
