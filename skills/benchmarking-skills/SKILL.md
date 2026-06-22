---
name: benchmarking-skills
description: Use when the user wants to benchmark, test, score, evaluate, or measure how well another Claude Code skill performs — how an agent flows through its workflow, makes decisions at branch points, and holds up under pressure — or asks for tuning guidance to improve a skill. Triggers on "benchmark this skill", "ทดสอบ skill", "skill นี้ดีไหม", "ให้คะแนน skill", "ปรับจูน skill", and when a target SKILL.md path is given for evaluation.
---

# Benchmarking Skills

You orchestrate a 6-phase benchmark of a TARGET skill. Drive each phase by invoking the named subagent or script yourself. The output is a `scorecard.md` + `tuning-report.md` backed by real evidence — never a static opinion.

## Rules (rails — read before you start)
1. **Never score without running a real scenario.** Reviewing a skill by just reading its SKILL.md is a violation, not a shortcut — what this skill measures (workflow flow + decision-making + holding up under pressure) is invisible to a static review.
2. **Every score needs evidence** — quote it from the real transcript / Decision Log. A score based on a "feeling" is void.
3. **Always run the baseline (with/without the skill)** unless the user turns it off — no baseline = no way to know whether the skill creates a real delta.
4. **The user must approve scenarios.json before Phase 2** — weak scenarios measure nothing.
5. **Pressure changes depth, not steps** — this applies to us (don't shortcut a phase) AND it is the criterion for judging the target skill's robustness.

## Scope & Rigor (read first — sets the cost)
Start every run by parsing a **scope spec** from the user's request (default = a lean full run):
- `skills` — the target SKILL.md(s) to benchmark
- `scenario_types` — neutral | adversarial | trigger (default: all). "triggers only" = no runners at all
- `scenario_ids` — all in the chosen types, or an explicit subset (e.g. re-run only adversarial-2, -4)
- `configs` — with_skill + baseline (default both; a re-check may be with_skill only)
- `phases` — 0 Profile · 1 Scenario · 2 Run · 3 Judge · 4 Aggregate · 5 Tune (default all; a subset enables reuse)
- `rigor` — lean (default) | rigorous

**Principle: scope narrows the work, reuse fills the rest** — phases/units not in scope reuse existing artifacts (idempotent self-skip). E.g. "re-judge only" → skip Phase 2, reuse the existing transcripts; "re-aggregate" → run the script only. Phase 0/1 reuse the existing Contract + scenarios.json if present.

**Tuning re-bench loop (the highest-value case):** after applying a fix → `{scenario_ids:[the weak ones], configs:[with_skill], reuse the prior baseline}` → ~5–10 agents to confirm the fix moved the score (vs 260 for a full run).

### Lean default (low cost, still trustworthy)
| knob | lean (default) | rigorous |
|---|---|---|
| judges/run | 1 (neutral) / 3-median (adversarial) | 3-median every run |
| runs/config | ×1 | ×2–3 |
| baseline | on (delta is the core signal) | on |
| judge model | sonnet | opus |
| trigger runs | ×1 | ×2 |

Switch to **rigorous** when the user says "rigorous" / "เข้มหน่อย" / "--rigorous", or when gating a real release.
> Keep the median only for adversarial, because robustness/decision are the dimensions judges disagree on most; neutral/output scores are straightforward and stable with 1 judge — this cuts redundancy, not signal (the baseline is still there).

## The 6 Phases

### Phase 0 — Profile: extract the Skill Contract
Read the target SKILL.md (+ its references/agents) → extract the **Skill Contract** (see `references/scenario-design.md`, section "What is a Skill Contract"): step order, branch points + criteria, gates/exits, sub-skills it must invoke **(verify they actually exist in the available skills — referencing a skill that doesn't exist is a bug in the Contract)**, rails/red-flags, expected output, trigger conditions.
**Exit:** the Contract has all 7 items. If there is no step order / no branch point → switch to **fallback** (see rubric) and tell the user.

### Phase 1 — Scenario: build the situations
Per `references/scenario-design.md` + `references/pressure-taxonomy.md`: neutral 3-5, adversarial 3-5 (each one probing a specific rail), trigger 8-10 (should / should-not). Write `scenarios.json`.
**Exit:** the user approves scenarios.json

### Phase 2 — Run: spawn runner subagents
Per scenario, spawn a **runner** (per `agents/runner.md`) — run the target skill for real + record a Decision Log. Run **with_skill and baseline**, and **×3 per config** to measure variance. Save transcript + decision-log.md + efficiency (tokens/duration from the task notification) under `<target>-benchmark/iteration-N/<scenario_id>/<config>/run-<index>/`.
**Exit:** every run has a decision-log.md + transcript

### Phase 3 — Judge: spawn judge subagents
Per run, spawn a **judge** (per `agents/judge.md`) to read the rubric + Contract + Decision Log + **the real transcript** → write `grading.json`. For the contestable dimensions (workflow_adherence/decision_quality/robustness), spawn **3 judges → median**. Trigger records are scored correct = (should_fire == fired).
**Exit:** every run has a grading.json matching the schema

### Phase 4 — Aggregate: roll up into a scorecard
Run (cwd = scripts dir):
```bash
python aggregate_scorecard.py <iteration_dir> --skill-name <target-name>
```
Produces `scorecard.json` + `scorecard.md`: mean±stddev per dimension, overall + grade, with/without delta, flags (high_variance / non_discriminating).
**Exit:** scorecard.md created

### Phase 5 — Tune: report how to improve
Per `agents/tuning-advisor.md`: map low scores / flags / failure points → concrete fix instructions, citing techniques from `references/skill-authoring-techniques.md` → `tuning-report.md`, ordered by priority.
**Exit:** every item in tuning-report.md is tied to real evidence

## Scale & rate-limit robustness (Phase 2-3 fan-out)
Phases 2-3 spawn many subagents (runner + judge combined can be 100+). Real lesson: fanning out all at once at the concurrency cap (~16) makes the server respond "Server is temporarily limiting requests (not your usage limit)" and then **starve the tail of the batch** — roughly half can fail. Recipe:
1. **Chunk the fan-out:** if runner + judge total > 50, don't parallelize them all at once — `await parallel()` one slice of ~6 at a time (forces concurrency ≤6 + spaces the chunks out). Evidence: chunk-6 passed 46/46 after cap-16 failed ~50%.
2. **Decouple the runner (expensive; once it survives, keep it) from the judge (cheap; can be refilled)** — don't re-run the whole matrix to fix a partial failure; the runner is the expensive part and should not be thrown away.
3. **Idempotent recovery:** compute the gap (which run is missing which grading-j / which trigger has none yet) and spawn only the holes; have each agent self-skip if the destination file already exists → you can re-run repeatedly until the gap closes.
4. If you use the Workflow tool: **bake the parameters straight into the script** — `args` may not reach the script (seen: the script saw `{}` and ran the full default).

## Fallback (reference / style skill)
If Phase 0 finds the target skill has no workflow / no clear branch points → drop workflow_adherence + decision_quality + robustness (applicable=false) and keep **triggering + output_quality** (see `references/rubric.md`, fallback section). Don't force-measure a workflow the skill doesn't have.

## Rationalizations — observed in real baselines, all wrong
| Excuse | Reality |
|---|---|
| "Reading the SKILL.md is enough to assess it, no need to run" | A static review doesn't see the real flow / decisions — that's exactly what this skill measures. Run the scenario. |
| "Scoring from a feeling is fine" | A score with no evidence is void — the judge is forced to quote. |
| "The baseline isn't necessary" | No baseline = no way to know the skill creates a real delta (it might do no better than a bare agent). |
| "One scenario / one run is enough" | Variance is high — run multiple times + multiple branches before you trust it. |
| "Skipping adversarial is fine, the skill already looks good" | Robustness is exactly where a workflow skill fails silently — never skip it. |
| "The Decision Log says it did everything, that's trustworthy" | The runner may write a prettier log than reality — the judge must compare against the transcript. |

## Red Flags — STOP and re-read this skill
- About to score but haven't spawned a runner yet / there's no transcript
- A score with no evidence
- Skipping adversarial or skipping the baseline without the user asking
- Trusting the Decision Log without comparing the transcript
- Measuring the workflow of a skill that has no workflow (should fall back)

## Completion
Done when there is a **scorecard.md + tuning-report.md** backed by evidence. Summarize for the user: overall grade with/without + delta, strengths / failure points with evidence, the P1 recommendation plus a re-benchmark loop proposal.
