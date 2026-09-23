---
name: pick-skill
description: >-
  Picks the right skill for a vague task from installed or installable skills.
  Use when starting work and no skill obviously owns it: "ไม่รู้ใช้ skill ไหน",
  "เลือก skill ให้หน่อย", or any task with several candidate skills.
  Do not use for tasks start-work already routes clearly, or when no skill
  fits at all (proceed skill-less instead of forcing one).
---

# Pick Skill

With dozens of skills installed, the wrong pick wastes the whole run. Spend one
short pass choosing, then commit. Resolve skill availability using the host
adapter (`adapters/`); never claim a skill ran that the host cannot load.

## When to Use

- A task arrives with no explicit skill and several plausible candidates.
- The user asks which skill fits a job.
- An installed skill exists but its trigger is ambiguous for this task.
- Don't use for: tasks `start-work` already routes clearly; cases where no skill
  fits at all (proceed skill-less instead of forcing one).

## Procedure

1. List candidates. Get the host's skill list (names plus one-line descriptions
   only, not full bodies). Include installed packs and, when the host supports
   it, installable external skills.
   **Exit:** 1-4 candidate names, or a written statement that none fits.
   Do not announce a pick or skill-less work until the candidate names are
   written in the transcript first — if none fits, name the closest rejects
   plus a half-sentence reason, e.g. "ดูแล้ว: music, songwriting-and-ai-music,
   heartmula — ไม่มีตัวไหนเป็นเจ้าของงานนี้ เลยทำแบบไม่ใช้ skill ครับ".
2. Match task verbs to triggers. Compare what the task DOES (debug, plan, ship,
   review, write, automate) against each candidate's When to Use. Prefer the
   narrowest skill that owns the whole task over a broad one that half-covers it.
   **Exit:** one named pick.
3. Break ties by evidence cost. If two skills fit, choose the one whose procedure
   produces checkable evidence for this task's definition of done.
   **Exit:** the tie-break reason in half a sentence.
4. Announce and load. State the pick plus why in one sentence, then load that
   skill and follow it. If none fits, say so and continue without a skill rather
   than shoehorning one.
   **Exit:** the chosen skill is loaded, or skill-less work is declared.
   The announce sentence must quote the criterion verbatim for half a sentence
   (narrowest full-owner / checkable evidence for this DoD) — never paraphrase
   only, e.g. "เลือก scrutinize เพราะ narrowest full-owner ของงานนี้ และให้
   checkable evidence for this DoD ด้วย trace เส้นทางโค้ดจริงครับ".

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
- Installing an external skill when an installed one fits: local first, install
  only on a genuine gap.
- Re-picking mid-task on every doubt: one pick per task unless evidence proves
  it wrong.

## Verification

- The pick plus its one-sentence reason is stated before any task work begins.
- The loaded skill's own verification gate passes at the end of the task.
