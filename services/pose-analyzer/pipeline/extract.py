"""Run MediaPipe Pose over every frame of a video."""
from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

from .pose import PoseSequence

MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/"
    "pose_landmarker_full/float16/latest/pose_landmarker_full.task"
)
DEFAULT_MODEL = Path(__file__).resolve().parent.parent / "models" / "pose_landmarker_full.task"


def ensure_model(path: Path = DEFAULT_MODEL) -> Path:
    if not path.exists():
        import urllib.request

        path.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(MODEL_URL, path)
    return path


def extract_pose(video_path: str | Path, model_path: Path | None = None, max_width: int = 720) -> PoseSequence:
    """Return keypoints per frame. Frames are scaled down to max_width to keep GPU/CPU cost low."""
    from mediapipe import Image, ImageFormat
    from mediapipe.tasks.python import BaseOptions
    from mediapipe.tasks.python.vision import PoseLandmarker, PoseLandmarkerOptions, RunningMode

    options = PoseLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=str(ensure_model(model_path or DEFAULT_MODEL))),
        running_mode=RunningMode.VIDEO,
        num_poses=1,
    )
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise ValueError(f"Could not open video {video_path}")
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frames: list[np.ndarray] = []
    width = height = 0
    with PoseLandmarker.create_from_options(options) as landmarker:
        index = 0
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            h, w = frame.shape[:2]
            if w > max_width:
                frame = cv2.resize(frame, (max_width, int(h * max_width / w)))
            height, width = frame.shape[:2]
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = landmarker.detect_for_video(Image(image_format=ImageFormat.SRGB, data=rgb), int(index * 1000 / fps))
            if result.pose_landmarks:
                lm = result.pose_landmarks[0]
                frames.append(np.array([[p.x, p.y, p.z, p.visibility or 0.0] for p in lm]))
            else:
                frames.append(np.full((33, 4), np.nan))
            index += 1
    cap.release()
    if not frames:
        raise ValueError("The video has no readable frames")
    return PoseSequence(points=np.stack(frames), fps=fps, width=width, height=height)
