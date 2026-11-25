import numpy as np
import pytest

from feedback.compare import compare
from pipeline.metrics import angle, compute_metrics
from tests.synthetic import overhead_swing


def test_angle_right_angle():
    assert angle(np.array([1, 0]), np.array([0, 0]), np.array([0, 1])) == pytest.approx(90)


def test_angle_straight():
    assert angle(np.array([-1, 0]), np.array([0, 0]), np.array([1, 0])) == pytest.approx(180)


def test_detects_right_hand_and_contact_after_prep():
    m = compute_metrics(overhead_swing())
    assert m.hitting_side == "right"
    assert m.prep_frame < m.contact_frame
    assert m.prep_to_contact_s > 0
    assert m.confidence > 0.9


def test_bent_arm_scores_lower_and_gets_tip():
    good = compare(compute_metrics(overhead_swing(contact_elbow=170)), "forehand_clear")
    bent = compare(compute_metrics(overhead_swing(contact_elbow=110)), "forehand_clear")
    assert bent.score < good.score
    assert any("Straighten your arm" in t for t in bent.tips)


def test_always_three_to_five_tips():
    fb = compare(compute_metrics(overhead_swing()), "forehand_clear")
    assert 3 <= len(fb.tips) <= 5
    assert 0 <= fb.score <= 100


def test_missing_detections_are_filled():
    seq = overhead_swing()
    seq.points[5:8] = np.nan
    m = compute_metrics(seq)
    assert not np.isnan(m.elbow_at_contact)


def test_low_visibility_warns():
    seq = overhead_swing()
    seq.points[:, :, 3] = 0.2
    fb = compare(compute_metrics(seq), "forehand_clear")
    assert fb.warnings


def test_unknown_stroke():
    with pytest.raises(ValueError):
        compare(compute_metrics(overhead_swing()), "trick_shot")
