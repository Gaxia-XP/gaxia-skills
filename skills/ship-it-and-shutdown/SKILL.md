---
name: ship-it-and-shutdown
description: Use when the user delegates work to run UNATTENDED and steps away — going to sleep or AFK — wanting it carried to the given scope and the machine powered off, with a thorough resume-ready report left behind for whatever didn't pass. Triggers — "จะไปนอนแล้ว ฝากทำให้เสร็จ แล้วปิดคอมให้ด้วย", "ทำให้เสร็จข้ามคืนแล้วปิดเครื่อง", "เสร็จแล้วฝากปิดคอม/ปิดเครื่องให้ด้วย", "merge เลยไม่ต้องรอรีวิว", "finish it overnight and shut down", "ship it and power off", "shut down when it's done", or /ship-it-and-shutdown.
---

# Ship It and Shutdown

The user is gone and wants the machine OFF when they return. You carry the work to the scope they gave, integrate what's safe, then check out — **whether or not everything passed.** The user often runs several of these sessions at once, so every session signs in to a shared check-in registry, and **only the last one still working powers the machine off**; the others hand the shutdown on. Ending on an imperfect result is made safe by two things: you never auto-apply anything irreversible, and you always leave a report complete enough to resume from cold. The shutdown command is trivial; **the risk gate and the report are the skill.**

## The overriding rule

**The run always ends checked out: machine off if you are the last session, shutdown handed on if you are not — the terminal action is the goal, not a reward for success.** It is made safe not by staying on, but by: (1) never auto-applying anything irreversible — Rail C parks it instead, so the machine is never left half-broken; and (2) always writing a durable, resume-ready report — Rail D — so a failure the user must handle is one they can pick up instantly on boot. A still-running machine is NOT the goal here; a powered-off machine plus a report that makes the next step obvious is. Never kill a session that is still working to get there.

## Persistence

Active for the whole unattended run, every step, until you have checked out. Treat the user as unreachable — never pause to ask a question they cannot answer; decide via the rails below and record every decision in the report.

## The check-in script

`checkin.sh` below means `bash "<this skill's folder>/scripts/checkin.sh"` (Git Bash on Windows, any shell on macOS/Linux). The registry is `~/.ship-it-checkin/`, one file per session.

| Command | Does |
|---|---|
| `checkin.sh join "<one-line task>"` | Signs in; prints your session id — keep it for the whole run |
| `checkin.sh beat <id>` | Refreshes your heartbeat |
| `checkin.sh leave <id>` | Marks you done and prints exactly `SHUTDOWN` (you are the last) or `WAIT <ids>` (still working); stale sessions skipped print as `STALE <ids>` |
| `checkin.sh list` | Shows every session, its state and heartbeat age |
| `checkin.sh shutdown` | Powers off (Windows `shutdown //s //t 60`, else `shutdown -h +1`); `SHIP_IT_DRY_RUN=1` only prints it |

A session whose heartbeat is older than 90 minutes (`SHIP_IT_STALE_MIN`) counts as dead and never blocks the shutdown. `leave` decides under a lock, so when two sessions finish at the same moment exactly one gets `SHUTDOWN`.

## The Spine

1. **Check in — first action, before any work**: `checkin.sh join "<task>"`; keep the printed id.
2. **Do the work** to the stated scope. Use `start-work` or a host-equivalent workflow when appropriate. `checkin.sh beat <id>` at every step of this Spine, at least every ~20 minutes of work, and before any command that may run long.
3. **Verify** with the project's own checks.
4. **Integrate safely**: merge only safe changes; park risky changes.
5. **Write a durable report** with the exact state and next steps, and push it — Shutdown line still `pending`.
6. **Check out**: `checkin.sh leave <id>`, fill in the report's Shutdown line, commit + push that one line.
7. **Shutdown — only on `SHUTDOWN`, always last** — Rail A. On `WAIT`, end the run.

## Rails

### Rail A - The last session out powers off, always last

Every run ends in one of two ways — verified success or not: **`leave` printed `SHUTDOWN`** → you are the last session working; run `checkin.sh shutdown`. No exception. **`leave` printed `WAIT <ids>`** → other sessions are still working, and the last of them will power off; record `Shutdown: handed to <ids>` and end the run without shutting down. There is no "stay on" branch and no other precondition that cancels shutdown — only `WAIT` from `leave` defers it, and only `SHUTDOWN` from `leave` permits it. Never power off because the others *look* finished, and never stay behind to poll them. If `checkin.sh` itself errors, do not shut down — killing a working session is the worse failure; record the error in the report. Order is absolute: report pushed, then `leave`, then shutdown.

### Rail B - Definition of done is self-checkable, and the result is reported honestly

Prove the state with the project's **own** checks — run the tests, the build, lint/typecheck. You are the only reviewer tonight. A check you didn't run is a check that didn't pass — and the report must say exactly which checks passed, which failed, and the real error output for the ones that failed. Never merge on "it looks done."

### Rail C - Integration gate (safe → merge, risky → park, never auto-apply the irreversible)

Classify the diff after verification:

- **Touches nothing on the stop-list → merge** to the target branch. This is "shipping it."
- **Touches anything on the stop-list → DO NOT auto-apply.** Push the branch + open a PR (or leave the branch in place), and document in the report what it is and why it was parked. You still check out afterward — parking is what *keeps shutdown safe*, not a reason to stay on.

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
<timestamp> · branch: <branch> · session: <check-in id>
Shutdown: done by this session | handed to <ids> | skipped stale <ids>

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

### Rail E - Check out only after the report is durable; shutdown is the very last action

Order is fixed: finish → verify → integrate → **write report → push** → `leave` → fill the Shutdown line → push → only then, on `SHUTDOWN`, trigger shutdown. Never `leave` before the report is pushed: once you are marked done, another session may power the machine off at any moment. Once the box is off, nothing else can run.

### Rail F - Right-size and don't invent work

A trivial task doesn't need the full gate — short-circuit, but still check in, write the report, and check out last. Never invent extra work to "make use of the night"; when the asked scope is done and handled, stop.

### Rail G - Bounded retries, no overnight thrash, no silent rewrites

If the work errors or a verify keeps failing and you can't fix it within a bounded attempt (e.g. the same gate fails twice), STOP — do not loop all night, and do NOT silently rewrite the user's code to force a pass. Record the failure, its cause, and the next step in the report (Rail D), then check out (Rail A).

## Decision Points

- **Merge or park?** → Rail C stop-list. Safe → merge; risky → park + document.
- **Is it actually done / passing?** → Rail B: only a green check you ran yourself counts, and the report states the truth either way.
- **Shut down?** → Only when `leave` printed `SHUTDOWN` (Rail A), after the report is durable (Rail D/E). `WAIT <ids>` → record "handed to <ids>" and end. The only thing that ever delays check-out is a broken precondition (report not durable, irreversible change applied) — fix it, then check out.
- **Is another session alive?** → Its heartbeat decides, not your guess: `checkin.sh list`. Stale ones are skipped by `leave` and named in your Shutdown line.

## Rationalizations — all wrong

| Excuse | Reality |
|---|---|
| "It failed, so I should leave the machine on for the user" | Not in this mode. The user asked for the machine OFF; the report is how they pick up a failure. Park anything irreversible, document it fully, then check out — and power off if you are the last. |
| "User pre-authorized merge, so just merge the risky migration too" | "Ship it" covers safe, finished work. Irreversible diffs (Rail C) are parked + documented, never auto-applied — that's exactly what makes shutting down safe. |
| "The branch looks finished, no need to run the tests" | Unattended = you are the only check. Run the project's real tests/build, and report the true result. |
| "I'll just auto-fix the bug so it passes, then merge" | Silently rewriting the user's code overnight hides the real problem. Fix only if unambiguous + verified; else park + report + check out. |
| "The report can be short, the user knows the context" | They'll read it groggy, hours later, with none of tonight's context loaded. Write it to resume from cold. |
| "Shutdown is risky after a failure, I'll skip it" | After `SHUTDOWN`, with a durable report and nothing irreversible applied, shutdown is safe — and is what was asked. Skipping it defies the request. |
| "`WAIT` — but they're probably nearly done, I'll shut down anyway" | `WAIT` means they are working. Powering off kills them mid-work — the exact failure the registry exists to stop. Hand it on and end. |
| "I got `WAIT`, so I'll stay and poll until they finish" | Not asked. The last session powers off; record the hand-off and end. |
| "Short task, I'll skip the check-in" | An unregistered session is invisible: another session's `leave` will shut the machine down under you. |

## Red Flags — STOP and re-read this skill

- About to start work without `join`, or no longer sure of your session id.
- A long stretch, or a long command about to start, without a `beat`.
- About to `leave` before the report is written and (if a remote exists) pushed.
- About to shut down without `leave` having printed `SHUTDOWN` in this run.
- About to auto-merge / auto-apply a diff that touches the stop-list.
- About to merge without having run the project's own tests + build yourself.
- About to write a thin report that wouldn't let a cold reader resume.
- About to silently rewrite the user's code to force a pass, or to loop on a failing gate all night.
- About to invent extra work to fill the night.

## Completion

Every run ends checked out, with `OVERNIGHT_REPORT.md` written (+ pushed if possible), its Shutdown line filled, reflecting one of:
1. **Verified success** — scope done, checks green, safe diffs merged (risky ones parked + documented), report written → check out → shutdown if last, else handed on.
2. **Partial / blocked / failed** — safe work merged, risky work parked, failures + causes + exact next steps + recommended skills documented → check out → shutdown if last, else handed on.
