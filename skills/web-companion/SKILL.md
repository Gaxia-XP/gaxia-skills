---
name: web-companion
description: Use when any skill or task needs an interactive browser screen the user can see and click — picking from visual options, reviewing mockups or lesson pages, or any choice better made by seeing than reading. Needs Node.js and a local browser. Not for text-only questions or headless setups with no browser.
---

# Web Companion

## Overview
One URL serves an agent-written HTML screen to the user's browser. Every new screen auto-reloads their tab, and their clicks come back as JSON lines the agent reads on its next turn. Answers and text input are collected on the page itself (`companion.submit`); the chat reply is only the nudge that wakes the agent — the agent cannot wake on a click alone, so always end a screen with a one-word chat nudge shown on the page.

## When to Use
- The choice is visual: layouts, styles, mockups, diagrams, lesson pages
- Seeing beats reading: side-by-side comparisons, look-and-feel questions
- You need structured picks (`choice` values), not free text
- Collecting answers or text on the page: quiz responses, forms, confirmations — the user answers there, never retypes in chat

When NOT to use: text-only Q&A (use the terminal), conceptual tradeoffs, environments with no browser (remote SSH, CI), or hosts without Node.js on PATH.

## Quick Reference
| Step | Action |
|---|---|
| 1. Start | `node scripts/start-companion.cjs --session-dir <dir>` → prints the server-info JSON with the URL |
| 2. Push screen | Write a new `.html` file in `content/` (semantic name, never reuse) |
| 3. Hand off | Tell the user the URL + what's on screen, end turn |
| 4. Read back | Next turn: read `state/events` (JSON lines) before pushing anything new |
| 5. Stop | Same launcher with `--stop`; session files persist under the session dir |

## Starting the Server
```bash
node scripts/start-companion.cjs --session-dir "<dir>/.web-companion/session-name"
```
PowerShell wrapper with the same behavior: `.\scripts\start-companion.ps1 -SessionDir "C:\path\to\.web-companion\session-name"`.

The launcher prints the `server-info` JSON: `url` (complete, with `?key=` — never strip it), `port`, `pid`, `screen_dir`, `state_dir`. It is idempotent: a live server for that session is reused (`"reused": true`); a dead, killed, or crashed one is restarted on the same port with the same key, so the open tab reconnects by itself. Always use the URL it prints: if the preferred port was taken the server falls back to a random one, and when the URL differs from the one the user already has, send the new URL.

Keep the session dir outside the project's git tree (or gitignore `.web-companion/`): it holds screens, events, logs, and the session key (`.last-token`).

## The Loop
1. **Check alive**: rerun the launcher — it returns the live server or restarts a dead one. Do not trust `state/server-info` alone; a killed process leaves it behind.
2. **Write one new screen** to `screen_dir`. Full HTML documents only, offline: no CDN or hotlinked assets — use the vendored theme via `/theme/…` and inline your own CSS/JS. Batch a whole step-sequence into ONE screen with client-side steps/tabs — each push costs a chat round-trip, so never split one flow across many screens.
3. **End your turn**: repeat the URL, one-line summary of the screen, and the one-word chat nudge the page shows (e.g. `เสร็จแล้ว`). The nudge carries no content — content lives in `state/events`.
4. **Next turn**: read `state/events` FIRST — pushing a new screen wipes it. Merge clicks/answers with their chat nudge.
5. **Iterate**: changed screen = new filename (`layout-v2.html`). Only advance when the step is validated.

## Screen Rules
- Style lesson screens with the vendored Bootstrap theme, served offline by the companion server: `<link rel="stylesheet" href="/theme/bootstrap.min.css">` (never a CDN link). Lock dark mode — `<html data-bs-theme="dark">` + `<meta name="color-scheme" content="dark">` — so it matches the Tomorrow code theme; never mix a light page with dark code blocks. Use Bootstrap components (container/card/alert/list-group/badge/buttons) with semantic HTML. Lesson-specific CSS (checklist `<details>`, SVG tweaks) goes in a `<style>` after the link.
- Code highlighting: vendored Prism — `<link rel="stylesheet" href="/theme/prism-tomorrow.min.css">`, tag blocks `<pre><code class="language-lua|sql|json">`, and before `</body>` add `<script src="/theme/prism-core.min.js"></script>` plus the needed `prism-lua|sql|json.min.js`, then `<script>Prism.highlightAll()</script>`.
- Clickable choices: any element with `data-choice="value"` reports clicks. For select-one styling add `onclick="toggleSelect(this)"` (provided by the injected helper).
- Collect answers on the page: `<button type="button" onclick="companion.submit('quiz-done', '#quiz')">` gathers named inputs (radio/checkbox/text/select/textarea) into an `answers` object. The submit button needs no `data-choice` (it would double-report). Quiz pattern: radio groups named `q1`…`qn` + one submit button + a line showing the chat nudge.
- Report custom events from your own script: `window.companion.choice("value", {extra: 1})` or `window.companion.send({type: "note", text: "..."})`.
- Only events carrying a `choice` field are recorded to the events file.
- The last `choice` click is usually the final pick; a long click trail means hesitation — worth asking about.
- No `X-Frame-Options` surprises on your side: never embed screens in iframes (the server sends `DENY`).
- Open screens only through `/`. Files opened via `/files/` directly get no injected helper, so clicks there are silent (`/files/` is for assets).
- Images must keep the screen offline-capable: inline SVG for diagrams/illustrations (no CDN, no hotlinked `<img>`). User-supplied raster files go in `content/` and are referenced via `/files/` (no helper there is fine for `<img>`).

## Events Format
One JSON object per line in `state/events`:
```jsonl
{"type":"click","choice":"layout-slides","text":"B · dark + slides","id":null,"timestamp":1789406891754}
{"type":"answer","choice":"quiz-done","answers":{"q1":"B","q2":"A"},"timestamp":1789406891755}
```
No file = the user didn't click anything; use only their chat nudge.

## Stopping
`node scripts/start-companion.cjs --session-dir <dir> --stop` (PowerShell: add `-Stop`), or let the 4-hour idle timeout do it. Both leave `state/server-stopped`. To resume later, rerun the launcher with the same session dir.

## Common Mistakes
| Mistake | Fix |
|---|---|
| Reusing a screen filename | Always a fresh file — the server keys off newest mtime |
| Reading events after pushing | Read first; each push clears the file |
| Sharing the URL without `?key=` | Always the complete URL from server-info |
| External fonts/CDN in screens | Vendored theme via `/theme/…`, everything else inline; localhost must stand alone |
| Hand-editing `state/` files to judge liveness | Rerun the launcher; it checks the PID and the server itself |
| Pushing screens faster than the user can look | One screen per turn, then wait |
| Splitting one flow across many screens | Batch a step-sequence into one screen with client-side steps — each push costs a chat round-trip |
| Asking in chat what the page could collect | Quiz answers, picks, text → `companion.submit` on the page; chat is only the wake-up nudge |

## Reference
- Server: `scripts/companion-server.cjs` (Node stdlib only, no `npm install`)
- Theme: `theme/bootstrap.min.css` (Bootstrap v5.3.8 CSS only, MIT © The Bootstrap Authors — https://getbootstrap.com), served at `/theme/bootstrap.min.css`
- Code highlight: `theme/prism-core/lua/sql/json.min.js` + `theme/prism-tomorrow.min.css` (Prism v1.30.0, MIT © Lea Verou — https://prismjs.com), served at `/theme/…`
- Licenses for vendored files: `theme/THIRD_PARTY_NOTICES.md`
- Browser helper (auto-injected): `scripts/companion-helper.js`
- Launcher: `scripts/start-companion.cjs` (any OS); `scripts/start-companion.ps1` wraps it for PowerShell
- Smoke test (run after any change to server/helper/launcher): `node scripts/smoke-test.cjs`
