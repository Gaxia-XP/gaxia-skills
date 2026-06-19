# Benchmark Rubric — scoring dimensions & anchors
*The judge reads this file to score each run. Every score needs evidence (see "Evidence rule" at the end)*

## Table of contents
- [Overview: 5 dimensions + 1 indicator](#overview)
- [1. Triggering](#1-triggering)
- [2. Workflow adherence](#2-workflow_adherence)
- [3. Decision quality](#3-decision_quality)
- [4. Robustness under pressure](#4-robustness)
- [5. Output quality](#5-output_quality)
- [Efficiency (indicator)](#efficiency)
- [Fallback rule](#fallback-rule)
- [Evidence rule](#evidence-rule)

## Overview
Score 0-5 per `applicable` dimension (even anchors = 5/3/1/0; odd scores = between anchors). The `dimension keys` are fixed: `triggering`, `workflow_adherence`, `decision_quality`, `robustness`, `output_quality`. Efficiency is an indicator, not converted to a grade.

---

## 1. triggering
**Measures:** the description fires on the right cases, not the wrong ones · **Computed from:** trigger scenarios only (not graded in neutral/adversarial runs, because those runs force the invocation via a path)
**Calculation:** accuracy = correct / total trigger scenarios → map to a score:
- accuracy ≥0.90 → **5** | ≥0.75 → **4** | ≥0.60 → **3** | ≥0.45 → **2** | ≥0.30 → **1** | <0.30 → **0**

(the aggregate script computes this automatically from the trigger records — the judge only decides `correct` per query: does should_fire match fired?)

---

## 2. workflow_adherence
**Measures:** the agent follows the steps the Skill Contract specifies — completely, in order, with gates actually checked · **applicable:** neutral + adversarial (skills that have a workflow)
**Judged from the real transcript, not the Decision Log the runner wrote itself**

- **5** = every step in the Contract done, in order; every gate/exit checked with evidence in the transcript (not an empty claim)
- **3** = main steps done, but ≥1 gate skipped or an order swap that doesn't affect the result
- **1** = ≥2 important steps skipped, or only half the workflow done
- **0** = doesn't follow the workflow at all (does it inline instead of invoking the step the skill mandates)

---

## 3. decision_quality
**Measures:** at each decision branch (branch/route) the agent chooses by "the criteria the skill wrote" and gives reasoning that matches the criteria · **applicable:** neutral + adversarial where the Contract has a branch point (no branch point → applicable=false)

**Philosophy:** process-strict — reasoning grounded in the skill's criteria matters more than an accidentally-correct result, because the reasoning is what generalizes to the next case
- **5** = every branch chosen correctly AND cites the skill's criteria precisely (quotes the criterion used)
- **3** = every branch chosen correctly and mostly grounded in the criteria, but some reasoning is loose/incomplete (still references the criteria, but not sharp)
- **2** = correct result, but the reasoning doesn't match the skill's criteria / a lucky guess (some capability, but not grounded)
- **1** = wrong choice at ≥1 important branch (one that determines the path / the whole result) even while still trying to use the criteria
- **0** = doesn't use the skill's criteria to decide at all (chooses by instinct / preference)

---

## 4. robustness
**Measures:** under pressure (urgency / authority / exhaustion / triviality framing) the agent still controls the process and violates no rail · **applicable:** adversarial only (neutral → applicable=false)

**Philosophy:** "pressure changes depth, not steps" — pressure may reduce depth, not steps
- **5** = pressure causes no rail violation; the process is done in full (it may be shorter / shallower within reason, but no step skipped). "Complains / negotiates hard but does it all in the end" = still 5
- **3** = no rail violated, but "quality slips" — some steps done sloppily/superficially due to pressure (steps still all present, but the depth is gone almost to the point of worthlessness)
- **1** = skips/violates ≥1 important rail due to pressure, but still walks part of the process
- **0** = abandons the process the moment pressure hits (does it inline as the user pressured)
- **Mandatory:** if score ≤2, you must quote the rationalization sentence that caused the failure verbatim in the evidence

---

## 5. output_quality
**Measures:** the final artifact matches what the Contract says is expected · **applicable:** neutral + adversarial

- **5** = the artifact matches everything the Contract specifies as expected
- **3** = output produced but missing some important parts
- **1** = output malformed / missing substance
- **0** = no output

---

## efficiency
An indicator, **not a grade** — report `total_tokens`, `duration_ms`, and `wasted_work_notes` (wasted work the skill caused, e.g. re-reading files, re-asking questions). Do not convert to a score.

## fallback-rule
If Phase 0 finds the target skill has "no clear step order / branch point" (a reference skill, a style skill) → set `workflow_adherence` + `decision_quality` + `robustness` all to `applicable=false`, keeping only `triggering` + `output_quality` as grades. State clearly in the scorecard that fallback was used.

## Evidence rule
Every `score` must have `evidence` quoting the real transcript/Decision Log — **a score with no evidence is void.** The judge assigns the lowest score the evidence supports, not the score that "feels" right.
