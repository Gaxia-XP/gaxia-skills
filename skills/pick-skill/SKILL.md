---
name: pick-skill
description: >-
  Use when the user asks which skill fits a job ("ไม่รู้ใช้ skill ไหน",
  "เลือก skill ให้หน่อย", "which skill should I use"), or when two or more
  installed skills plausibly own the same task. Picks one owner from names and
  descriptions, or declares skill-less work instead of forcing one. Not the
  default entry point for new work — start-work routes ordinary requests.
---

# Pick Skill

With dozens of skills installed, the wrong pick wastes the whole run. Spend one
short pass choosing, then commit. Resolve skill availability using the host
adapter (`adapters/`); never claim a skill ran that the host cannot load.

## When to Use

- The user asks which skill fits a job.
- Several installed skills plausibly own the same task.
- An installed skill exists but its trigger is ambiguous for this task.
- Don't use for: routing ordinary new work (`start-work` owns that); tasks with
  one obvious owner; cases where no skill fits at all (proceed skill-less
  instead of forcing one).

## Procedure

1. List candidates. Get the host's skill list (names plus one-line descriptions
   only, not full bodies). Look at installed skills first; list installable
   external skills only when none installed fits and the host can install.
   Write the candidate names in the transcript before announcing a pick or
   skill-less work. If none fits, name the closest rejects plus a half-sentence
   reason, e.g. "ดูแล้ว: pdf, docx, xlsx — ไม่มีตัวไหนเป็นเจ้าของงานนี้
   เลยทำแบบไม่ใช้ skill ครับ".
   **Exit:** 1-4 candidate names written, or a written statement that none fits.
2. Match task verbs to triggers. Compare what the task DOES (debug, plan, ship,
   review, write, automate) against each candidate's When to Use. Prefer the
   narrowest skill that owns the whole task over a broad one that half-covers it.
   **Exit:** one named pick.
3. Break ties by evidence cost. If two skills fit, choose the one whose procedure
   produces checkable evidence for this task's definition of done.
   **Exit:** the tie-break reason in half a sentence.
4. Announce and load. State the pick plus why in one sentence, naming the
   criterion that decided it by its term — `narrowest full owner` or
   `checkable evidence` — rather than a vague paraphrase, e.g. "เลือก
   systematic-debugging เพราะเป็น narrowest full owner ของงานนี้ และให้
   checkable evidence ด้วยการ reproduce บั๊กจริงครับ". Then load that skill and
   follow it. If the pick is an external skill that is not installed, ask the
   user before installing — never install on your own. If none fits, say so and
   continue without a skill rather than shoehorning one.
   **Exit:** the chosen skill is loaded, or skill-less work is declared.

## Robustness

- **Pre-flight:** if the host exposes no skill list, declare skill-less work
  immediately instead of guessing names. Never invoke a skill that may not exist.
- **Loop bound:** if the pick proves wrong twice (re-pick → fail → re-pick → fail),
  stop and escalate to the user instead of cycling candidates.
- **Gate-not-met recovery:** if the chosen skill finishes without meeting its own
  verification gate, decide explicitly: retry with a different pick, continue
  skill-less, or ask the user. Don't silently accept the gap.

## Pitfalls

- Loading two overlapping skills: they contradict and the run thrashes. One task,
  one owner.
- Reading full SKILL.md bodies to choose: decide from names plus descriptions,
  load the full body only after picking.
- Installing an external skill when an installed one fits: local first, and
  install only on a genuine gap with the user's approval.
- Re-picking mid-task on every doubt: one pick per task unless evidence proves
  it wrong.

## Verification

- The pick plus its one-sentence reason is stated before any task work begins.
- The loaded skill's own verification gate passes at the end of the task.
