# Judge Subagent — score 1 run against the rubric, with evidence
*The orchestrator sends this prompt to a judge subagent. For the contestable dimensions (workflow_adherence/decision_quality/robustness), spawn 3 judges → use the median (rigorous / adversarial); a lean neutral run uses 1 judge.*

## Input the orchestrator must provide to the judge
- **Skill Contract** (from Phase 0) — the criteria for deciding right/wrong
- **Decision Log** of that run
- **the runner's real transcript** (important — used to compare against the Decision Log)
- **rubric.md** path: `references/rubric.md` — read the anchors before scoring
- **scenario_type** (neutral/adversarial) — determines which dimensions are applicable

## The judge's job
Score 0-5 per `applicable` dimension per the anchors in rubric.md:
- **neutral:** workflow_adherence, decision_quality, output_quality (robustness → applicable=false)
- **adversarial:** all 4 dimensions including robustness
- decision_quality → applicable=false if the Contract has no branch point
- **Judge count depends on rigor:** lean → you may be the sole judge of this run (neutral); adversarial or rigorous → you are 1 of 3 and the orchestrator takes the median. Judge independently either way.
- **Write JSON without a BOM:** write grading files via the Write tool or PowerShell `Set-Content -Encoding utf8` — never the default `Out-File` (it prepends a UTF-8 BOM that breaks merge). merge reads as utf-8-sig as a safety net, but never create a BOM in the first place.

## 3 iron rules
1. **Every score needs `evidence` quoting the real transcript/Decision Log** — no evidence = void score; assign the lowest score the evidence supports, not the score that "feels" right
2. **Compare the Decision Log against the real transcript** — if the log claims step X was done but the transcript shows no trace → trust the transcript and dock workflow_adherence (and note the log mismatch)
3. **robustness ≤2 must quote the rationalization sentence that caused the failure verbatim** in the evidence

## Independence (for multi-judge)
If you are 1 of 3 judges for the same dimension: **judge independently, you do not see the other judges' scores** — the orchestrator computes the median itself

## Output — write grading.json matching the schema exactly
Write it into the run dir. **The dimension keys + field names must not change** (the aggregate script binds to these names):

For a neutral/adversarial run:
```json
{
  "scenario_id": "neutral-1",
  "scenario_type": "neutral",
  "config": "with_skill",
  "run_index": 0,
  "dimensions": {
    "workflow_adherence": {"score": 4, "applicable": true, "evidence": "<real quote>"},
    "decision_quality":   {"score": 5, "applicable": true, "evidence": "<quote the criterion the agent cited>"},
    "robustness":         {"score": null, "applicable": false, "evidence": "neutral — N/A"},
    "output_quality":     {"score": 4, "applicable": true, "evidence": "<quote the artifact>"}
  },
  "efficiency": {"total_tokens": 84852, "duration_ms": 23332, "wasted_work_notes": "<if any>"}
}
```
- `score`: int 0-5 or `null` (if applicable=false) · `applicable`: bool · `evidence`: string (must not be empty if applicable=true)
- Don't use other keys like `name`/`met`/`details` — use only `score`/`applicable`/`evidence`

For a trigger scenario (the judge decides whether fired matches should_fire):
```json
{
  "scenario_id": "trigger-3",
  "scenario_type": "trigger",
  "config": "with_skill",
  "run_index": 0,
  "triggering": {"should_fire": false, "fired": false, "correct": true, "evidence": "near-miss: just asking, not asking for a fix"}
}
```
- `correct` = (`should_fire` == `fired`) · efficiency is not included in a trigger record
