// Runs MediaPipe Pose on a video in the browser, frame by frame. The video never leaves
// the device: only the pose model is downloaded, the clip is read locally.

import type { PoseLandmarker } from "@mediapipe/tasks-vision";
import type { Kp, PoseClip } from "./landmarks";

const WASM_PATH = "/mediapipe/wasm";
// Used only if the copy in public/ is missing (e.g. a build that skipped scripts/copy-mediapipe.mjs).
const WASM_FALLBACK = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task";

export const SAMPLE_FPS = 30;
export const MAX_SECONDS = 12;

let landmarker: Promise<PoseLandmarker> | null = null;
// VIDEO mode needs timestamps that only ever go up, across every clip.
let clock = 0;

export function loadPoseModel(): Promise<PoseLandmarker> {
  landmarker ??= (async () => {
    const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
    const local = await fetch(`${WASM_PATH}/vision_wasm_internal.js`, { method: "HEAD" }).then((r) => r.ok, () => false);
    const files = await FilesetResolver.forVisionTasks(local ? WASM_PATH : WASM_FALLBACK);
    const make = (delegate: "GPU" | "CPU") =>
      PoseLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    try {
      return await make("GPU");
    } catch {
      return await make("CPU");
    }
  })().catch((e) => {
    landmarker = null;
    throw e;
  });
  return landmarker;
}

function once(el: HTMLMediaElement, event: string, timeoutMs = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      cleanup();
      reject(new Error("The video took too long to load."));
    }, timeoutMs);
    const ok = () => { cleanup(); resolve(); };
    const bad = () => { cleanup(); reject(new Error("This video format can't be played in your browser. Try an MP4 or MOV clip.")); };
    const cleanup = () => {
      clearTimeout(t);
      el.removeEventListener(event, ok);
      el.removeEventListener("error", bad);
    };
    el.addEventListener(event, ok);
    el.addEventListener("error", bad);
  });
}

async function videoDuration(video: HTMLVideoElement): Promise<number> {
  if (Number.isFinite(video.duration) && video.duration > 0) return video.duration;
  // Some recordings (WebM from MediaRecorder) report Infinity until you seek to the end.
  video.currentTime = 1e6;
  await once(video, "seeked");
  const d = video.duration;
  video.currentTime = 0;
  await once(video, "seeked");
  return Number.isFinite(d) ? d : MAX_SECONDS;
}

export type ExtractResult = PoseClip & { duration: number; truncated: boolean };

/** Body points for every 1/30 s of the video (up to MAX_SECONDS). */
export async function extractPose(
  src: string,
  onProgress?: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<ExtractResult> {
  const model = await loadPoseModel();
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.crossOrigin = "anonymous";
  video.src = src;
  await once(video, "loadeddata");
  const duration = await videoDuration(video);
  const length = Math.min(duration, MAX_SECONDS);
  const count = Math.max(1, Math.floor(length * SAMPLE_FPS));
  const frames: (Kp[] | null)[] = [];
  for (let i = 0; i < count; i++) {
    if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
    const t = Math.min(i / SAMPLE_FPS, Math.max(0, duration - 0.001));
    if (Math.abs(video.currentTime - t) > 1e-4) {
      video.currentTime = t;
      await once(video, "seeked");
    }
    clock = Math.max(clock + 1, Math.round(performance.now()));
    const res = model.detectForVideo(video, clock);
    const img = res.landmarks[0], world = res.worldLandmarks[0];
    frames.push(
      img
        ? img.map((p, j) => [p.x, p.y, p.visibility ?? 1, world?.[j]?.x ?? NaN, world?.[j]?.y ?? NaN, world?.[j]?.z ?? NaN] as Kp)
        : null,
    );
    onProgress?.((i + 1) / count);
  }
  const result: ExtractResult = {
    fps: SAMPLE_FPS,
    width: video.videoWidth,
    height: video.videoHeight,
    frames,
    start: 0,
    duration,
    truncated: duration > MAX_SECONDS + 0.05,
  };
  video.removeAttribute("src");
  video.load();
  return result;
}
