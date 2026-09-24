# Changelog

All notable changes to **gaxia-skills** are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/), and the project
aims to follow [Semantic Versioning](https://semver.org/).

## [0.11.1] — 2026-09-24

### Fixed
- **web-companion: server no longer exits on Windows reserved ports.** The
  first-boot port was picked at random from a range where Windows reserves
  blocks (Hyper-V, WinNAT); binding one failed with `EACCES`, which was not
  retried, so the launcher reported "server did not start" at random. First
  boot now lets the OS pick the port, `EACCES` falls back like `EADDRINUSE`,
  and a failed start prints the server's own error. The smoke test gains a
  Windows check on a real reserved port.
- **benchmarking-skills: runners write deliverables for real.** When the
  orchestrator says to simulate actions (shutdown, push, deploy), that covers
  only the named actions: every file the skill must produce is written and
  placed in the run's output dir, and runners check the Decision Log,
  transcript, and deliverables exist before reporting. Previously runners
  could describe a required report instead of writing it and be scored down
  for a harness gap.

## [0.11.0] — 2026-09-24

### Added
- **cut-release (new skill).** Publishes a version so the manifests, the
  changelog entry, and the tag all describe the same verified commit. Asks
  before pushing tags or publishing, never moves a published tag, and hands
  the user exact commands when the host cannot push tags.
- **CI.** Repo consistency checks (`scripts/check_repo.py`), Python tests,
  and the web-companion smoke test on Ubuntu, Windows, and macOS.

## [0.10.0] — 2026-09-23

### Added
- **web-companion (new skill).** Interactive browser screen for visual
  choices, lesson pages, and mockups: one URL, auto-reload on push, clicks
  back as JSON lines. `companion.submit()` collects quiz answers and form
  input on the page (radio/checkbox/text/select) so the chat reply stays a
  wake-up nudge; whole flows batch into one screen. Node-only launcher for
  any OS (`start-companion.cjs`, with a PowerShell wrapper) that reuses a
  live server, restarts a dead one on the same URL, and stops cleanly.
  Vendored offline theme served at `/theme/` (Bootstrap v5.3.8 dark + Prism
  v1.30.0, both MIT, notices in `theme/THIRD_PARTY_NOTICES.md`) and a Node
  smoke test (22 checks).
- **pick-skill (new skill).** Picks one owner when the user asks which skill
  fits or several installed skills overlap; declares skill-less work instead
  of forcing a pick. `start-work` stays the default router.
- **lessons-capture (new skill).** Turns failed attempts and novel fixes into
  one durable rule each — a user-approved Pitfalls patch for skills the user
  maintains, host memory otherwise (never edits installed plugin copies).
- **stand-up-server-agent (new skill).** Stands up or recovers a persistent
  self-hosted AI assistant on a server: snapshot-gated restore or fresh
  install, storage rescue, and lifelines, with explicit approval before
  external effects.

### Changed
- **lemme-teach-you: on-page answers, images, checklist toggle, 4 styles.**
  Outcomes-first outline with a visible checklist and a batched prerequisite
  check; practical mode asks who drives and teaches one step at a time. When
  `web-companion` can run, checks, confirms, and quizzes live on the page;
  lesson screens carry an inline-SVG diagram wherever one clarifies and a
  collapsible checklist toggle; style cards are always 4 (Explainer, Slides,
  Cheat-sheet, Agent-designed), all on the vendored theme.

### Notes
- Version bumped across `.claude-plugin/plugin.json`,
  `.claude-plugin/marketplace.json`, and `.codex-plugin/plugin.json`.

## [0.9.0] — 2026-07-18

### Changed
- **think-first: context-based triggering.** Rewrote the description from
  keyword-matching to a context-based trigger — the skill now fires on any
  coding task (implementation, fix, refactor, edit), including implicit ones
  (bug reports, performance issues, feature requests) that don't say "fix" or
  "implement". Caution phrases ("ทำให้หน่อย", "อย่าทำมั่ว", "อย่าแก้มั่ว",
  "don't mess it up", "be careful") now only fire when paired with a coding
  task — they no longer trigger on read-only work (review, explanation,
  analysis, translation). Rule 1 heading renamed "คิดก่อนเขียน" →
  "ระบุ assumption ก่อนแตะโค้ด" to drop an unnatural keyword.

### Notes
- Benchmarked before ship (think-first-benchmark/iteration-1): with_skill A/5.0
  vs baseline F/0.33; triggering accuracy 9/9 (1.0), up from 6/9 (0.667) on the
  pre-fix description. workflow_adherence, robustness, output_quality all 5.0.

## [0.8.1] — 2026-07-17

### Fixed
- **ship-it-and-shutdown: shutdown now always happens, no exception.** Reverted
  the 0.8.0 (portable-adapter) softening that had made power-down
  optional/host-gated, and removed the remaining Rail A "broken precondition"
  escape clause. The resume-ready report is the safety net; the Rail C risk gate
  (safe → merge, risky → park, never auto-apply) is what keeps an unconditional
  shutdown safe.
- **README: restored the Credits section** with source-repo links that the
  0.8.0 provider-neutral rewrite had dropped.

### Notes
- Content-only patch; skill set is unchanged (7 skills). Version bumped across
  `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, and
  `.codex-plugin/plugin.json`.

## [0.8.0]

### Added
- Portable agent skill adapters (`adapters/`, `.codex-plugin/`); README and all
  SKILL.md rewritten provider-neutral so the skills run under Claude Code and
  Codex.

## [0.7.0]

### Added
- `think-first` skill (pre-coding discipline filter).

### Changed
- Renamed `goodnight` → `ship-it-and-shutdown`.

## [0.5.0]

### Added
- `ship-it-and-shutdown` (originally `goodnight`): unattended overnight mode —
  finish → verify → hybrid-merge → report → conditional shutdown.

## [0.4.0]

### Added / Changed
- `dont-burn-my-tokens` context-guard hook.
- `lemme-teach-you` practical (8-step) mode.

## [0.3.0]

### Added
- `dont-burn-my-tokens` economy mode.

## [0.2.0]

### Added
- `lemme-teach-you` tutor skill.

## [0.1.0]

### Added
- Initial repo scaffold: manifests, MIT license, and the first workflow skills
  (`start-work`, `benchmarking-skills`, `creating-workflow-skills`).

[0.11.1]: https://github.com/Gaxia-XP/gaxia-skills/releases
[0.11.0]: https://github.com/Gaxia-XP/gaxia-skills/releases
[0.10.0]: https://github.com/Gaxia-XP/gaxia-skills/releases
[0.9.0]: https://github.com/Gaxia-XP/gaxia-skills/releases
[0.8.1]: https://github.com/Gaxia-XP/gaxia-skills/releases
[0.8.0]: https://github.com/Gaxia-XP/gaxia-skills/releases
