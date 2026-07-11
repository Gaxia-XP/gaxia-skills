---
name: creating-workflow-skills
description: Use when creating a skill that chains or orchestrates other skills, tools, or agent roles in a fixed order. Use for workflow, pipeline, and orchestrator skills that need explicit gates, hand-offs, branch handling, or multi-phase execution from one invocation.
---

# Creating Workflow Skills

## Overview

A **workflow (orchestrator) skill** is a SKILL.md whose body tells an agent how to invoke or load *other* capabilities in a fixed order. The user starts one workflow; the host agent drives the chain.

**Core principle:** Agents already write the happy-path chain well. An orchestrator skill earns its place by the parts they reliably MISS — the **robustness rails** below. Spend your words there, not on basics.

**REQUIRED BACKGROUND:** Use a skill-authoring guide appropriate to the host. It should cover naming, trigger descriptions, cross-referencing, and test-first creation. This skill adds the orchestrator-specific rails.

## What writing-skills already handles (don't pad)

Baseline-tested orchestrators reliably preserve ordering, per-step exit gates, exact capability references, no-early-completion claims, and auto-progression. Resolve capability names using the selected host adapter; do not encode one provider's namespace in the portable core. The template below already encodes the basics — put your effort into the rails.

## Description: resist the chain-summary urge

The one basic that orchestrator authors still fail is leaking the chain into the `description` ("plan → build → verify"). **Don't.** Agents may follow that summary and run an abbreviated chain instead of reading the body. State the *situation*, never the steps:

- ❌ `Use when shipping a branch — runs review, then debug, then finish`
- ✅ `Use when a branch is code-complete and the user wants it reviewed and integrated in one run`

If your description contains "then", "→", or a list of the phases, delete that clause.

## The Template

Copy this, replace the bracketed parts, delete steps you don't need. The `## Robustness` block is the point — keep it.

```markdown
---
name: <verb-first-name>
description: Use when <triggering conditions ONLY — never summarize the chain>
---

# <Name>

You orchestrate this workflow. The user invokes only this workflow. Drive every
step through the host's capability mechanism: a named skill, tool, subagent
role, or documented inline procedure. Do not skip, reorder, or merge steps.

## Rules
1. **Satisfy each step through its declared capability** — record the concrete skill, tool, role, or inline procedure used.
2. **Strict order, one at a time.** A step may not start until the previous step's exit condition is met.
3. **Backward jumps allowed, forward jumps never.** If a later step proves an earlier one wrong, return to it, redo it via its skill, then go forward again.
4. **No early completion claims.** Don't report done until the final step passes with evidence.
5. **Don't ask "should I continue?"** between steps — automatic progression is the point. Pause only when a step's own skill needs user input.

## Robustness (the rails — keep every one)
- **Pre-flight:** resolve every required capability before relying on it. If a required capability is unavailable and no documented inline fallback exists, STOP and tell the user.
- **Loop bound:** if the same gate fails twice on backward jumps (e.g. verify→debug→verify), STOP and escalate to the user. No infinite ping-pong.
- **Artifact hand-off:** make "pass forward" real — write the artifact to a file (note its path) or summarize it into the next invocation's prompt. Name the concrete carrier (plan path, branch, output dir).
- **Gate-not-met recovery:** if a capability returns WITHOUT meeting its exit condition, decide explicitly: retry, abort, or ask the user. Don't assume a clean exit.
- **Right-size:** for a trivial or already-partly-done request, short-circuit — the chain is not always all-or-nothing.

## Step 1 — <Phase name>
**REQUIRED CAPABILITY:** <capability-name>
- Host implementation: <skill / tool / role / inline procedure>
- Carry forward: <the concrete artifact + how (file path / prompt summary)>
- **Exit condition:** <concrete, checkable condition>

## Step 2 — <Phase name>  [CONDITIONAL: only if <condition>]
**REQUIRED CAPABILITY:** <capability-name>
- **Exit condition:** <...>
- **If skipped:** <state why in one line, carry the prior artifact forward>

## Completion
Only after the last step passes: summarize what each step produced + the evidence.
```

## Nested orchestration (the subtle one)

If a step invokes a capability that is *itself* an orchestrator:

- **Do not re-drive its children.** Invoking the inner orchestrator is what runs them; don't also invoke them yourself.
- **Beware context bloat + control conflict** — running an orchestrator inside an orchestrator can blow the context window and have two skills both "owning" ordering and completion. Consider delegating the inner step to a subagent / fresh context.
- **Require evidence, not a claim.** Gate the outer step on concrete proof the inner one finished (merge commit, PR URL, passing output) — not on its self-reported success.

## Common Mistakes (from baseline testing)

These are what writing-skills-equipped authors still miss — the table maps each to its rail:

| Mistake | Seen in baseline | Fix |
|---|:--:|---|
| Names sub-skills but never checks they exist | 4/4 | Pre-flight |
| No cap on backward-jump loops | 3/4 | Loop bound |
| "Pass forward" with no real mechanism | 4/4 | Artifact hand-off |
| No behavior when a gate isn't met / sub-skill fails | 4/4 | Gate-not-met recovery |
| Ignores that a sub-skill is itself an orchestrator | 3/4 | Nested orchestration |
| Chain rigidly all-or-nothing | — | Right-size |
| Description summarizes the chain | 1/4 | (writing-skills' description rule) |

## Quick Reference

- **A host-appropriate authoring guide = the basics** (description/naming/cross-ref/testing). **This skill = the rails.**
- One invocation → many capabilities, ordered and gated.
- Bake all rails into every orchestrator you generate; address nested orchestration when a step is itself an orchestrator.
- **Test before deploying** with a baseline run or an independent agent when the host supports one.
