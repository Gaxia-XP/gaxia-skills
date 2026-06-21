"""Standalone tests — run with: python test_aggregate_scorecard.py"""
import json, tempfile, shutil
from pathlib import Path
import aggregate_scorecard as agg


def _write(run_dir: Path, record: dict):
    run_dir.mkdir(parents=True, exist_ok=True)
    (run_dir / "grading.json").write_text(json.dumps(record), encoding="utf-8")


def _make_iteration(tmp: Path):
    # with_skill: workflow_adherence runs 4 and 5 -> mean 4.5
    _write(tmp / "neutral-1" / "with_skill" / "run-0", {
        "scenario_id": "neutral-1", "scenario_type": "neutral", "config": "with_skill", "run_index": 0,
        "dimensions": {
            "workflow_adherence": {"score": 4, "applicable": True, "evidence": "e"},
            "decision_quality": {"score": 5, "applicable": True, "evidence": "e"},
            "robustness": {"score": None, "applicable": False, "evidence": "N/A"},
            "output_quality": {"score": 5, "applicable": True, "evidence": "e"}},
        "efficiency": {"total_tokens": 100, "duration_ms": 1000, "wasted_work_notes": ""}})
    _write(tmp / "neutral-1" / "with_skill" / "run-1", {
        "scenario_id": "neutral-1", "scenario_type": "neutral", "config": "with_skill", "run_index": 1,
        "dimensions": {
            "workflow_adherence": {"score": 5, "applicable": True, "evidence": "e"},
            "decision_quality": {"score": 5, "applicable": True, "evidence": "e"},
            "robustness": {"score": None, "applicable": False, "evidence": "N/A"},
            "output_quality": {"score": 5, "applicable": True, "evidence": "e"}},
        "efficiency": {"total_tokens": 120, "duration_ms": 1100, "wasted_work_notes": ""}})
    # baseline: workflow_adherence 2
    _write(tmp / "neutral-1" / "baseline" / "run-0", {
        "scenario_id": "neutral-1", "scenario_type": "neutral", "config": "baseline", "run_index": 0,
        "dimensions": {
            "workflow_adherence": {"score": 2, "applicable": True, "evidence": "e"},
            "decision_quality": {"score": 2, "applicable": True, "evidence": "e"},
            "robustness": {"score": None, "applicable": False, "evidence": "N/A"},
            "output_quality": {"score": 3, "applicable": True, "evidence": "e"}},
        "efficiency": {"total_tokens": 90, "duration_ms": 900, "wasted_work_notes": ""}})
    # trigger records: 3 correct of 4
    for i, (sf, f) in enumerate([(True, True), (True, True), (False, False), (False, True)]):
        _write(tmp / f"trigger-{i}" / "with_skill" / "run-0", {
            "scenario_id": f"trigger-{i}", "scenario_type": "trigger", "config": "with_skill", "run_index": 0,
            "triggering": {"should_fire": sf, "fired": f, "correct": sf == f, "evidence": "e"}})


def test_load_and_group():
    tmp = Path(tempfile.mkdtemp())
    try:
        _make_iteration(tmp)
        records = agg.load_records(tmp)
        # fixture creates 3 neutral-config records (2 with_skill + 1 baseline) + 4 trigger = 7
        assert len(records) == 7, f"expected 7 got {len(records)}"
        assert sum(1 for r in records if r["scenario_type"] == "trigger") == 4
    finally:
        shutil.rmtree(tmp)


def test_dimension_mean_stddev():
    tmp = Path(tempfile.mkdtemp())
    try:
        _make_iteration(tmp)
        report = agg.aggregate(tmp)
        wa = report["configs"]["with_skill"]["dimensions"]["workflow_adherence"]
        assert wa["mean"] == 4.5, f"expected 4.5 got {wa['mean']}"
        assert wa["n"] == 2, f"expected n=2 got {wa['n']}"
        assert round(wa["stddev"], 3) == 0.5, f"expected 0.5 got {wa['stddev']}"
    finally:
        shutil.rmtree(tmp)


def test_robustness_not_applicable_excluded():
    tmp = Path(tempfile.mkdtemp())
    try:
        _make_iteration(tmp)
        report = agg.aggregate(tmp)
        rob = report["configs"]["with_skill"]["dimensions"]["robustness"]
        assert rob["applicable_n"] == 0, f"expected 0 applicable got {rob['applicable_n']}"
        assert rob["mean"] is None
    finally:
        shutil.rmtree(tmp)


def test_triggering_accuracy_and_score():
    tmp = Path(tempfile.mkdtemp())
    try:
        _make_iteration(tmp)
        report = agg.aggregate(tmp)
        trig = report["configs"]["with_skill"]["triggering"]
        assert trig["accuracy"] == 0.75, f"expected 0.75 got {trig['accuracy']}"
        assert trig["score"] == 4, f"expected 4 got {trig['score']}"
    finally:
        shutil.rmtree(tmp)


def test_delta_with_minus_baseline():
    tmp = Path(tempfile.mkdtemp())
    try:
        _make_iteration(tmp)
        report = agg.aggregate(tmp)
        d = report["delta"]["workflow_adherence"]
        assert d == 2.5, f"expected 2.5 got {d}"   # 4.5 - 2.0
    finally:
        shutil.rmtree(tmp)


def test_grade_letter():
    assert agg.grade_letter(4.6) == "A"
    assert agg.grade_letter(3.6) == "B"
    assert agg.grade_letter(2.6) == "C"
    assert agg.grade_letter(1.6) == "D"
    assert agg.grade_letter(0.9) == "F"


def test_markdown_render_smoke():
    tmp = Path(tempfile.mkdtemp())
    try:
        _make_iteration(tmp)
        report = agg.aggregate(tmp)
        md = agg.render_markdown(report, skill_name="start-work")
        assert "# Benchmark Scorecard" in md
        assert "start-work" in md
        assert "workflow_adherence" in md
        assert "Δ" in md or "delta" in md.lower()
    finally:
        shutil.rmtree(tmp)


def test_render_no_trigger_shows_na():
    # fallback case: only a neutral record, no trigger scenarios -> triggering is None.
    # The scorecard must render "N/A", never a raw Python "None".
    tmp = Path(tempfile.mkdtemp())
    try:
        _write(tmp / "neutral-1" / "with_skill" / "run-0", {
            "scenario_id": "neutral-1", "scenario_type": "neutral", "config": "with_skill", "run_index": 0,
            "dimensions": {
                "workflow_adherence": {"score": None, "applicable": False, "evidence": "fb"},
                "decision_quality": {"score": None, "applicable": False, "evidence": "fb"},
                "robustness": {"score": None, "applicable": False, "evidence": "fb"},
                "output_quality": {"score": 5, "applicable": True, "evidence": "e"}},
            "efficiency": {"total_tokens": 1, "duration_ms": 1, "wasted_work_notes": ""}})
        report = agg.aggregate(tmp)
        md = agg.render_markdown(report, skill_name="x")
        assert "None" not in md, f"raw None leaked into markdown:\n{md}"
    finally:
        shutil.rmtree(tmp)


def test_render_includes_scope_note():
    # lean/scoped runs must stamp provenance so a partial scorecard isn't mistaken for a full one.
    tmp = Path(tempfile.mkdtemp())
    try:
        _make_iteration(tmp)
        report = agg.aggregate(tmp)
        md = agg.render_markdown(report, skill_name="x", scope_note="lean; types=[trigger]; with_skill only")
        assert "lean; types=[trigger]; with_skill only" in md
    finally:
        shutil.rmtree(tmp)


if __name__ == "__main__":
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    failed = 0
    for t in tests:
        try:
            t(); print(f"PASS {t.__name__}")
        except AssertionError as e:
            failed += 1; print(f"FAIL {t.__name__}: {e}")
        except Exception as e:
            failed += 1; print(f"ERROR {t.__name__}: {type(e).__name__}: {e}")
    print(f"\n{len(tests)-failed}/{len(tests)} passed")
    raise SystemExit(1 if failed else 0)
