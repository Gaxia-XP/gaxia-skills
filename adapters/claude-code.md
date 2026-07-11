# Claude Code Adapter

Install through the existing `.claude-plugin` marketplace metadata. The
portable core stays valid without these optional companion packs.

| Capability | Claude Code mapping when installed |
|---|---|
| `scope-interview` | `mattpocock-skills:grill-with-docs` or `mattpocock-skills:grill-me` |
| `planning` | `superpowers:writing-plans` |
| `implementation` | `feature-dev:feature-dev` or `superpowers:executing-plans` |
| `diagnosis` | `9arm-skills:debug-mantra`, then `mattpocock-skills:diagnose` when needed |
| `independent-review` | `9arm-skills:scrutinize` |
| `security-review` | `security-review` |
| `postmortem` | `9arm-skills:post-mortem` |
| `handoff` | `mattpocock-skills:handoff` |

`dont-burn-my-tokens/hooks/context_guard.py` is a Claude Code-only optional
Stop hook. Install it only after the user approves editing Claude Code user
settings. The core skill remains usable without the hook.
