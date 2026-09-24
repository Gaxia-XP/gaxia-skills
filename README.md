# gaxia-skills

Portable workflow skills for coding agents. The canonical source is the
provider-neutral Markdown in `skills/<skill-name>/SKILL.md`; platform adapters
only describe discovery, invocation, and optional host features.

This is not a claim that every AI product has the same plugin API. Any agent
that can load Markdown instructions can use the core skills. Claude Code and
Codex additionally have native manifests in this repository.

## Skills

| Skill | Purpose |
|---|---|
| `creating-workflow-skills` | Build ordered, gated workflow skills. |
| `start-work` | Route a coding request through the right capabilities. |
| `benchmarking-skills` | Evaluate a skill with real runs, evidence, and a baseline. |
| `lemme-teach-you` | Teach a topic through a tailored conceptual or hands-on lesson. |
| `dont-burn-my-tokens` | Reduce cost and context use without lowering verification standards. |
| `ship-it-and-shutdown` | Run an authorized unattended task, preserve a durable report, and power down only when the host permits it. |
| `think-first` | Apply discipline rules before a coding change. |
| `web-companion` | Show an interactive browser screen and read the user's clicks and answers back. |
| `pick-skill` | Choose one skill when several could own a task, or work skill-less. |
| `lessons-capture` | Turn failed attempts and novel fixes into durable, reusable rules. |
| `stand-up-server-agent` | Install or recover a persistent self-hosted AI assistant on a server. |
| `cut-release` | Publish a version: bump every manifest, write the changelog entry, tag the verified commit. |

## Compatibility

| Host | Integration |
|---|---|
| Any Markdown-capable agent | Read [adapters/generic-agent.md](adapters/generic-agent.md). |
| Claude Code | Use the existing `.claude-plugin` marketplace metadata. See [adapters/claude-code.md](adapters/claude-code.md). |
| Codex | Use `.codex-plugin/plugin.json` or expose individual directories under the Codex skills directory. See [adapters/codex.md](adapters/codex.md). |

Read [adapters/capabilities.md](adapters/capabilities.md) when a workflow refers
to a capability such as independent review or handoff. A capability may be a
native tool, installed skill, subagent role, or documented host procedure.

## Design Rules

- Keep `skills/*/SKILL.md` provider-neutral.
- Put host-only behavior in `adapters/` or the relevant platform manifest.
- Do not claim an unavailable capability. State the limitation and preserve the gate.
- Require explicit user authorization for external effects, merges, credentials, or shutdown.
- Load references only when the selected skill calls for them.

## Claude Code Install

```text
/plugin marketplace add Gaxia-XP/gaxia-skills
/plugin install gaxia-skills@gaxia-skills
```

The Claude Code adapter retains the existing mappings to optional companion
skill packs. They are not required by the portable core.

## Credits

`start-work` and `creating-workflow-skills` orchestrate capabilities from these packs — thank you:

- [superpowers](https://github.com/obra/superpowers) — Jesse Vincent / obra (MIT)
- [mattpocock-skills](https://github.com/mattpocock/skills) — Matt Pocock (MIT)
- [9arm-skills](https://github.com/thananon/9arm-skills) — thananon (9arm)
- [feature-dev](https://github.com/anthropics/claude-plugins-public/tree/main/plugins/feature-dev) — Anthropic, `@claude-plugins-official` (Apache-2.0)

## License

MIT © 2026 Gaxia-XP
