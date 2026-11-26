// Run with: pnpm --filter web test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { AnalysisError, analyse, dtw, type Reference } from "./analyze";
import type { Kp, PoseClip } from "./landmarks";
import { buildReference } from "./reference";
import { filmMove, smashMove, type SmashFlaws } from "./synthetic";

// A reference built the same way as from coach clips, here from the 3D player filmed from both sides.
const ideal = smashMove();
const built = buildReference(
  [
    { name: "r1", clip: filmMove(ideal, { noise: 0.002, seed: 1 }) },
    { name: "r2", clip: filmMove(ideal, { noise: 0.002, seed: 2, distance: 380 }) },
    { name: "l1", clip: filmMove(ideal, { otherSide: true, noise: 0.002, seed: 3 }) },
    { name: "l2", clip: filmMove(ideal, { otherSide: true, noise: 0.002, seed: 4, distance: 500 }) },
  ],
  { placeholder: true, source: "test" },
);
const ref = built.reference!;

test("builds a reference from several clips", () => {
  assert.ok(ref);
  assert.equal(ref.clips, 4);
  assert.ok(built.reports.every((r) => r.ok));
  assert.equal(ref.frames.length, ref.world.length);
});

test("the published reference file is valid", () => {
  const pub = JSON.parse(readFileSync(join(import.meta.dirname, "..", "..", "public", "coach", "references", "smash.json"), "utf8")) as Reference;
  assert.equal(pub.stroke, "smash");
  assert.ok(pub.frames.length > 20 && pub.frames.length === pub.world.length);
  for (const k of Object.keys(ref.metrics)) assert.ok(Number.isFinite(pub.metrics[k as keyof Reference["metrics"]].target), k);
});

function run(flaws: SmashFlaws = {}, o: Parameters<typeof filmMove>[1] = {}) {
  return analyse(filmMove(smashMove(flaws), { noise: 0.002, seed: 11, ...o }), ref);
}

test("a swing like the coach's scores high with no fixes", () => {
  const a = run();
  assert.ok(a.score >= 90, `score ${a.score}`);
  assert.equal(a.fixes.length, 0);
  assert.equal(a.side, "right");
});

test("filming from the other side gives the same verdict", () => {
  const a = run({}, { otherSide: true, distance: 350 });
  assert.ok(a.score >= 88, `score ${a.score}`);
  assert.equal(a.facing, -1);
});

const cases: [keyof SmashFlaws, string][] = [
  ["bentArm", "armExtension"],
  ["lowElbow", "elbowHeight"],
  ["noRotation", "rotation"],
  ["stiffLegs", "kneeBend"],
  ["shortFollowThrough", "followThrough"],
];
for (const [flaw, metric] of cases) {
  test(`spots ${flaw} and suggests the matching fix`, () => {
    const a = run({ [flaw]: true });
    assert.ok(a.score <= run().score - 8, `score ${a.score}`);
    assert.ok(a.fixes.some((f) => f.key === metric), `fixes: ${a.fixes.map((f) => f.key)}`);
    assert.ok(a.fixes.length <= 3);
    const fix = a.fixes.find((f) => f.key === metric)!;
    assert.ok(fix.title && fix.tip && !fix.tip.includes("{diff}"));
    assert.ok(Object.keys(a.highlights[fix.phase]).length > 0);
  });
}

test("a swing with many mistakes scores lower than one with a single mistake", () => {
  const one = run({ bentArm: true });
  const many = run({ bentArm: true, noRotation: true, stiffLegs: true, shortFollowThrough: true });
  assert.ok(many.score < one.score, `${many.score} vs ${one.score}`);
  assert.equal(many.fixes.length, 3);
});

test("works for left-handed players", () => {
  const clip = filmMove(smashMove(), { noise: 0.002, seed: 5 });
  const swap = (j: number) => (j >= 11 && j % 2 === 1 ? j + 1 : j >= 11 ? j - 1 : j);
  const mirrored: PoseClip = {
    ...clip,
    frames: clip.frames.map((f) => f && f.map((_, j) => {
      const p = f[swap(j)];
      return [1 - p[0], p[1], p[2], -p[3], p[4], p[5]] as Kp;
    })),
  };
  const a = analyse(mirrored, ref);
  assert.equal(a.side, "left");
  assert.ok(a.score >= 88, `score ${a.score}`);
});

test("lines the swing up with the reference in time order", () => {
  const a = run({}, { lead: 1.2 });
  for (let i = 1; i < a.userToRef.length; i++) assert.ok(a.userToRef[i] >= a.userToRef[i - 1] - 1e-9);
  const refContact = ref.keyframes.contact;
  assert.ok(Math.abs(a.userToRef[a.keyframes.contact] - refContact) <= 3);
});

test("dtw matches a slowed-down copy of a sequence", () => {
  const a = Array.from({ length: 20 }, (_, i) => [Math.sin(i / 3)]);
  const b = Array.from({ length: 40 }, (_, i) => [Math.sin(i / 6)]);
  const { cost } = dtw(a, b);
  assert.ok(cost < 0.1, `cost ${cost}`);
});

test("explains when there is no person in the clip", () => {
  const empty: PoseClip = { fps: 30, width: 720, height: 1280, frames: Array(60).fill(null) };
  assert.throws(() => analyse(empty, ref), AnalysisError);
});
