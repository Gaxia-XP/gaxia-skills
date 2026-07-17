# Changelog

All notable changes to **gaxia-skills** are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/), and the project
aims to follow [Semantic Versioning](https://semver.org/).

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

[0.8.1]: https://github.com/Gaxia-XP/gaxia-skills/releases
[0.8.0]: https://github.com/Gaxia-XP/gaxia-skills/releases
