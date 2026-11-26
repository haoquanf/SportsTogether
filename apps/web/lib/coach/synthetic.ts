// "Films" the 3D lesson player doing a smash from the side, giving body points in the
// same format MediaPipe returns. Used for the placeholder reference (until the coach's
// clips exist) and for tests, including deliberately flawed swings.

import * as THREE from "three";
import { MOVES, poseAt, type Move, type Pose } from "../moves";
import { applyPose, bodyKeypoints, buildPlayer } from "../player-rig";
import type { Kp, PoseClip } from "./landmarks";

export type SmashFlaws = {
  /** Straighter legs while loading. */
  stiffLegs?: boolean;
  /** Bent arm at contact. */
  bentArm?: boolean;
  /** Elbow low at contact. */
  lowElbow?: boolean;
  /** Little trunk rotation (stays side-on). */
  noRotation?: boolean;
  /** Racket stops right after contact. */
  shortFollowThrough?: boolean;
};

/** The lesson's jump smash, with optional beginner mistakes mixed into its keyframes. */
export function smashMove(flaws: SmashFlaws = {}): Move {
  const base = MOVES.smash;
  const keys = base.keys.map((k, i) => {
    const p: Pose = { ...k.pose };
    if (flaws.stiffLegs && (i === 1 || i === 2)) Object.assign(p, { rKnee: 6, lKnee: 6, rHipX: -4, lHipX: -6, air: 0 });
    if (i === 3) {
      if (flaws.bentArm) Object.assign(p, { rEl: -80 });
      if (flaws.lowElbow) Object.assign(p, { rShX: -105 });
      if (flaws.noRotation) Object.assign(p, { yaw: -68, spineY: -8 });
    }
    if (i === 4) {
      if (flaws.noRotation) Object.assign(p, { yaw: -62, spineY: -5 });
      if (flaws.shortFollowThrough) Object.assign(p, { rShX: -125, rShZ: -10, rEl: -55 });
    }
    return { t: k.t, pose: p };
  });
  return { ...base, keys };
}

export type FilmOptions = {
  fps?: number;
  width?: number;
  height?: number;
  /** Film from the player's left instead of their right. */
  otherSide?: boolean;
  /** Camera distance in cm. */
  distance?: number;
  /** Random wobble in the points, as a fraction of the frame. */
  noise?: number;
  seed?: number;
  /** Seconds of standing still before the move starts. */
  lead?: number;
};

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

export function filmMove(move: Move, o: FilmOptions = {}): PoseClip {
  const fps = o.fps ?? 30, width = o.width ?? 720, height = o.height ?? 1280;
  const distance = o.distance ?? 450, lead = o.lead ?? 0.4;
  const rig = buildPlayer();
  const rand = rng(o.seed ?? 7);
  const gauss = () => Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand());
  const focal = (0.62 * height * distance) / 200; // a 2 m tall space fills about 62% of the frame height
  const side = o.otherSide ? 1 : -1; // camera on the player's right (-x) or left (+x)
  const cam = new THREE.Vector3(side * distance, 115, 0);
  const frames: Kp[][] = [];
  const total = lead + move.duration;
  for (let i = 0; i * (1 / fps) <= total; i++) {
    const t = Math.max(0, i / fps - lead);
    applyPose(rig, poseAt(move, t));
    const pts = bodyKeypoints(rig);
    const hip = pts[23].clone().add(pts[24]).multiplyScalar(0.5);
    frames.push(
      pts.map((p) => {
        // 3D position in metres around the hips, axes as MediaPipe reports them: x right, y down, z away from the camera.
        const wx = ((p.z - hip.z) * -side) / 100, wy = -(p.y - hip.y) / 100, wz = ((p.x - hip.x) * -side) / 100;
        const depth = (p.x - cam.x) * -side;
        const u = ((p.z - cam.z) * -side * focal) / depth; // the net (+z) ends up on the right when filming from the player's right
        const v = (-(p.y - cam.y) * focal) / depth;
        const nx = (o.noise ?? 0) * gauss(), ny = (o.noise ?? 0) * gauss();
        return [0.5 + u / width + nx, 0.55 + v / height + ny, 0.95, wx, wy, wz] as Kp;
      }),
    );
  }
  return { fps, width, height, frames };
}
