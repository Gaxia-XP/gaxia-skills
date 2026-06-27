---
name: goodnight
description: Use when the user delegates work to run UNATTENDED and steps away — going to sleep or AFK — and wants it carried to completion and the machine shut down with nobody watching. Triggers — "ไปนอนแล้วนะ ฝากทำให้เสร็จ", "merge เลยไม่ต้องรอรีวิว", "เสร็จแล้วฝากปิดคอม/ปิดเครื่องให้ด้วย", "ทำให้เสร็จข้ามคืน", "finish it overnight", "merge without me", "shut down when it's done", or /goodnight.
---

# Goodnight (unattended / fire-and-forget mode)

The user is gone. You finish the work, decide for yourself whether it is safe to integrate, then — only if everything truly succeeded — power the machine off. The value of this mode is the judgment a careful teammate would apply at 3am, encoded so it runs without them. The shutdown command is trivial; **knowing when NOT to run it is the skill.**

## The overriding rule
**The terminal action (shutdown) happens ONLY after a fully verified success.** Any doubt → stay on and leave a report. A powered-off machine after a failed or blocked task is the worst possible outcome: the user wakes to a dark screen and a problem they can no longer act on quickly. When the choice is "shut down" vs "stay on", staying on is always the safe default.

## Persistence
Active for the whole unattended run, every step, until the run ends in either a verified shutdown or a "left it on + reported" state. Treat the user as unreachable — never pause to ask a question they cannot answer; decide via the gates below and record the decision.

## The spine — each step gates the next, no skipping forward
1. **Do the work** (execution-agnostic). If the task isn't done yet, do it via your normal flow; for a real coding task you may invoke **gaxia-skills:start-work** to drive the doing. This skill owns everything *after* the work claims done — do not re-drive start-work's internals, just require evidence it finished.
2. **Verify done-for-real** — Rail B. No green signal you ran yourself = not done.
3. **Merge gate** — Rail C. Safe → merge; risky → park as PR.
4. **Report — always** — Rail D. Written and reachable off-machine.
5. **Terminal action — conditional** — Rail A. Only on full success, and only last.

## Rails (keep every one)

### Rail A — Conditional terminal action (the rail that matters most)
Shut down ONLY when ALL hold: work complete **and** verified green (Rail B) **and** integrated per policy (actually merged — Rail C) **and** the report is written + durable (Rail D). **Any other state — tests fail, build broken, merge parked to PR, an error you couldn't resolve, ran out of work, or any ambiguity — means DO NOT shut down.** Leave the machine on. PR-fallback is a non-success: the user still has to decide on the risky change, so they need the machine awake (unless they explicitly said "PR-and-still-shut-down is fine"). A missing git remote does NOT block shutdown after a genuine success — a report committed to disk (on the merged branch / main) is durable and visible on boot.

### Rail B — Definition of done is self-checkable, never "feels done"
Before integrating anything, prove completion with the project's **own** checks — run the tests, the build, lint/typecheck. You are the only reviewer tonight; "the branch looks done" is not done. A check you didn't run is a check that didn't pass.

### Rail C — Merge gate (hybrid: safe → merge, risky → park)
After verify is green, classify the diff:
- **Touches nothing on the stop-list → merge** to the target branch.
- **Touches anything on the stop-list → DO NOT merge.** Push the branch + open a PR (or leave the branch in place) and record why in the report. Per Rail A this is a non-success → do not shut down.

**Stop-list — if the diff matches ANY of these, do NOT auto-merge** (park as PR + report; per Rail A, stay on):
- **DB migrations / schema** — files under `migrations/`, any `*.sql`, or ORM migration dirs; especially `DROP`, `ALTER`, `TRUNCATE`, `DELETE`. Usually irreversible against real data.
- **Secrets / credentials** — added lines matching `sk_live`, `AKIA`, `-----BEGIN * PRIVATE KEY-----`, `password=`, `token=`, high-entropy strings, or new `.env*` / `secrets*` / `credentials*` entries. Also flag the key for rotation in the report.
- **Mass delete / move** — the diff removes or renames more than ~5 files, or drops a whole directory.
- **Dependencies / lockfiles** — `package.json`, `*.lock`, `requirements*.txt`, `go.mod`, `Cargo.toml`, `Gemfile*`, and the like.
- **CI / infra / deploy** — `.github/`, `Dockerfile`, `docker-compose*`, `*.tf`, k8s/helm manifests, deploy scripts.
- **Public API / contract** — changed signatures of exported/public functions, REST/GraphQL routes, protobufs, or DB-facing schema other code depends on.
- **Anything irreversible** — force-push, history rewrite, data backfills/deletes, or actions that send real email / payments / messages.

**Default-merge zone** (auto-merge when verify is green): app/business logic, bug fixes, tests, docs, comments, styling, and refactors that don't change a public signature.

<!-- Tune this list to your own risk tolerance — it is the heart of the gate. -->

### Rail D — Report always, reachable without booting the machine
Every run ends with a report (what was done, the decisions + why, blockers, exact next step) at a fixed path — `OVERNIGHT_REPORT.md` in the repo root. **If a remote exists, push it / post it to the PR** so the user can read it from their phone without powering the machine on. This off-machine reachability matters **only when you are staying on for something the user must act on** (a parked PR, a blocker). For a verified success you're about to shut down on, a report committed to disk — on the merged branch / main — is durable and there on boot; **a missing remote is not a reason to stay on after success.** Push when a remote exists; its absence never blocks a success shutdown.

### Rail E — Shutdown is the very last action, after the report is durable
Order is fixed: finish → verify → integrate → **write report → push** → only then trigger shutdown. Never power off before the report (and any push) is safely committed. Once the box is off, nothing else can run.

### Rail F — Right-size and don't invent work
A trivial task, or "just do X then sleep" with no integration asked, doesn't need the full gate — short-circuit, but Rail A still governs the shutdown. Never invent extra work to "make use of the night"; when the asked work is done and handled, stop.

### Rail G — Bounded retries, no overnight thrash
If the work errors or a verify keeps failing and you cannot fix it within a bounded attempt (e.g. the same gate fails twice), STOP — do not loop all night, do not silently rewrite the user's code to force a pass. Park it, leave the machine on, report.

## Decision points
- **Shut down or stay on?** → Rail A. Full verified success → shut down. Anything else → stay on.
- **Merge or park as PR?** → Rail C stop-list.
- **Is it actually done?** → Rail B: only a green check you ran yourself counts.

## Rationalizations — all wrong
| Excuse | Reality |
|---|---|
| "User said shut down when done — it's in a safe state, so power off" | "Done" = the asked task completed (merged + green). Blocked or parked ≠ done. Powering off a non-success strands the user. Stay on. |
| "User pre-authorized merge without review, so just merge it" | "Without review" removes the review *gate* for finished, safe work — not a license to merge broken or dangerous code. Verify + stop-list first. |
| "The branch looks finished, no need to run the tests" | Unattended = you are the only check. Run the project's real tests/build before integrating. |
| "I'll just auto-fix the bug, then merge so the task completes" | Silently rewriting the user's code overnight hides the real problem. Fix only if unambiguous + verified; else park + report. |
| "No remote means the report isn't durable — stay on even though it succeeded" | A committed report on the merged branch IS durable and visible on boot. No-remote does not block shutdown after a verified success; staying on with nothing left to do defies the user's request. |
| "Powering off saves energy even though it failed" | A stranded user costs far more than the energy. Failure → stay on. |

## Red Flags — STOP and re-read this skill
- About to trigger shutdown, but the last verify wasn't green / the merge was parked to a PR / an error is unresolved.
- About to merge without having run the project's own tests + build yourself.
- About to merge a diff that touches the stop-list.
- About to shut down before the report is written and (if a remote exists) pushed.
- About to invent extra work to fill the night, or to loop on a failing gate.
- About to STAY ON after a genuine verified success (merged + green) only because there's no remote — a committed report is durable; that's a success, shut down.

## Completion
The run ends in exactly one of two clean states:
1. **Verified success** → merged + green + report written/pushed → shutdown triggered (last).
2. **Anything else** → machine left ON, `OVERNIGHT_REPORT.md` written (+ pushed if possible) explaining what's done, what's blocked, and the one next action for the user.
