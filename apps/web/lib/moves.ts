// Keyframed full-body badminton moves for the 3D player (right-handed, facing the net at +z).
// Angles are in degrees. Conventions (see body-viewer-3d.tsx):
//  shX  negative raises the arm forwards (-180 = straight up)   shZ  right arm out to the side is negative
//  El   negative bends the elbow                                 WrY  forearm rotation (pronation is negative)
//  HipX negative lifts the thigh forwards, Knee positive bends it; HipZ right leg out is negative (like the arms)
//  shY rotates the upper arm about its own axis (-90 with shZ -90 and El -90 = throwing position)
//  Ank  0 keeps the foot flat; positive points the toes down (on the toes / in the air)
//  spineX positive leans forwards, spineY twists (positive turns the chest to the left)
//  yaw turns the whole body (-90 = side-on with the left shoulder to the net)
//  air lifts the body off the floor (jumps); x / z move the player on court (cm)

export type Pose = Record<string, number>;

export type Phase = {
  t: number;
  name: string;
  cues: { legs: string; trunk: string; arm: string; other: string; eyes: string };
};

export type Move = {
  id: string;
  label: string;
  summary: string;
  duration: number;
  keys: { t: number; pose: Pose }[];
  phases: Phase[];
};

const BASE: Pose = {
  rShX: 0, rShZ: -8, lShZ: 8, rHipZ: -4, lHipZ: 4,
};
const P = (...parts: Pose[]): Pose => Object.assign({}, BASE, ...parts);

// Building blocks
const READY_LEGS: Pose = { rHipX: -38, rKnee: 55, rAnk: 0, lHipX: -38, lKnee: 55, lAnk: 0, rHipZ: -14, lHipZ: 14, rHipY: -10, lHipY: 10, spineX: 18, headX: -14 };
const READY_ARMS: Pose = { rShX: -55, rShZ: -30, rEl: -75, rWrX: -40, rWrY: 0, lShX: -40, lShZ: 25, lEl: -60 };
const READY = P(READY_LEGS, READY_ARMS);

// Side-on overhead preparation (clear / smash), weight on the back (right) foot.
const OVERHEAD_PREP = P({
  yaw: -70, rHipX: -20, rKnee: 30, lHipX: -35, lKnee: 18, rHipZ: -12, lHipZ: 6,
  spineX: -8, spineY: -10, spineZ: 6, headX: -28, headY: 50,
  rShX: -10, rShZ: -90, rShY: -90, rEl: -95, rWrX: 25, rWrY: 0,
  lShX: -160, lShZ: 20, lEl: -10,
});
// Racket drops behind the back as the elbow leads up (just before the swing).
const RACKET_DROP: Pose = { rShX: -20, rShZ: -120, rShY: -200, rEl: -130, rWrX: -20, rWrY: 0 };
const OVERHEAD_CONTACT = P({
  yaw: -20, rHipX: 5, rKnee: 15, lHipX: -25, lKnee: 20, spineX: 2, spineY: 20, headX: -30, headY: 10,
  rShX: -172, rShZ: -10, rEl: -8, rWrX: -10, rWrY: -40,
  lShX: -60, lShZ: 30, lEl: -70,
});
const OVERHEAD_FINISH = P({
  yaw: 0, rHipX: -20, rKnee: 30, lHipX: -30, lKnee: 35, spineX: 25, spineY: 35, headX: -10,
  rShX: -40, rShZ: 30, rEl: -40, rWrX: 20, rWrY: -60,
  lShX: -20, lShZ: 20, lEl: -80,
});

export const MOVES: Record<string, Move> = {
  ready: {
    id: "ready",
    label: "Ready stance",
    summary: "The base position you return to after every shot.",
    duration: 2.4,
    keys: [
      { t: 0, pose: READY },
      { t: 1.2, pose: P(READY, { rKnee: 62, lKnee: 62, rHipX: -42, lHipX: -42 }) },
      { t: 2.4, pose: READY },
    ],
    phases: [
      {
        t: 0.6,
        name: "Ready",
        cues: {
          legs: "Feet a little wider than your shoulders, right foot slightly forward in singles. Knees bent, weight on the balls of your feet.",
          trunk: "Lean slightly forwards from the hips, back straight.",
          arm: "Racket up in front of your chest, head of the racket above your hand, elbow comfortably bent.",
          other: "Non-racket arm up and out in front for balance.",
          eyes: "Watch your opponent's racket, not just the shuttle.",
        },
      },
    ],
  },

  split: {
    id: "split",
    label: "Split step",
    summary: "A small hop timed with your opponent's hit, so you can push off in any direction.",
    duration: 1.6,
    keys: [
      { t: 0, pose: READY },
      { t: 0.35, pose: P(READY, { rKnee: 35, lKnee: 35, rHipX: -22, lHipX: -22, rAnk: 15, lAnk: 15, air: 0 }) },
      { t: 0.55, pose: P(READY, { rKnee: 30, lKnee: 30, rHipX: -20, lHipX: -20, rAnk: 20, lAnk: 20, air: 9, rHipZ: -10, lHipZ: 10 }) },
      { t: 0.8, pose: P(READY, { rKnee: 75, lKnee: 75, rHipX: -50, lHipX: -50, rHipZ: -22, lHipZ: 22, spineX: 24 }) },
      { t: 1.6, pose: READY },
    ],
    phases: [
      { t: 0.3, name: "Load", cues: { legs: "Rise onto the balls of your feet.", trunk: "Stay tall and relaxed.", arm: "Racket stays up in front.", other: "Balance arm stays out.", eyes: "Watch your opponent's racket start its swing." } },
      { t: 0.55, name: "Hop", cues: { legs: "A small, quick hop, only a few centimetres, timed with the opponent's hit.", trunk: "Keep your chest over your feet.", arm: "Don't drop the racket.", other: "Arms stay up.", eyes: "Read where the shuttle is going." } },
      { t: 0.85, name: "Land wide", cues: { legs: "Land with feet wider than before and knees bent, like a coiled spring, ready to push in any direction.", trunk: "Slight forward lean.", arm: "Racket up and ready.", other: "Arm out for balance.", eyes: "Pick up the shuttle early." } },
    ],
  },

  lunge: {
    id: "lunge",
    label: "Lunge to the net",
    summary: "The big step that gets you to a shot in the forecourt, then back to base.",
    duration: 2.6,
    keys: [
      { t: 0, pose: READY },
      { t: 0.4, pose: P(READY, { z: 25, x: -5, lHipX: -10, lKnee: 20, rHipX: -50, rKnee: 60 }) },
      { t: 0.85, pose: P({ z: 105, x: -30, yaw: -12, rHipX: -88, rKnee: 92, rAnk: -8, rHipZ: -8, lHipX: 32, lKnee: 18, lAnk: 40, lHipZ: 6, spineX: 22, spineY: 6, headX: -18, rShX: -88, rShZ: -18, rEl: -12, rWrX: -30, rWrY: 0, lShX: 15, lShZ: 35, lEl: -15 }) },
      { t: 1.4, pose: P({ z: 105, x: -30, yaw: -12, rHipX: -88, rKnee: 92, rAnk: -8, rHipZ: -8, lHipX: 32, lKnee: 18, lAnk: 40, lHipZ: 6, spineX: 22, spineY: 6, headX: -18, rShX: -80, rShZ: -18, rEl: -20, rWrX: -45, rWrY: 0, lShX: 15, lShZ: 35, lEl: -15 }) },
      { t: 1.9, pose: P(READY, { z: 45, x: -10, rHipX: -55, rKnee: 55, lHipX: -10, lKnee: 30 }) },
      { t: 2.6, pose: READY },
    ],
    phases: [
      { t: 0.35, name: "Push off", cues: { legs: "Push off hard from your left (back) foot.", trunk: "Stay upright; don't lean forwards to reach.", arm: "Racket arm starts to reach forwards.", other: "Balance arm begins to move back.", eyes: "Keep your eyes on the shuttle as it drops." } },
      { t: 0.9, name: "Lunge", cues: { legs: "Big step with the right foot, landing heel first, toes pointing at the shuttle. Front knee over the ankle, not past the toes. Back leg long, back foot dragging on its inside edge.", trunk: "Chest up, back straight, slight forward lean.", arm: "Racket arm fully reaching, racket face up to meet the shuttle early near the tape.", other: "Left arm extends back to counterbalance.", eyes: "Head still, watching the shuttle onto the strings." } },
      { t: 1.65, name: "Recover", cues: { legs: "Push back off your right heel and bring the back foot in.", trunk: "Stay upright as you move back.", arm: "Racket comes back up in front.", other: "Arm returns to the front.", eyes: "Look at your opponent for the next shot." } },
    ],
  },

  rear: {
    id: "rear",
    label: "Back-court footwork",
    summary: "Turn and chassé back to the forehand rear corner, then return to base.",
    duration: 3.2,
    keys: [
      { t: 0, pose: READY },
      { t: 0.35, pose: P(READY, { yaw: -50, rHipX: -15, rKnee: 30, lHipX: -45, lKnee: 50, spineX: 10 }) },
      { t: 0.75, pose: P({ yaw: -75, z: -55, x: -25, rHipX: 20, rKnee: 25, lHipX: -45, lKnee: 40, spineX: 4, headX: -20, headY: 45, rShX: -10, rShZ: -85, rShY: -80, rEl: -95, rWrX: 20, lShX: -120, lShZ: 20, lEl: -20 }) },
      { t: 1.05, pose: P({ yaw: -80, z: -95, x: -40, rHipX: -15, rKnee: 30, lHipX: 5, lKnee: 25, spineX: 4, headX: -24, headY: 50, rShX: -10, rShZ: -90, rShY: -90, rEl: -95, rWrX: 25, lShX: -140, lShZ: 20, lEl: -15, air: 4 }) },
      { t: 1.4, pose: P(OVERHEAD_PREP, { z: -150, x: -60 }) },
      { t: 1.7, pose: P(OVERHEAD_CONTACT, { z: -150, x: -60, air: 8 }) },
      { t: 2.0, pose: P(OVERHEAD_FINISH, { z: -130, x: -55 }) },
      { t: 2.6, pose: P(READY, { z: -50, x: -20, rHipX: -50, rKnee: 60, lHipX: -20, lKnee: 40 }) },
      { t: 3.2, pose: READY },
    ],
    phases: [
      { t: 0.3, name: "Turn", cues: { legs: "Pivot on your left foot and turn your right foot towards the back corner.", trunk: "Turn your hips and shoulders side-on.", arm: "Bring the racket up and back early.", other: "Left arm starts to rise.", eyes: "Track the shuttle over your head." } },
      { t: 0.9, name: "Chassé", cues: { legs: "Side-skip backwards: right foot back, left foot closes towards it, without crossing your feet.", trunk: "Stay side-on, upright, not leaning back.", arm: "Racket arm in the throwing position: elbow up, racket behind.", other: "Left arm points up at the shuttle.", eyes: "Get behind the shuttle, not under it." } },
      { t: 1.65, name: "Hit and scissor", cues: { legs: "Push up from the right leg and scissor: right leg comes forwards, left goes back as you land.", trunk: "Rotate your hips and chest to face the net.", arm: "Throw the racket up and through the shuttle.", other: "Left arm pulls down to help the rotation.", eyes: "Eyes up on the contact point." } },
      { t: 2.6, name: "Return", cues: { legs: "Land on the left foot, push off towards the centre with small steps.", trunk: "Recover upright.", arm: "Racket back up in front.", other: "Arm returns to the front.", eyes: "Watch the opponent's reply." } },
    ],
  },

  clear: {
    id: "clear",
    label: "Forehand clear",
    summary: "A high, deep shot to the back of your opponent's court.",
    duration: 2.6,
    keys: [
      { t: 0, pose: READY },
      { t: 0.6, pose: OVERHEAD_PREP },
      { t: 1.0, pose: P(OVERHEAD_PREP, RACKET_DROP, { rKnee: 40, rHipX: -26 }) },
      { t: 1.25, pose: OVERHEAD_CONTACT },
      { t: 1.65, pose: OVERHEAD_FINISH },
      { t: 2.6, pose: READY },
    ],
    phases: [
      { t: 0.6, name: "Prepare", cues: { legs: "Side-on, weight on your back (right) foot, knees slightly bent.", trunk: "Shoulders and hips turned so your left shoulder points at the net.", arm: "Elbow up at shoulder height, racket held up and back: the “throwing” position.", other: "Left arm points up at the shuttle to aim and balance.", eyes: "Get behind the shuttle and keep your head up." } },
      { t: 1.0, name: "Load", cues: { legs: "Drive up from the back leg.", trunk: "Hips start to rotate first, chest follows.", arm: "Racket drops behind your back as the elbow leads up.", other: "Left arm starts to pull down.", eyes: "Track the shuttle into the hitting zone." } },
      { t: 1.25, name: "Contact", cues: { legs: "Weight moves from back foot to front foot.", trunk: "Chest rotates to face the net.", arm: "Reach up: arm nearly straight, contact at the highest point slightly in front of your head, forearm rotating (pronation) and fingers squeezing.", other: "Left arm tucked in to the body.", eyes: "Watch the shuttle onto the strings." } },
      { t: 1.8, name: "Follow through", cues: { legs: "Right leg comes through, ready to step back to base.", trunk: "Finish facing the net.", arm: "Racket follows through down and across your body, then relaxes.", other: "Left arm balances.", eyes: "Look up to see where the shuttle lands and the opponent's reply." } },
    ],
  },

  smash: {
    id: "smash",
    label: "Jump smash",
    summary: "A steep, fast attacking shot, hit at the top of a jump.",
    duration: 2.8,
    keys: [
      { t: 0, pose: READY },
      { t: 0.6, pose: P(OVERHEAD_PREP, { rKnee: 55, lKnee: 45, rHipX: -40, lHipX: -45 }) },
      { t: 0.95, pose: P(OVERHEAD_PREP, { air: 32, rHipX: -40, rKnee: 70, lHipX: -10, lKnee: 60, ...RACKET_DROP, spineX: -12 }) },
      { t: 1.15, pose: P(OVERHEAD_CONTACT, { air: 38, rShX: -150, spineX: 18, rWrX: 20, rHipX: -10, rKnee: 40, lHipX: -40, lKnee: 50 }) },
      { t: 1.45, pose: P(OVERHEAD_FINISH, { air: 0, rShX: -20, rShZ: 35, spineX: 35, rHipX: -45, rKnee: 60, lHipX: 10, lKnee: 30 }) },
      { t: 2.0, pose: P(READY, { z: 30, rHipX: -50, rKnee: 65, lHipX: -10, lKnee: 40 }) },
      { t: 2.8, pose: READY },
    ],
    phases: [
      { t: 0.6, name: "Prepare and crouch", cues: { legs: "Side-on and sink into both legs to load the jump.", trunk: "Turned side-on, chest open.", arm: "Throwing position: elbow up, racket behind.", other: "Left arm up at the shuttle.", eyes: "Get under and slightly behind the shuttle." } },
      { t: 0.95, name: "Jump", cues: { legs: "Explode up off both feet (or the right foot), knees tucking slightly in the air.", trunk: "Arch back slightly in the air to stretch the front of the body.", arm: "Racket drops low behind your back.", other: "Left arm high.", eyes: "Eyes on the shuttle." } },
      { t: 1.15, name: "Contact", cues: { legs: "Legs scissor in the air.", trunk: "Snap the trunk forwards and rotate to face the net.", arm: "Hit at the top of the jump, in front of your head, with a fast forearm rotation and finger squeeze; racket face angled down.", other: "Left arm pulls down hard.", eyes: "Watch contact; head stays up until after the hit." } },
      { t: 1.5, name: "Land and recover", cues: { legs: "Land on the left then right foot, bending the knees to absorb, then move forwards for the reply.", trunk: "Lean forwards after the hit.", arm: "Follow through down past your left hip, then bring the racket up quickly.", other: "Arm balances the landing.", eyes: "Expect a block to the net." } },
    ],
  },

  net: {
    id: "net",
    label: "Net shot",
    summary: "A soft shot that tumbles just over the net.",
    duration: 2.6,
    keys: [
      { t: 0, pose: READY },
      { t: 0.5, pose: P(READY, { z: 40, x: -8, rHipX: -55, rKnee: 60, lHipX: -10, lKnee: 25, rShX: -75, rEl: -30 }) },
      { t: 0.95, pose: P({ z: 115, x: -15, yaw: -8, rHipX: -88, rKnee: 92, rAnk: -8, rHipZ: -8, lHipX: 32, lKnee: 18, lAnk: 40, lHipZ: 6, spineX: 18, spineY: 4, headX: -12, rShX: -105, rShZ: -12, rEl: -14, rWrX: -55, rWrY: 0, lShX: 15, lShZ: 35, lEl: -15 }) },
      { t: 1.35, pose: P({ z: 115, x: -15, yaw: -8, rHipX: -88, rKnee: 92, rAnk: -8, rHipZ: -8, lHipX: 32, lKnee: 18, lAnk: 40, lHipZ: 6, spineX: 18, spineY: 4, headX: -12, rShX: -108, rShZ: -12, rEl: -10, rWrX: -40, rWrY: -10, lShX: 15, lShZ: 35, lEl: -15 }) },
      { t: 1.9, pose: P(READY, { z: 50, x: -8, rHipX: -55, rKnee: 55, lHipX: -10, lKnee: 30 }) },
      { t: 2.6, pose: READY },
    ],
    phases: [
      { t: 0.5, name: "Approach", cues: { legs: "Small steps forwards, then push off the back foot.", trunk: "Upright, no bending at the waist.", arm: "Racket up and forwards early, in front of your body.", other: "Arm moves back for balance.", eyes: "Watch the shuttle as it crosses the net." } },
      { t: 1.0, name: "Lunge and meet early", cues: { legs: "Lunge with the right foot, heel first, front knee over the ankle.", trunk: "Chest up and still.", arm: "Arm extended with the racket face flat, meeting the shuttle as close to the tape as possible. Hold the grip in your fingers, very lightly.", other: "Left arm extended back.", eyes: "Head still, eyes on the shuttle and the tape." } },
      { t: 1.35, name: "Lift with the fingers", cues: { legs: "Hold the lunge, don't bounce.", trunk: "Stay still; the body does nothing here.", arm: "A tiny push with the fingers and thumb lifts the shuttle over. No arm swing.", other: "Hold balance.", eyes: "Watch the shuttle tumble over." } },
      { t: 1.9, name: "Recover", cues: { legs: "Push back off the right heel towards the centre.", trunk: "Upright.", arm: "Racket up, ready for a push or net kill.", other: "Arm returns to the front.", eyes: "Watch the opponent; a lift or net reply is coming." } },
    ],
  },
};

const smooth = (t: number) => t * t * (3 - 2 * t);

export function poseAt(move: Move, t: number): Pose {
  const keys = move.keys;
  if (t <= keys[0].t) return keys[0].pose;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t <= b.t) {
      const k = smooth((t - a.t) / (b.t - a.t));
      const out: Pose = {};
      const names = new Set([...Object.keys(a.pose), ...Object.keys(b.pose)]);
      for (const n of names) out[n] = (a.pose[n] ?? 0) + ((b.pose[n] ?? 0) - (a.pose[n] ?? 0)) * k;
      return out;
    }
  }
  return keys[keys.length - 1].pose;
}

export function phaseAt(move: Move, t: number): number {
  let idx = 0;
  move.phases.forEach((p, i) => {
    const start = i === 0 ? 0 : (move.phases[i - 1].t + p.t) / 2;
    if (t >= start) idx = i;
  });
  return idx;
}
