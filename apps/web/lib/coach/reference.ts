// Building the reference swing from the coach's clips, and loading it in the app.
// The reference lives in public/coach/references/<stroke>.json (plus an optional video),
// so swapping in the coach's clips means replacing that one file.

import { dtw, measureClip, vectors, type MetricTarget, type P2, type P3, type Reference } from "./analyze";
import type { PoseClip } from "./landmarks";
import { SMASH_METRICS, type MetricKey } from "./smash";

export const REFERENCE_URL = "/coach/references/smash.json";

export async function loadReference(url = REFERENCE_URL): Promise<Reference> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Couldn't load the coach's reference swing.");
  return (await res.json()) as Reference;
}

export type ClipReport = {
  name: string;
  ok: boolean;
  error?: string;
  measurements?: Record<MetricKey, number>;
  /** How different this clip is from the others (lower = more typical). */
  oddness?: number;
  armVisibility?: number;
};

const r3 = (v: number) => Math.round(v * 1000) / 1000;
const round = (frames: P2[][]) => frames.map((p) => p.map(([x, y]) => [r3(x), r3(y)] as P2));
const round3 = (frames: P3[][]) => frames.map((p) => p.map(([x, y, z]) => [r3(x), r3(y), r3(z)] as P3));

function mean(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function std(xs: number[]) {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

/**
 * Turn several clips of the coach doing the same stroke into a reference.
 * Targets are the coach's average; the tolerance widens when the coach's own clips vary.
 * The most typical clip becomes the swing shown in the side-by-side view.
 */
export function buildReference(
  inputs: { name: string; clip: PoseClip; videoSrc?: string }[],
  opts: { placeholder: boolean; source: string; label?: string },
): { reference: Reference | null; reports: ClipReport[] } {
  const measured: { name: string; m: ReturnType<typeof measureClip>; input: (typeof inputs)[number] }[] = [];
  const reports: ClipReport[] = [];
  for (const input of inputs) {
    try {
      const m = measureClip(input.clip);
      measured.push({ name: input.name, m, input });
      reports.push({ name: input.name, ok: true, measurements: m.measurements, armVisibility: m.armVisibility });
    } catch (e) {
      reports.push({ name: input.name, ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  }
  if (!measured.length) return { reference: null, reports };

  const vecs = measured.map((x) => vectors(x.m.features));
  const oddness = vecs.map((a, i) => (vecs.length < 2 ? 0 : mean(vecs.filter((_, j) => j !== i).map((b) => dtw(a, b).cost))));
  measured.forEach((x, i) => {
    const rep = reports.find((r) => r.name === x.name);
    if (rep) rep.oddness = r3(oddness[i]);
  });
  const t = oddness.indexOf(Math.min(...oddness));
  const template = measured[t];

  const metrics = {} as Record<MetricKey, MetricTarget>;
  for (const spec of SMASH_METRICS) {
    const vals = measured.map((x) => x.m.measurements[spec.key]).filter(Number.isFinite);
    metrics[spec.key] = {
      target: r3(mean(vals)),
      tolerance: r3(vals.length >= 3 ? Math.max(spec.tolerance, 1.5 * std(vals)) : spec.tolerance),
    };
  }

  const { m } = template;
  const clip = template.input.clip;
  const reference: Reference = {
    version: 1,
    stroke: "smash",
    label: opts.label ?? "Forehand overhead smash",
    placeholder: opts.placeholder,
    source: opts.source,
    createdAt: new Date().toISOString(),
    clips: measured.length,
    fps: clip.fps,
    side: m.swing.side,
    frames: round(m.frames),
    world: round3(m.world),
    keyframes: m.keyframes,
    metrics,
  };
  if (template.input.videoSrc) {
    reference.video = {
      src: template.input.videoSrc,
      start: r3((clip.start ?? 0) + m.from / clip.fps),
      width: clip.width,
      height: clip.height,
      frames: round(m.track.pts.slice(m.from, m.to + 1).map((p) => p.map(([x, y]) => [x / m.track.aspect, y] as P2))),
    };
  }
  return { reference, reports };
}
