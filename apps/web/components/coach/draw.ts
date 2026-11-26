// Draws the stick figure on a canvas, with problem joints coloured in.

import type { P2 } from "@/lib/coach/analyze";
import { BONES, DOTS } from "@/lib/coach/landmarks";

export const COLORS = { bad: "#ef4444", close: "#f59e0b", good: "#4ade80", line: "#ffffff" };

export type Label = { joint: number; text: string };

export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  pts: P2[], // in canvas pixels
  opts: { color: string; marks?: Record<number, 1 | 2>; markColor?: (level: 1 | 2) => string; labels?: Label[]; scale?: number },
) {
  const s = opts.scale ?? 1;
  const markOf = (j: number) => opts.marks?.[j];
  const colorOf = (j: number) => {
    const m = markOf(j);
    return m ? (opts.markColor ? opts.markColor(m) : m === 2 ? COLORS.bad : COLORS.close) : null;
  };
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const [a, b] of BONES) {
    const pa = pts[a], pb = pts[b];
    if (!pa || !pb || !Number.isFinite(pa[0] + pb[0] + pa[1] + pb[1])) continue;
    const c = markOf(a) && markOf(b) ? colorOf(a) : null;
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 6 * s;
    ctx.beginPath();
    ctx.moveTo(pa[0], pa[1]);
    ctx.lineTo(pb[0], pb[1]);
    ctx.stroke();
    ctx.strokeStyle = c ?? opts.color;
    ctx.lineWidth = (c ? 4 : 3) * s;
    ctx.stroke();
  }
  for (const j of DOTS) {
    const p = pts[j];
    if (!p || !Number.isFinite(p[0] + p[1])) continue;
    const c = colorOf(j);
    if (c) {
      ctx.fillStyle = c + "55";
      ctx.beginPath();
      ctx.arc(p[0], p[1], 13 * s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = c ?? opts.color;
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.arc(p[0], p[1], (c ? 6 : 3.5) * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.font = `600 ${Math.round(13 * s)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  for (const l of opts.labels ?? []) {
    const p = pts[l.joint];
    if (!p || !Number.isFinite(p[0] + p[1])) continue;
    const w = ctx.measureText(l.text).width + 10 * s;
    const x = p[0] + 14 * s, y = p[1] - 14 * s;
    ctx.fillStyle = "rgba(15,23,42,0.85)";
    ctx.beginPath();
    ctx.roundRect(x, y - 10 * s, w, 20 * s, 6 * s);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(l.text, x + 5 * s, y);
  }
}

/** Fit a set of normalised frames into a box, keeping proportions. */
export function fitFrames(frames: P2[][], joints: number[], w: number, h: number, pad: number, mirror: boolean) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of frames) for (const j of joints) {
    const [x, y] = p[j];
    if (!Number.isFinite(x + y)) continue;
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  const scale = Math.min((w - 2 * pad) / (maxX - minX || 1), (h - 2 * pad) / (maxY - minY || 1));
  const ox = (w - (maxX - minX) * scale) / 2, oy = (h - (maxY - minY) * scale) / 2;
  return (p: P2): P2 => {
    const x = ox + (p[0] - minX) * scale;
    return [mirror ? w - x : x, oy + (p[1] - minY) * scale];
  };
}
