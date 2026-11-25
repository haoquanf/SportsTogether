"""Pose data structures and the MediaPipe landmark indices we use."""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

# MediaPipe Pose landmark indices (33-point body model).
NOSE = 0
L_SHOULDER, R_SHOULDER = 11, 12
L_ELBOW, R_ELBOW = 13, 14
L_WRIST, R_WRIST = 15, 16
L_HIP, R_HIP = 23, 24
L_KNEE, R_KNEE = 25, 26
L_ANKLE, R_ANKLE = 27, 28

# Bones drawn in the skeleton overlay.
SKELETON_EDGES = [
    (L_SHOULDER, R_SHOULDER), (L_SHOULDER, L_ELBOW), (L_ELBOW, L_WRIST),
    (R_SHOULDER, R_ELBOW), (R_ELBOW, R_WRIST), (L_SHOULDER, L_HIP), (R_SHOULDER, R_HIP),
    (L_HIP, R_HIP), (L_HIP, L_KNEE), (L_KNEE, L_ANKLE), (R_HIP, R_KNEE), (R_KNEE, R_ANKLE),
]


@dataclass
class PoseSequence:
    """Keypoints for every frame of a clip.

    points: array of shape (frames, 33, 4) holding x, y (0..1 of the frame,
    y pointing down), z (relative depth) and visibility (0..1). Frames where no
    person was found are NaN.
    """

    points: np.ndarray
    fps: float
    width: int
    height: int

    @property
    def frames(self) -> int:
        return int(self.points.shape[0])

    def xy_pixels(self, frame: int, landmark: int) -> np.ndarray:
        p = self.points[frame, landmark]
        return np.array([p[0] * self.width, p[1] * self.height])
