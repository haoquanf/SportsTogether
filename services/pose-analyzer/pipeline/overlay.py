"""Draw the skeleton on the member's clip, side by side with the coach's."""
from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path

import cv2
import numpy as np

from .pose import SKELETON_EDGES, PoseSequence

MEMBER_COLOUR = (80, 220, 80)  # BGR green
COACH_COLOUR = (255, 170, 60)  # BGR blue


def draw_skeleton(frame: np.ndarray, seq: PoseSequence, index: int, colour) -> None:
    if index >= seq.frames or np.isnan(seq.points[index, :, 0]).all():
        return
    h, w = frame.shape[:2]
    pts = seq.points[index]
    for a, b in SKELETON_EDGES:
        if min(pts[a, 3], pts[b, 3]) < 0.3:
            continue
        pa = (int(pts[a, 0] * w), int(pts[a, 1] * h))
        pb = (int(pts[b, 0] * w), int(pts[b, 1] * h))
        cv2.line(frame, pa, pb, colour, 3, cv2.LINE_AA)
    for p in pts[11:29]:
        if p[3] >= 0.3:
            cv2.circle(frame, (int(p[0] * w), int(p[1] * h)), 4, (255, 255, 255), -1, cv2.LINE_AA)


def _read_frames(path: Path, size: tuple[int, int]) -> list[np.ndarray]:
    cap = cv2.VideoCapture(str(path))
    frames = []
    while True:
        ok, f = cap.read()
        if not ok:
            break
        frames.append(cv2.resize(f, size))
    cap.release()
    return frames


def render_side_by_side(
    member_video: Path,
    member: PoseSequence,
    member_contact: int,
    out_path: Path,
    coach_video: Path | None = None,
    coach: PoseSequence | None = None,
    coach_contact: int = 0,
    height: int = 640,
) -> Path:
    """Write an H.264 MP4. The two clips are aligned so both reach contact on the same frame."""
    mw = int(member.width * height / member.height)
    m_frames = _read_frames(member_video, (mw, height))
    c_frames: list[np.ndarray] = []
    cw = 0
    if coach_video and coach is not None:
        cw = int(coach.width * height / coach.height)
        c_frames = _read_frames(coach_video, (cw, height))

    # Shift the coach clip so contact frames line up.
    offset = member_contact - coach_contact
    with tempfile.TemporaryDirectory() as tmp:
        raw = Path(tmp) / "raw.mp4"
        writer = cv2.VideoWriter(str(raw), cv2.VideoWriter_fourcc(*"mp4v"), member.fps, (mw + cw, height))
        for i, frame in enumerate(m_frames):
            left = frame.copy()
            draw_skeleton(left, member, i, MEMBER_COLOUR)
            cv2.putText(left, "You", (16, 36), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2, cv2.LINE_AA)
            if c_frames:
                ci = min(max(i - offset, 0), len(c_frames) - 1)
                right = c_frames[ci].copy()
                draw_skeleton(right, coach, ci, COACH_COLOUR)
                cv2.putText(right, "Coach", (16, 36), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2, cv2.LINE_AA)
                left = np.hstack([left, right])
            if i == member_contact:
                for _ in range(int(member.fps * 0.6)):  # hold on the contact moment
                    writer.write(left)
            writer.write(left)
        writer.release()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-c:v", "libx264", "-pix_fmt", "yuv420p",
             "-movflags", "+faststart", str(out_path)],
            check=True,
        )
    return out_path
