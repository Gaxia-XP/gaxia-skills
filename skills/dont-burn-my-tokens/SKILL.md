---
name: dont-burn-my-tokens
description: Use when the user wants to minimize token spend / cost for a stretch of a session — "low token mode", "save tokens", "work cheaply", "ประหยัด token", "โหมดประหยัด", "อย่าเผา token", or invokes /dont-burn-my-tokens. A persistent economy mode: delegate heavy work to cheap subagents, keep the main context lean, and communicate concisely — without sacrificing quality. Stack with caveman for maximal output compression.
---

# Don't Burn My Tokens (economy mode)

A persistent operating mode to minimize token spend and cost while keeping quality. Three levers: delegate heavy work to cheap subagents, keep the main context lean, communicate concisely. The biggest savings come from the first two (context/tool tokens dwarf output tokens) — not from terse replies.

## Persistence
ACTIVE EVERY TURN once triggered. It does not wear off after many turns. Still active if unsure. Off only when the user says "normal mode" / "stop low-token" / "off".

## Context guard (offer once, then warn when context is large)
Long sessions bloat context — the very thing that burns tokens. While economy mode is active, watch for the context getting large (~200K tokens) and tell the user to `/compact` (keep working) or hand off (pausing/ending). You cannot read your own token count, so choose a mechanism the FIRST time the mode activates.

**On first activation, only if no guard hook is already installed, ask once:**
> "ติดตั้ง hook เช็ค context อัตโนมัติไหม? แม่นกว่า (อ่าน token จริง เด้งเองทุกครั้งที่จบ turn) — หรือให้ผมประเมินเอง?"

- **Yes → install the `Stop` hook** (precise): register `hooks/context_guard.py` (ships with this skill) as a `Stop` hook in **user scope** `~/.claude/settings.json` (dbmt is global). Use the `update-config` skill to edit settings.json safely:
  ```json
  { "hooks": { "Stop": [ { "matcher": "", "hooks": [ { "type": "command", "command": "python \"<ABS-PATH>/skills/dont-burn-my-tokens/hooks/context_guard.py\"" } ] } ] } }
  ```
  Then write the active-marker (below). Tune the threshold with the `DBMT_CONTEXT_THRESHOLD` env var (default 200000).
- **No → heuristic fallback**: after each unit of work, estimate context pressure from proxy signals (cumulative large reads, long multi-task session, many tool outputs) and give the same warning when it looks ≥ ~200K. Say it is an estimate.
- **If a guard hook is already installed**, skip the question; just manage the marker.
- **If the user already declined this session**, don't ask again.

**Active marker (gates the hook to economy mode):**
- When economy mode turns ON, write `~/.claude/.dbmt-active` (touch it; its mtime is what the hook checks).
- When it turns OFF ("normal mode"), delete `~/.claude/.dbmt-active`.
- The hook warns only when this marker exists and is fresh (< 12h).

**Warning content (hook or heuristic), one line:**
`Context ~XXXk — large: /compact (keep working this session) หรือ handoff (กำลังพัก/จบงาน)`
Recommend **handoff** (→ `mattpocock-skills:handoff`) if work is pausing/ending; **/compact** if continuing. After warning once, don't repeat every turn — re-warn only after a further jump (~+25K) or when work pauses.

## Rules

### 1. Delegate heavy work to cheap subagents (the main lever)
When a task would bloat the main context, dispatch a subagent and have it return ONLY the conclusion/result — never raw dumps. Delegate-worthy work: reading many or large files, repo-wide/broad searches, codebase exploration, repetitive multi-site edits, or any work whose raw output is large but you only need the takeaway.
- **Pick the cheapest sufficient model:** `haiku` for trivial/mechanical (fetch a file's content, run a search, simple edits), `sonnet` for standard implementation/analysis.
- **Escalate a subagent to `opus` only when the sub-task genuinely exceeds sonnet — and ask the user first** ("this part needs Opus to do well — OK?").
- **Never change the brain/main model yourself** — only the user can, via `/model`. You control subagent models only.

### 2. Overhead guard — do NOT delegate trivial work
Spawning a subagent costs tokens too. A quick single read/edit/answer is cheaper done inline. Delegate ONLY when the bulk work **and** its raw output would otherwise enter the main context, and that outweighs the spawn overhead. When in doubt and the task is small, do it inline.

### 3. Keep the main context lean
- **Surgical reads** — only the file/range you need; never re-read what is already in context.
- **Narrow searches** — request matching lines, not whole files; targeted globs over broad dumps.
- **Batch** independent tool calls into one turn.
- **Don't paste large outputs** (file contents, command logs) into the conversation — summarize, or have a subagent digest them and return the summary.

### 4. Communicate concisely
Drop preamble, fluff, and hedging; keep full technical accuracy. Stay readable — this is "concise", not telegraphic grunt. If the user wants maximal output compression, they can stack `caveman` on top.

## Quality guard — never sacrifice correctness for cost
Cheap models save money only if the work is right. If a cheap-model subagent returns wrong or insufficient output, do NOT ship it — redo it or escalate (ask the user for opus on that part). A wrong cheap answer costs a redo and wastes more than it saved.

## Auto-clarity exceptions
Do not over-compress or shortcut for: security warnings, irreversible-action confirmations, or when the user is confused / asks you to clarify. Be fully clear there, then resume economy mode.

## Decision points
- **Delegate vs inline** → the overhead guard (Rule 2).
- **Which subagent model** → `haiku` (trivial) / `sonnet` (standard); `opus` only with the user's OK.
- **Escalate to opus** → only when sonnet genuinely cannot, and ask first.

## Rationalizations — all wrong
| Excuse | Reality |
|---|---|
| "Delegate everything to save context" | Spawning tiny tasks burns MORE than doing them inline. Delegate only bulk / context-bloating work. |
| "The cheap model's output is good enough, ship it" | Only if it is correct. A wrong cheap answer forces a redo — sanity-check, escalate if needed. |
| "Just read the whole file/repo to be safe" | That bloat is exactly what this mode avoids. Use surgical reads + delegated digests. |
| "I'll switch the main model to save money" | You cannot — that is the user's `/model`. You control subagent models only. |
| "Compress the security warning too" | Never. Clarity exceptions stay fully clear. |

## Red Flags — STOP and re-read this skill
- About to delegate a 5-second task (overhead > savings).
- About to dump a large file or command output into the main context.
- About to ship cheap-model output you have not sanity-checked.
- About to silently use `opus` (cost) without asking.

## Off
Deactivate when the user says "normal mode" / "stop low-token" / "off". Delete the `~/.claude/.dbmt-active` marker so the context guard goes quiet. Confirm once: "Economy mode off."
