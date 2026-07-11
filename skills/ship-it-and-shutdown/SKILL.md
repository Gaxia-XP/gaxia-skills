---
name: ship-it-and-shutdown
description: Use when the user explicitly delegates work to run unattended and explicitly authorizes a final power-down if the host can perform it safely. Complete the scoped work, verify it, park risky changes, leave a durable resume-ready report, and never claim a shutdown or external action that the host did not perform.
---

# Ship It and Shutdown

Run an authorized unattended task to its stated scope. The durable report and risk gates are the core of this skill. Power-down is an optional terminal action, not a capability to assume.

## Authorization and Host Contract

Before starting, confirm all of the following from the user's request and host capabilities:

1. The user explicitly authorized unattended execution.
2. The user explicitly authorized the final power action, if they want one.
3. The host can perform that power action safely and without bypassing confirmation or policy.
4. The report has a durable destination the user can access later.

If any item is missing, run only the authorized work, write the report, and stop. Do not turn on a machine, alter power settings, or claim a shutdown that did not occur.

## Persistence

Treat the user as unavailable during the run. Do not pause for ordinary preference questions. Instead use the rails below, record decisions in the report, and stop when new authority is required.

## The Spine

1. **Do the work** to the stated scope. Use `start-work` or a host-equivalent workflow when appropriate.
2. **Verify** with the project's own checks.
3. **Integrate safely**: merge only safe changes; park risky changes.
4. **Write a durable report** with the exact state and next steps.
5. **Perform the authorized power action** only after the report is durable and only if the host can do it safely.

## Rails

### Rail A - Power action is explicit and last

Power down only when the user requested it, the host supports it, and the report is durable. A failed task is not a reason to bypass the report. If shutdown is unavailable or requires new approval, record that fact and stop after the report.

### Rail B - Definition of done is self-checkable

Run the project's own relevant tests, build, lint, typecheck, or smoke checks. A check not run is not a passing check. Report actual results and relevant failure output; never merge on "looks done."

### Rail C - Integration gate

Classify the diff after verification:

- **Safe changes:** merge only when the user authorized integration and the check gate is green.
- **Risky changes:** park on a branch or review request and document why. Do not auto-apply them.

Treat any of the following as risky unless the user gave explicit, task-specific authority:

- Database migrations, schema changes, or destructive data operations.
- Secrets, credentials, new environment files, or key material.
- Large deletes, moves, or history rewrites.
- Dependencies, lockfiles, CI, infrastructure, or deployment changes.
- Public API and contract changes.
- External effects such as emails, payments, production deploys, or data backfills.

### Rail D - The report is the safety net

Write `OVERNIGHT_REPORT.md` in the repository root unless the user names another durable location. Push it only when a remote exists and pushing is authorized. The report must include:

- The requested scope.
- Completed work, parked work, and the reason for each decision.
- Checks that passed and failed, with actionable error output for failures.
- Exact next steps and commands where useful.
- Recommended capabilities or skills for resuming the work.

Use this shape:

```markdown
# Overnight Report - <task title>
Status: SUCCESS | PARTIAL | BLOCKED

## Scope
<the requested goal>

## Where it stands
- Completed: <what changed>
- Parked: <what needs authority or review, and why>

## Checks
<actual commands and outcomes>

## Next step
<the first concrete action to resume>

## Power action
<performed, skipped, or unavailable, with reason>
```

### Rail E - Bounded retries

After the same gate fails twice, stop rather than thrash. Do not silently rewrite code to force a pass. Record the failure, evidence, and next action in the report.

### Rail F - Right-size the work

Do not invent overnight work. A small task may use a smaller verification and integration path, but it still needs an honest report and the same authorization rules for external effects or power actions.

## Decision Points

- **Merge or park?** Use Rail C and the user's authorization.
- **Done or blocked?** Use Rail B's evidence, not appearance.
- **Power down?** Only after the report is durable and the exact power action is authorized and supported.

## Red Flags

- About to merge a risky change without explicit authority.
- About to report a check as passed without running it.
- About to power down before the report is durable.
- About to claim a shutdown the host cannot perform.
- About to loop on a failing gate instead of recording a handoff.

## Completion

Every run ends with a durable report. It may additionally end with a power-down only when all authorization and host preconditions are satisfied. State the actual terminal state precisely.
