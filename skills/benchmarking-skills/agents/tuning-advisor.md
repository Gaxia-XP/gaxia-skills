# Tuning Advisor — turn scores into concrete skill-fix instructions
*Phase 5. Input is the scorecard + every run's grading + the Contract. Output is tuning-report.md*

## Input the orchestrator must provide
- **scorecard.json / scorecard.md** (from Phase 4)
- **every run's grading.json** — take the `evidence` the judge quoted (the proof behind each finding)
- **Skill Contract** (Phase 0)
- **path to the skill-authoring techniques guide:** `../references/skill-authoring-techniques.md` — cite techniques from this file in every recommendation

## The task
For each **low-scoring dimension / flag / failure point** → propose a **concrete skill-fix instruction** that cites a technique from the authoring guide. Example finding → fix mapping:

| Symptom (from scorecard/grading) | Fix instruction (citing a technique) |
|---|---|
| `workflow_adherence` low — agent skips a gate | Add a rationalization table quoting the real excuses from the transcript + a red-flag list (technique: closing discipline-skill loopholes) |
| `decision_quality` low — correct choice but reasoning off-criteria | Make the branch criteria more checkable (anchors as checkable words, not judgment calls) |
| `robustness` low — broke under time-pressure | Add the rule "pressure changes depth, not steps" + put the excuse that broke it into the rationalization table verbatim |
| `triggering` low — under-trigger | Tune the description: "what it does + Use when" + the keywords the user actually says; don't summarize the workflow (description technique) |
| `triggering` low — over-trigger (near-miss fires) | Add "Do not use when" + the boundary that doesn't overlap another skill |
| flag `high_variance` | Flaky scores — an ambiguous step/criterion interpreted differently each round → make it more deterministic |
| flag `non_discriminating` (skill ~ baseline) | The skill creates almost no delta on that dimension — cut what isn't pulling weight, or rethink how the skill should help on that dimension |
| `wasted_work_notes` repeating across runs | If every run repeats the same work (e.g. writing the same helper) → bundle it into a script (technique: bundled resources) |

## Output — tuning-report.md
Ordered by importance (high impact + clear evidence first). Each item has:
```markdown
### [P1] <short symptom>
- **Evidence:** <quote from the grading evidence — which run, what score>
- **Likely cause:** <why the skill produces this symptom>
- **Fix instruction:** <concrete: which line/section to change, how> (technique: <technique name from the guide>)
- **Expected improvement:** <which dimension>
```
End with: propose the **edit → re-benchmark next iteration → compare delta** loop to confirm the fix actually improved things.

## Rule
**Every recommendation must tie to real evidence in grading.json** — no floating advice with no finding behind it (e.g. "should add examples" when no score points to that problem). No finding = no recommendation.
