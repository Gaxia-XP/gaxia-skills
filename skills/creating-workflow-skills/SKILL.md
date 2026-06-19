---
name: creating-workflow-skills
description: Use when creating a skill that chains or orchestrates other skills — a workflow, pipeline, or orchestrator skill where invoking one skill should drive several sub-skills in sequence (e.g. plan then build then debug then verify). Also use when a "meta" skill needs to call other skills via the Skill tool, enforce step ordering, or run a multi-phase process from a single invocation.
---

# Creating Workflow Skills

## Overview

A **workflow (orchestrator) skill** is a SKILL.md whose body tells Claude to invoke *other* skills in a fixed order via the Skill tool. The user runs one skill; Claude drives the whole chain.

**Core principle:** Agents already write the happy-path chain well. An orchestrator skill earns its place by the parts they reliably MISS — the **robustness rails** below. Spend your words there, not on basics.

**REQUIRED BACKGROUND:** Use superpowers:writing-skills. It already covers naming, the description "triggers-only" rule, cross-referencing (`REQUIRED SUB-SKILL`, no `@`-links), and test-first creation. Do **not** re-teach those here — this skill adds only what is orchestrator-specific.

## What writing-skills already handles (don't pad)

Baseline-tested (agents equipped with writing-skills, scored across 4 orchestrators): they reliably produce correct ordering, per-step exit gates, `REQUIRED SUB-SKILL` markers, correct namespacing (bare name for personal `~/.claude/skills/<n>/`, `plugin:name` for plugin skills), no `@`-links, no-early-completion claims, and auto-progression. The template below already encodes these — put your effort into the rails.

## Description: resist the chain-summary urge

The ONE basic that orchestrator authors still fail (re-tested: ~half leak it). The chain is the most salient thing in your head, so the instinct is to recap it in the `description` ("plan → build → verify…"). **Don't.** That recap is the exact trap writing-skills warns about — Claude follows the summary and runs an *abbreviated* chain instead of reading the body. Orchestrators fail this more than any other skill type. State the *situation*, never the steps:

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

You orchestrate this workflow. The user invokes ONLY this skill. You drive every
step by invoking the sub-skills yourself. Do not skip, reorder, or merge steps,
and do not "do a step yourself" instead of invoking its skill.

## Rules
1. **Invoke each step via the Skill tool** — a step counts only if the skill was actually invoked.
2. **Strict order, one at a time.** A step may not start until the previous step's exit condition is met.
3. **Backward jumps allowed, forward jumps never.** If a later step proves an earlier one wrong, return to it, redo it via its skill, then go forward again.
4. **No early completion claims.** Don't report done until the final step passes with evidence.
5. **Don't ask "should I continue?"** between steps — automatic progression is the point. Pause only when a step's own skill needs user input.

## Robustness (the rails — keep every one)
- **Pre-flight:** before relying on a sub-skill, confirm it exists by exact name/namespace. If a required skill is missing, STOP and tell the user — never silently do the step yourself.
- **Loop bound:** if the same gate fails twice on backward jumps (e.g. verify→debug→verify), STOP and escalate to the user. No infinite ping-pong.
- **Artifact hand-off:** the Skill tool takes no structured payload. Make "pass forward" real — write the artifact to a file (note its path) or summarize it into the next invocation's prompt. Name the concrete carrier (plan path, branch, output dir).
- **Gate-not-met recovery:** if a sub-skill returns WITHOUT meeting its exit condition, decide explicitly: re-invoke, abort, or ask the user. Don't assume a clean exit.
- **Right-size:** for a trivial or already-partly-done request, short-circuit — the chain is not always all-or-nothing.

## Step 1 — <Phase name>
**REQUIRED SUB-SKILL:** Use <namespace:skill-name>
- Carry forward: <the concrete artifact + how (file path / prompt summary)>
- **Exit condition:** <concrete, checkable condition>

## Step 2 — <Phase name>  [CONDITIONAL: only if <condition>]
**REQUIRED SUB-SKILL:** Use <namespace:skill-name>
- **Exit condition:** <...>
- **If skipped:** <state why in one line, carry the prior artifact forward>

## Completion
Only after the last step passes: summarize what each step produced + the evidence.
```

## Nested orchestration (the subtle one)

If a step invokes a skill that is *itself* an orchestrator (e.g. `superpowers:subagent-driven-development`, which internally drives worktrees → review → finish):

- **Do not re-drive its sub-skills.** Invoking the inner orchestrator is what runs them; don't also invoke them yourself.
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

- **writing-skills = the basics** (description/naming/cross-ref/testing). **This skill = the rails.**
- One invocation → many sub-skills, ordered and gated.
- Bake all rails into every orchestrator you generate; address nested orchestration when a step is itself an orchestrator.
- **Test before deploying** (RED baseline with a subagent) — **REQUIRED SUB-SKILL:** Use superpowers:writing-skills.
