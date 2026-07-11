# Codex Adapter

The repository includes `.codex-plugin/plugin.json` for Codex plugin discovery.
For direct local use, expose a selected `skills/<skill-name>` directory under
the Codex skills directory and let Codex load its `SKILL.md`.

Use Codex's available terminal, editor, planning, and delegated-agent features
to satisfy the capability contract. Do not assume a particular subagent model,
plugin pack, lifecycle hook, or automatic approval exists in every Codex host.

For economy mode, prefer targeted reads and narrow searches. Delegate only when
the host permits it and the context savings exceed the coordination cost.

For unattended work, do not merge, send external messages, or shut down a
machine unless the user explicitly authorized that exact effect and the current
host exposes a safe way to perform it.
