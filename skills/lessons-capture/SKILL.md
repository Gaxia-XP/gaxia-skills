---
name: lessons-capture
description: >-
  Use when an attempt fails after real effort, or a never-seen-before problem
  gets solved with a generalizable fix, and the lesson should outlive the
  session: "จำไว้ว่าวิธีนี้พัง", "รอบหน้าอย่าทำแบบนี้", "remember this
  failure", or any dead end worth not repeating. Captures it as a reusable rule.
  Do not use when the user only reports routine success with no new problem or
  method (e.g. "วิธีนี้เวิร์คดีมาก" alone).
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

1. Capture the failure. One lesson per entry, every entry in the same shape:
   [สิ่งที่ลอง] + [หลักฐาน: output/error/behavior] + [ครั้งหน้าทำแทน].
   If evidence is missing (e.g. the user is rushed), write the known parts first,
   put "รอเติม: <สิ่งที่ต้องถาม>" in each empty slot, then ask one pointed
   question per missing slot, one at a time. Never invent evidence. Never merge
   several issues into one entry to finish faster — a merged blob cannot be
   reused next time.
   **Exit:** the failure is stated plainly enough that a stranger would avoid it.
2. File it where it will be read — exactly one destination:
   - A skill owns the task and its SKILL.md is source the user maintains (a repo
     checkout or personal skills folder): propose the patch to its Pitfalls
     section — one rule plus why — and apply it once the user approves.
   - The owning skill comes from a plugin/marketplace install or a third party:
     don't edit it (the next update erases the lesson, and it isn't the user's
     file). Record the lesson in the host's durable memory with the skill's
     name, and offer upstream issue text if the user wants it.
   - No skill owns the task: record it in the host's durable memory.
   Never leave it only in chat, and never write task lessons into this skill's
   own file.
   **Exit:** the lesson lives in exactly one durable place, no duplicates.
3. Promote solved novelty. When a first-of-its-kind problem was fixed, add the
   prevention or fast-response rule to the destination Step 2 chose, under the
   same approval rule.
   **Exit:** a future run hitting the same problem finds the answer without search.
4. Prune on write. If the new rule replaces older wording, delete the old wording.
   Skills accumulate sediment; each addition must keep the file shorter or clearer.
   **Exit:** no duplicated or contradicted rules remain.

## Pitfalls

- Logging the failure without the evidence: "X doesn't work" with no output or
  reason teaches nothing and gets ignored.
- Recording the lesson in two places: the copies drift and both rot.
- Turning every hiccup into a rule: one-off environment flukes are session notes,
  not skill rules.
- Rewriting the whole skill for one lesson: patch the Pitfalls section, nothing more.
- Patching an installed plugin's SKILL.md: the next update silently erases it.

## Verification

- Re-read the patched section or memory entry: the new rule plus its reason is
  present. Never claim "ตรวจแล้ว" without a read to back it.
- State what changed and where in one sentence before continuing other work.
