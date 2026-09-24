# Runner - run the target skill on one scenario and record a Decision Log
*The orchestrator sends this prompt to an isolated runner: a subagent, fresh context, or equivalent host mechanism. Run each scenario the number of times the orchestrator specifies - lean x1 / rigorous x2-3 - to measure variance.*

## Input the orchestrator must provide to the runner
- **skill path:** path to the target SKILL.md — or `"none"` for a baseline run
- **scenario:** the scenario's prompt + `scenario_type` (neutral/adversarial) + `scenario_id` + `run_index`
- **output dir:** `<target>-benchmark/iteration-N/<scenario_id>/<config>/run-<index>/`
  (config = `with_skill` or `baseline`)

## The runner's job
1. Complete the scenario **as if doing it for real** - if there is a skill path, load or invoke that skill through the host's mechanism and follow it; if `none`, proceed with normal judgment (this is the baseline).
2. **Record a Decision Log as you go** (not written after the fact to look good) into `decision-log.md`
3. Keep a transcript of your own work in the output dir (the judge compares it against the log)

## Real vs simulated actions
The orchestrator may tell you to simulate some actions (shutdown, `git push`, merge, deploy, deleting data, sending messages). Simulating means: don't execute it — record in the Decision Log what you would have run and why. That applies **only to the actions named**; everything else is done for real:
- **Every file the skill tells you to produce is written as a real file** — reports, plans, patches, summaries — even when the step after it is simulated. Put it in the output dir; if the skill names another location, write it there inside your sandbox and copy it into the output dir too. A deliverable described in the transcript but never written counts as not produced.
- Any other action that is irreversible or reaches outside your sandbox is simulated too, even if the orchestrator didn't name it. Never the reverse: when unsure, simulate the action and still write the file.

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
- Before reporting back, check that `decision-log.md`, the transcript, and every deliverable the skill required exist in the output dir. A run without them can't be judged — write any missing file first, then report.
- Report `total_tokens` and `duration_ms` when the host exposes them; otherwise record the available duration or mark the metric unavailable.
- Don't score yourself — that's the judge's job
