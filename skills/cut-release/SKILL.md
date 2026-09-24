---
name: cut-release
description: >-
  Use when the user wants to publish a new version of a repository: "ออก
  release", "ทำ tag v1.2.0", "cut a release", "bump the version", "ship
  v0.11", or /cut-release. Covers libraries, apps, and plugin/skill repos whose
  version lives in one or more manifest files. Not for deploying a service to
  production or for merging a feature branch.
---

# Cut Release

A release is a promise that one commit, one version number, one changelog
entry, and one tag all describe the same thing. Most broken releases are a
drift between those four: a manifest left on the old version, a tag on the
wrong commit, a changelog that says "Unreleased". Drive the steps in order;
each exit condition must hold before the next step starts.

## Rules

1. **One version everywhere.** Every file that declares the project version
   moves together. A release with two version numbers in the tree is broken.
2. **Tag what was verified.** The tag points at the exact commit whose checks
   passed on the default branch — never at a local commit that was not pushed
   or a branch that was not merged.
3. **Ask before outward effects.** Pushing a tag, publishing a GitHub/GitLab
   release, or uploading to a package registry needs the user's explicit
   go-ahead in this conversation. A request to "cut a release" covers the
   tag and release page; publishing to a registry must be named.
4. **Never move or delete a published tag.** If a tag is wrong, release the
   next patch version instead. Retagging breaks everyone who already fetched it.
5. **Pressure changes depth, not steps.** "Just tag it" still gets the version
   check and the changelog entry, only shorter.

## Step 1 — Establish the state

- Fetch the remote. Confirm you are on the default branch, it is up to date,
  and the working tree is clean.
- Find every version source: plugin/app manifests, `package.json`,
  `pyproject.toml`, `Cargo.toml`, `version.py`, marketplace metadata, README
  badges. Search the tree for the current version string to catch stragglers.
- List existing tags and the last release, and the commits since it.
- Read the repo's contributing notes or previous release commits for its
  conventions (tag prefix `v`, commit message style, who bumps what).

**Exit:** you can state the current version, every file that carries it, the
last tag (or "none"), and whether CI is green on the default branch head.

## Step 2 — Choose the version

Apply the project's scheme (default SemVer): breaking change → major (minor
while below 1.0), new feature or new skill → minor, fixes only → patch.
State the choice and the reason in one line. If the user named a version,
use it unless it would go backwards or reuse an existing tag — then say so
and propose the next valid one.

**Exit:** one new version, not already a tag, higher than the last.

## Step 3 — Prepare the release commit

- Bump every version source found in Step 1, and nothing else.
- Turn the changelog's `Unreleased` section into `[X.Y.Z] — YYYY-MM-DD`,
  or write the entry from the commits since the last tag. Group as Added /
  Changed / Fixed / Removed; describe user-visible effects, not file edits.
  Add the link reference if the file keeps them.
- Run the repo's own checks (tests, lint, consistency scripts).
- Land it the way the repo lands changes: a PR merged after green CI, or a
  direct commit where the repo allows it.

**Exit:** the release commit is on the default branch, CI is green on it, and
a search for the old version string finds only history (changelog, old
tags), not live manifests.

## Step 4 — Tag and publish

- Create an annotated tag on the verified default-branch commit:
  `git tag -a vX.Y.Z <sha> -m "<name> vX.Y.Z"`.
- With approval (Rule 3), push only that tag: `git push origin vX.Y.Z`.
- Create the release page from the changelog section when the host has a
  tool for it; publish to a registry only if the user named it.

**Exit:** the remote lists the tag at the verified sha, and the release page
(if made) shows the changelog section.

## Robustness

- **Pre-flight:** if the remote, the default branch, or CI status cannot be
  read, say which one and stop before Step 3 — do not release blind.
- **Tag push refused** (permissions, a sandbox that only allows branch pushes,
  a dropped connection that retries cannot fix): do not retag or work around
  it. Keep the local tag, and hand the user the exact commands for their own
  machine plus the release-page fields (tag, target sha, title, notes). The
  release is incomplete until they confirm the tag exists on the remote.
- **Loop bound:** if the release commit's CI fails twice, stop and report the
  failure instead of pushing more fix-ups under the release banner.
- **Right-size:** if the version is already bumped and merged (for example,
  by a previous PR), skip to Step 4 after confirming the exit of Step 3.

## Completion

Report the version, the tagged sha, the files bumped, the changelog heading,
the CI run that verified it, and anything left for the user (a tag they must
push, a registry upload they have not approved).
