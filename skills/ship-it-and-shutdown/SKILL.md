---
name: ship-it-and-shutdown
description: Use when the user delegates work to run UNATTENDED and steps away — going to sleep or AFK — wanting it carried to the given scope and the machine powered off, with a thorough resume-ready report left behind for whatever didn't pass. Triggers — "จะไปนอนแล้ว ฝากทำให้เสร็จ แล้วปิดคอมให้ด้วย", "ทำให้เสร็จข้ามคืนแล้วปิดเครื่อง", "เสร็จแล้วฝากปิดคอม/ปิดเครื่องให้ด้วย", "merge เลยไม่ต้องรอรีวิว", "finish it overnight and shut down", "ship it and power off", "shut down when it's done", or /ship-it-and-shutdown.
---

# Ship It and Shutdown

The user is gone and wants the machine OFF when they return. You carry the work to the scope they gave, integrate what's safe, then power the machine down — **whether or not everything passed.** Shutting down on an imperfect result is made safe by two things: you never auto-apply anything irreversible, and you always leave a report complete enough to resume from cold. The shutdown command is trivial; **the risk gate and the report are the skill.**

## The overriding rule

**The run always ends in shutdown — the terminal action is the goal, not a reward for success.** It is made safe not by staying on, but by: (1) never auto-applying anything irreversible — Rail C parks it instead, so the machine is never left half-broken; and (2) always writing a durable, resume-ready report — Rail D — so a failure the user must handle is one they can pick up instantly on boot. A still-running machine is NOT the goal here; a powered-off machine plus a report that makes the next step obvious is.

## Persistence

Active for the whole unattended run, every step, until the machine powers off. Treat the user as unreachable — never pause to ask a question they cannot answer; decide via the rails below and record every decision in the report.

## The Spine

1. **Do the work** to the stated scope. Use `start-work` or a host-equivalent workflow when appropriate.
2. **Verify** with the project's own checks.
3. **Integrate safely**: merge only safe changes; park risky changes.
4. **Write a durable report** with the exact state and next steps.
5. **Shutdown — always, last** — Rail A. Only after the report is safely committed.

## Rails

### Rail A - The terminal action always happens, and always last

Power the machine off at the end of every run — verified success or not. No exception. Order is absolute: report first, then shutdown — the report must be written and pushed (if a remote exists) before the machine goes off, so it is readable from a phone. There is no "stay on" branch, no precondition that cancels shutdown. If the report is not yet written, write it now, then shut down. If an irreversible change was not safely parked, document it in the report, then shut down. The run **always** ends with the machine off.

### Rail B - Definition of done is self-checkable, and the result is reported honestly

Prove the state with the project's **own** checks — run the tests, the build, lint/typecheck. You are the only reviewer tonight. A check you didn't run is a check that didn't pass — and the report must say exactly which checks passed, which failed, and the real error output for the ones that failed. Never merge on "it looks done."

### Rail C - Integration gate (safe → merge, risky → park, never auto-apply the irreversible)

Classify the diff after verification:

- **Touches nothing on the stop-list → merge** to the target branch. This is "shipping it."
- **Touches anything on the stop-list → DO NOT auto-apply.** Push the branch + open a PR (or leave the branch in place), and document in the report what it is and why it was parked. You still shut down afterward — parking is what *keeps shutdown safe*, not a reason to stay on.

Treat any of the following as risky unless the user gave explicit, task-specific authority:

- Database migrations, schema changes, or destructive data operations.
- Secrets, credentials, new environment files, or key material.
- Large deletes, moves, or history rewrites.
- Dependencies, lockfiles, CI, infrastructure, or deployment changes.
- Public API and contract changes.
- External effects such as emails, payments, production deploys, or data backfills.

### Rail D - The report is the safety net: always written, comprehensive, durable

Because the machine will be OFF, this report is the ONLY thing the user wakes up to. It must let them resume from cold without re-deriving tonight's context. Write it at a fixed path — `OVERNIGHT_REPORT.md` in the repo root — and **push it if a remote exists** so it's readable from a phone. Use this shape:

```markdown
# Overnight Report — <task title>
Status: SUCCESS | PARTIAL | BLOCKED · ✅<N> merged · ⏸<N> parked · ❌<N> tests fail
<timestamp> · branch: <branch>

## Scope
<the goal, in the user's own words>

## Where it stands
- Merged: <what shipped>
- Parked (needs you): <what + why — the stop-list reason>

## Checks
✅ <checks that passed — build / lint / typecheck>
❌ <check that failed> — <the real error output, pasted, not summarized>

## Next step
  $ <copy-paste command, e.g. git checkout <branch> && <cmd>>
  → <one line: what this does / where it leaves you>

## Continue with
- gaxia-skills:start-work — <when: resume the build>
- <other skill> — <when it fits, if any>
```

### Rail E - Shutdown is the very last action, after the report is durable

Order is fixed: finish → verify → integrate → **write report → push** → only then trigger shutdown. Never power off before the report (and any push) is safely committed. Once the box is off, nothing else can run.

### Rail F - Right-size and don't invent work

A trivial task doesn't need the full gate — short-circuit, but still write the report and shut down last. Never invent extra work to "make use of the night"; when the asked scope is done and handled, stop.

### Rail G - Bounded retries, no overnight thrash, no silent rewrites

If the work errors or a verify keeps failing and you can't fix it within a bounded attempt (e.g. the same gate fails twice), STOP — do not loop all night, and do NOT silently rewrite the user's code to force a pass. Record the failure, its cause, and the next step in the report (Rail D), then shut down.

## Decision Points

- **Merge or park?** → Rail C stop-list. Safe → merge; risky → park + document.
- **Is it actually done / passing?** → Rail B: only a green check you ran yourself counts, and the report states the truth either way.
- **Shut down?** → Always (Rail A), after the report is durable (Rail D/E). The only thing that ever delays shutdown is a broken precondition (report not durable, irreversible change applied) — fix it, then power off.

## Rationalizations — all wrong

| Excuse | Reality |
|---|---|
| "It failed, so I should leave the machine on for the user" | Not in this mode. The user asked for the machine OFF; the report is how they pick up a failure. Park anything irreversible, document it fully, then shut down. |
| "User pre-authorized merge, so just merge the risky migration too" | "Ship it" covers safe, finished work. Irreversible diffs (Rail C) are parked + documented, never auto-applied — that's exactly what makes shutting down safe. |
| "The branch looks finished, no need to run the tests" | Unattended = you are the only check. Run the project's real tests/build, and report the true result. |
| "I'll just auto-fix the bug so it passes, then merge" | Silently rewriting the user's code overnight hides the real problem. Fix only if unambiguous + verified; else park + report + shut down. |
| "The report can be short, the user knows the context" | They'll read it groggy, hours later, with none of tonight's context loaded. Write it to resume from cold. |
| "Shutdown is risky after a failure, I'll skip it" | Shutdown after a durable report, with nothing irreversible applied, is safe — and is what was asked. Skipping it defies the request. |

## Red Flags — STOP and re-read this skill

- About to shut down before the report is written and (if a remote exists) pushed.
- About to auto-merge / auto-apply a diff that touches the stop-list.
- About to merge without having run the project's own tests + build yourself.
- About to write a thin report that wouldn't let a cold reader resume.
- About to silently rewrite the user's code to force a pass, or to loop on a failing gate all night.
- About to invent extra work to fill the night.

## Completion

Every run ends powered off, with `OVERNIGHT_REPORT.md` written (+ pushed if possible) reflecting one of:
1. **Verified success** — scope done, checks green, safe diffs merged (risky ones parked + documented), report written → shutdown (last).
2. **Partial / blocked / failed** — safe work merged, risky work parked, failures + causes + exact next steps + recommended skills documented → shutdown (last).
