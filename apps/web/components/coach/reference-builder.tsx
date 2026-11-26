"use client";

// Lets a coach (or Haoquan) turn 5 to 10 clips of the coach's smash into the reference
// file the AI coach compares everyone with. Everything runs in the browser.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Reference } from "@/lib/coach/analyze";
import { DOTS } from "@/lib/coach/landmarks";
import { extractPose, type ExtractResult } from "@/lib/coach/extract";
import { buildReference, type ClipReport } from "@/lib/coach/reference";
import { SMASH_METRICS } from "@/lib/coach/smash";
import { LOCAL_REFERENCE_KEY } from "./coach-studio";
import { COLORS, drawSkeleton, fitFrames } from "./draw";

const VIDEO_PATH = "/coach/references/smash.mp4";

type Item = { name: string; status: "waiting" | "reading" | "ready" | "failed"; progress: number; clip?: ExtractResult; error?: string; include: boolean };

function Preview({ reference }: { reference: Reference }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let raf = 0, i = 0, last = 0;
    const tick = (t: number) => {
      const c = canvas.current;
      if (c && t - last > 1000 / 15) {
        last = t;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        c.width = c.clientWidth * dpr;
        c.height = c.clientHeight * dpr;
        const ctx = c.getContext("2d")!;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const map = fitFrames(reference.frames, DOTS, c.clientWidth, c.clientHeight, 20, false);
        drawSkeleton(ctx, reference.frames[i].map(map), { color: COLORS.good });
        i = (i + 1) % reference.frames.length;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reference]);
  return <canvas ref={canvas} className="h-72 w-full rounded-2xl bg-[#06110c]" aria-label="The reference swing, played at half speed" />;
}

export function ReferenceBuilder() {
  const [items, setItems] = useState<Item[]>([]);
  const [coach, setCoach] = useState("");
  const [isReal, setIsReal] = useState(true);
  const [result, setResult] = useState<{ reference: Reference | null; reports: ClipReport[] } | null>(null);
  const [saved, setSaved] = useState(false);
  const busy = items.some((i) => i.status === "reading" || i.status === "waiting");

  const update = (name: string, patch: Partial<Item>) => setItems((xs) => xs.map((x) => (x.name === name ? { ...x, ...patch } : x)));

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).filter((f) => !items.some((i) => i.name === f.name));
    setItems((xs) => [...xs, ...list.map((f) => ({ name: f.name, status: "waiting" as const, progress: 0, include: true }))]);
    setResult(null);
    for (const f of list) {
      const url = URL.createObjectURL(f);
      update(f.name, { status: "reading" });
      try {
        const clip = await extractPose(url, (p) => update(f.name, { progress: p }));
        update(f.name, { status: "ready", clip, progress: 1 });
      } catch (e) {
        update(f.name, { status: "failed", error: e instanceof Error ? e.message : String(e) });
      } finally {
        URL.revokeObjectURL(url);
      }
    }
  };

  const build = () => {
    const inputs = items.filter((i) => i.include && i.clip).map((i) => ({ name: i.name, clip: i.clip!, videoSrc: VIDEO_PATH }));
    const label = coach.trim() ? `Coach ${coach.trim()}` : "Coach";
    setResult(
      buildReference(inputs, {
        placeholder: !isReal,
        source: `${label}: ${inputs.map((i) => i.name).join(", ")}`,
      }),
    );
    setSaved(false);
  };

  const ref = result?.reference;
  const templateName = ref ? result.reports.reduce((best, r) => (r.ok && (best == null || (r.oddness ?? 0) < (best.oddness ?? 0)) ? r : best), null as ClipReport | null)?.name : null;
  const oddLimit = (() => {
    const odd = result?.reports.filter((r) => r.ok).map((r) => r.oddness ?? 0).sort((a, b) => a - b) ?? [];
    return odd.length >= 3 ? odd[Math.floor(odd.length / 2)] * 1.6 : Infinity;
  })();

  const download = () => {
    if (!ref) return;
    const blob = new Blob([JSON.stringify(ref) + "\n"], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "smash.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const tryLocally = () => {
    if (!ref) return;
    try {
      // The coach video only exists once the files are added to the site, so test with the skeleton alone.
      localStorage.setItem(LOCAL_REFERENCE_KEY, JSON.stringify({ ...ref, video: undefined }));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="card space-y-4">
        <h2 className="text-xl font-bold">1. Add the coach&apos;s clips</h2>
        <p className="text-slate-600">Pick 5 to 10 clips at once. Each one is read on this device; nothing is uploaded.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Coach&apos;s name (shown as the source)</span>
            <input className="input" value={coach} onChange={(e) => setCoach(e.target.value)} placeholder="e.g. Lin" />
          </label>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input type="checkbox" checked={isReal} onChange={(e) => setIsReal(e.target.checked)} className="h-4 w-4 accent-brand-600" />
            These are real coach clips (not a test)
          </label>
        </div>
        <input type="file" accept="video/*" multiple onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:font-medium file:text-white" data-testid="reference-files" />
        {items.length > 0 && (
          <ul className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200">
            {items.map((i) => (
              <li key={i.name} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <input type="checkbox" checked={i.include} disabled={i.status !== "ready"} onChange={(e) => { update(i.name, { include: e.target.checked }); setResult(null); }} className="h-4 w-4 accent-brand-600" aria-label={`Use ${i.name}`} />
                <span className="min-w-0 flex-1 truncate font-medium">{i.name}</span>
                <span className={i.status === "failed" ? "text-red-700" : "text-slate-500"}>
                  {i.status === "waiting" && "Waiting…"}
                  {i.status === "reading" && `Reading ${Math.round(i.progress * 100)}%`}
                  {i.status === "ready" && "Ready"}
                  {i.status === "failed" && (i.error ?? "Couldn't read")}
                </span>
              </li>
            ))}
          </ul>
        )}
        <button className="btn-primary" disabled={busy || items.filter((i) => i.include && i.clip).length < 1} onClick={build}>
          Build the reference
        </button>
      </section>

      {result && (
        <section className="card space-y-5">
          <h2 className="text-xl font-bold">2. Check the result</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr><th className="py-2 pr-3 font-medium">Clip</th><th className="py-2 pr-3 font-medium">Result</th><th className="py-2 font-medium">Arm visible</th></tr>
            </thead>
            <tbody>
              {result.reports.map((r) => (
                <tr key={r.name} className="border-t border-slate-100">
                  <td className="py-2 pr-3">{r.name}{r.name === templateName && <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-700">shown in the replay</span>}</td>
                  <td className="py-2 pr-3">
                    {!r.ok ? <span className="text-red-700">{r.error}</span> : (r.oddness ?? 0) > oddLimit ? <span className="text-amber-700">Looks different from the others. Untick it and rebuild if it was a bad rep.</span> : <span className="text-brand-700">Good</span>}
                  </td>
                  <td className="py-2">{r.armVisibility != null ? `${Math.round(r.armVisibility * 100)}%` : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {ref && (
            <>
              <div className="grid gap-5 md:grid-cols-2">
                <Preview reference={ref} />
                <div>
                  <p className="text-sm font-medium text-slate-500">What members will be compared with ({ref.clips} clips)</p>
                  <ul className="mt-2 divide-y divide-slate-100 text-sm">
                    {SMASH_METRICS.map((m) => (
                      <li key={m.key} className="flex justify-between py-1.5">
                        <span>{m.label}</span>
                        <span className="tabular-nums text-slate-600">
                          {m.unit === "deg" ? `${Math.round(ref.metrics[m.key].target)}° ± ${Math.round(ref.metrics[m.key].tolerance)}` : `${ref.metrics[m.key].target.toFixed(1)} ± ${ref.metrics[m.key].tolerance.toFixed(1)}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold">3. Try it, then put it live</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="btn-secondary" onClick={tryLocally}>Try it in the AI coach (this device only)</button>
                  <button className="btn-primary" onClick={download}>Download smash.json</button>
                </div>
                {saved && (
                  <p className="mt-2 text-sm text-brand-700">
                    Saved on this device. <Link href="/coach" className="font-medium underline">Open the AI coach</Link> and try a clip.
                  </p>
                )}
                <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-slate-600">
                  <li>Download <strong>smash.json</strong>.</li>
                  <li>Rename the clip <strong>{templateName}</strong> to <strong>smash.mp4</strong> (it is the most typical swing, so it is shown next to members).</li>
                  <li>Put both files in <code className="rounded bg-slate-100 px-1">apps/web/public/coach/references/</code>, replacing the sample, or send them to your developer.</li>
                </ol>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
