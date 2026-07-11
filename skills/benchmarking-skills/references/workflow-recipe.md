# Scoped / lean workflow recipe
*Use in Phases 2-3. Copy this shape and fill in the scope. The numbers below are an observed configuration, not a host-independent concurrency guarantee.*

## Table of contents
- Values to bake in · Building unit lists from scope · Chunk + idempotent rules · Post-processing · Reference implementation

## Values to bake into the script (args may not reach it)
- `PHASE` = 'run' → edit to 'judge' and re-run · `RIGOR` = 'lean' | 'rigorous'
- Per skill: graded scenarios (id + type), triggers (id + prompt), bench dir, skillPath, scenariosJson
- From the scope spec: which `scenario_types` / `scenario_ids`, which `configs` (`[with_skill]` or `+ baseline`)

## Building the unit lists from scope
- **runner units** = graded scenarios (in scope) × configs × runs, where `runs = (RIGOR=='lean' ? 1 : 2)`
- **judge units** = per run: `(scenario_type=='adversarial' || RIGOR=='rigorous') ? 3 : 1` judges ; trigger judges × `(lean ? 1 : 2)`
- Choose the least expensive capable runner and judge for lean runs; use a stronger independent judge when rigorous scoring needs it.
- **triggers-only** scope → no runner units at all (cheapest)

## Chunk + idempotent rules (the rate-limit lesson)
- Start in chunks of ≤6 and tune down when the host rate-limits. Do not fan out the full matrix at once.
- Every agent is idempotent: if its destination file already exists, return `SKIPPED`. Re-run until the gap closes.
- Decouple runner (expensive — keep) from judge (cheap — refill): run all runners first, gap-check, then judges.

## Post-processing (after the workflow)
```
python merge_gradings.py <iteration_dir> <scenarios.json>
python aggregate_scorecard.py <iteration_dir> --skill-name <name> --scope-note "<rigor>; <scope summary>"
```
`--scope-note` stamps provenance so a scoped/lean scorecard isn't mistaken for a full run. `merge_gradings.py` reads as utf-8-sig (BOM-safe) and takes the median of however many judges exist (1 = lean, 3 = rigorous).

## Reference implementation
A proven runner and judge script used chunking, a `PHASE` flag, and a `STATUS` schema. Mirror its chunking and idempotent recovery behavior using the current host's orchestration API. Build `runnerUnits` and `judgeUnits` from the scope spec above; idempotent self-skip makes partial re-runs free.
