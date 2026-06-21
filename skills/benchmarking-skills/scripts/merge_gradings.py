"""Merge per-judge gradings into a median grading.json per process run, and
inject ground-truth should_fire into trigger records (judges never see should_fire).

Usage:
    python merge_gradings.py <iteration_dir> <scenarios.json>

Then run aggregate_scorecard.py on <iteration_dir>.
Stdlib only. Windows-safe (utf-8, pathlib).
"""
import json
import statistics
import sys
from pathlib import Path

DIMS = ["workflow_adherence", "decision_quality", "robustness", "output_quality"]


def _median_int(scores):
    if not scores:
        return None
    m = statistics.median(scores)
    return int(m) if float(m).is_integer() else int(m + 0.5)  # round half up


def merge_process_run(run_dir: Path) -> bool:
    jfiles = sorted(run_dir.glob("grading-j*.json"))
    if not jfiles:
        return False
    judges = []
    for f in jfiles:
        try:
            judges.append(json.loads(f.read_text(encoding="utf-8-sig")))
        except (json.JSONDecodeError, OSError) as e:
            print(f"WARN: skip {f}: {e}")
    if not judges:
        return False
    base = judges[0]
    out = {
        "scenario_id": base.get("scenario_id"),
        "scenario_type": base.get("scenario_type"),
        "config": base.get("config"),
        "run_index": base.get("run_index"),
        "dimensions": {},
        "efficiency": base.get("efficiency", {"total_tokens": 0, "duration_ms": 0, "wasted_work_notes": ""}),
        "_judges": len(judges),
    }
    for dim in DIMS:
        ds = [j.get("dimensions", {}).get(dim) for j in judges]
        ds = [d for d in ds if isinstance(d, dict)]
        applicable = sum(1 for d in ds if d.get("applicable")) > len(ds) / 2
        if applicable:
            scores = [d["score"] for d in ds if d.get("applicable") and d.get("score") is not None]
            score = _median_int(scores)
            ev = ""
            for d in ds:
                if d.get("score") == score and d.get("evidence"):
                    ev = d["evidence"]
                    break
            if not ev and ds:
                ev = ds[0].get("evidence", "")
            out["dimensions"][dim] = {"score": score, "applicable": True,
                                      "evidence": ev, "_all_scores": scores}
        else:
            evs = "; ".join(filter(None, [d.get("evidence", "") for d in ds]))
            out["dimensions"][dim] = {"score": None, "applicable": False, "evidence": evs[:300] or "N/A"}
    (run_dir / "grading.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    return True


def load_should_fire(scenarios_json: Path) -> dict:
    data = json.loads(Path(scenarios_json).read_text(encoding="utf-8-sig"))
    return {s["id"]: s.get("should_fire") for s in data.get("scenarios", []) if s.get("type") == "trigger"}


def merge_trigger_run(run_dir: Path, sf_map: dict) -> bool:
    raw = run_dir / "grading-raw.json"
    if not raw.exists():
        return False
    try:
        r = json.loads(raw.read_text(encoding="utf-8-sig"))
    except (json.JSONDecodeError, OSError) as e:
        print(f"WARN: skip {raw}: {e}")
        return False
    sid = r.get("scenario_id") or run_dir.parents[1].name
    should = sf_map.get(sid)
    fired = bool(r.get("fired"))
    out = {
        "scenario_id": sid, "scenario_type": "trigger", "config": "with_skill",
        "run_index": r.get("run_index", 0),
        "triggering": {"should_fire": should, "fired": fired,
                       "correct": (should == fired), "evidence": r.get("evidence", "")},
    }
    (run_dir / "grading.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    return True


def main():
    iter_dir = Path(sys.argv[1])
    sf_map = load_should_fire(Path(sys.argv[2]))
    proc = trig = 0
    for d in sorted(iter_dir.rglob("*")):
        if not d.is_dir():
            continue
        if list(d.glob("grading-j*.json")):
            if merge_process_run(d):
                proc += 1
        elif (d / "grading-raw.json").exists():
            if merge_trigger_run(d, sf_map):
                trig += 1
    print(f"merged {proc} process runs, {trig} trigger runs into grading.json")


if __name__ == "__main__":
    main()
