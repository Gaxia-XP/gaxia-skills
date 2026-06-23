import json, time
from pathlib import Path
import context_guard as cg


def test_compute_context_tokens_uses_last_usage_entry():
    lines = [
        json.dumps({"type": "assistant", "message": {"usage": {
            "input_tokens": 1000, "cache_read_input_tokens": 0,
            "cache_creation_input_tokens": 0, "output_tokens": 50}}}),
        json.dumps({"type": "user", "message": {"content": "hi"}}),
        json.dumps({"type": "assistant", "message": {"usage": {
            "input_tokens": 180000, "cache_read_input_tokens": 25000,
            "cache_creation_input_tokens": 3000, "output_tokens": 1200}}}),
    ]
    assert cg.compute_context_tokens("\n".join(lines)) == 180000 + 25000 + 3000 + 1200


def test_compute_context_tokens_ignores_bad_and_usageless_lines():
    text = "not json\n" + json.dumps({"type": "user", "message": {"content": "x"}}) + "\n\n"
    assert cg.compute_context_tokens(text) == 0


def test_marker_is_active_fresh_true(tmp_path):
    m = tmp_path / ".dbmt-active"
    m.write_text("2026-06-23T00:00:00")
    assert cg.marker_is_active(m) is True


def test_marker_is_active_stale_false(tmp_path):
    import os
    m = tmp_path / ".dbmt-active"
    m.write_text("old")
    old = time.time() - 13 * 3600
    os.utime(m, (old, old))
    assert cg.marker_is_active(m) is False


def test_marker_is_active_missing_false(tmp_path):
    assert cg.marker_is_active(tmp_path / "nope") is False


def test_build_warning_above_threshold_mentions_compact_and_handoff():
    w = cg.build_warning(205000, threshold=200000)
    assert w is not None and "/compact" in w and "hand off" in w


def test_build_warning_below_threshold_is_none():
    assert cg.build_warning(150000, threshold=200000) is None
