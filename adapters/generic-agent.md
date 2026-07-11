# Generic Agent Adapter

Use this adapter with any agent that can receive Markdown instructions but has
no native skill or plugin loader.

1. Select one directory under `skills/` that fits the task.
2. Give the agent that directory's `SKILL.md` before it starts work.
3. Load only the references or scripts named by that skill when needed.
4. Resolve workflow capabilities using [capabilities.md](capabilities.md).
5. Preserve every exit condition and report unavailable capabilities instead of
   pretending a native tool exists.

Treat `SKILL.md` as task-scoped operating instructions, not as a replacement
for the host's safety policy. The host and user still control credentials,
external actions, model selection, and destructive commands.
