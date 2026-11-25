# Pose analyzer

Python + MediaPipe Pose (Apache 2.0) + OpenCV + FFmpeg.

1. `pipeline/extract.py` finds 33 body keypoints in every frame.
2. `pipeline/metrics.py` finds the loaded position and the contact moment (hitting wrist at its highest),
   then measures arm extension, reach, racket preparation, body lean, knee bend, contact height and swing time.
3. `feedback/compare.py` compares those numbers with the coach reference in `references/<stroke>.json`
   and returns a 0 to 100 score and 3 to 5 plain-language tips, plus a warning when the body is hard to see.
4. `pipeline/overlay.py` draws the skeleton and renders the member's clip side by side with the coach's,
   lined up on the contact moment.

## Try it

```
pip install -r requirements.txt          # Linux also needs libegl1 libgles2 ffmpeg (see Dockerfile)
python analyze.py my_clear.mp4 --stroke forehand_clear --out results/
python -m pytest tests
```

## Coach references

`references/*.json` currently hold textbook placeholder values. Once the coach clips are filmed
(side view, 3 to 5 m away, whole body in frame, 3 to 5 clips per stroke), run:

```
python build_reference.py forehand_clear coach1.mp4 coach2.mp4 coach3.mp4
```
