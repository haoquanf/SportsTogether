"use client";

// The AI coach: pick or record a smash clip, track the body in the browser, compare it
// with the coach's reference and show a score, the top fixes and a side-by-side replay.

import { useCallback, useEffect, useRef, useState } from "react";
import { analyse, AnalysisError, type Analysis, type MetricResult, type Reference } from "@/lib/coach/analyze";
import { extractPose, loadPoseModel, MAX_SECONDS } from "@/lib/coach/extract";
import { loadReference } from "@/lib/coach/reference";
import { PHASES, SMASH_METRICS, type Phase } from "@/lib/coach/smash";
import { SideBySide, type Jump } from "./side-by-side";

export const LOCAL_REFERENCE_KEY = "zenisports.coach.reference.smash";
const SAMPLE_CLIP = "/coach/samples/smash-sample.mp4";

type State =
  | { kind: "idle" }
  | { kind: "working"; step: "model" | "reading" | "scoring"; progress: number }
  | { kind: "done"; analysis: Analysis; url: string; aspect: number; truncated: boolean }
  | { kind: "error"; message: string };

function readLocalReference(): Reference | null {
  try {
    const raw = localStorage.getItem(LOCAL_REFERENCE_KEY);
    return raw ? (JSON.parse(raw) as Reference) : null;
  } catch {
    return null;
  }
}

function verdict(score: number) {
  if (score >= 85) return "Great smash. Only small details to polish.";
  if (score >= 70) return "Good swing with a couple of things to tidy up.";
  if (score >= 50) return "Getting there. Work on the fixes below one at a time.";
  return "Lots to work on. Start with fix number 1; it makes the biggest difference.";
}

function fmt(m: Pick<MetricResult, "unit">, v: number) {
  return m.unit === "deg" ? `${Math.round(v)}°` : v.toFixed(1);
}

function ScoreRing({ score }: { score: number }) {
  const r = 52, c = 2 * Math.PI * r;
  const color = score >= 85 ? "#16a34a" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32 shrink-0" role="img" aria-label={`Score ${score} out of 100`}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
      <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} transform="rotate(-90 60 60)" />
      <text x="60" y="60" textAnchor="middle" dominantBaseline="central" className="fill-ink text-[34px] font-bold">{score}</text>
      <text x="60" y="86" textAnchor="middle" className="fill-slate-500 text-[11px]">out of 100</text>
    </svg>
  );
}

export function CoachStudio() {
  const [ref, setRef] = useState<Reference | null>(null);
  const [usingLocal, setUsingLocal] = useState(false);
  const [refError, setRefError] = useState<string | null>(null);
  const [state, setState] = useState<State>({ kind: "idle" });
  const [hasSample, setHasSample] = useState(false);
  const [jump, setJump] = useState<Jump | null>(null);
  const urlRef = useRef<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const viewer = useRef<HTMLDivElement>(null);
  const pickInput = useRef<HTMLInputElement>(null);
  const recordInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const local = readLocalReference();
    (local ? Promise.resolve(local) : loadReference()).then(
      (r) => {
        setRef(r);
        setUsingLocal(!!local);
      },
      (e) => setRefError(e.message),
    );
    fetch(SAMPLE_CLIP, { method: "HEAD" }).then((r) => setHasSample(r.ok), () => {});
    return () => {
      abort.current?.abort();
      if (urlRef.current?.startsWith("blob:")) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const run = useCallback(
    async (url: string) => {
      if (!ref) return;
      abort.current?.abort();
      const ctrl = new AbortController();
      abort.current = ctrl;
      if (urlRef.current?.startsWith("blob:") && urlRef.current !== url) URL.revokeObjectURL(urlRef.current);
      urlRef.current = url;
      setJump(null);
      try {
        setState({ kind: "working", step: "model", progress: 0 });
        await loadPoseModel();
        setState({ kind: "working", step: "reading", progress: 0 });
        const clip = await extractPose(url, (p) => setState({ kind: "working", step: "reading", progress: p }), ctrl.signal);
        setState({ kind: "working", step: "scoring", progress: 1 });
        await new Promise((r) => setTimeout(r, 30));
        const analysis = analyse(clip, ref);
        setState({ kind: "done", analysis, url, aspect: clip.width / clip.height || 9 / 16, truncated: clip.truncated });
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        console.error(e);
        const message =
          e instanceof AnalysisError
            ? e.message
            : e instanceof Error && /format|load/i.test(e.message)
              ? e.message
              : "Something went wrong while reading the clip. Please try again, or try a different video.";
        setState({ kind: "error", message });
      }
    },
    [ref],
  );

  const onFile = (file: File | undefined) => {
    if (!file) return;
    run(URL.createObjectURL(file));
  };

  const useBuiltIn = () => {
    try { localStorage.removeItem(LOCAL_REFERENCE_KEY); } catch {}
    setUsingLocal(false);
    setRef(null);
    loadReference().then(setRef, (e) => setRefError(e.message));
  };

  const showPhase = (phase: Phase) => {
    if (state.kind !== "done") return;
    const k = state.analysis.keyframes;
    setJump((j) => ({ frame: phase === "load" ? k.prep : phase === "contact" ? k.contact : k.finish, n: (j?.n ?? 0) + 1 }));
    viewer.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const busy = state.kind === "working";

  return (
    <div className="space-y-6">
      {usingLocal && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900 ring-1 ring-blue-200">
          <span>Comparing with the reference you built on this device{ref ? ` (${ref.clips} clips)` : ""}.</span>
          <button onClick={useBuiltIn} className="font-medium underline">Use the built-in reference</button>
        </div>
      )}

      {/* Upload */}
      <section className="card">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Check your smash</h2>
            <p className="mt-1 text-slate-600">Film one smash from the side, then pick the clip. It is analysed on your device and never uploaded.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" disabled={!ref || busy} onClick={() => recordInput.current?.click()} data-track="Coach: record">
              🎥 Record a clip
            </button>
            <button className="btn-secondary" disabled={!ref || busy} onClick={() => pickInput.current?.click()} data-track="Coach: choose video">
              Choose a video
            </button>
            {hasSample && (
              <button className="btn-secondary" disabled={!ref || busy} onClick={() => run(SAMPLE_CLIP)} data-track="Coach: sample clip">
                Try a sample clip
              </button>
            )}
          </div>
        </div>
        <input ref={recordInput} type="file" accept="video/*" capture="environment" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
        <input ref={pickInput} type="file" accept="video/*" className="hidden" data-testid="coach-file" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
        {refError && <p className="mt-4 text-sm text-red-700">{refError}</p>}
        {ref?.placeholder && (
          <p className="mt-4 text-sm text-slate-500">
            Preview: until our coach&apos;s clips are added, you are compared with a sample smash performed by the ZeniSports 3D player.
          </p>
        )}

        {busy && (
          <div className="mt-5" role="status">
            <p className="text-sm font-medium text-slate-700">
              {state.step === "model" && "Loading the body-tracking model (first time only)…"}
              {state.step === "reading" && `Finding your body in each frame… ${Math.round(state.progress * 100)}%`}
              {state.step === "scoring" && "Comparing with the coach…"}
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${state.step === "model" ? 5 : Math.max(5, state.progress * 100)}%` }} />
            </div>
          </div>
        )}
        {state.kind === "error" && (
          <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200" role="alert" data-testid="coach-error">{state.message}</p>
        )}
      </section>

      {state.kind === "done" && ref && (
        <Results
          a={state.analysis}
          truncated={state.truncated}
          onShow={showPhase}
          viewer={
            <div ref={viewer} className="scroll-mt-20">
              <SideBySide videoUrl={state.url} videoAspect={state.aspect} analysis={state.analysis} reference={ref} jump={jump} />
            </div>
          }
        />
      )}
    </div>
  );
}

function Results({ a, truncated, onShow, viewer }: { a: Analysis; truncated: boolean; onShow: (p: Phase) => void; viewer: React.ReactNode }) {
  const phaseScore = (p: Phase) => {
    const ms = a.metrics.filter((m) => m.phase === p);
    return Math.round(ms.reduce((s, m) => s + m.score, 0) / ms.length);
  };
  const warnings = truncated ? [...a.warnings, `Only the first ${MAX_SECONDS} seconds were checked. Trim the clip to one smash for best results.`] : a.warnings;
  return (
    <div className="space-y-6" data-testid="coach-results">
      <section className="card">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <ScoreRing score={a.score} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-500">Your smash score</p>
            <p className="mt-1 text-xl font-bold">{verdict(a.score)}</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {PHASES.map((p) => {
                const s = phaseScore(p.id);
                return (
                  <button key={p.id} onClick={() => onShow(p.id)} className="rounded-xl bg-slate-50 p-3 text-left ring-1 ring-slate-200 hover:bg-slate-100">
                    <span className="block text-xs text-slate-500">{p.label}</span>
                    <span className={`text-lg font-bold ${s >= 85 ? "text-brand-700" : s >= 60 ? "text-amber-600" : "text-red-600"}`}>{s}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {warnings.length > 0 && (
          <ul className="mt-5 space-y-2">
            {warnings.map((w) => (
              <li key={w} className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200">{w}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="text-xl font-bold">{a.fixes.length ? `Your top ${a.fixes.length === 1 ? "fix" : `${a.fixes.length} fixes`}` : "Nothing major to fix"}</h2>
        {a.fixes.length ? (
          <ol className="mt-4 space-y-3" data-testid="coach-fixes">
            {a.fixes.map((f, i) => (
              <li key={f.key} className="flex gap-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink font-bold text-white">{i + 1}</span>
                <div className="min-w-0">
                  <p className="font-semibold">{f.title}</p>
                  <p className="mt-1 text-slate-700">{f.tip}</p>
                  <button onClick={() => onShow(f.phase)} className="mt-2 text-sm font-medium text-brand-700 hover:underline">
                    Show me in the replay →
                  </button>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-slate-600">Your swing matches the coach closely on every check. Keep filming to make sure it stays that way under pressure.</p>
        )}
        {a.strengths.length > 0 && (
          <div className="mt-5">
            <p className="text-sm font-medium text-slate-500">What you&apos;re doing well</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {a.strengths.map((s) => (
                <span key={s.key} className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700 ring-1 ring-brand-100">✓ {s.label}</span>
              ))}
            </div>
          </div>
        )}
      </section>

      {viewer}

      <details className="card">
        <summary className="cursor-pointer font-semibold">All {SMASH_METRICS.length} checks, in numbers</summary>
        <p className="mt-2 text-sm text-slate-500">Angles are in degrees (180° = straight). Heights and distances are in torso lengths, so your size and how far away the camera was don&apos;t matter.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr><th className="py-2 pr-3 font-medium">Check</th><th className="py-2 pr-3 font-medium">You</th><th className="py-2 pr-3 font-medium">Coach</th><th className="py-2 font-medium">Score</th></tr>
            </thead>
            <tbody>
              {a.metrics.map((m) => (
                <tr key={m.key} className="border-t border-slate-100">
                  <td className="py-2 pr-3">{m.label}</td>
                  <td className="py-2 pr-3 tabular-nums">{Number.isFinite(m.value) ? fmt(m, m.value) : "–"}</td>
                  <td className="py-2 pr-3 tabular-nums">{fmt(m, m.target)}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full ${m.score >= 85 ? "bg-brand-500" : m.score >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${m.score}%` }} />
                      </div>
                      <span className="tabular-nums">{m.score}</span>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="border-t border-slate-100">
                <td className="py-2 pr-3">Overall swing shape</td>
                <td className="py-2 pr-3 text-slate-500" colSpan={2}>How closely the whole movement follows the coach&apos;s</td>
                <td className="py-2 tabular-nums">{a.shapeScore}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
