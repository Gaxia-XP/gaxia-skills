# gaxia-skills

A skill-builder's toolkit for Claude Code: **author → ship → validate** your own workflow skills — plus an on-demand tutor to learn anything.

| Skill | What it does |
|---|---|
| `creating-workflow-skills` | How to author an orchestrator skill — the robustness rails agents reliably miss. |
| `start-work` | A workflow router: clarify the goal, pick one route (feature / bug / mechanical / unclear), then drive each sub-skill in order. |
| `benchmarking-skills` | A 6-phase benchmark that scores a skill on real runs (with/without baseline) and emits a scorecard + tuning report. |
| `lemme-teach-you` | An on-demand tutor: clarifies what you want to learn, verifies the facts, sequences a lesson, then teaches it in the delivery style you pick. |

## Install

```
/plugin marketplace add Gaxia-XP/gaxia-skills
/plugin install gaxia-skills@gaxia-skills
```

Then invoke: `gaxia-skills:start-work`, `gaxia-skills:benchmarking-skills`, `gaxia-skills:creating-workflow-skills`, `gaxia-skills:lemme-teach-you`.

## Prerequisites

`start-work` and `creating-workflow-skills` orchestrate skills from other packs. Install these first:

| Pack | Provides | Source |
|---|---|---|
| superpowers | brainstorming, writing-plans, executing-plans, writing-skills | github.com/obra/superpowers |
| 9arm-skills | debug-mantra, scrutinize, post-mortem | its public repo |
| mattpocock-skills | grill-with-docs, grill-me, diagnose, prototype, handoff | its public repo |
| feature-dev | feature-dev | @claude-plugins-official |

If a required skill is missing, `start-work` stops and tells you which one — it never silently does the step itself.

## Credits

This toolkit stands on the shoulders of these packs — thank you:

- [superpowers](https://github.com/obra/superpowers) — Jesse Vincent / obra (MIT)
- mattpocock-skills — Matt Pocock (MIT)
- 9arm-skills
- feature-dev — Anthropic, `@claude-plugins-official` (Apache-2.0)

## Quickstart per skill

- **start-work** — say what you want done; it asks one batched clarifying question, announces a route, and drives the chain.
- **benchmarking-skills** — point it at a target `SKILL.md`; it profiles the skill, generates scenarios (you approve them), runs with/without baseline, judges with evidence, and reports a grade + tuning advice.
- **creating-workflow-skills** — read it before authoring any orchestrator skill; it gives the rails template and the common mistakes to avoid.
- **lemme-teach-you** — say "teach me X" / "สอน X หน่อย"; it pins scope + depth, verifies the material, shows a lesson outline, lets you pick a delivery style, then teaches and recaps with encouragement. Standalone (no prerequisite packs).

## License

MIT © 2026 Gaxia-XP
