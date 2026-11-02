---
name: handoff-read-map
description: Use when ending a session and handing the work to a fresh agent ("ทำ handoff", "เขียน handoff ให้ session ใหม่", "hand this off", /handoff-read-map), or when starting from a handoff document someone else wrote. Writes a handoff whose core is a Read-before-acting map (before you do X, read file + section Y, because Z), and makes the receiving agent follow that map instead of re-deriving the product from code.
argument-hint: "What will the next session be used for?"
---

# Handoff with a read-before-acting map

A plain handoff says "read these files". The receiver then reads the short ones,
greps the long ones, and rebuilds the product from code that is only half built.
That is how an agent ends up asking the owner a question the approved design
already answers. This skill ties each **action** to the **exact section** that
governs it, and gives the receiver gates that stop it before it acts unread.

Two parts: **A. Writing** the handoff (the sending agent), **B. Receiving** it
(the next agent). Each gate is pass/fail. A failed gate stops the step.

## A. Writing the handoff

### A1. Gather (no writing yet)
1. List every artifact the work stands on: design docs, plans, deploy notes,
   ledgers, PRs, branches, memory files. Give the path or URL of each.
2. For each design doc, find its **who-does-what summary**: a short section that
   says which part (site, plugin, server, user…) owns each decision. If none
   exists, write one into the design itself (with the owner's OK when the doc is
   approved) or into the handoff, marked as your reading, not the owner's.
3. List the owner's newest words that override the documents (date them).

**Gate A1:** every artifact has a path; a who-does-what summary exists or is
written; owner overrides are listed with dates. Fail → finish gathering.

### A2. Write the document
Save it to the OS temp directory, not the workspace (`$TMPDIR`, `%TEMP%`).
Reference artifacts by path; never copy their content. Redact secrets and
personal data. Sections, in this order:

1. **State**: branch, HEAD, pushed or not, PR, deployed or not, test result
   with its date.
2. **Read before acting**: the table below. One row per action the next
   session may take. The section must be named (heading or §number), never just
   the file.

   | Before you… | Read (file → section) | Why |
   |---|---|---|
   | ask the owner how the product behaves | design → who-does-what summary, then the section on that feature | the answer is usually written down |
   | change behaviour in code | design → the feature's section + owner overrides | code may still carry doors the design removes later |
   | deploy / migrate / roll back | deploy note → whole file; ops skill | gates and order |
   | change user-facing words | texts file + the approved-wordings list | wordings need the owner's OK |

   Fill in real paths and add rows for this work; delete rows that don't apply.
3. **Owner overrides**: dated, quoted short, newest first. They beat the docs.
4. **Next steps**: numbered; mark each one that needs the owner's word.
5. **Gotchas**: environment traps (credentials, line endings, flaky tests).
6. **Suggested skills**: which to invoke and when.
7. **Receiver rules**: copy part B's gates B1–B4 in full, so the receiver has
   them even without this skill.

If the user passed arguments, they describe the next session's focus: order
the table and the next steps for that focus.

**Gate A2:** every table row names a section, not just a file; the
who-does-what pointer is row 1; receiver rules are included; no artifact
content is duplicated; no secrets. Fail → fix the document.

### A3. Self-test
Pick the two most likely questions the next session would ask the owner. For
each, find its answer through the table alone. If the table doesn't lead to
it, add the row.

**Gate A3:** both questions are answered through the table. Then report the
handoff's path to the user.

## B. Receiving a handoff

**B1. Read the map first.** Before any tool call that changes something,
read every section in the "Read before acting" rows that your first step needs:
the whole section, not grep hits. Read the who-does-what summary first.
Gate: you can name, for your first step, the section that governs it.

**B2. Design wins over half-built code.** When code and the design (plus the
owner's dated overrides) disagree, the design is the target. Code in an
unfinished plan still carries routes, columns and refusals that later plans
remove. Gate: before you call a code path "how it works", check it against the
design section for that feature.

**B3. Ask only what the documents don't answer.** Before asking the owner a
product question, quote the section you checked and say why it doesn't answer.
Gate: no question goes out without that quote.

**B4. Re-read on pushback.** When the owner corrects you or asks why you didn't
know, stop. Re-read the governing section in full before your next reply, and
don't send a reworded version of the same question. Gate: your reply cites what
the section says.

## Common mistakes

| Mistake | Fix |
|---|---|
| "Read docs/design.md" with no section | Name the heading or § for each action |
| Reading the short deploy note and grepping the long design | B1: read the whole governing section |
| Reasoning from routes in code ("there is a /link route, so the web links") | B2: check the design; the route may be slated for removal |
| Asking the owner a reworded question after a correction | B4: re-read first |
| Copying the plan into the handoff | Reference it by path |

A pressure scenario for testing this skill (with `benchmarking-skills`) is in
`references/test-scenario.md`.
