"""Make a fake side-view overhead swing so the maths can be tested without video."""
import numpy as np

from pipeline import pose as P
from pipeline.pose import PoseSequence


def overhead_swing(frames: int = 30, contact_elbow: float = 165.0, fps: float = 30.0) -> PoseSequence:
    pts = np.zeros((frames, 33, 4))
    pts[:, :, 3] = 0.95
    for f in range(frames):
        t = f / (frames - 1)
        body = {
            P.NOSE: (0.52, 0.20), P.L_SHOULDER: (0.48, 0.30), P.R_SHOULDER: (0.50, 0.30),
            P.L_HIP: (0.48, 0.55), P.R_HIP: (0.50, 0.55), P.L_KNEE: (0.47, 0.72), P.R_KNEE: (0.52, 0.72),
            P.L_ANKLE: (0.47, 0.90), P.R_ANKLE: (0.50, 0.90),
        }
        for k, (x, y) in body.items():
            pts[f, k, :2] = (x, y)
        # Upper arm swings from beside the body up to overhead; elbow bends then extends.
        sh = np.array(body[P.R_SHOULDER])
        arm_up = np.radians(60 + 110 * min(t / 0.7, 1.0))  # angle from straight down
        elbow_pos = sh + 0.12 * np.array([np.sin(arm_up) * 0.3, np.cos(arm_up)])
        bend = 80 + (contact_elbow - 80) * max(0.0, (t - 0.4) / 0.3) if t < 0.7 else contact_elbow
        bend = 80 if t < 0.4 else bend
        fore_dir = arm_up + np.radians(180 - bend)
        wrist = elbow_pos + 0.11 * np.array([np.sin(fore_dir) * 0.3, np.cos(fore_dir)])
        if t > 0.7:  # follow-through: wrist drops back down
            wrist = wrist + np.array([0.0, (t - 0.7) * 0.6])
        pts[f, P.R_ELBOW, :2] = elbow_pos
        pts[f, P.R_WRIST, :2] = wrist
        pts[f, P.L_ELBOW, :2] = (0.46, 0.40)
        pts[f, P.L_WRIST, :2] = (0.45, 0.48)
    return PoseSequence(points=pts, fps=fps, width=1000, height=1000)
