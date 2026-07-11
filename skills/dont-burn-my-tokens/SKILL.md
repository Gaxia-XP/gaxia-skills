---
name: dont-burn-my-tokens
description: >-
  Use when the user wants to minimize token spend or context use for a stretch
  of work: "low token mode", "save tokens", "work cheaply", "ประหยัด token",
  "โหมดประหยัด", "อย่าเผา token", or /dont-burn-my-tokens. Run a persistent
  economy mode that keeps context lean, delegates only when worthwhile, and
  stays concise without sacrificing correctness.
---

# Don't Burn My Tokens

Run a persistent economy mode that minimizes cost and context use while keeping quality. The main levers are targeted context, bounded delegation, and concise communication. Do not trade away verification, safety, or clarity for a cheaper run.

## Persistence

Stay active on every turn once triggered. Turn off only when the user says "normal mode", "stop low-token", or "off". If the host cannot preserve mode state across turns, state that limitation once and apply the rules for the current task.

## Context Guard

On first activation, choose the strongest guard the host supports:

1. A host-native context meter or lifecycle hook, if the user authorizes its installation.
2. A host-provided handoff or compaction mechanism.
3. A heuristic based on large reads, broad searches, long sessions, and repeated tool output.

Use a host adapter for platform-specific setup. Do not edit host settings or install hooks without explicit user approval. When pressure is high, recommend a compaction or durable handoff. Say when the warning is an estimate.

## Rules

### 1. Delegate only context-heavy work

Delegate broad exploration, large-file digestion, repetitive multi-site edits, or work whose raw output would otherwise bloat the main context. Return only the useful conclusion or artifact summary to the main agent.

Use the least expensive worker that can safely satisfy the task. Do not change the user's primary model or subscription tier. If the host exposes no safe delegation mechanism, use targeted reads and narrow searches instead.

### 2. Do not delegate trivial work

Spawning or coordinating a worker has cost. Do a quick read, edit, or answer inline when that is cheaper than delegation. Delegate only when the saved context and work outweigh the overhead.

### 3. Keep the active context lean

- Read only the file ranges needed for the decision.
- Search for matching lines instead of dumping trees or whole files.
- Batch independent checks when the host supports batching.
- Summarize large outputs instead of pasting them into the conversation.
- Reuse facts already established instead of reading them again.

### 4. Communicate concisely

Drop filler and keep full technical accuracy. Be fully clear for security warnings, irreversible-action confirmations, or a confused user; those are never candidates for compression.

## Quality Guard

Do not ship a low-cost result that has not met its verification gate. A wrong cheap result costs more to diagnose and redo. Retry, improve the method, or ask before escalating to a more expensive capability.

## Decision Points

- **Delegate or inline?** Use delegation only when the context savings exceed its overhead.
- **Use a stronger worker?** Ask before incurring a meaningful cost increase when the host exposes cost tiers.
- **Warn about context?** Prefer an exact host signal; otherwise explain that the estimate is heuristic.

## Rationalizations

| Excuse | Reality |
|---|---|
| "Delegate everything to save context" | Small delegations can cost more than inline work. |
| "The cheap result is good enough" | Only if it passes the same quality gate. |
| "Read the whole repo to be safe" | Broad reads are exactly what this mode avoids. |
| "Compress the security warning" | Safety and irreversible-action clarity stay complete. |

## Off

When the user disables economy mode, remove or disable only the state that this mode created through the current host. Confirm once that economy mode is off.
