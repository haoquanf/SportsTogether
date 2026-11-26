// The 33 body points MediaPipe Pose finds in each video frame, and how to join them up.

export const L = {
  NOSE: 0,
  L_EAR: 7,
  R_EAR: 8,
  L_SHOULDER: 11,
  R_SHOULDER: 12,
  L_ELBOW: 13,
  R_ELBOW: 14,
  L_WRIST: 15,
  R_WRIST: 16,
  L_INDEX: 19,
  R_INDEX: 20,
  L_HIP: 23,
  R_HIP: 24,
  L_KNEE: 25,
  R_KNEE: 26,
  L_ANKLE: 27,
  R_ANKLE: 28,
  L_HEEL: 29,
  R_HEEL: 30,
  L_FOOT: 31,
  R_FOOT: 32,
} as const;

export const POINT_COUNT = 33;

/**
 * One body point: x and y as fractions of the frame (0..1), how sure the model is it can see it (0..1),
 * and its estimated 3D position in metres around the hips (x right, y down, z away from the camera).
 * Angles are measured in 3D so they don't depend much on exactly where the camera stood.
 */
export type Kp = [x: number, y: number, visibility: number, wx: number, wy: number, wz: number];
/** All 33 points in one frame, or null when no person was found. */
export type PoseFrame = Kp[] | null;

/** Body points for every frame of a clip, sampled at a fixed rate. */
export type PoseClip = {
  fps: number;
  width: number;
  height: number;
  frames: PoseFrame[];
  /** Seconds into the video of frame 0. */
  start?: number;
};

export type Side = "right" | "left";

export function sideJoints(side: Side) {
  return side === "right"
    ? { sh: L.R_SHOULDER, el: L.R_ELBOW, wr: L.R_WRIST, hip: L.R_HIP, knee: L.R_KNEE, ankle: L.R_ANKLE, osh: L.L_SHOULDER, ohip: L.L_HIP }
    : { sh: L.L_SHOULDER, el: L.L_ELBOW, wr: L.L_WRIST, hip: L.L_HIP, knee: L.L_KNEE, ankle: L.L_ANKLE, osh: L.R_SHOULDER, ohip: L.R_HIP };
}

/** Lines drawn between body points to make the stick figure. */
export const BONES: [number, number][] = [
  [L.L_SHOULDER, L.R_SHOULDER],
  [L.L_SHOULDER, L.L_ELBOW],
  [L.L_ELBOW, L.L_WRIST],
  [L.R_SHOULDER, L.R_ELBOW],
  [L.R_ELBOW, L.R_WRIST],
  [L.L_SHOULDER, L.L_HIP],
  [L.R_SHOULDER, L.R_HIP],
  [L.L_HIP, L.R_HIP],
  [L.L_HIP, L.L_KNEE],
  [L.L_KNEE, L.L_ANKLE],
  [L.R_HIP, L.R_KNEE],
  [L.R_KNEE, L.R_ANKLE],
  [L.L_ANKLE, L.L_HEEL],
  [L.L_HEEL, L.L_FOOT],
  [L.L_ANKLE, L.L_FOOT],
  [L.R_ANKLE, L.R_HEEL],
  [L.R_HEEL, L.R_FOOT],
  [L.R_ANKLE, L.R_FOOT],
  [L.L_WRIST, L.L_INDEX],
  [L.R_WRIST, L.R_INDEX],
];

/** Points drawn as dots (the face is left out apart from the nose). */
export const DOTS = [
  L.NOSE, L.L_SHOULDER, L.R_SHOULDER, L.L_ELBOW, L.R_ELBOW, L.L_WRIST, L.R_WRIST,
  L.L_HIP, L.R_HIP, L.L_KNEE, L.R_KNEE, L.L_ANKLE, L.R_ANKLE,
];
