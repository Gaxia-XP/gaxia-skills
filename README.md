# gaxia-skills

A skill-builder's toolkit for Claude Code: **author → ship → validate** your own workflow skills — plus an on-demand tutor to learn anything and a token-economy mode to work cheaply.

| Skill | What it does |
|---|---|
| `creating-workflow-skills` | How to author an orchestrator skill — the robustness rails agents reliably miss. |
| `start-work` | A workflow router: clarify the goal, pick one route (feature / bug / mechanical / unclear), then drive each sub-skill in order. |
| `benchmarking-skills` | A 6-phase benchmark that scores a skill on real runs (with/without baseline) and emits a scorecard + tuning report. |
| `lemme-teach-you` | An on-demand tutor: picks conceptual vs hands-on mode, verifies the facts, teaches a tailored lesson, quizzes you interactively, then points you at real practice. |
| `dont-burn-my-tokens` | A token-economy mode: delegate heavy work to cheap subagents, keep context lean, warn before context gets large (`/compact` or handoff), and stay concise. |
| `ship-it-and-shutdown` | An unattended / overnight mode: finish the job to the given scope, merge what's safe (risky changes — migrations, secrets, deps, infra — parked as a PR, never auto-applied), write a comprehensive resume-ready report, then power the machine off. The report is the safety net, so it shuts down whether or not everything passed. |
| `think-first` | Apply four discipline rules before any coding task to prevent common LLM mistakes: think before touching code (ask if unsure), write minimum code, touch only what was asked, and define verifiable goals. Includes a rationalization table to catch yourself before breaking the rules. |

## Install

```
/plugin marketplace add Gaxia-XP/gaxia-skills
/plugin install gaxia-skills@gaxia-skills
```

Then invoke: `gaxia-skills:start-work`, `gaxia-skills:benchmarking-skills`, `gaxia-skills:creating-workflow-skills`, `gaxia-skills:lemme-teach-you`, `gaxia-skills:dont-burn-my-tokens`, `gaxia-skills:ship-it-and-shutdown`, `gaxia-skills:think-first`.

## Prerequisites

`start-work` and `creating-workflow-skills` orchestrate skills from other packs. Install these first:

| Pack | Provides | Source |
|---|---|---|
| superpowers | brainstorming, writing-plans, executing-plans, writing-skills | github.com/obra/superpowers |
| 9arm-skills | debug-mantra, scrutinize, post-mortem | github.com/thananon/9arm-skills |
| mattpocock-skills | grill-with-docs, grill-me, diagnose, prototype, handoff | github.com/mattpocock/skills |
| feature-dev | feature-dev | github.com/anthropics/claude-plugins-public (/plugins/feature-dev) |

If a required skill is missing, `start-work` stops and tells you which one — it never silently does the step itself.

## Credits

This toolkit stands on the shoulders of these packs — thank you:

- [superpowers](https://github.com/obra/superpowers) — Jesse Vincent / obra (MIT)
- [mattpocock-skills](https://github.com/mattpocock/skills) — Matt Pocock (MIT)
- [9arm-skills](https://github.com/thananon/9arm-skills) — thananon (9arm)
- [feature-dev](https://github.com/anthropics/claude-plugins-public/tree/main/plugins/feature-dev) — Anthropic, `@claude-plugins-official` (Apache-2.0)

## Quickstart per skill

- **start-work** — say what you want done; it asks one batched clarifying question, announces a route, and drives the chain.
- **benchmarking-skills** — point it at a target `SKILL.md`; it profiles the skill, generates scenarios (you approve them), runs with/without baseline, judges with evidence, and reports a grade + tuning advice.
- **creating-workflow-skills** — read it before authoring any orchestrator skill; it gives the rails template and the common mistakes to avoid.
- **lemme-teach-you** — say "teach me X" / "สอน X หน่อย"; it pins scope + depth, picks conceptual vs hands-on mode, verifies the material, shows a lesson outline, teaches it, then offers an interactive quiz and points you at real practice. Standalone (no prerequisite packs).
- **dont-burn-my-tokens** — say "low token mode" / "ประหยัด token"; a persistent mode that delegates heavy work to cheap subagents (haiku/sonnet), keeps the main context lean, warns before context gets large (`/compact` or handoff), and stays concise. Off with "normal mode". Standalone; stack with `caveman` for max output compression.
- **ship-it-and-shutdown** — say "จะไปนอนแล้ว ฝากทำให้เสร็จ แล้วปิดคอมให้ด้วย" / "finish it overnight and shut down"; it runs the work unattended to your scope, verifies with the project's own tests/build, merges safe diffs (risky ones — migrations, secrets, deps, infra — parked as a PR, never auto-applied), writes a comprehensive `OVERNIGHT_REPORT.md` (what's done, what failed, exact next steps, recommended skills to continue), then powers the machine off — **the report is the safety net, so it shuts down pass or fail**. Standalone; can hand the doing to `start-work`.
- **think-first** — say "คิดก่อน" / "ช้าๆ" / "ไม่ต้องรีบ" / "measure twice" / "slow down" / `/think-first`; read the four discipline rules before starting any coding task to avoid common LLM mistakes (guessing silently, over-engineering, scope creep, vague goals). Includes a rationalization table showing the exact phrases that signal you're about to break a rule. Not a workflow — read it as a filter, then apply each rule to whatever you're doing. Standalone.

## License

MIT © 2026 Gaxia-XP
