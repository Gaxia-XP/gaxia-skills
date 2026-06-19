# Techniques for writing an effective SKILL.md
*Researched and verified 2026-06-15 — mined from the skill-authoring skills installed locally (superpowers:writing-skills, mattpocock:write-a-skill, skill-creator, creating-workflow-skills) + web research (official Anthropic docs) · 20 agents · 14 key claims verified adversarially*

> **The iron rule of this document:** every item is tagged **[Official]** (present in Anthropic's official docs) or **[Community]** (a convention of superpowers/obra/mattpocock — works in practice but is house style, not a standard) — because the verify phase found that many techniques people assume are "rules" are actually one framework's opinion.

---

## 0. The core mental model — 3-level Progressive Disclosure **[Official]**

Understand this one thing and the rest of the techniques follow. A SKILL.md works in 3 layers, each loaded into context at a different moment:

| Level | What's in it | Loaded when | Token cost |
|---|---|---|---|
| 1 | `name` + `description` (frontmatter) | loaded into the system prompt **always** | tiny — must be most frugal |
| 2 | the SKILL.md body | loaded **only when the skill is triggered** | medium — keep < 500 lines |
| 3 | attached files (`references/`, `scripts/`, `assets/`) | loaded **only when actually used** | zero until opened |

**Implications:** the `description` is a signpost, not a manual · the body is a table of contents, not an encyclopedia · heavy detail can be pushed down into a reference for free ("SKILL.md serves as an overview that points Claude to detailed materials as needed, like a table of contents")

---

## 1. `description` — the most important (and most contested) battleground

The `description` is the only signal Claude uses to pick a skill out of 100+. Get it wrong = no matter how good the skill, it's never invoked.

### What every source **agrees on**
1. **Always write in the third person** **[Official]** — because the description is injected into the system prompt · no "I can help you..." (first person breaks discovery)
2. **Include the trigger keywords the user actually says** **[Official]** — symptoms, error text, synonyms, specific tool names · "specific" beats "broad" every time — `Helps with documents` / `Processes data` is the #1 silent failure mode
3. **Describe the "problem", not the "language-specific symptom"** **[Community]** — write "race conditions, timing-dependent" not "setTimeout, sleep" (unless the skill is tied to a specific technology)
4. **Stay under the 1024-character limit** **[Official]** · frequently-loaded ones should aim for ~under 500 characters **[Community]**
5. **Make it "a little pushy"** **[Official-ish]** — Claude tends to *under-trigger* skills by default; the official skill-creator says to "make the skill descriptions a little bit pushy"
6. **Separate overlapping skills** with non-overlapping boundaries + a "Do not use when…" sentence

### The conflict you must know — "say what it does" or "say only when"?
This is where the verify phase was sharpest. Two schools conflict head-on:

- **The official Anthropic school:** the description must have **both "what it does" and "when to use it"**
  > *"The description field enables Skill discovery and should include both what the Skill does and when to use it"*
  Official example: `Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.`

- **The superpowers school:** the description must **"say only when" (triggers only), never summarize the workflow**
  > because testing found that if the description summarizes the workflow → Claude follows the description and **skips reading the body** · real case: a description saying "code review between tasks" made Claude review **once** when the flowchart in the body mandated **twice** — removing the workflow summary fixed it.

**Verdict from verify (nuanced):** the rule "triggers only, never say what it does" is an **overreach** — it directly contradicts the official Anthropic docs · **the valid kernel is: don't let the description summarize the "workflow's step sequence"** (that makes Claude shortcut the steps), but "say what it does + when to use it" is allowed and recommended.

> **Safe practical formula:** `<what it does, 1 sentence> + Use when <condition/symptom/words the user says>` — but **don't put a step sequence** ("step 1 do A, then step 2 do B") into the description, especially for a multi-step workflow skill.

---

## 2. Body structure + content style

### Structure
- **A single file (SKILL.md only) is a valid and common structure** **[Official]** — don't split files unless you must
- **Body under 500 lines; if near the limit, split into files** **[Official]**
- **References go only 1 level deep from SKILL.md** **[Official]** — no SKILL→advanced→details, because Claude reads partially (`head -100`); deeply nested files get read incompletely
- **A reference file over 100 lines gets a table of contents (TOC) at the top** **[Official]** — guards against Claude previewing only part of it
- **Split references by "domain/variable", not by sequence number** — `forms.md`, `tables.md` not `doc1.md`, `doc2.md` · keep unrelated context separate

### Content style
- **As concise as possible — "the context window is a public good"** **[Official]** · assume "Claude is already smart" · ask of every paragraph *"is this paragraph worth the tokens it costs?"* (official example: a ~50-token PDF instruction beats a ~150-token one that explains what a PDF is)
- **Explain "why" instead of shouting bare MUST/ALWAYS/NEVER** — reasons make Claude comply more consistently than naked commands (*there's tension here*: some discipline skills deliberately use MUST to close loopholes — choose by skill type, see §4)
- **Use imperative language + consistent terminology throughout the skill** — don't call the same thing by several names
- **One good example beats several diluted languages** — go deep on one language rather than skim 5
- **A skill is a "reusable reference document", not "the story of one problem-solving session"** — cut case-specific narrative
- **Avoid time-bound info** (versions/dates) — if necessary, make a separate "old patterns" section
- **Use a flowchart only for genuinely unclear decision points** — don't draw a flowchart for linear steps, code, or reference content
- **Give "one default, not a menu of options"** — many options = a non-deterministic instruction

### Degrees of freedom — tune strictness to the task's fragility **[Official]**
- fragile work / breaks if wrong (a narrow bridge) → write fixed steps, ready-made scripts
- flexible work (an open field) → give principles, let Claude choose the method
- match the degree of freedom to the task; don't put a rigid script on creative work, or free rein on work that must not fail

---

## 3. Bundled Resources **[Official]**

Standard directory layout: `scripts/` · `references/` · `assets/`

- **Bundle a utility script for deterministic/repeated work** — instead of describing it in prose for Claude to reinvent each time, attach a runnable script (if a test re-runs the same thing repeatedly = a signal it should be a script)
- **State the intent "to run" vs "to read" clearly** — say which file to execute and which to read for reference
- **Scripts must "solve the problem", not "throw it back"** — real error handling, no voodoo/magic constants you can't explain, no hardcoded Windows paths
- **Always use forward slashes + meaningful file names + fully-qualified MCP tool names** — helps navigation and cross-platform portability
- **Don't assume a package is installed** — runtimes/packages differ by platform

---

## 4. The hard skill types — Discipline & Orchestrator

These two types need special technique, because Claude is motivated to "weasel" out of the process.

### Discipline skills (enforce a discipline, e.g. TDD, debugging) **[Community — superpowers]**
- **Close every loophole explicitly — don't just state the rule** because Claude will rationalize its way out
- **A Rationalization table (`Excuse | Reality`)** — catch the excuses seen in real testing, written next to a verbatim rebuttal
- **A Red Flags list for Claude to self-check** — "if you're thinking these sentences = STOP, you're rationalizing"
- **Lay the root principle up front: "violating the letter of the rule = violating the intent of the rule"** **[verify: confirmed effective]** — kills the whole "but I followed the intent" family of excuses (meta-test evidence: adding this sentence changed agent behavior to "follow the rule")
- **Update the description with the "symptoms of violating"** — CSO for a discipline skill, so it triggers right when Claude is about to do it wrong

### Orchestrator skills (chain other skills into a workflow) **[Community — creating-workflow-skills]**
- **Spend your words on the "rails" agents reliably miss, not the happy path** — pre-flight, loop bounds, artifact hand-off, recovery when a gate isn't met
- **The description must state the "situation", not the "chain sequence"** — (consistent with §1: don't summarize the workflow in the description)
- **Orchestrator body rules:** invoke every step through the real Skill tool · fixed order · backward jumps allowed but never forward jumps · no early completion claim before the final gate passes · auto-progress through steps without asking "continue?"
- **Nested orchestration: don't re-drive a sub-skill** — if the child skill drives its own internal phases, gate on "evidence it finished" (build/test passing) not its self-report
- **Don't re-teach what a referenced foundation skill already teaches**

> *(Note: the `start-work` skill in this pack uses this full set of techniques.)*

---

## 5. Eval & Testing — the overlooked heart

### Eval-driven development **[Official]** — verify: confirmed
- **Build the evaluation before writing extensive documentation** — *"Create evaluations BEFORE writing extensive documentation... solves real problems rather than documenting imagined ones"*
- The official 5-step order: identify the gap → build 3 test scenarios → measure a baseline (no skill) → add minimal instructions → iterate
- Official eval schema: `{skills, query, files, expected_behavior}` · the official checklist says "create at least 3 evaluations"

### Subagent pressure-testing **[Community — superpowers]** — verify: nuanced
- **Test with subagents A/B (with skill vs without)** on real work, not a quiz
- *"A good test combines 3+ pressures"* (time limit + authority + exhaustion etc.) — **but verify cautions: the "3+" number is the author's heuristic, not a value Anthropic confirmed empirically**
- **Meta-testing: ask a failed agent "how should the skill be written to prevent this mistake"** then map the answer: vague → reinforce the principle / "should say X" → add it verbatim / "didn't see Y" → make it more prominent

### Quantitative measurement **[Official — skill-creator]**
- **Measure trigger accuracy on should-trigger / should-NOT-trigger cases** then iterate on the description
- **Variance analysis: run multiple times** (e.g. 3 per query) to catch flaky / non-discriminating / tradeoff patterns
- **Test on every model you'll actually use** (Haiku/Sonnet/Opus) — behavior differs
- **Observe how Claude walks through the skill on real work** then iterate (Claude A writes / Claude B tests)

### The Iron Law **[Community — superpowers]** — verify: nuanced
> *"NO SKILL WITHOUT A FAILING TEST FIRST"* — applies to new skills and to editing existing skills
- **verify cautions:** this is one framework's strict house style, not an official principle · Anthropic recommends something softer ("start from an evaluation, observe where it stumbles, iterate") · and "test" here means a subagent pressure scenario, not an automated unit test · it's a good principle, but the "delete/restart" framing is a context-dependent style choice

---

## 6. Anti-patterns — a "don't" checklist

| Anti-pattern | Why it fails |
|---|---|
| broad/vague description (`Helps with X`) | the #1 silent failure mode — never triggers |
| description summarizes the workflow sequence | Claude follows the description and skips the body (shortcuts the steps) |
| bloated body over ~500 lines | wastes tokens — push down into a reference |
| reference-level detail in the body | breaks progressive disclosure |
| references nested several levels deep | Claude reads partially → misses content (only 1 level deep) |
| non-deterministic instruction / many options | unpredictable result — give one default |
| many overlapping skills | fight over triggering the wrong one — add "Do not use when" |
| bare MUST/ALWAYS/NEVER with no reasons | inconsistent compliance — explain why (except discipline skills deliberately closing loopholes) |
| examples as case narrative / many diluted languages | a skill must be reusable, not a record of one fix |
| script throws the error back / magic numbers / Windows paths | non-deterministic + not cross-machine portable |
| time-bound info (versions/dates) in the body | silently goes stale |
| too many skills installed / too much free rein | competes for context + triggers wrongly |

**When NOT to build a skill:** if it's an automatic behavior rule ("every time that...") → use a hook · if it's a setting value → use config · a skill fits "knowledge/process that Claude pulls in while working"

---

## 7. Summary table — "Official Anthropic" vs "Community convention"

This is the most important result from the verify phase — separating what's firmly citable vs what's one framework's opinion.

| Technique | Status | Note from verify |
|---|---|---|
| description has "what it does + when to use" | **Official** ✅ | confirmed straight from the best-practices doc |
| description "triggers only, never say what it does" | Community ⚠️ | overreach — the real kernel is "don't summarize the workflow" |
| Progressive disclosure / SKILL.md as a TOC | **Official** ✅ | matches the doc |
| body <500 lines | **Official** ✅ | counts "lines" |
| word budget <150/<200/<500 words | Community ⚠️ | Anthropic counts lines not words; no such tiering |
| references 1 level deep | **Official** ✅ | matches the doc |
| TOC for files >100 lines | **Official** ✅ | (skill-creator uses >300 — the numbers don't fully agree) |
| "the context window is a public good" | **Official** ✅ | direct quote |
| build the eval before writing docs | **Official** ✅ | direct quote |
| CSO / keyword coverage | partly Official ⚠️ | focused on the description field, not headings/body |
| Iron Law (failing test first) | Community ⚠️ | strict house style, not an official principle |
| pressure-test "3+ pressures" | Community ⚠️ | the 3+ number is a heuristic, not verified |
| "spirit vs letter" root principle | Community ✅ | n=1 but with evidence it works |
| persuasion principles by skill type | Community ⚠️ | the mechanism is fine, but the statistical framing exceeds the evidence |

---

## 8. Starter template + Pre-flight checklist

### frontmatter (validation rules)
```yaml
---
name: my-skill-name        # ≤64 chars, lowercase + digits + hyphen only, no reserved words
description: <what it does, 1 sentence>. Use when <condition/symptom/words the user says>.  # ≤1024 chars, third person
# --- Claude Code-specific extensions (optional) ---
# allowed-tools: Read, Grep, Bash
# model: claude-opus-4-8
# disable-model-invocation: false
---
```
> **Only 2 required fields:** `name` + `description` · the rest are optional

### Standard body skeleton
```markdown
# <skill name>
<1-2 sentences on what it does>

## When to use / When NOT to use
## <main steps / principles>   ← imperative, concise, one deep example
## Red Flags (if a discipline skill)
## Rationalizations table (if a discipline skill)

# Attached files (loaded on demand):
# references/<domain>.md   ← heavy detail, TOC if >100 lines
# scripts/<repeated task>.py  ← deterministic work
```

### Pre-flight checklist before deploy
- [ ] `description` has "what it does + Use when" + the trigger words the user actually says (no workflow summary)
- [ ] third person, ≤1024 chars
- [ ] body <500 lines, heavy detail pushed into references
- [ ] references only 1 level deep, files >100 lines have a TOC
- [ ] eval/baseline built (at least 3 scenarios) — is having the skill actually better than not?
- [ ] (discipline skill) loopholes closed with a rationalization table + red flags + the "letter=spirit" principle
- [ ] trigger tested on should/should-NOT cases + tested across the models you'll use
- [ ] forward slashes, no time-sensitive info, consistent terminology

---

## Primary sources
- **Official Anthropic:** `platform.claude.com/docs/en/agents-and-tools/agent-skills/` (overview + best-practices) · `anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills` · the `anthropics/skills` repo (skill-creator)
- **Community:** `github.com/obra/superpowers` (writing-skills, testing-skills-with-subagents) · mattpocock:write-a-skill · creating-workflow-skills (local)
- **Persuasion research cited:** Meincke, Cialdini et al. "Call Me a Jerk" (Wharton/PNAS, 2026) — *caution: measured on jailbreak requests, not general instruction-following*

*Verified as of 2026-06-15 — the official Anthropic docs can change; check the URLs before citing as a standard*
