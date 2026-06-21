"""Tests for merge_gradings: median (3-judge rigorous), single-judge (lean), BOM tolerance."""
import json
import importlib.util
from pathlib import Path

HERE = Path(__file__).parent
_spec = importlib.util.spec_from_file_location("merge_gradings", HERE / "merge_gradings.py")
mg = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(mg)


def _graded(score):
    return {"scenario_id": "neutral-1", "scenario_type": "neutral", "config": "with_skill",
            "run_index": 0, "dimensions": {
                "workflow_adherence": {"score": score, "applicable": True, "evidence": "e"},
                "decision_quality": {"score": 5, "applicable": True, "evidence": "e"},
                "robustness": {"score": None, "applicable": False, "evidence": "N/A"},
                "output_quality": {"score": 5, "applicable": True, "evidence": "e"}}}


def test_median_of_three(tmp_path):
    for i, s in enumerate([5, 4, 5]):
        (tmp_path / f"grading-j{i}.json").write_text(json.dumps(_graded(s)), encoding="utf-8")
    assert mg.merge_process_run(tmp_path)
    out = json.loads((tmp_path / "grading.json").read_text(encoding="utf-8"))
    assert out["dimensions"]["workflow_adherence"]["score"] == 5


def test_single_judge_lean(tmp_path):
    (tmp_path / "grading-j0.json").write_text(json.dumps(_graded(4)), encoding="utf-8")
    assert mg.merge_process_run(tmp_path)
    out = json.loads((tmp_path / "grading.json").read_text(encoding="utf-8"))
    assert out["dimensions"]["workflow_adherence"]["score"] == 4


def test_trigger_raw_with_bom_is_tolerated(tmp_path):
    # grading-raw.json written WITH a UTF-8 BOM (the 2026-06-21 bug). Must still merge.
    (tmp_path / "grading-raw.json").write_text(
        json.dumps({"scenario_id": "trigger-1", "run_index": 0, "fired": True, "evidence": "e"}),
        encoding="utf-8-sig")
    assert mg.merge_trigger_run(tmp_path, {"trigger-1": True})
    out = json.loads((tmp_path / "grading.json").read_text(encoding="utf-8"))
    assert out["triggering"]["correct"] is True
