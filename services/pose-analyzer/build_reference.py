"""Build a coach reference from several clips of the coach doing one stroke.

    python build_reference.py forehand_clear coach_clear_1.mp4 coach_clear_2.mp4 coach_clear_3.mp4

Averages the coach's measurements into references/<stroke>.json (keeping the
tip wording and tolerances) and copies the first clip to references/<stroke>.mp4
for the side-by-side view. Tolerance is widened if the coach's own clips vary a lot.
"""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

import numpy as np

from feedback.compare import REFERENCES
from pipeline.extract import extract_pose
from pipeline.metrics import compute_metrics


def main(stroke: str, clips: list[str]) -> None:
    ref_path = REFERENCES / f"{stroke}.json"
    ref = json.loads(ref_path.read_text())
    measured = [compute_metrics(extract_pose(c)).as_dict() for c in clips]
    for name, spec in ref["metrics"].items():
        vals = np.array([m[name] for m in measured], dtype=float)
        spec["target"] = round(float(np.nanmean(vals)), 3)
        spec["tolerance"] = round(max(spec["tolerance"], 1.5 * float(np.nanstd(vals))), 3)
    ref["source"] = f"Coach clips: {', '.join(Path(c).name for c in clips)}"
    ref_path.write_text(json.dumps(ref, indent=2))
    shutil.copy(clips[0], REFERENCES / f"{stroke}.mp4")
    print(f"Updated {ref_path}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2:])
