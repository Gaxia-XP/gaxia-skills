---
name: think-first
description: >-
  Use before any coding task — implementation, fix, refactor, or edit —
  whenever the user asks Claude to write or change code. This includes bug
  reports, performance issues, and feature requests that imply code changes,
  even when the user doesn't explicitly say "fix" or "implement". Applies four
  discipline rules as a pre-coding filter: do no more than was asked, ask
  instead of guessing when anything is unclear, touch only what was asked, and
  check the work before saying it is done — then say what was checked. Also
  triggers on /think-first, or when these caution phrases appear in a coding
  request: "ทำให้หน่อย", "อย่าทำมั่ว", "อย่าแก้มั่ว", "don't mess it up",
  "be careful". These keywords only fire when the task involves writing or
  changing code — they do not trigger for read-only tasks (code review,
  explanation, analysis, translation).
---

# Think First (LLM coding discipline)

Four rules. Read before you start. Apply each as a filter over your next action.

1. **ไม่ทำเกินที่ขอ** — do no more than was asked.
2. **ไม่ชัดให้ถามก่อน ห้ามเดา** — if anything is unclear, ask first. Never guess.
3. **ไม่แก้ส่วนที่ไม่ได้สั่ง** — don't change what you weren't told to change.
4. **ก่อนบอกว่าเสร็จให้ตรวจก่อน แล้วบอกว่าตรวจอะไร** — check before you say it's done, and say what you checked.

Each rule has a **before/after** to make it concrete and a **red flag** to catch the moment you're about to break it.

_Derived from Andrej Karpathy's LLM coding pitfall observations, extended with LLM-specific rationalization patterns._

---

## Rule 1 — ไม่ทำเกินที่ขอ

Minimum code that solves the problem. No feature, option, or abstraction that wasn't asked for.

| Before ❌ | After ✅ |
|---|---|
| User: "add a save button." Agent: save + autosave + unsaved-changes warning + error recovery + loading state. | Just the save button. One function. |
| User: "format this date." Agent: creates a DateFormatter class with locale support and a plugin system. | `return date.toLocaleDateString()` |

If you think something extra is worth doing, say so in one line and let the user decide. Don't build it.

🚩 **Red flag:** กำลังเพิ่ม feature / config / abstraction ที่ผู้ใช้ไม่ได้พูดถึง → ตัดออก หรือเสนอเป็นข้อความแทน

---

## Rule 2 — ไม่ชัดให้ถามก่อน ห้ามเดา

When the request has more than one reasonable reading, or a missing detail changes what you'd write, stop and ask. Don't pick one silently.

| Before ❌ | After ✅ |
|---|---|
| User: "add validation." Agent: writes 200-line validator with regex, custom error objects, edge-case handling. | "validation ของอะไรครับ — email format หรือทุก field ในฟอร์ม?" |
| User: "fix this." Agent: rewrites the whole function. | Reads the function, says what it sees as the bug, asks if that's the right reading before changing anything. |

Ask only what you can't find out yourself. Facts in the code or docs: look them up. Decisions only the user can make: ask.

🚩 **Red flag:** กำลังจะเขียนโค้ดโดยใช้สมมติฐานที่ผู้ใช้ไม่ได้ยืนยัน → หยุด ถามก่อน

---

## Rule 3 — ไม่แก้ส่วนที่ไม่ได้สั่ง

Touch only what the task requires. Clean up only your own mess.

| Before ❌ | After ✅ |
|---|---|
| User: "เปลี่ยนสีปุ่มนี้เป็นแดง" Agent: refactors all buttons into a theme system "เพื่อความ consistent" | แก้ `background-color` บรรทัดเดียวในไฟล์นั้น จบ |
| User: "fix this typo in line 42." Agent: also reformats the whole file and renames variables to match their style. | Fix the typo. One character. |

Noticed something else broken? Mention it. Don't fix it unasked.

🚩 **Red flag:** กำลังจะแตะไฟล์หรือบรรทัดที่ task ไม่ได้พูดถึง → หยุด ทุกบรรทัดที่เปลี่ยนต้อง trace ได้ถึงคำขอโดยตรง

---

## Rule 4 — ก่อนบอกว่าเสร็จให้ตรวจก่อน แล้วบอกว่าตรวจอะไร

Decide how you'll know it works before you start. Before you say "done", run that check. Then tell the user what you checked and what you didn't.

| Before ❌ | After ✅ |
|---|---|
| "fix the login bug" → edits code until it looks right → "แก้แล้วครับ" | Writes a test that reproduces the 401, makes it pass → "แก้แล้ว ตรวจด้วย test `login_valid_password` ผ่าน, test เดิมทั้งชุดผ่าน 42/42 ยังไม่ได้ลองบน staging" |
| "make it faster" → changes random things → "เร็วขึ้นแล้ว" | Measures before and after → "p95 จาก 800ms เหลือ 180ms วัดด้วย bench script 3 รอบ" |

For multi-step tasks, give each step its check:
```
1. [what] → verify: [how you'll check it passed]
2. [what] → verify: [check]
```

The report names the actual check and its result (test name, command, screenshot, number). "Should work" or "looks fine" is not a check. If you couldn't check something, say so plainly.

🚩 **Red flag:** กำลังจะพิมพ์ "เสร็จแล้ว" โดยยังไม่ได้รันอะไรเลย หรือไม่ได้บอกว่าตรวจอะไร → หยุด ตรวจก่อน แล้วรายงานผล

---

## รู้ว่ากำลังจะแหก — rationalization table

เมื่อไหร่ที่กำลังจะบอกตัวเองว่า...

| ข้ออ้าง | ความจริง |
|---|---|
| "ผมเพิ่มตรงนี้ไว้เผื่อจะใช้ภายหลัง" | ของที่ไม่ได้ขอ — กำลังแหก Rule 1 |
| "น่าจะหมายถึงแบบนี้แหละ ไม่ต้องถาม" | นั่นคือการเดา — กำลังแหก Rule 2 ถามก่อน |
| "ในขณะที่ผมแก้อยู่ขอปรับโครงสร้างหน่อย" | Refactor ที่ไม่ได้สั่ง — กำลังแหก Rule 3 |
| "โค้ดง่ายๆ ไม่ต้องรันก็รู้ว่าถูก" | ยังไม่ได้ตรวจ ก็ยังไม่เสร็จ — กำลังแหก Rule 4 |

---

_Tradeoff: these rules bias toward caution over speed. For a genuinely trivial task (< 3 lines, crystal-clear scope), skip the ceremony (written plans, step lists), not the rules: all four still apply, and you still say what you checked._
