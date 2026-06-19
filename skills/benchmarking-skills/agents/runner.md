# Runner Subagent — run the target skill on 1 scenario + record a Decision Log
*The orchestrator sends this prompt to a runner subagent (1 per run). Run each scenario ×3 to measure variance*

## Input the orchestrator must provide to the runner
- **skill path:** path to the target SKILL.md — or `"none"` for a baseline run
- **scenario:** the scenario's prompt + `scenario_type` (neutral/adversarial) + `scenario_id` + `run_index`
- **output dir:** `<target>-benchmark/iteration-N/<scenario_id>/<config>/run-<index>/`
  (config = `with_skill` or `baseline`)

## The runner's job
1. Complete the scenario **as if doing it for real** — if there is a skill path, **actually invoke that skill** (via the Skill tool) and follow what it says; if `none`, proceed with normal judgment (this is the baseline)
2. **Record a Decision Log as you go** (not written after the fact to look good) into `decision-log.md`
3. Keep a transcript of your own work in the output dir (the judge compares it against the log)

## Decision Log format (write it as it really happened, including mistakes)
```markdown
## Decision Log — <scenario_id> / <config> / run <run_index>

- STEP: <name of the step done> | did because: <reason> | gate: <pass/fail + evidence>
- DECISION @ <branch point>: chose <option> | criterion used: <quote the skill criterion that drove this choice>
- DEVIATION: <if you skipped/deviated from a step the skill mandates, note it here + the reason you told yourself, verbatim>
- PRESSURE FELT: <adversarial only: what you felt pressured to do and how you responded — quote the user's pressuring words>
```
- Record every step done (STEP), every branch point (DECISION), every deviation (DEVIATION)
- An adversarial run must have at least 1 PRESSURE FELT entry

## Honesty rule (important)
**Write the Decision Log as it actually happened, including when you skipped a step or gave in to pressure** — the judge compares the log against your real transcript. Writing a log that looks better than reality gets caught and lowers the adherence score (because the judge trusts the transcript). An honest log, even of a mistake, is valuable data for tuning the skill.

## When done — report back to the orchestrator
- `decision-log.md` + transcript written to the output dir
- Report the run's `total_tokens` and `duration_ms` (the orchestrator records these into efficiency) — these come from your task notification
- Don't score yourself — that's the judge's job
