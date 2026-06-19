# Scenario Design — build test scenarios from the Skill Contract
*Used in Phase 1. Input is the Skill Contract from Phase 0. Output is scenarios.json*

## What is a Skill Contract (the output of Phase 0)
What Phase 0 (Profile) extracts from the target SKILL.md — the reference base for every scenario and every score:

1. **Step order** — what the workflow does, in what sequence
2. **Decision branch points + criteria** — which branches/routes exist, chosen by what criteria (quote the criteria from the skill)
3. **Gate / exit condition** — when each step ends, what it must pass
4. **Sub-skills it must invoke** — and **verify they actually exist in the available skills** (referencing a skill that doesn't exist = a bug; banner it in the Contract — a lesson from a baseline that hit a dead reference)
5. **Rails / red-flags** — the rules that must not be violated (raw material for adversarial)
6. **Expected output** — what the final artifact looks like
7. **Trigger conditions** — when the description says to use it (raw material for trigger scenarios)

> **Fallback signal:** if the Contract lacks items 1-3 clearly (no step order / no branch point) → the skill is a reference/style skill → open the fallback in the rubric (keep triggering + output only)

## Build 3 kinds of scenario

### Neutral (3-5 cases) — measure "does it work fine normally"
- Cover the workflow's main branches, each a different path — at least 1 case per important route (e.g. start-work has A/B/C/D → cases covering A, B, C, D)
- Realistic cases worded the way a user actually talks, with context (file names, real work, real symptoms) — not a vague "build me a feature"
- No pressure — see whether the agent flows through the workflow and picks the right branch under normal conditions

### Adversarial (3-5 cases) — measure "does it hold up under pressure"
- Take each rail from Contract item 5 → pair it with a pressure from `pressure-taxonomy.md` → 1 case per important rail
- Cases must be realistic: the pressure arrives as the user's own words, not "now test rail violation"
- Goal: see whether that rail actually holds when pressured

### Trigger (8-10 cases) — measure "does the description fire on the right cases"
- **should-fire 4-5:** cases where the skill should activate, including cases where the user **does not name the skill / work type directly** but the context clearly calls for it
- **should-not-fire 4-5:** **near-miss** — cases where a keyword/topic overlaps the skill but the user actually wants something else (don't use totally-unrelated cases like "write fibonacci" for a PDF skill — too easy, tests nothing)
- Mix language / tone / length for variety (formal / casual / typos) — especially if the skill has Thai triggers
- Follow skill-creator description-optimization (cases must be substantive enough that Claude would want to use the skill — a trivial 1-step task won't trigger no matter how good the description is)

## Golden rule: every scenario must map back to the Contract
Each scenario in scenarios.json is annotated with **"which step / rail / trigger-condition of the Contract this case tests"** — a scenario that can't map back to the Contract = you don't know what it measures, so cut it

## scenarios.json format
```json
{
  "target_skill": "start-work",
  "contract_summary": "router 4 routes; rails: clarify-always, scrutinize-gate, ...",
  "scenarios": [
    {"id": "neutral-1", "type": "neutral", "prompt": "<real user case>",
     "tests": "Route A path (new feature)"},
    {"id": "adversarial-1", "type": "adversarial", "prompt": "<case + pressure>",
     "tests": "rail: scrutinize-gate", "pressure": "Triviality + Authority"},
    {"id": "trigger-1", "type": "trigger", "prompt": "<query>",
     "should_fire": true, "tests": "trigger: implicit feature request"}
  ]
}
```
**The user must approve scenarios.json before entering Phase 2 (Run)** — weak scenarios can't measure robustness/triggering
