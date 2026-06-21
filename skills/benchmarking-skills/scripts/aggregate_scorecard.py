"""Aggregate per-run grading.json files into a benchmark scorecard.

Usage:
    python aggregate_scorecard.py <iteration_dir> --skill-name <name>

Reads every grading.json under <iteration_dir> (recursively), groups by config
(with_skill / baseline), computes per-dimension mean +/- stddev across runs,
overall score and letter grade, with-minus-baseline delta, variance and
non-discriminating flags, and writes scorecard.json + scorecard.md.
Stdlib only. Windows-safe (utf-8, pathlib, forward slashes).
"""
import json
import argparse
import statistics
from pathlib import Path

GRADED_DIMS = ["workflow_adherence", "decision_quality", "robustness", "output_quality"]
HIGH_VARIANCE_STDDEV = 1.0
NON_DISCRIMINATING_DELTA = 0.5


def load_records(iteration_dir):
    iteration_dir = Path(iteration_dir)
    records = []
    for p in sorted(iteration_dir.rglob("grading.json")):
        try:
            records.append(json.loads(p.read_text(encoding="utf-8")))
        except (json.JSONDecodeError, OSError) as e:
            print(f"WARN: skipping unreadable {p}: {e}")
    return records


def grade_letter(score):
    if score is None:
        return "N/A"
    if score >= 4.5:
        return "A"
    if score >= 3.5:
        return "B"
    if score >= 2.5:
        return "C"
    if score >= 1.5:
        return "D"
    return "F"


def _dim_stats(scores):
    vals = [s for s in scores if s is not None]
    if not vals:
        return {"mean": None, "stddev": 0.0, "n": 0, "applicable_n": 0}
    return {
        "mean": round(statistics.mean(vals), 4),
        "stddev": round(statistics.pstdev(vals), 4) if len(vals) > 1 else 0.0,
        "n": len(vals),
        "applicable_n": len(vals),
    }


def _accuracy_to_score(acc):
    if acc >= 0.9:
        return 5
    if acc >= 0.75:
        return 4
    if acc >= 0.6:
        return 3
    if acc >= 0.45:
        return 2
    if acc >= 0.3:
        return 1
    return 0


def _config_report(records):
    graded = [r for r in records if r.get("scenario_type") in ("neutral", "adversarial")]
    dims = {}
    for dim in GRADED_DIMS:
        scores = []
        for r in graded:
            d = r.get("dimensions", {}).get(dim)
            if d and d.get("applicable") and d.get("score") is not None:
                scores.append(d["score"])
        dims[dim] = _dim_stats(scores)

    trig_records = [r for r in records if r.get("scenario_type") == "trigger"]
    if trig_records:
        correct = sum(1 for r in trig_records if r.get("triggering", {}).get("correct"))
        accuracy = round(correct / len(trig_records), 4)
        triggering = {"accuracy": accuracy, "n": len(trig_records),
                      "score": _accuracy_to_score(accuracy)}
    else:
        triggering = {"accuracy": None, "n": 0, "score": None}

    applicable_means = [dims[d]["mean"] for d in GRADED_DIMS if dims[d]["mean"] is not None]
    if triggering["score"] is not None:
        applicable_means.append(triggering["score"])
    overall = round(statistics.mean(applicable_means), 4) if applicable_means else None
    return {"dimensions": dims, "triggering": triggering,
            "overall_score": overall, "grade": grade_letter(overall)}


def aggregate(iteration_dir):
    records = load_records(iteration_dir)
    by_config = {}
    for r in records:
        by_config.setdefault(r.get("config", "with_skill"), []).append(r)
    configs = {cfg: _config_report(recs) for cfg, recs in by_config.items()}

    delta = {}
    flags = {"high_variance": [], "non_discriminating": []}
    ws = configs.get("with_skill")
    bl = configs.get("baseline")
    if ws:
        for dim in GRADED_DIMS:
            wmean = ws["dimensions"][dim]["mean"]
            if wmean is not None and ws["dimensions"][dim]["stddev"] > HIGH_VARIANCE_STDDEV:
                flags["high_variance"].append(dim)
            if bl:
                bmean = bl["dimensions"][dim]["mean"]
                if wmean is not None and bmean is not None:
                    d = round(wmean - bmean, 4)
                    delta[dim] = d
                    if abs(d) < NON_DISCRIMINATING_DELTA:
                        flags["non_discriminating"].append(dim)
    return {"configs": configs, "delta": delta, "flags": flags,
            "record_count": len(records)}


def render_markdown(report, skill_name, scope_note=""):
    lines = [f"# Benchmark Scorecard — {skill_name}", ""]
    if scope_note:
        lines.append(f"_Scope: {scope_note}_")
        lines.append("")
    for cfg, rep in sorted(report["configs"].items()):
        lines.append(f"## Config: {cfg}")
        lines.append(f"**Overall: {rep['overall_score']} ({rep['grade']})**")
        lines.append("")
        lines.append("| Dimension | Mean | Stddev | n |")
        lines.append("|---|---|---|---|")
        for dim in GRADED_DIMS:
            s = rep["dimensions"][dim]
            mean = "N/A" if s["mean"] is None else s["mean"]
            lines.append(f"| {dim} | {mean} | {s['stddev']} | {s['n']} |")
        t = rep["triggering"]
        t_score = "N/A" if t["score"] is None else t["score"]
        t_acc = "N/A" if t["accuracy"] is None else t["accuracy"]
        lines.append(f"| triggering | {t_score} | (acc {t_acc}) | {t['n']} |")
        lines.append("")
    if report["delta"]:
        lines.append("## Δ with_skill − baseline")
        lines.append("| Dimension | Delta |")
        lines.append("|---|---|")
        for dim, d in report["delta"].items():
            lines.append(f"| {dim} | {d:+} |")
        lines.append("")
    if report["flags"]["high_variance"] or report["flags"]["non_discriminating"]:
        lines.append("## Flags")
        if report["flags"]["high_variance"]:
            lines.append(f"- **High variance (flaky?):** {', '.join(report['flags']['high_variance'])}")
        if report["flags"]["non_discriminating"]:
            lines.append(f"- **Non-discriminating (skill ~ baseline):** {', '.join(report['flags']['non_discriminating'])}")
        lines.append("")
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("iteration_dir")
    ap.add_argument("--skill-name", required=True)
    ap.add_argument("--scope-note", default="")
    args = ap.parse_args()
    report = aggregate(args.iteration_dir)
    out_dir = Path(args.iteration_dir)
    (out_dir / "scorecard.json").write_text(
        json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    md = render_markdown(report, args.skill_name, scope_note=args.scope_note)
    (out_dir / "scorecard.md").write_text(md, encoding="utf-8")
    print(f"Wrote {out_dir / 'scorecard.json'} and {out_dir / 'scorecard.md'}")
    print(f"Aggregated {report['record_count']} records")


if __name__ == "__main__":
    main()
