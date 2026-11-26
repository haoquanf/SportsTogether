// Turns the body points of a clip into a smash analysis: finds the swing, lines it up
// with the coach's swing (dynamic time warping), measures key joint angles in each
// phase and turns the gaps into a 0 to 100 score and plain-language fixes.
// Pure functions with no browser APIs, so they run in tests and in the reference builder.

import { L, POINT_COUNT, sideJoints, type PoseClip, type Side } from "./landmarks";
import { SMASH_METRICS, type MetricKey, type MetricSpec, type Phase } from "./smash";

export type P2 = [number, number];
export type P3 = [number, number, number];

// ---------- Geometry helpers ----------

const DEG = 180 / Math.PI;

export function angleAt(a: P2, b: P2, c: P2): number {
  const v1x = a[0] - b[0], v1y = a[1] - b[1], v2x = c[0] - b[0], v2y = c[1] - b[1];
  const n = Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y);
  if (!n || !Number.isFinite(n)) return NaN;
  return Math.acos(Math.max(-1, Math.min(1, (v1x * v2x + v1y * v2y) / n))) * DEG;
}

/** Angle at b in 3D, in degrees. */
export function angle3(a: P3, b: P3, c: P3): number {
  const v1 = [a[0] - b[0], a[1] - b[1], a[2] - b[2]], v2 = [c[0] - b[0], c[1] - b[1], c[2] - b[2]];
  const n = Math.hypot(...v1) * Math.hypot(...v2);
  if (!n || !Number.isFinite(n)) return NaN;
  return Math.acos(Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]) / n))) * DEG;
}

const mid = (a: P2, b: P2): P2 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const dist = (a: P2, b: P2) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function median(xs: number[]): number {
  const v = xs.filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return NaN;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

function argBy(xs: number[], from: number, to: number, better: (a: number, b: number) => boolean): number {
  let best = -1;
  for (let i = Math.max(0, from); i <= Math.min(xs.length - 1, to); i++) {
    if (!Number.isFinite(xs[i])) continue;
    if (best < 0 || better(xs[i], xs[best])) best = i;
  }
  return best < 0 ? Math.max(0, Math.min(xs.length - 1, from)) : best;
}
const argMin = (xs: number[], from: number, to: number) => argBy(xs, from, to, (a, b) => a < b);
const argMax = (xs: number[], from: number, to: number) => argBy(xs, from, to, (a, b) => a > b);
const minIn = (xs: number[], from: number, to: number) => xs[argMin(xs, from, to)];
const maxIn = (xs: number[], from: number, to: number) => xs[argMax(xs, from, to)];

/** Fill gaps (NaN) by straight lines between the nearest good values. */
function fillGaps(s: number[]): number[] {
  const good = s.map((v, i) => (Number.isFinite(v) ? i : -1)).filter((i) => i >= 0);
  if (!good.length) return s.slice();
  const out = s.slice();
  for (let i = 0; i < s.length; i++) {
    if (Number.isFinite(s[i])) continue;
    let k = 0;
    while (k < good.length && good[k] < i) k++;
    if (k === 0) out[i] = s[good[0]];
    else if (k === good.length) out[i] = s[good[good.length - 1]];
    else {
      const a = good[k - 1], b = good[k];
      out[i] = s[a] + ((s[b] - s[a]) * (i - a)) / (b - a);
    }
  }
  return out;
}

/** Centred moving average to take out frame-to-frame jitter. */
function smooth(s: number[], window: number): number[] {
  if (window < 2 || s.length < window) return s.slice();
  const h = Math.floor(window / 2);
  return s.map((_, i) => {
    let sum = 0, n = 0;
    for (let k = i - h; k <= i + h; k++) {
      const v = s[Math.max(0, Math.min(s.length - 1, k))];
      sum += v;
      n++;
    }
    return sum / n;
  });
}

// ---------- Step 1: clean up the raw points ----------

export type Track = {
  fps: number;
  aspect: number;
  /** Per frame, per point: x and y in frame heights (so angles are not stretched), gaps filled and smoothed. */
  pts: P2[][];
  /** Per frame, per point: 3D position in metres around the hips, gaps filled and smoothed. */
  world: P3[][];
  vis: number[][];
  found: boolean[];
};

export function prepare(clip: PoseClip): Track {
  const n = clip.frames.length;
  const aspect = clip.width / clip.height;
  const found = clip.frames.map((f) => !!f);
  const window = Math.max(3, Math.round(clip.fps / 10) | 1);
  const cols: number[][][] = [];
  const series = (j: number, k: number, scale = 1) =>
    smooth(fillGaps(clip.frames.map((f) => (f && f[j][2] > 0.05 && Number.isFinite(f[j][k]) ? f[j][k] * scale : NaN))), window);
  for (let j = 0; j < POINT_COUNT; j++) {
    cols.push([series(j, 0, aspect), series(j, 1), series(j, 3), series(j, 4), series(j, 5)]);
  }
  const pts: P2[][] = [];
  const world: P3[][] = [];
  const vis: number[][] = [];
  for (let i = 0; i < n; i++) {
    pts.push(cols.map((c) => [c[0][i], c[1][i]] as P2));
    world.push(cols.map((c) => [c[2][i], c[3][i], c[4][i]] as P3));
    vis.push(Array.from({ length: POINT_COUNT }, (_, j) => clip.frames[i]?.[j][2] ?? 0));
  }
  return { fps: clip.fps, aspect, pts, world, vis, found };
}

// ---------- Step 2: find the swing ----------

export type Swing = {
  side: Side;
  /** +1 when the player hits towards the right of the frame, -1 towards the left. */
  facing: 1 | -1;
  torso: number;
  contact: number;
  peakSpeed: number;
};

export class AnalysisError extends Error {}

function torsoLength(t: Track): number {
  return median(
    t.pts.map((p, i) =>
      t.found[i] ? dist(mid(p[L.L_SHOULDER], p[L.R_SHOULDER]), mid(p[L.L_HIP], p[L.R_HIP])) : NaN,
    ),
  );
}

function wristSpeed(t: Track, wr: number, torso: number): number[] {
  return t.pts.map((p, i) => (i === 0 ? 0 : (dist(p[wr], t.pts[i - 1][wr]) * t.fps) / torso));
}

export function findSwing(t: Track, side?: Side): Swing {
  const foundCount = t.found.filter(Boolean).length;
  if (foundCount < Math.max(8, t.fps * 0.5)) throw new AnalysisError("We couldn't see a person in this clip. Film from the side with your whole body in the frame.");
  const torso = torsoLength(t);
  if (!Number.isFinite(torso) || torso <= 0) throw new AnalysisError("We couldn't see your shoulders and hips clearly enough.");

  const score = (s: Side) => {
    const sp = wristSpeed(t, sideJoints(s).wr, torso).sort((a, b) => b - a);
    return sp.slice(0, 5).reduce((a, b) => a + b, 0);
  };
  const hitSide: Side = side ?? (score("right") >= score("left") ? "right" : "left");
  const wr = sideJoints(hitSide).wr;
  const speed = wristSpeed(t, wr, torso).map((v, i) => (t.found[i] ? v : 0));
  const peak = argMax(speed, 1, speed.length - 1);
  const peakSpeed = speed[peak];
  if (!(peakSpeed > 2.5)) throw new AnalysisError("We couldn't find a swing in this clip. Make sure the whole smash, from getting ready to the follow-through, is in the video.");

  const wy = t.pts.map((p) => p[wr][1]);
  const contact = argMin(wy, peak - Math.round(0.35 * t.fps), peak + Math.round(0.15 * t.fps));

  // The racket travels towards the net through contact, so the wrist's sideways motion tells us which way the player faces.
  const k = Math.max(2, Math.round(0.1 * t.fps));
  const a = t.pts[Math.max(0, contact - k)][wr][0], b = t.pts[Math.min(t.pts.length - 1, contact + k)][wr][0];
  let dir = b - a;
  if (Math.abs(dir) < 0.05 * torso) {
    dir = median(t.pts.map((p) => p[L.NOSE][0] - mid(p[L.L_EAR], p[L.R_EAR])[0]));
  }
  return { side: hitSide, facing: dir >= 0 ? 1 : -1, torso, contact, peakSpeed };
}

// ---------- Step 3: normalise and measure ----------

/**
 * The swing with the player facing right: 2D points with the hips at the origin and the torso
 * one unit long (for heights and drawing), and 3D points in metres (for joint angles).
 */
export function normalise(t: Track, s: Swing, from: number, to: number): { flat: P2[][]; world: P3[][] } {
  const hips = t.pts.slice(from, to + 1).map((p) => mid(p[L.L_HIP], p[L.R_HIP]));
  const ox = median(hips.map((h) => h[0])), oy = median(hips.map((h) => h[1]));
  return {
    flat: t.pts.slice(from, to + 1).map((p) => p.map(([x, y]) => [((x - ox) * s.facing) / s.torso, (y - oy) / s.torso] as P2)),
    world: t.world.slice(from, to + 1).map((p) => p.map(([x, y, z]) => [x * s.facing, y, z] as P3)),
  };
}

export type Features = {
  elbow: number[]; // angle at the elbow, 180 = straight arm
  lift: number[]; // angle hip-shoulder-elbow, 180 = elbow straight above the shoulder
  knee: number[]; // hitting-side knee angle, 180 = straight leg
  turn: number[]; // 0 = fully side-on, 90 = chest square to the net
  lean: number[]; // trunk from vertical, positive = leaning back
  wristHeight: number[]; // wrist above the nose, in torso lengths
  wristY: number[]; // wrist height (down is positive), in torso lengths
  wristX: number[]; // wrist in front of the hips, in torso lengths
};

export function features(frames: P2[][], world: P3[][], side: Side): Features {
  const j = sideJoints(side);
  const f: Features = { elbow: [], lift: [], knee: [], turn: [], lean: [], wristHeight: [], wristY: [], wristX: [] };
  frames.forEach((p, i) => {
    const w = world[i];
    const hip = mid(p[L.L_HIP], p[L.R_HIP]);
    const sh = mid(p[L.L_SHOULDER], p[L.R_SHOULDER]);
    f.elbow.push(angle3(w[j.sh], w[j.el], w[j.wr]));
    f.lift.push(angle3(w[j.hip], w[j.sh], w[j.el]));
    f.knee.push(angle3(w[j.hip], w[j.knee], w[j.ankle]));
    // Shoulder line seen from above: 0 = side-on (front shoulder points at the net), 90 = chest square to the net.
    const dx = w[j.osh][0] - w[j.sh][0], dz = w[j.osh][2] - w[j.sh][2];
    f.turn.push(Math.acos(Math.max(-1, Math.min(1, dx / (Math.hypot(dx, dz) || 1)))) * DEG);
    f.lean.push(Math.atan2(-(sh[0] - hip[0]), -(sh[1] - hip[1])) * DEG);
    f.wristHeight.push(p[L.NOSE][1] - p[j.wr][1]);
    f.wristY.push(p[j.wr][1]);
    f.wristX.push(p[j.wr][0] - hip[0]);
  });
  return f;
}

export type Keyframes = { prep: number; contact: number; finish: number };

/** Loaded position, contact and end of the follow-through, as indices into the features. */
export function keyframes(f: Features, contact: number, fps: number): Keyframes {
  const prep = argMin(f.elbow, contact - Math.round(0.6 * fps), contact - 1);
  const finish = argMax(f.wristY, contact + 1, contact + Math.round(0.7 * fps));
  return { prep, contact, finish };
}

export type Measurements = Record<MetricKey, number>;

export function measure(f: Features, k: Keyframes, fps: number): Measurements {
  const loadFrom = k.contact - Math.round(1.0 * fps);
  // Contact is only known to within a frame or two, and 3D estimates wobble, so take the best value just around it.
  const near = Math.max(2, Math.round(0.1 * fps));
  const around = (xs: number[], at: number, h: number) => median(xs.slice(Math.max(0, at - h), at + h + 1));
  return {
    kneeBend: minIn(f.knee, loadFrom, k.contact - Math.round(0.1 * fps)),
    racketPrep: around(f.elbow, k.prep, 2),
    rotation: maxIn(f.turn, k.contact, k.finish) - minIn(f.turn, loadFrom, k.prep),
    elbowHeight: maxIn(f.lift, k.contact - near, k.contact + near),
    armExtension: maxIn(f.elbow, k.contact - near, k.contact + near),
    contactHeight: f.wristHeight[k.contact],
    followThrough: f.wristY[k.finish] - f.wristY[k.contact],
  };
}

// ---------- Step 4: time alignment (dynamic time warping) ----------

export function vectors(f: Features): number[][] {
  return f.elbow.map((_, i) => [
    f.elbow[i] / 90,
    f.lift[i] / 90,
    f.knee[i] / 90,
    f.turn[i] / 90,
    f.lean[i] / 45,
    f.wristHeight[i],
    f.wristX[i],
  ]);
}

/** Classic DTW with a band. Returns the matched frame pairs and the average distance along the path. */
export function dtw(a: number[][], b: number[][], bandFraction = 0.5): { path: [number, number][]; cost: number } {
  const n = a.length, m = b.length;
  const band = Math.max(Math.abs(n - m) + 2, Math.round(bandFraction * Math.max(n, m)));
  const D = Array.from({ length: n + 1 }, () => new Float64Array(m + 1).fill(Infinity));
  D[0][0] = 0;
  const d = (i: number, j: number) => {
    let s = 0;
    for (let k = 0; k < a[i].length; k++) {
      const x = a[i][k] - b[j][k];
      if (Number.isFinite(x)) s += x * x;
    }
    return Math.sqrt(s);
  };
  for (let i = 1; i <= n; i++) {
    const centre = Math.round((i * m) / n);
    for (let j = Math.max(1, centre - band); j <= Math.min(m, centre + band); j++) {
      D[i][j] = d(i - 1, j - 1) + Math.min(D[i - 1][j], D[i][j - 1], D[i - 1][j - 1]);
    }
  }
  const path: [number, number][] = [];
  let i = n, j = m;
  while (i > 0 && j > 0) {
    path.push([i - 1, j - 1]);
    const diag = D[i - 1][j - 1], up = D[i - 1][j], left = D[i][j - 1];
    if (diag <= up && diag <= left) { i--; j--; }
    else if (up <= left) i--;
    else j--;
  }
  path.reverse();
  return { path, cost: D[n][m] / path.length };
}

// ---------- Step 5: score and advice ----------

export type MetricTarget = { target: number; tolerance: number };

export type MetricResult = {
  key: MetricKey;
  label: string;
  phase: Phase;
  unit: MetricSpec["unit"];
  value: number;
  target: number;
  diff: number;
  score: number;
  title?: string;
  tip?: string;
  joints: number[];
};

function fmtDiff(diff: number, unit: MetricSpec["unit"]): string {
  return unit === "deg" ? String(Math.round(Math.abs(diff))) : Math.abs(diff).toFixed(1);
}

export function scoreMetric(spec: MetricSpec, value: number, t: MetricTarget, side: Side): MetricResult {
  const diff = value - t.target;
  const tolerance = Math.max(spec.tolerance, t.tolerance);
  const harmless = (spec.okDirection === "higher" && diff > 0) || (spec.okDirection === "lower" && diff < 0);
  const excess = harmless ? 0 : Math.max(0, Math.abs(diff) - tolerance);
  const score = Number.isFinite(value) ? Math.round(Math.max(0, 1 - excess / spec.span) * 100) : 0;
  const advice = diff < 0 ? spec.low : spec.high;
  return {
    key: spec.key,
    label: spec.label,
    phase: spec.phase,
    unit: spec.unit,
    value,
    target: t.target,
    diff,
    score,
    title: advice?.title,
    tip: advice?.tip.replace("{diff}", fmtDiff(diff, spec.unit)),
    joints: spec.joints(side),
  };
}

// ---------- The reference (what the coach's swing looks like) ----------

export type Reference = {
  version: 1;
  stroke: "smash";
  label: string;
  /** True while the reference is the built-in sample instead of real coach clips. */
  placeholder: boolean;
  source: string;
  createdAt: string;
  clips: number;
  fps: number;
  /** Hitting arm of the reference player. */
  side: Side;
  /** The reference swing: normalised points (facing right, hips at 0, torso = 1), rounded. */
  frames: P2[][];
  /** The same swing as 3D points in metres (for joint angles), rounded. */
  world: P3[][];
  keyframes: Keyframes;
  metrics: Record<MetricKey, MetricTarget>;
  /** Optional coach video for the side-by-side view, with points in frame fractions for drawing over it. */
  video?: { src: string; start: number; width: number; height: number; frames: P2[][] };
};

// ---------- Putting it together ----------

export type Analysis = {
  side: Side;
  facing: 1 | -1;
  fps: number;
  /** Frame range of the swing in the member's clip, and its key moments (all in clip frames). */
  window: [number, number];
  keyframes: Keyframes;
  score: number;
  shapeScore: number;
  metrics: MetricResult[];
  fixes: MetricResult[];
  strengths: MetricResult[];
  /** Body points to colour per phase: 2 = needs work (red), 1 = close (amber). */
  highlights: Record<Phase, Record<number, 1 | 2>>;
  /** For every frame of the member's clip, the matching frame of the reference swing. */
  userToRef: number[];
  /** Smoothed points in frame fractions, for drawing over the member's video. */
  overlay: P2[][];
  found: boolean[];
  warnings: string[];
};

export const WINDOW_BEFORE_S = 1.0;
export const WINDOW_AFTER_S = 0.7;

/** Everything measured from one clip, shared by member analysis and reference building. */
export function measureClip(clip: PoseClip, side?: Side) {
  const track = prepare(clip);
  const swing = findSwing(track, side);
  const from = Math.max(0, swing.contact - Math.round(WINDOW_BEFORE_S * clip.fps));
  const to = Math.min(track.pts.length - 1, swing.contact + Math.round(WINDOW_AFTER_S * clip.fps));
  const { flat: frames, world } = normalise(track, swing, from, to);
  const f = features(frames, world, swing.side);
  const k = keyframes(f, swing.contact - from, clip.fps);
  const m = measure(f, k, clip.fps);
  const armVis = track.vis.slice(from, to + 1).flatMap((v) => {
    const j = sideJoints(swing.side);
    return [v[j.sh], v[j.el], v[j.wr]];
  });
  const foundShare = track.found.slice(from, to + 1).filter(Boolean).length / (to - from + 1);
  return { track, swing, from, to, frames, world, features: f, keyframes: k, measurements: m, armVisibility: median(armVis), foundShare };
}

export function featuresOfReference(ref: Reference): Features {
  return features(ref.frames, ref.world, ref.side);
}

export function analyse(clip: PoseClip, ref: Reference, specs: MetricSpec[] = SMASH_METRICS): Analysis {
  const c = measureClip(clip);
  const refF = featuresOfReference(ref);
  const { path, cost } = dtw(vectors(c.features), vectors(refF));

  const results = specs.map((s) => scoreMetric(s, c.measurements[s.key], ref.metrics[s.key] ?? { target: NaN, tolerance: 0 }, c.swing.side));
  // Root-mean-square of the gaps, so one big mistake costs more than several tiny ones.
  const totalW = specs.reduce((a, s) => a + s.weight, 0);
  const metricScore = 100 - Math.sqrt(results.reduce((a, r, i) => a + specs[i].weight * (100 - r.score) ** 2, 0) / totalW);
  const shapeScore = Math.round(100 * Math.exp(-cost / 0.6));
  const score = Math.round(0.85 * metricScore + 0.15 * shapeScore);

  const byPenalty = results
    .map((r, i) => ({ r, p: specs[i].weight * (100 - r.score) }))
    .sort((a, b) => b.p - a.p);
  const fixes = byPenalty.filter((x) => x.r.score < 85 && x.r.title).slice(0, 3).map((x) => x.r);
  const strengths = results.filter((r) => r.score >= 85).sort((a, b) => b.score - a.score);

  const highlights: Analysis["highlights"] = { load: {}, contact: {}, follow: {} };
  for (const r of results) {
    if (r.score >= 85) continue;
    const level: 1 | 2 = r.score < 60 ? 2 : 1;
    for (const j of r.joints) highlights[r.phase][j] = Math.max(highlights[r.phase][j] ?? 0, level) as 1 | 2;
  }

  // Map every frame of the clip to a reference frame: average of the DTW matches inside the swing, held at the ends outside it.
  const n = clip.frames.length;
  const sums = new Map<number, { s: number; c: number }>();
  for (const [i, j] of path) {
    const e = sums.get(i) ?? { s: 0, c: 0 };
    e.s += j;
    e.c++;
    sums.set(i, e);
  }
  const last = ref.frames.length - 1;
  const userToRef = Array.from({ length: n }, (_, i) => {
    if (i < c.from) return 0;
    if (i > c.to) return last;
    const e = sums.get(i - c.from);
    return e ? e.s / e.c : 0;
  });

  const warnings: string[] = [];
  if (c.foundShare < 0.8) warnings.push("You were out of view for part of the swing, so some numbers are estimates. Keep your whole body in the frame.");
  if (c.armVisibility < 0.5) warnings.push("Your racket arm was hard to see. Film from the side with your racket arm closer to the camera, in good light.");
  if (ref.placeholder) warnings.push("You are being compared with a sample reference swing, not a real coach yet.");

  const overlay = c.track.pts.map((p) => p.map(([x, y]) => [x / c.track.aspect, y] as P2));
  const shift = (k: number) => k + c.from;
  return {
    side: c.swing.side,
    facing: c.swing.facing,
    fps: clip.fps,
    window: [c.from, c.to],
    keyframes: { prep: shift(c.keyframes.prep), contact: shift(c.keyframes.contact), finish: shift(c.keyframes.finish) },
    score,
    shapeScore,
    metrics: results,
    fixes,
    strengths,
    highlights,
    userToRef,
    overlay,
    found: c.track.found,
    warnings,
  };
}

/** Which phase a frame of the member's clip belongs to. */
export function phaseOf(frame: number, k: Keyframes): Phase {
  if (frame <= k.prep + Math.round((k.contact - k.prep) / 2)) return "load";
  if (frame <= k.contact + Math.max(2, Math.round((k.finish - k.contact) / 3))) return "contact";
  return "follow";
}
