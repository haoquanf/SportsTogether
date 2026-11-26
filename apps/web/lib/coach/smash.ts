// What the AI coach checks in a forehand overhead smash, and how it explains each fix.
// Target numbers come from the reference (public/coach/references/smash.json), which is
// built from the coach's clips; the wording and the default tolerances live here.

import { sideJoints, type Side } from "./landmarks";

export type Phase = "load" | "contact" | "follow";

export const PHASES: { id: Phase; label: string; hint: string }[] = [
  { id: "load", label: "Load", hint: "Turn side-on, bend the knees and take the racket back" },
  { id: "contact", label: "Contact", hint: "Elbow up, arm straight, hit high and in front" },
  { id: "follow", label: "Follow-through", hint: "Racket carries on down across the body" },
];

export type MetricKey =
  | "kneeBend"
  | "racketPrep"
  | "rotation"
  | "elbowHeight"
  | "armExtension"
  | "contactHeight"
  | "followThrough";

type Advice = { title: string; tip: string };

export type MetricSpec = {
  key: MetricKey;
  label: string;
  phase: Phase;
  /** "deg" angles, "body" = lengths of the player's own torso (so height and distance from camera don't matter). */
  unit: "deg" | "body";
  weight: number;
  /** No penalty this close to the coach. */
  tolerance: number;
  /** Beyond the tolerance, the score falls to 0 over this distance. */
  span: number;
  /** Being further than the coach in this direction is fine (e.g. a straighter arm at contact). */
  okDirection: "higher" | "lower" | null;
  /** Body points to highlight when this is off. */
  joints: (side: Side) => number[];
  /** What to say when the value is below / above the coach's. {diff} is replaced by the gap. */
  low?: Advice;
  high?: Advice;
};

export const SMASH_METRICS: MetricSpec[] = [
  {
    key: "armExtension",
    label: "Arm straight at contact",
    phase: "contact",
    unit: "deg",
    weight: 2,
    tolerance: 10,
    span: 40,
    okDirection: "higher",
    joints: (s) => { const j = sideJoints(s); return [j.sh, j.el, j.wr]; },
    low: {
      title: "Straighten your arm when you hit",
      tip: "At contact your elbow is about {diff}° more bent than the coach's, which costs power and makes the smash flatter. Reach up and hit the shuttle at full stretch.",
    },
  },
  {
    key: "elbowHeight",
    label: "Elbow height at contact",
    phase: "contact",
    unit: "deg",
    weight: 2,
    tolerance: 10,
    span: 40,
    okDirection: "higher",
    joints: (s) => { const j = sideJoints(s); return [j.sh, j.el]; },
    low: {
      title: "Lift your elbow higher at contact",
      tip: "When you hit, your racket arm is about {diff}° lower than the coach's. Lead the swing with your elbow up and hit with your arm close to your ear.",
    },
  },
  {
    key: "rotation",
    label: "Trunk rotation",
    phase: "contact",
    unit: "deg",
    weight: 2,
    tolerance: 12,
    span: 50,
    okDirection: "higher",
    joints: (s) => { const j = sideJoints(s); return [j.sh, j.osh, j.hip, j.ohip]; },
    low: {
      title: "Turn your chest to the net as you hit",
      tip: "Your upper body turns about {diff}° less than the coach's. Start side-on, then rotate your hips and chest towards the net as you swing, so the power comes from your body and not just your arm.",
    },
  },
  {
    key: "kneeBend",
    label: "Knee bend when loading",
    phase: "load",
    unit: "deg",
    weight: 1.5,
    tolerance: 10,
    span: 35,
    okDirection: "lower",
    joints: (s) => { const j = sideJoints(s); return [j.hip, j.knee, j.ankle]; },
    high: {
      title: "Bend your knees more before you hit",
      tip: "Your legs are about {diff}° straighter than the coach's while you get ready. Sink into your knees so you can push up into the shot. Try 10 shadow smashes, holding the crouch for a second each time.",
    },
  },
  {
    key: "followThrough",
    label: "Follow-through",
    phase: "follow",
    unit: "body",
    weight: 1.5,
    tolerance: 0.3,
    span: 1.2,
    okDirection: "higher",
    joints: (s) => { const j = sideJoints(s); return [j.el, j.wr]; },
    low: {
      title: "Follow through down and across your body",
      tip: "Your racket stops soon after you hit. Let it carry on down past your opposite hip. Stopping early means the racket was already slowing down at contact.",
    },
  },
  {
    key: "racketPrep",
    label: "Racket back (throwing position)",
    phase: "load",
    unit: "deg",
    weight: 1,
    tolerance: 15,
    span: 45,
    okDirection: null,
    joints: (s) => { const j = sideJoints(s); return [j.sh, j.el, j.wr]; },
    high: {
      title: "Take the racket further back",
      tip: "Before you swing, your elbow is about {diff}° more open than the coach's. Bend it and let the racket drop behind your head, like throwing a ball, so you have room to speed up.",
    },
    low: {
      title: "Relax your arm at the back of the swing",
      tip: "Your elbow folds about {diff}° tighter than the coach's before the swing. Keep it relaxed, near a right angle, so the swing stays smooth.",
    },
  },
  {
    key: "contactHeight",
    label: "Contact height",
    phase: "contact",
    unit: "body",
    weight: 1,
    tolerance: 0.2,
    span: 0.8,
    okDirection: "higher",
    joints: (s) => [sideJoints(s).wr],
    low: {
      title: "Hit the shuttle at the highest point",
      tip: "You meet the shuttle lower than the coach does. Move your feet earlier so you are under the shuttle and can hit it at the top of your reach.",
    },
  },
];

export const SMASH = {
  id: "smash",
  label: "Forehand overhead smash",
  metrics: SMASH_METRICS,
};
