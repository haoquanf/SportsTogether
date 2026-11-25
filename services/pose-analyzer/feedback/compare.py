"""Compare a member's stroke with the coach reference and write a score and tips."""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

from pipeline.metrics import StrokeMetrics

REFERENCES = Path(__file__).resolve().parent.parent / "references"
LOW_CONFIDENCE = 0.5
POSITIVE_TIP = "Your {name} matches the coach closely. Keep it up."
METRIC_NAMES = {
    "elbow_at_contact": "arm extension at contact",
    "shoulder_at_contact": "reach at contact",
    "elbow_at_prep": "racket preparation",
    "trunk_lean_at_contact": "body position",
    "knee_bend_at_prep": "leg loading",
    "contact_height": "contact height",
    "prep_to_contact_s": "swing timing",
}


@dataclass
class MetricResult:
    metric: str
    value: float
    target: float
    diff: float  # signed: value - target
    score: float  # 0..100


@dataclass
class Feedback:
    stroke: str
    score: int
    tips: list[str]
    metrics: list[MetricResult] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def load_reference(stroke: str) -> dict:
    path = REFERENCES / f"{stroke}.json"
    if not path.exists():
        raise ValueError(f"No coach reference for stroke '{stroke}' yet")
    return json.loads(path.read_text())


def _fmt(diff: float, unit: str) -> str:
    if unit == "s":
        return f"{abs(diff):.2f}"
    if unit == "body":
        return f"{abs(diff):.1f}"
    return f"{abs(diff):.0f}"


def compare(metrics: StrokeMetrics, stroke: str, max_tips: int = 4) -> Feedback:
    ref = load_reference(stroke)
    values = metrics.as_dict()
    results: list[tuple[float, MetricResult, dict]] = []
    total = weights = 0.0
    for name, spec in ref["metrics"].items():
        value = values[name]
        diff = value - spec["target"]
        excess = max(0.0, abs(diff) - spec["tolerance"])
        score = max(0.0, 1.0 - excess / spec["span"]) * 100
        r = MetricResult(metric=name, value=round(value, 2), target=spec["target"], diff=round(diff, 2), score=round(score, 1))
        results.append((spec["weight"] * (100 - score), r, spec))
        total += spec["weight"] * score
        weights += spec["weight"]

    overall = int(round(total / weights)) if weights else 0
    tips = []
    for penalty, r, spec in sorted(results, key=lambda t: -t[0]):
        if penalty <= 0 or len(tips) >= max_tips:
            continue
        template = spec["low"] if r.diff < 0 else spec["high"]
        tips.append(template.format(diff=_fmt(r.diff, spec["unit"])))
    # Always give at least 3 tips: fill with what the member does well.
    for _, r, _ in sorted(results, key=lambda t: t[0]):
        if len(tips) >= 3:
            break
        if r.score >= 95:
            tips.append(POSITIVE_TIP.format(name=METRIC_NAMES.get(r.metric, r.metric)))

    warnings = []
    if metrics.confidence < LOW_CONFIDENCE:
        warnings.append(
            "Parts of your body were hard to see, so these tips may be less accurate. "
            "Film from the side, 3 to 5 metres away, with your whole body in the frame."
        )
    return Feedback(stroke=stroke, score=overall, tips=tips, metrics=[r for _, r, _ in results], warnings=warnings)
