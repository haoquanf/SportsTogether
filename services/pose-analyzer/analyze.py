"""Analyse one clip from the command line.

    python analyze.py my_clear.mp4 --stroke forehand_clear --out results/

Writes results/analysis.json and, if a coach clip exists in references/,
results/overlay.mp4 with the skeleton side by side with the coach.
"""
from __future__ import annotations

import argparse
import json
from dataclasses import asdict
from pathlib import Path

from feedback.compare import REFERENCES, compare
from pipeline.extract import extract_pose
from pipeline.metrics import compute_metrics
from pipeline.overlay import render_side_by_side


def analyze(video: Path, stroke: str, out_dir: Path, overlay: bool = True) -> dict:
    seq = extract_pose(video)
    metrics = compute_metrics(seq)
    fb = compare(metrics, stroke)
    result = {"score": fb.score, "tips": fb.tips, "warnings": fb.warnings,
              "metrics": [asdict(m) for m in fb.metrics], "raw": metrics.as_dict()}
    out_dir.mkdir(parents=True, exist_ok=True)
    if overlay:
        coach_video = REFERENCES / f"{stroke}.mp4"
        coach = coach_metrics = None
        if coach_video.exists():
            coach = extract_pose(coach_video)
            coach_metrics = compute_metrics(coach)
        render_side_by_side(
            video, seq, metrics.contact_frame, out_dir / "overlay.mp4",
            coach_video if coach else None, coach, coach_metrics.contact_frame if coach_metrics else 0,
        )
        result["overlay"] = str(out_dir / "overlay.mp4")
    (out_dir / "analysis.json").write_text(json.dumps(result, indent=2))
    return result


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("video", type=Path)
    ap.add_argument("--stroke", default="forehand_clear")
    ap.add_argument("--out", type=Path, default=Path("results"))
    ap.add_argument("--no-overlay", action="store_true")
    args = ap.parse_args()
    r = analyze(args.video, args.stroke, args.out, overlay=not args.no_overlay)
    print(f"Score: {r['score']}")
    for t in r["tips"]:
        print(f"- {t}")
    for w in r["warnings"]:
        print(f"! {w}")
