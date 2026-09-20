---
name: stand-up-server-agent
description: Use when setting up an AI agent that runs on a server (VPS, Railway, Render, or any container host). Use for fresh installs, backup restores, storage rescues, and wiring the server agent to external services.
---

# Stand Up Server Agent

Bring a server-hosted agent from zero to operational. Verify each step from
inside the machine before moving on. Never print secret values in chat —
names, lengths, and prefixes only.

## Rules

1. Ephemeral versus persistent first. Know what survives a restart
   (`/data` volume) and what does not (`/tmp`, installed packages,
   background processes, sockets). Redo all durable work under the
   persistent path; after any restart assume the ephemeral side is empty
   and reinstall before debugging.
2. Safety snapshot before surgery. Confirm a rollback backup exists before
   overwriting anything (a web restore auto-creates one — verify it).
3. One gate at a time. No step starts until the previous step's check passes
   with evidence. If a gate fails twice, stop and escalate.
4. Verify by effect, not by success message. Schedulers, installers, and
   CLIs report success for operations that did nothing — check the artifact.

## Step 1 — Inventory the machine

List the home directory, credential names only, backups, memory files, and
disk usage. High-value targets: prior export bundles (per-OS `.env` files
are the first place workspace keys hide), safety snapshots, `USER.md`,
and the sessions database.

**Exit:** you can state free disk, credential names present, and whether a
rollback snapshot exists.

## Step 2 — Restore identity and secrets

Apply the backup (memory, skills, config). Confirm the speaker by matching
their platform user ID against the allow-list, not by display name. Test
each third-party key with a read-only call and record which services answer.

**Exit:** model, messaging channel, and at least one external service
verified working.

## Step 3 — Storage and lifelines

If disk is critical, reserve credentials (kilobytes) before deleting bulk
(sessions, duplicate bundles) — and only delete bulk the user confirms
exists elsewhere. Install a tailnet client in userspace mode with a SOCKS
proxy when TUN is unavailable, and write a one-command restart script for
post-restart recovery.

**Exit:** free space above 30%, tailnet reachable, restart script tested.

## Robustness

- **Shell is ground truth for secrets.** Keys that pass through layered
  tool calls can arrive truncated and fail auth exactly like revoked keys.
  Extract and use them in-shell, unset after use.
- **Prefer simple HTTP through the proxy over HTTPS to tailnet peers.**
  Large TLS handshakes can stall on constrained paths while plain HTTP
  sails through; escalate to TLS only when the channel demands it.
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
