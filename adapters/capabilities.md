# Capability Contract

Portable workflows use capability names rather than a provider's plugin names.
Resolve a capability in this order:

1. A named host skill or tool that explicitly provides it.
2. A scoped subagent role, when the host supports subagents.
3. A documented inline procedure, with its evidence recorded.
4. Stop and report the missing capability when none of the above is safe.

| Capability | Required outcome |
|---|---|
| `scope-interview` | Scope, non-goals, and acceptance criteria are explicit. |
| `planning` | A sequenced implementation plan exists. |
| `implementation` | The requested change is made and verified. |
| `diagnosis` | A failure is reproduced and its cause is evidenced. |
| `independent-review` | A separate review pass examines the actual diff. |
| `security-review` | Sensitive changes receive a focused risk review. |
| `postmortem` | Cause, fix, and recurrence prevention are recorded. |
| `handoff` | A durable resume artifact explains the current state. |
| `benchmark-runner` | A real skill run produces a transcript and decision record. |
| `benchmark-judge` | Evidence is scored against an explicit rubric. |

Do not silently replace a missing specialized capability with a weaker one.
When an inline fallback is allowed, say so and record the evidence that meets
the original gate.
