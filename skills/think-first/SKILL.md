---
name: think-first
description: >-
  Use before any coding task — implementation, fix, refactor, or edit —
  whenever the user asks Claude to write or change code. This includes bug
  reports, performance issues, and feature requests that imply code changes,
  even when the user doesn't explicitly say "fix" or "implement". Applies four
  discipline rules as a pre-coding filter: state assumptions before touching
  anything, write only the minimum that solves the problem, touch only what was
  asked, and define a verifiable goal before looping. Also triggers on
  /think-first, or when these caution phrases appear in a coding request:
  "ทำให้หน่อย", "อย่าทำมั่ว", "อย่าแก้มั่ว", "don't mess it up", "be careful".
  These keywords only fire when the task involves writing or changing code —
  they do not trigger for read-only tasks (code review, explanation, analysis,
  translation).
---

# Think First (LLM coding discipline)

Four rules, four lenses. Read before you start. Apply each as a filter over your next action.
Each rule has a **before/after** to make it concrete and a **red flag** to catch the moment you're about to break it.

_Derived from Andrej Karpathy's LLM coding pitfall observations, extended with LLM-specific rationalization patterns._

---

## Rule 1 — ระบุ assumption ก่อนแตะโค้ด: ไม่ชัวร์ต้องถาม ไม่เดาเงียบๆ

State assumptions before you touch anything. If there are multiple valid interpretations, surface them — don't pick silently.

| Before ❌ | After ✅ |
|---|---|
| User: "add validation." Agent: writes 200-line validator with regex, custom error objects, edge-case handling. | "ผมตีความว่าหมายถึง email format — ถ้าใช่จะเขียน 10 บรรทัด ถ้าหมายถึงอย่างอื่นบอกได้เลย" |
| User: "fix this." Agent: rewrites the whole function. | Reads the function, states what it sees as the bug, asks if that's the right reading before changing anything. |

🚩 **Red flag:** กำลังจะเขียน code เกิน 5 บรรทัดโดยยังไม่รู้ว่า assumption ที่ใช้คืออะไร → หยุด ระบุ assumption ก่อน

---

## Rule 2 — เขียนเท่าที่จำเป็น: ห้ามใส่ feature ที่ไม่ได้ขอ ห้ามทำ abstraction ที่ใช้ที่เดียว

Minimum code that solves the problem. Nothing speculative.

| Before ❌ | After ✅ |
|---|---|
| User: "add a save button." Agent: save + autosave + unsaved-changes warning + error recovery + loading state. | Just the save button. One function. |
| User: "format this date." Agent: creates a DateFormatter class with locale support and a plugin system. | `return date.toLocaleDateString()` |

🚩 **Red flag:** กำลังสร้าง abstraction / config / flexibility ที่ยังไม่มี use case ที่สอง → ตัดออก

---

## Rule 3 — แก้เฉพาะที่ต้องแก้: ห้ามไป "ปรับปรุง" โค้ดข้างเคียงตามใจ

Touch only what the task requires. Clean up only your own mess.

| Before ❌ | After ✅ |
|---|---|
| User: "เปลี่ยนสีปุ่มนี้เป็นแดง" Agent: refactors all buttons into a theme system "เพื่อความ consistent" | แก้ `background-color` บรรทัดเดียวในไฟล์นั้น จบ |
| User: "fix this typo in line 42." Agent: also reformats the whole file and renames variables to match their style. | Fix the typo. One character. |

🚩 **Red flag:** กำลังจะแตะไฟล์ที่ task ไม่ได้พูดถึง / กำลัง refactor โค้ดที่ไม่ได้พัง → หยุด ทุก line ที่เปลี่ยนต้อง trace ได้ถึงคำขอโดยตรง

---

## Rule 4 — ตั้งเป้าให้ตรวจสอบได้: แปลง task เป็นเงื่อนไขที่วัดได้ก่อนเริ่ม

Transform vague tasks into verifiable goals. Loop until the goal passes, not until it "feels done."

| Before ❌ | After ✅ |
|---|---|
| "fix the login bug" → fiddles with code until it looks plausible | "เขียนเทสที่ reproduce: login ด้วย password ถูกแล้ว return 401 → ทำให้เทสผ่าน" |
| "make it faster" → changes random things | Profiles first. Picks one bottleneck. States the target: "reduce p95 from 800ms to <200ms." Measures before and after. |

For multi-step tasks, state a plan with a verify step before each move:
```
1. [what] → verify: [how you'll check it passed]
2. [what] → verify: [check]
```

🚩 **Red flag:** กำลังจะ mark งานว่าเสร็จโดยที่ไม่มีผลลัพธ์ที่วัดได้ว่า "ผ่าน" หมายถึงอะไร → หยุด ตั้ง success criteria ก่อน

---

## รู้ว่ากำลังจะแหก — rationalization table

เมื่อไหร่ที่กำลังจะบอกตัวเองว่า...

| ข้ออ้าง | ความจริง |
|---|---|
| "แค่คำถามง่ายๆ ไม่ต้องเช็ค skill หรอก" | ถ้าไม่แน่ใจว่า assumption ถูกต้องคุณกำลังแหก Rule 1 — ถามก่อนเขียน |
| "ผมเพิ่มตรงนี้ไว้เผื่อจะใช้ภายหลัง" | Feature ที่ไม่ได้ขอคือ speculative code — กำลังแหก Rule 2 |
| "ขอดูโค้ดก่อนแล้วค่อยถาม" | ไฟล์ไม่มีบริบท conversation — ถามผู้ใช้ก่อนจะตีความถูก (Rule 1) |
| "ในขณะที่ผมแก้อยู่ขอปรับโครงสร้างหน่อย" | Refactor ที่ไม่ได้ขอคือ scope creep — กำลังแหก Rule 3 |

---

_Tradeoff: these rules bias toward caution over speed. For a genuinely trivial task (< 3 lines, crystal-clear scope), use judgment — overhead of Rule 1-4 may exceed the task itself._
