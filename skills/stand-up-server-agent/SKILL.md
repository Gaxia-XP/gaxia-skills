---
name: stand-up-server-agent
description: Use when standing up or recovering a persistent, self-hosted AI assistant on a server or container host (VPS, Railway, Render) — one that keeps memory files, a messaging channel, and an allow-list of users. Use for fresh installs, restores from a backup or export bundle, storage rescues, and wiring the agent to external services. Not for deploying a stateless app, API, or bot without persistent memory.
---

# Stand Up Server Agent

Bring a server-hosted agent from zero to operational. Verify each step from
inside the machine before moving on. Never print secret values in chat —
names, lengths, and at most a 4-character prefix only.

File and feature names below (`/data`, `USER.md`, the sessions database, a
web restore) are examples from one agent layout. Resolve the real ones from
the agent's own docs before acting; do not assume they exist.

## Rules

1. Ephemeral versus persistent first. Know what survives a restart
   (e.g. a `/data` volume) and what does not (`/tmp`, installed packages,
   background processes, sockets). Redo all durable work under the
   persistent path; after any restart assume the ephemeral side is empty
   and reinstall before debugging.
2. Safety snapshot before surgery. A verified rollback backup of the
   current state must exist before anything is overwritten (a web restore
   may auto-create one — verify it, don't assume it).
3. One gate at a time. No step starts until the previous step's check passes
   with evidence. If a gate fails twice, stop and escalate.
4. Verify by effect, not by success message. Schedulers, installers, and
   CLIs report success for operations that did nothing — check the artifact.
5. Ask before external effects. Installing network software (a tailnet
   client), deleting data, restoring over live state, and calling write or
   paid APIs need the user's explicit go-ahead. Read-only checks do not.

## Step 1 — Inventory the machine

List the home directory, credential names only, backups, memory files, and
disk usage. High-value targets: prior export bundles (per-OS `.env` files
are the first place workspace keys hide), safety snapshots, memory files
such as `USER.md`, and the sessions database.

**Exit:** you can state free disk and credential names present, and either
a verified rollback snapshot of the current state exists (create one now if
missing — Rule 2) or the machine is fresh with nothing to lose.

## Step 2 — Restore or install identity and secrets

- **Restore:** apply the backup (memory, skills, config) over the
  snapshotted state.
- **Fresh install:** install the agent per its docs under the persistent
  path, then configure the model, messaging channel, and allow-list.

Either way, confirm the speaker by matching their platform user ID against
the allow-list, not by display name. Test each third-party key with a
read-only call and record which services answer.

**Exit:** model, messaging channel, and at least one external service
verified working.

## Step 3 — Storage and lifelines

Do only what this deployment needs:

- **Disk critical:** reserve credentials (kilobytes) before deleting bulk
  (sessions, duplicate bundles) — and only delete bulk the user confirms
  exists elsewhere.
- **Private network wanted:** with the user's approval (Rule 5), install a
  tailnet client in userspace mode with a SOCKS proxy when TUN is
  unavailable.
- **Always:** write a one-command restart script for post-restart recovery.

**Exit:** disk usage below ~70% (or the user accepted the current level),
every lifeline the user asked for is reachable, and the restart script has
been run once successfully.

## Robustness

- **Shell is ground truth for secrets.** Keys that pass through layered
  tool calls can arrive truncated and fail auth exactly like revoked keys.
  Extract and use them in-shell, unset after use.
- **Plain HTTP only inside the tailnet.** Tailnet traffic is already
  encrypted (WireGuard), so between tailnet peers plain HTTP through the
  tailnet proxy may replace a TLS handshake that stalls on a constrained
  path. Never downgrade to HTTP outside the tailnet, and never send secrets
  over plain HTTP on a public path.
- **Silent download stalls.** A folder sync quiet for 10+ minutes is stuck
  (usually one large file or a permission wall). Kill it, rerun unbuffered
  so per-file progress is visible, and prioritize small high-value paths.
- **Private DNS plus port state is the diagnosis.** A sibling name that
  resolves with all ports refused is a stopped service, not a network
  problem. A platform dashboard saying Online while no port answers is a
  crashed process, usually missing env vars. Never brute-force names —
  only probe names found in the user's own data.
- **Logs of other services are not reachable without their platform
  token.** Say so after one check instead of repeating unreachable
  attempts, and state exactly which token unblocks it.
