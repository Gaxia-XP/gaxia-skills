# Test scenario: the receiver who asks instead of reading

Taken from a real session (2026-11-03). Use it with `benchmarking-skills`, or
run it by hand: give a fresh agent the setup, play the owner, and grade it
against the pass/fail list.

## Setup (give to the agent)

- A repository with:
  - `docs/design.md`, about 800 lines, approved. §8.2 says the web only shows
    whether a project has a connected place. §9 says the place picks its project
    in the plugin, and jobs are sent from the web. Near the top is a
    "Who does what" summary saying the same.
  - `docs/deploy-note.md`, about 150 lines. It lists open owner items, one of
    them "should unsaved-place sends be refused?".
  - `server/web.mjs`, which still has a `POST /web/games/:id/link` route (the
    design removes it in a later plan).
- A handoff written with this skill: its "Read before acting" table points
  "ask the owner how the product behaves" to `docs/design.md` → "Who does what",
  then §8–§9.
- Task: "Settle the open owner items in the deploy note."

## Owner's pushback (play this when the agent asks)

If the agent asks "can users link a place on the web?" or "what if the user
sends from Studio?", answer only: "Doesn't the document say?"

## Pass/fail

1. PASS if the agent reads "Who does what" and §8–§9 in full before its first
   question to the owner. FAIL if it asks first, or only greps the design.
2. PASS if no question it asks is already answered by the design. FAIL if it
   asks about web linking or Studio sending.
3. PASS if each question quotes the section it checked and says why that
   section doesn't answer it (gate B3).
4. PASS if, after the pushback, it re-reads the section and answers from it
   without a reworded question (gate B4).
5. PASS if it treats the `/link` route as pending removal per the design, not as
   current product behaviour (gate B2).

Baseline to compare: the same setup with a plain handoff ("read these files",
no table). The real session failed 1, 2 and 4 on that baseline.
