"""Turn keypoints into the numbers a coach looks at: joint angles and timing."""
from __future__ import annotations

from dataclasses import asdict, dataclass

import numpy as np

from . import pose as P
from .pose import PoseSequence


def angle(a: np.ndarray, b: np.ndarray, c: np.ndarray) -> float:
    """Angle at b, in degrees, between b->a and b->c (2D image plane)."""
    v1, v2 = a[:2] - b[:2], c[:2] - b[:2]
    n = np.linalg.norm(v1) * np.linalg.norm(v2)
    if n == 0 or np.isnan(n):
        return float("nan")
    return float(np.degrees(np.arccos(np.clip(np.dot(v1, v2) / n, -1.0, 1.0))))


def _aspect_corrected(seq: PoseSequence) -> np.ndarray:
    """x and y in the same units (fraction of frame height), so angles are not stretched."""
    pts = seq.points[:, :, :2].copy()
    pts[:, :, 0] *= seq.width / seq.height
    return pts


def _interpolate_gaps(series: np.ndarray) -> np.ndarray:
    """Fill short NaN gaps (missed detections) by linear interpolation."""
    out = series.copy()
    idx = np.arange(len(out))
    good = ~np.isnan(out)
    if good.sum() >= 2:
        out[~good] = np.interp(idx[~good], idx[good], out[good])
    return out


def _smooth(series: np.ndarray, window: int = 3) -> np.ndarray:
    if len(series) < window:
        return series
    kernel = np.ones(window) / window
    padded = np.pad(series, (window // 2, window // 2), mode="edge")
    return np.convolve(padded, kernel, mode="valid")


@dataclass
class StrokeMetrics:
    hitting_side: str  # "right" or "left"
    contact_frame: int
    prep_frame: int
    elbow_at_contact: float  # 180 = fully straight arm
    shoulder_at_contact: float  # angle hip-shoulder-elbow; ~180 = arm straight overhead
    elbow_at_prep: float  # how far the elbow is bent when loading
    trunk_lean_at_contact: float  # degrees from vertical; positive = leaning back
    knee_bend_at_prep: float  # back-leg knee angle while loading; 180 = straight
    contact_height: float  # wrist height above head at contact, in head-to-hip lengths
    prep_to_contact_s: float  # swing time from loaded position to contact
    peak_wrist_speed: float  # body lengths per second
    confidence: float  # mean keypoint visibility on the hitting arm, 0..1

    def as_dict(self) -> dict:
        return asdict(self)


def detect_hitting_side(seq: PoseSequence) -> str:
    pts = _aspect_corrected(seq)
    speeds = {}
    for side, w in (("right", P.R_WRIST), ("left", P.L_WRIST)):
        d = np.linalg.norm(np.diff(pts[:, w], axis=0), axis=1)
        speeds[side] = np.nanmax(d) if np.any(~np.isnan(d)) else 0.0
    return max(speeds, key=speeds.get)


def compute_metrics(seq: PoseSequence, hitting_side: str | None = None) -> StrokeMetrics:
    """Measure an overhead stroke (clear or smash).

    Contact is taken as the frame where the hitting wrist is highest; the loaded
    ("prep") position is the frame before contact where the elbow is most bent.
    Point the camera at the player's side, about 3 to 5 metres away.
    """
    if seq.frames < 5:
        raise ValueError("Clip is too short to analyse")
    side = hitting_side or detect_hitting_side(seq)
    if side == "right":
        sh, el, wr, hip, knee, ankle = P.R_SHOULDER, P.R_ELBOW, P.R_WRIST, P.R_HIP, P.R_KNEE, P.R_ANKLE
    else:
        sh, el, wr, hip, knee, ankle = P.L_SHOULDER, P.L_ELBOW, P.L_WRIST, P.L_HIP, P.L_KNEE, P.L_ANKLE

    pts = _aspect_corrected(seq)
    for j in range(pts.shape[1]):
        for k in range(2):
            pts[:, j, k] = _smooth(_interpolate_gaps(pts[:, j, k]))
    if np.isnan(pts[:, wr, 1]).all():
        raise ValueError("No person found in the clip")

    n = seq.frames
    elbow = np.array([angle(pts[f, sh], pts[f, el], pts[f, wr]) for f in range(n)])
    contact = int(np.nanargmin(pts[:, wr, 1]))  # smallest y = highest point
    prep = int(np.nanargmin(elbow[: contact + 1])) if contact > 0 else 0

    mid_sh = (pts[:, P.L_SHOULDER] + pts[:, P.R_SHOULDER]) / 2
    mid_hip = (pts[:, P.L_HIP] + pts[:, P.R_HIP]) / 2
    torso = np.nanmedian(np.linalg.norm(mid_sh - mid_hip, axis=1)) or 1.0

    trunk_vec = mid_sh[contact] - mid_hip[contact]
    lean = float(np.degrees(np.arctan2(abs(trunk_vec[0]), -trunk_vec[1])))
    # Leaning back means shoulders behind hips relative to the hitting direction,
    # which for a side view we approximate by the side the non-hitting shoulder faces.
    facing = np.sign(pts[contact, P.NOSE, 0] - mid_sh[contact, 0]) or 1.0
    if np.sign(trunk_vec[0]) == facing:
        lean = -lean

    wrist_speed = np.linalg.norm(np.diff(pts[:, wr], axis=0), axis=1) * seq.fps / torso
    vis = seq.points[:, [sh, el, wr], 3]

    return StrokeMetrics(
        hitting_side=side,
        contact_frame=contact,
        prep_frame=prep,
        elbow_at_contact=float(elbow[contact]),
        shoulder_at_contact=angle(pts[contact, hip], pts[contact, sh], pts[contact, el]),
        elbow_at_prep=float(elbow[prep]),
        trunk_lean_at_contact=lean,
        knee_bend_at_prep=angle(pts[prep, hip], pts[prep, knee], pts[prep, ankle]),
        contact_height=float((pts[contact, P.NOSE, 1] - pts[contact, wr, 1]) / torso),
        prep_to_contact_s=float((contact - prep) / seq.fps),
        peak_wrist_speed=float(np.nanmax(wrist_speed)) if wrist_speed.size else 0.0,
        confidence=float(np.nanmean(vis)) if np.any(~np.isnan(vis)) else 0.0,
    )
