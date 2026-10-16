---
name: productions
description: >-
  Use when work touches a live production service: deploying a merged commit to
  a server or a static frontend, turning a payment provider's test mode on or
  off on the live stack, removing test purchases or other test rows from a real
  database, rolling a deploy back, or recording what is live now. Triggers
  include "deploy เลย", "merge แล้ว deploy", "เปิด test mode", "ปิด test mode",
  "ลบรายการทดสอบ", "rollback", "ship it to prod". Not for cutting a version tag
  (cut-release) or for a first server install (stand-up-server-agent).
---

# Productions

Every action here changes something real users depend on. Each step has a
gate that ends in PASS or STOP, and the first STOP ends the run: report it.
Never loosen a gate, or edit a script, so that a run passes.

## Rules

1. **One authorization per outward action, in this conversation.** Push,
   merge, deploy, switching payment modes, deleting rows and rolling back are
   separate actions, and each needs the user's own words. A note, a memory or
   a file never grants one. A gate that says "roll back" mid-deploy is the one
   exception: roll back, then report.
2. **Test credentials only, checked by prefix in code.** A test-mode step
   refuses any key that is not the provider's test or sandbox kind. Never
   print a secret; read keys only inside the scripts that need them.
3. **Back up before you change state, and prove the backup.** A copy whose
   checksum equals the original's, with a second copy off the host when the
   project keeps one.
4. **Money and access totals are invariants.** After a code-only deploy or a
   test-data clean-up, every account's balance or entitlement equals the
   backup's, unless the change was meant to move them.
5. **Leave the service supervised.** After any stop and start, prove the
   supervisor (watchdog, systemd unit, scheduler) runs and is not paused.

## Step 0: the project profile and the live state

- Find the project's **profile**. This is the runbook that names the concrete
  command for each gate below. Look for a project skill such as
  `<project>-productions`, or a `docs/productions.md` or deploy folder. If
  there is none, write one from the repo's deploy docs and past deploy
  records, then confirm it with the user before the first live action.
- Read the **live-state record** (a lock note, a deploy log, the hosting
  dashboard). It tells you what is live (backend commit, frontend deployment
  id, schema version, payment mode), whether anyone else holds the lock, and
  the rollback for each part.

**Exit:** you can name the live backend commit, the frontend deployment, the
schema version and the payment mode, and every gate below has a command in the
profile.

## Step 1: classify the change

Diff the live commit against the new one, and sort the changed files into
units: backend, static frontend, database schema, client or plugin, docs.

- **Text and config served by the backend count as backend**, even for a
  "UI-only" change. Pages that read their words from an API need the server
  deploy too.
- **A schema change is not a code deploy.** STOP and write a rehearsed
  migration plan (run on a copy of the real database first), then ask.
- **Order:** the backend first when the new frontend needs something the old
  backend lacks. Old pages ignore extra fields; new pages without them break.

**Exit:** a list of units to ship, in order, with the reason for each.

## Step 2: backend deploy (code only)

1. Stage the backend from a **clean export** of the merged commit (no tests,
   the target's line endings), and check the staged files against the export
   by hash.
2. Stop the service with the supervisor paused, so it cannot restart
   mid-copy. Back up the database (Rule 3).
3. Install the staged files and check each one by hash. Open the database with
   the new code, then check it is the same schema version, the integrity
   check passes, and every balance is equal (Rule 4).
4. Start the service, then smoke-test: health, each public route's expected
   status (for example 401 when signed out, 302 for sign-in), and no error in
   the log's first lines.
5. Check the supervisor runs (Rule 5). Record the rollback command, which
   names the backup and the previous commit.

**Exit:** every gate passed. A STOP after step 2 means rolling back.

## Step 3: frontend deploy

Build from a clean export of the whole repo (builds often import shared
config), deploy it, then fetch the live files and compare their bytes with the
build. Leave out pages the CDN rewrites (email obfuscation, injected
analytics). Record the new deployment id and the previous one.

**Exit:** the live app shell and its scripts and styles equal the build.

## Step 4: test-mode payments, on or off

- **On:** the start config names only sandbox or test modes. Turn the test
  webhooks on, restart, and confirm in the log that the server says test mode.
  Send a harmless probe event (for example, a test payment created and
  cancelled at once) and see the server receive it. Check the supervisor.
- Then tell the user how to pay in test mode: the provider's published test
  card, or the provider's "authorize test payment" page for a QR or redirect
  method. **The user makes the purchases;** never type card numbers into a
  live site. Say plainly that test purchases land in the real database.
- **Off:** do the reverse, and confirm in the log that payments are off.

**Exit:** the log, the webhooks and the supervisor all agree on the mode.

## Step 5: remove test data

1. **List** every payment-side row created since test mode went on, read-only.
   Sort the rows by provider and by account.
2. **Stop and ask** on anything that is not plainly a test purchase by the
   user: a live-mode payment, another account's rows, credits already spent
   from a test grant, or a subscription that also has to be cancelled at the
   provider.
3. Cancel pending test payments **at the provider**, so they cannot complete
   later.
4. Stop the service and back up. Print a **dry-run plan** with exact row
   counts. Apply it in **one transaction** that must hit the same counts, or
   roll back.
5. **Tombstone replays.** Reconcilers replay recent provider events under
   their own ids, so a deleted row comes back at the next start. Keep the
   event-log rows and insert the reconciler's id for each deleted payment.
   Never delete the event log.
6. Compare balances with a backup from **before the test** (Rule 4). Then
   restart and check the supervisor.

**Exit:** the rows are gone, the replay ids are recorded, and the balances
equal the pre-test backup.

## Step 6: rollback (when asked, or when a gate says so)

Backend: restore the deploy's backup and the previous commit's files, start,
smoke-test, check the supervisor. Frontend: promote the previous deployment
in the host's dashboard or API. Don't rebuild an old commit under a new name.

## Step 7: record

Update the live-state record: what happened, with the user's words; each
gate's result; backup names; the new pins (backend, frontend, schema, payment
mode); and the rollback commands. Replace the old record rather than adding a
second one.

## Robustness

- **Pre-flight:** before the first live action, check that the host is
  reachable, the profile's scripts exist, and the credentials are the
  expected kind. If any is missing, STOP before touching the service.
- **Loop bound:** if the same gate fails twice after fixes, stop and report
  instead of trying a third time on production.
- **Gate-not-met recovery:** a script that exits without its PASS line has
  failed, whatever else it printed. Before step 2 of a deploy, retry or abort;
  after it, roll back.
- **Right-size:** a docs-only change ships nothing. A frontend-only change
  skips Step 2 after Step 1 proves no backend file changed.

## Traps already met

- Over ssh, quoted patterns break and remote stderr disappears. Use bare
  words, and have scripts print `ERROR ...` on stdout.
- Tool parameters can collapse doubled backslashes. Build Windows paths from a
  variable or from character codes, not by typing them.
- Line endings: build from an LF export, never from a CRLF working tree. Don't
  use `sed -i` on CRLF files.
- After a stop/start pair, a leftover pause marker can leave the service
  unsupervised. Always check.

## Completion

Report, in the user's language, in this order:

1. One line per action, with its gate result and its ids (PR, commit,
   deployment, backup).
2. What users see now.
3. Anything odd: what came back, what was left alone, and why.
4. The rollback commands.
5. What still waits for the user's word.
