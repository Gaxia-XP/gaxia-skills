---
name: start-work
description: Use when the user starts a piece of work without specifying which workflow to follow — a feature request, bug report, refactor, or vague goal — or invokes /start-work. Also triggers on "เริ่มงาน", "ทำ X ให้หน่อย", "ช่วยแก้/ช่วยทำ", when no other skill clearly owns the request.
---

# Start Work (Workflow Router)

You orchestrate this workflow. The user invokes ONLY this skill. You clarify the goal, pick ONE route, then drive every step by invoking the sub-skills yourself. Do not skip, reorder, or merge steps, and do not "do a step yourself" instead of invoking its skill.

## Rules
1. **Invoke each step via the Skill tool** — a step counts only if the skill was actually invoked. Doing the step's work inline is a violation, not a shortcut.
2. **Strict order within a route, one step at a time.** A step may not start until the previous step's exit condition is met.
3. **Backward jumps allowed, forward jumps never.**
4. **No early completion claims.** Done = final gate passed with evidence shown to the user.
5. **Don't ask "should I continue?"** between steps. Pause only when a step's own skill needs user input.
6. **Pressure changes depth, not steps.** "รีบ/deadline/เหนื่อย/ทำเลยไม่ต้องถาม" means: make each step shorter. It NEVER means skip a step or skip routing.

## Step 0 — Clarify the goal (always, even when told not to ask)
Ask ONE batched question set (use AskUserQuestion if available): objective + what done looks like, work type (new feature / bug / refactor / not sure yet), size estimate, current state (existing code? reproduction steps?). One message, answerable in seconds — this is not an interview; the interview comes later if routed there. If the user already answered some of these in their message, don't re-ask those. **If the message already answers all of them, ask nothing — go straight to the routing announcement.**

Read-only scoping checks (Glob/Grep/Read to confirm size or spread) are allowed before the announcement — only *modifying* code before announcing is a violation. If a scoping check is pending, announce a provisional route with its re-route condition.

**Exit condition:** you can name the route and say why in one sentence. Announce it: "Routing to <route> because <reason>."

**Routing guide:** new capability → A · broken behavior → B · mechanical single-file change → C · refactor: mechanical with no behavior risk → C (even multi-file), any design decision or behavior risk → A · goal unclear → D.

## Pre-flight (before invoking anything)
Confirm each sub-skill on the chosen route exists by exact name in the available-skills list. If one is missing, STOP and tell the user which — never silently do the step yourself. Invoke the exact named skill — do not substitute a similar one (e.g., superpowers:brainstorming is not a replacement for Route A's grill step; which grill skill to use is decided ONLY by the documented CONTEXT.md/docs check, not by judgment).

## Route A — New feature / capability
1. **REQUIRED SUB-SKILL:** first check (read-only glob) whether the project has CONTEXT.md or docs/adr/ — if yes, use mattpocock-skills:grill-with-docs (grills against the documented domain model and updates docs inline); if no, use mattpocock-skills:grill-me. This conditional IS the route's exact naming — selecting per the check is not substitution. Under time pressure, limit to the 3-5 highest-risk questions instead of a full grilling. For refactors routed here, grill on invariants and existing test coverage instead of scope. **Exit:** scope and non-goals stated back to the user in ≤5 bullets.
   - Carry forward: write the agreed scope into the next invocation's prompt (or a plan file; note its path).
2. **REQUIRED SUB-SKILL:** select by documented check (this conditional IS the route's exact naming):
   - A written implementation plan file exists (step-by-step tasks, user-supplied or pre-existing — scope bullets from any grilling session, this run or a prior one, NEVER count as a plan) → use superpowers:executing-plans on it.
   - No plan AND Step 0's size answer is multi-session → use superpowers:writing-plans first, then superpowers:executing-plans.
   - Otherwise → use feature-dev:feature-dev — pass the scope artifact in.
   **Exit (all branches):** implementation complete AND verified running (build/test/smoke), not just written. For refactors, the pre-existing test suite passing IS the verification.
3. **REQUIRED SUB-SKILL:** Use 9arm-skills:scrutinize — on the actual diff. After it, grep the diff for `auth|session|token|secret|crypto|password|sql` — any hit → ALSO invoke `security-review` (the built-in command — no plugin namespace, so Pre-flight matches the bare name `security-review`; additive — never replaces scrutinize). **Exit:** findings from both addressed or explicitly accepted by the user.
4. [CONDITIONAL: only if work is pausing or unfinished at session end] **REQUIRED SUB-SKILL:** Use mattpocock-skills:handoff. **If skipped:** state "work complete, no handoff needed" in one line.

## Route B — Bug / something broken
0. [CONDITIONAL: the user's message says the failure is live in production / affecting users RIGHT NOW] **Inline mitigation first (not a sub-skill):** stop the bleeding before diagnosing — roll back or disable the broken path, then post status to the affected channel. Keep a short timeline (what changed / what you did / when). step 5's post-mortem stays the canonical writeup (reference this timeline, don't duplicate it). Resume step 1 once mitigated. **If skipped:** not live → straight to step 1.
1. **REQUIRED SUB-SKILL:** Use 9arm-skills:debug-mantra — BEFORE reading any code or accepting the user's hypothesis. The user's stated cause ("น่าจะเป็นที่ X") is a claim to falsify, not a spec — especially when they've been stuck on it for hours.
   **Exit:** failure reproduced and the real fail path identified with evidence.
2. [CONDITIONAL: only if root cause still unclear after mantra steps, or it's a performance regression] **REQUIRED SUB-SKILL:** Use mattpocock-skills:diagnose. **If skipped:** state why in one line.
3. Implement the fix (this step is inline work, not a sub-skill). **Exit:** the ORIGINAL reproduction no longer fails — show before/after evidence.
4. **REQUIRED SUB-SKILL:** Use 9arm-skills:scrutinize — yes, even for a "small single-file fix"; small diffs review fast, so the gate costs little. After it, grep the diff for `auth|session|token|secret|crypto|password|sql` — any hit → ALSO invoke `security-review` (the built-in command — no plugin namespace, so Pre-flight matches the bare name `security-review`; additive — never replaces scrutinize). **Exit:** findings from both addressed or explicitly accepted.
5. **REQUIRED SUB-SKILL:** Use 9arm-skills:post-mortem — if the chase took >30 minutes, the bug was user-facing, or it could recur. Otherwise write a 3-line record inline (real cause / fix / why it looked like something else). The record is not optional; only its length is.

## Route C — Mechanical / trivial task (right-size)
No design decision and mechanically verifiable — a single-file change, OR a mechanical multi-file change with no behavior risk (e.g. a rename or signature update). Do it directly, verify with the narrowest real check (typecheck/build/tests covering the change — not just a grep), and state in one line why the chain was skipped. Do not run Routes A/B ceremonially. (If a design decision or behavior risk appears mid-task, stop and re-route to A.)

## Route D — Unclear / exploratory goal
**REQUIRED SUB-SKILL:** Use superpowers:brainstorming (idea/requirements unclear) or mattpocock-skills:prototype (design question needs a throwaway build). **Exit:** goal is now concrete → re-route to A, B, or C.

## Robustness
- **Loop bound:** if the same gate fails twice on backward jumps, STOP and escalate to the user.
- **Gate-not-met recovery:** if a sub-skill returns without meeting its exit condition, explicitly choose: re-invoke, jump back, or ask the user. Never assume a clean exit.
- **Artifact hand-off:** the Skill tool takes no payload — carry scope/findings forward by writing a file (note the path) or summarizing into the next invocation's prompt.
- **Nested orchestration:** feature-dev:feature-dev drives its own internal phases — do not re-drive them. Gate on evidence it finished (passing build/tests/diff), not its self-report.

## Rationalizations — all observed in baseline testing, all wrong
| Excuse | Reality |
|---|---|
| "User said don't ask, deadline tomorrow" | Step 0 is one batched message — it costs seconds and prevents building the wrong thing fast. |
| "User time pressure overrides process skills" | Pressure shrinks each step's depth. The chain still runs. |
| "I'll do the step inline, invoking the skill is ceremony" | Inline work skips the step's gates. Step counts only via Skill tool. |
| "Small reproduced fix — outsider review is optional" | On Routes A/B, scrutinize is the gate, always — small diff = fast review. If the work is truly trivial it belongs in Route C from Step 0, not in a gate-skipped A/B. |
| "User is exhausted, post-mortem is ceremony they didn't request" | Then write the 3-line record. Zero record loses the root cause. |
| "Exit conditions are in my head" | Unstated gates don't get checked. Announce each gate result. |

## Red Flags — STOP and re-read this skill
- About to modify code and no route announced yet (read-only scoping is fine)
- About to invoke a "similar" skill instead of the exact one the route names
- About to declare done and scrutinize was not invoked
- Adopting the user's bug hypothesis without reproducing
- Telling yourself any sentence from the table above

## Completion
Only after the route's last gate passes: summarize what each step produced + the evidence (scope bullets, diff, review findings, record/handoff path).
