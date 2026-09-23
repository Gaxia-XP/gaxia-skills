---
name: lessons-capture
description: >-
  Captures failed attempts and novel fixes as reusable skill rules.
  Use when an attempt fails after real effort or a never-seen-before problem
  gets solved with a generalizable fix: "จำไว้ว่าวิธีนี้พัง",
  "รอบหน้าอย่าทำแบบนี้", or any dead end worth not repeating.
  Do not use when the user only reports routine success with no new problem
  or method (e.g. "วิธีนี้เวิร์คดีมาก" alone).
---

# Lessons Capture

Failed attempts evaporate between sessions. Solved novel problems stay solved
only if the fix becomes a rule. Do both in one pass, every time either happens.
Resolve recording targets using the host adapter and `adapters/capabilities.md`.

## When to Use

- An approach failed after real effort: wrong tool, wrong assumption, dead end.
- A never-seen-before problem was solved and the fix generalizes beyond this task.
- The user says to remember a failure or a lesson.
- Don't use for: routine successes with nothing transferable; trivia that belongs
  in session history, not in a skill.

## Procedure

1. Capture the failure. Write what was tried, the evidence it failed (tool output,
   error text, observed behavior), and what to try instead. One lesson per entry.
   Every entry uses the same shape: [สิ่งที่ลอง] + [หลักฐาน: output/error/
   behavior หรือ "รอเติม: ..."] + [ครั้งหน้าทำแทน] — if a slot is empty, write
   "รอเติม: <สิ่งที่ต้องถาม>" plus one pointed question instead of leaving it
   blank. Never merge several issues into one blob to finish faster (a merged
   blob cannot be reused next time).
   If rushed with no evidence yet: capture what is known first (what-tried in
   one line + [รอหลักฐาน: คำสั่ง/error]) then ask for the minimum evidence per
   issue, one question at a time. Never invent evidence, and never merge several
   issues into one entry to finish faster.
   **Exit:** the failure is stated plainly enough that a stranger would avoid it.
2. File it where it will be read. If a skill owns the task, patch that skill's
   Pitfalls section with one rule plus why. If no skill owns it, record it in the
   host's durable memory. Never leave it only in chat.
   **Exit:** the lesson lives in exactly one durable place, no duplicates.
3. Promote solved novelty. When a first-of-its-kind problem was fixed, add the
   prevention or fast-response rule to the owning skill, or extend this skill's
   host notes when no owner exists.
   **Exit:** a future run hitting the same problem finds the answer without search.
4. Prune on write. If the new rule replaces older wording, delete the old wording.
   Skills accumulate sediment; each addition must keep the file shorter or clearer.
   **Exit:** no duplicated or contradicted rules remain.
   Final gate before reporting done: re-read the patched section (or the full
   draft entry) and report in one sentence what changed where — never claim
   "ตรวจแล้ว" without a read/trace to back it.

## Pitfalls

- Logging the failure without the evidence: "X doesn't work" with no output or
  reason teaches nothing and gets ignored.
- Recording the lesson in two places: the copies drift and both rot.
- Turning every hiccup into a rule: one-off environment flukes are session notes,
  not skill rules.
- Rewriting the whole skill for one lesson: patch the Pitfalls section, nothing more.

## Verification

- Re-read the patched section: the new rule plus its reason is present.
- State what changed and where in one sentence before continuing other work.
