---
name: start-work
description: >-
  Use when the user starts work without specifying a workflow: a feature
  request, bug report, refactor, mechanical change, or vague goal. Route the
  work through explicit capabilities and evidence gates. Triggers on "เริ่มงาน",
  "ทำ X ให้หน่อย", "ช่วยแก้/ช่วยทำ", or /start-work when no more specific skill
  owns the request.
---

# Start Work

Route a request through one workflow and preserve its gates. A declared capability can be a host skill, native tool, subagent role, or documented inline procedure. Resolve capabilities using the host adapter and `adapters/capabilities.md`; never claim that an unavailable capability ran.

## Rules

1. Satisfy every declared capability and state the implementation used.
2. Keep strict order within a route. Start the next step only after the prior exit condition is met.
3. Allow backward jumps when evidence invalidates an earlier step; never skip forward.
4. Do not claim completion without the final gate's evidence.
5. Do not ask for permission between normal steps. Pause only for missing facts, authority, or a step that explicitly needs user input.
6. Pressure changes depth, not gates. Under time pressure, shorten the work inside each step but do not omit routing or verification.

## Step 0 - Clarify and Route

Ask one compact batch only for missing information: objective, definition of done, work type (feature, bug, mechanical, or unclear), approximate size, and current state. Use the host's question mechanism when available. Do not re-ask facts already supplied.

Read-only scoping checks are allowed before routing. Do not modify code until a route is announced.

**Exit:** announce one route and why in one sentence.

| Situation | Route |
|---|---|
| New capability or behavior-risk refactor | A |
| Broken behavior | B |
| Mechanical change with no behavior risk | C |
| Goal or design is unclear | D |

## Pre-flight

Resolve the capabilities required by the selected route. Use a host adapter's named implementation when one exists. If the host has no safe implementation or documented inline fallback, stop and identify the missing capability.

## Route A - New Feature or Behavior-Risk Refactor

1. **REQUIRED CAPABILITY: `scope-interview`**
   - Use a docs-aware variant when the project has architecture or domain docs; otherwise use an interactive scope interview.
   - Under time pressure, cover the three to five highest-risk questions.
   - **Exit:** scope and non-goals are recorded in no more than five bullets.
   - **Carry forward:** write or pass the scope artifact to the next capability.

2. **REQUIRED CAPABILITY: `planning` and `implementation`**
   - A pre-existing detailed plan: execute it and verify the result.
   - No plan and multi-session work: create a plan, then execute it.
   - Otherwise: use the host's feature implementation capability with the scope artifact.
   - **Exit:** implementation is complete and a relevant build, test, or smoke check passes.

3. **REQUIRED CAPABILITY: `independent-review`**
   - Review the actual diff.
   - If the diff touches authentication, sessions, tokens, secrets, cryptography, passwords, or SQL, also run `security-review`.
   - **Exit:** findings are fixed or explicitly accepted by the user.

4. **CONDITIONAL CAPABILITY: `handoff`**
   - Use only when work pauses or remains unfinished.
   - **If skipped:** state that work is complete and no handoff is needed.

## Route B - Bug or Broken Behavior

0. **Conditional mitigation:** if the failure is live and harming users now, mitigate first using the safest available rollback, disablement, or status procedure. If mitigation needs authority the user did not grant, stop and escalate.

1. **REQUIRED CAPABILITY: `diagnosis`**
   - Reproduce the failure before accepting a proposed cause.
   - **Exit:** the real failure path is evidenced.

2. **CONDITIONAL CAPABILITY: deeper diagnosis**
   - Use when the cause remains unclear after diagnosis or when the issue is a performance regression.
   - **Exit:** a narrowed cause or measured performance hypothesis exists.

3. **REQUIRED CAPABILITY: `implementation`**
   - Fix the evidenced cause.
   - **Exit:** the original reproduction no longer fails, with before/after evidence.

4. **REQUIRED CAPABILITY: `independent-review`**
   - Review the actual diff. Add `security-review` for sensitive changes.
   - **Exit:** findings are fixed or explicitly accepted.

5. **REQUIRED CAPABILITY: `postmortem`**
   - Use a full postmortem when the investigation took substantial time, affected users, or could recur.
   - Otherwise record the cause, fix, and misleading symptom in three lines.
   - **Exit:** a durable record exists.

## Route C - Mechanical Task

Perform the change directly only when it has no design decision and no behavior risk. Run the narrowest real verification, such as a targeted test, typecheck, or build. State why the workflow was right-sized. If a design decision or behavior risk appears, stop and re-route to A.

## Route D - Unclear or Exploratory Goal

**REQUIRED CAPABILITY: ideation or prototype.** Use an idea or requirements exercise for unclear scope, or a throwaway prototype for a design question.

**Exit:** the goal is concrete enough to re-route to A, B, or C.

## Robustness

- **Loop bound:** after the same gate fails twice on a backward jump, stop and escalate.
- **Gate recovery:** when a capability returns without meeting its exit condition, explicitly retry, jump back, or ask the user. Never assume success.
- **Artifact hand-off:** pass scope and findings through a file path or concise prompt summary.
- **Nested orchestration:** if a selected capability runs its own workflow, do not re-drive its children. Gate on evidence, not its self-report.

## Red Flags

- Modifying code before a route is announced.
- Treating a user's bug theory as evidence without reproduction.
- Skipping independent review on Route A or B.
- Replacing a missing capability with an unrecorded weaker step.
- Declaring completion without the final verification evidence.

## Completion

After the route's last gate passes, summarize the route, artifacts, checks, and any accepted risks. For incomplete work, leave a handoff artifact rather than a vague status claim.
