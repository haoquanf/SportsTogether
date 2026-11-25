# Pose analyzer (phase 2)

Python service: FastAPI + MediaPipe Pose + OpenCV + FFmpeg.
Picks up queued analyses, extracts keypoints, compares joint angles with a
reference coach clip, renders the skeleton overlay, and writes a score and tips.
