"use client";

// The member's clip with their skeleton drawn over it, next to the coach's swing,
// kept in step by the time alignment. Problem joints light up during the phase they belong to.

import { useCallback, useEffect, useRef, useState } from "react";
import { phaseOf, type Analysis, type P2, type Reference } from "@/lib/coach/analyze";
import { DOTS } from "@/lib/coach/landmarks";
import { PHASES, type Phase } from "@/lib/coach/smash";
import { COLORS, drawSkeleton, fitFrames, type Label } from "./draw";

const SPEEDS = [0.25, 0.5, 1];

export type Jump = { frame: number; n: number };

function sizeCanvas(c: HTMLCanvasElement) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = c.clientWidth, h = c.clientHeight;
  if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
  }
  const ctx = c.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

export function SideBySide({
  videoUrl,
  videoAspect,
  analysis: a,
  reference: ref,
  jump,
}: {
  videoUrl: string;
  videoAspect: number;
  analysis: Analysis;
  reference: Reference;
  jump?: Jump | null;
}) {
  const userVideo = useRef<HTMLVideoElement>(null);
  const refVideo = useRef<HTMLVideoElement>(null);
  const userCanvas = useRef<HTMLCanvasElement>(null);
  const refCanvas = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(0.5);
  const [frame, setFrame] = useState(a.window[0]);
  const [showRefVideo, setShowRefVideo] = useState(!!ref.video);

  const [from, to] = a.window;
  const fps = a.fps;
  const mirrorRef = a.facing === -1;
  const phase: Phase = phaseOf(frame, a.keyframes);

  const draw = useCallback(
    (f: number) => {
      const marks = a.highlights[phaseOf(f, a.keyframes)];
      const failing = a.metrics.filter((m) => m.score < 85 && m.phase === phaseOf(f, a.keyframes) && m.unit === "deg");
      const userLabels: Label[] = [];
      const refLabels: Label[] = [];
      for (const m of failing) {
        const joint = m.joints[Math.min(1, m.joints.length - 1)];
        if (userLabels.some((l) => l.joint === joint)) continue;
        userLabels.push({ joint, text: `${Math.round(m.value)}°` });
        refLabels.push({ joint, text: `${Math.round(m.target)}°` });
      }

      const uc = userCanvas.current;
      if (uc) {
        const { ctx, w, h } = sizeCanvas(uc);
        const p = a.overlay[f];
        if (p && a.found[f]) {
          drawSkeleton(ctx, p.map(([x, y]) => [x * w, y * h] as P2), { color: COLORS.line, marks, labels: userLabels, scale: Math.max(0.7, w / 360) });
        }
      }

      const rc = refCanvas.current;
      if (rc) {
        const { ctx, w, h } = sizeCanvas(rc);
        const ri = Math.max(0, Math.min(ref.frames.length - 1, Math.round(a.userToRef[f] ?? 0)));
        const refMarks = Object.fromEntries(Object.keys(marks).map((k) => [k, 1])) as Record<number, 1>;
        const opts = { color: COLORS.good, marks: refMarks, markColor: () => "#ffffff", labels: refLabels, scale: Math.max(0.7, w / 360) };
        if (ref.video && showRefVideo) {
          const vp = ref.video.frames[ri];
          if (vp) drawSkeleton(ctx, vp.map(([x, y]) => [x * w, y * h] as P2), opts);
          const v = refVideo.current;
          const t = ref.video.start + ri / ref.fps;
          if (v && Math.abs(v.currentTime - t) > 0.5 / ref.fps) v.currentTime = t;
        } else {
          const map = fitFrames(ref.frames, DOTS, w, h, Math.min(w, h) * 0.1, mirrorRef);
          // Floor line under the lowest foot of the whole swing.
          ctx.strokeStyle = "rgba(255,255,255,0.15)";
          ctx.lineWidth = 1;
          const floor = Math.max(...ref.frames.flatMap((p) => [p[27][1], p[28][1]]));
          const fy = map([0, floor])[1] + 8;
          ctx.beginPath();
          ctx.moveTo(w * 0.08, fy);
          ctx.lineTo(w * 0.92, fy);
          ctx.stroke();
          drawSkeleton(ctx, ref.frames[ri].map(map), opts);
        }
      }
    },
    [a, ref, mirrorRef, showRefVideo],
  );

  // Keep the drawing in step with the video.
  useEffect(() => {
    let raf = 0;
    let last = -1;
    const tick = () => {
      const v = userVideo.current;
      if (v) {
        let f = Math.round(v.currentTime * fps);
        if (!v.paused && f > to + Math.round(0.3 * fps)) {
          v.currentTime = Math.max(0, from - Math.round(0.2 * fps)) / fps;
          f = Math.round(v.currentTime * fps);
        }
        f = Math.max(0, Math.min(a.overlay.length - 1, f));
        if (f !== last) {
          last = f;
          setFrame(f);
          draw(f);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const onResize = () => { last = -1; };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [a, draw, fps, from, to]);

  useEffect(() => {
    const v = userVideo.current;
    if (!v) return;
    v.playbackRate = speed;
    if (playing) v.play().catch(() => setPlaying(false));
    else v.pause();
  }, [playing, speed]);

  const seekTo = useCallback((f: number) => {
    const v = userVideo.current;
    if (!v) return;
    setPlaying(false);
    v.pause();
    v.currentTime = (f + 0.01) / fps;
  }, [fps]);

  useEffect(() => {
    if (jump) seekTo(jump.frame);
  }, [jump, seekTo]);

  const phaseFrame = (p: Phase) => (p === "load" ? a.keyframes.prep : p === "contact" ? a.keyframes.contact : a.keyframes.finish);
  const refAspect = ref.video && showRefVideo ? ref.video.width / ref.video.height : videoAspect;

  return (
    <div className="overflow-hidden rounded-3xl bg-[#06110c] text-white ring-1 ring-white/10">
      <div className="grid grid-cols-2 gap-px bg-white/10">
        <figure className="relative bg-black">
          <div className="relative mx-auto" style={{ aspectRatio: String(videoAspect), width: `min(100%, ${Math.round(560 * videoAspect)}px)` }}>
            <video
              ref={userVideo}
              src={videoUrl}
              muted
              playsInline
              onEnded={(e) => {
                if (!playing) return;
                e.currentTarget.currentTime = Math.max(0, from - Math.round(0.2 * fps)) / fps;
                e.currentTarget.play().catch(() => setPlaying(false));
              }}
              className="absolute inset-0 h-full w-full"
            />
            <canvas ref={userCanvas} className="absolute inset-0 h-full w-full" aria-label="Your skeleton drawn over your video" />
          </div>
          <figcaption className="absolute left-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold">You</figcaption>
        </figure>
        <figure className="relative bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.18),transparent_70%)]">
          <div className="relative mx-auto" style={{ aspectRatio: String(refAspect), width: `min(100%, ${Math.round(560 * refAspect)}px)` }}>
            {ref.video && showRefVideo && (
              <video ref={refVideo} src={ref.video.src} muted playsInline preload="auto" className="absolute inset-0 h-full w-full" />
            )}
            <canvas ref={refCanvas} className="absolute inset-0 h-full w-full" aria-label="The coach's swing at the same moment" />
          </div>
          <figcaption className="absolute left-2 top-2 rounded-full bg-brand-600/90 px-2.5 py-1 text-xs font-semibold">
            {ref.placeholder ? "Sample reference" : "Coach"}
          </figcaption>
        </figure>
      </div>

      <div className="space-y-3 border-t border-white/10 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setPlaying((p) => !p)} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink" aria-label={playing ? "Pause" : "Play"}>
            {playing ? "❚❚ Pause" : "▶ Play"}
          </button>
          <div className="flex rounded-full bg-white/10 p-1 text-xs">
            {SPEEDS.map((s) => (
              <button key={s} onClick={() => setSpeed(s)} className={`rounded-full px-2.5 py-1 ${s === speed ? "bg-white text-ink" : "text-slate-300"}`}>
                {s === 1 ? "1×" : `${s}×`}
              </button>
            ))}
          </div>
          {ref.video && (
            <button onClick={() => setShowRefVideo((s) => !s)} className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-slate-200">
              {showRefVideo ? "Coach skeleton only" : "Show coach video"}
            </button>
          )}
        </div>
        <input
          type="range"
          min={from}
          max={to}
          value={Math.max(from, Math.min(to, frame))}
          onChange={(e) => seekTo(Number(e.target.value))}
          className="w-full accent-brand-500"
          aria-label="Move through the swing"
        />
        <div className="grid grid-cols-3 gap-2">
          {PHASES.map((p) => {
            const issues = Object.keys(a.highlights[p.id]).length > 0;
            return (
              <button
                key={p.id}
                onClick={() => seekTo(phaseFrame(p.id))}
                className={`rounded-xl px-3 py-2 text-left text-xs transition ${phase === p.id ? "bg-white text-ink" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}
              >
                <span className="flex items-center gap-1.5 font-semibold">
                  <span className={`h-2 w-2 rounded-full ${issues ? "bg-red-500" : "bg-brand-400"}`} aria-hidden />
                  {p.label}
                </span>
                <span className="mt-0.5 hidden sm:block">{p.hint}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-400">
          <span className="text-red-400">●</span> needs work · <span className="text-amber-400">●</span> close · White rings on the right show the same joints on the {ref.placeholder ? "reference" : "coach"}. Both swings are lined up moment by moment, so they stay in step even if you swing faster or slower.
        </p>
      </div>
    </div>
  );
}
