# Scoped / lean Workflow recipe
*Used in Phases 2-3. Copy this shape and fill in the scope. Proven on the 2026-06-21 run (chunk-6 passed 56/56 runners + 204/204 judges).*

## Table of contents
- Values to bake in · Building unit lists from scope · Chunk + idempotent rules · Post-processing · Reference implementation

## Values to bake into the script (args may not reach it)
- `PHASE` = 'run' → edit to 'judge' and re-run · `RIGOR` = 'lean' | 'rigorous'
- Per skill: graded scenarios (id + type), triggers (id + prompt), bench dir, skillPath, scenariosJson
- From the scope spec: which `scenario_types` / `scenario_ids`, which `configs` (`[with_skill]` or `+ baseline`)

## Building the unit lists from scope
- **runner units** = graded scenarios (in scope) × configs × runs, where `runs = (RIGOR=='lean' ? 1 : 2)`
- **judge units** = per run: `(scenario_type=='adversarial' || RIGOR=='rigorous') ? 3 : 1` judges ; trigger judges × `(lean ? 1 : 2)`
- runner model = `'sonnet'`; judge model = `(RIGOR=='lean' ? 'sonnet' : 'opus')`
- **triggers-only** scope → no runner units at all (cheapest)

## Chunk + idempotent rules (the rate-limit lesson)
- Run in chunks of ≤6: `for (let i=0;i<units.length;i+=6) await parallel(units.slice(i,i+6).map(...))` — never fan out all at once (cap ~16 starves the tail; ~half can fail).
- Every agent is idempotent: if its destination file already exists, return `SKIPPED`. Re-run until the gap closes.
- Decouple runner (expensive — keep) from judge (cheap — refill): run all runners first, gap-check, then judges.

## Post-processing (after the workflow)
```
python merge_gradings.py <iteration_dir> <scenarios.json>
python aggregate_scorecard.py <iteration_dir> --skill-name <name> --scope-note "<rigor>; <scope summary>"
```
`--scope-note` stamps provenance so a scoped/lean scorecard isn't mistaken for a full run. `merge_gradings.py` reads as utf-8-sig (BOM-safe) and takes the median of however many judges exist (1 = lean, 3 = rigorous).

## Reference implementation
A proven runner+judge script (chunk≤6, `PHASE` flag, `STATUS` schema, runner sonnet / judge opus) was used on 2026-06-21. Mirror its `runChunked(units, makePrompt, {phase, model})` helper that loops slices of 6 and counts done/skipped/errored. Build `runnerUnits` and `judgeUnits` from the scope spec above; idempotent self-skip makes partial re-runs free.
