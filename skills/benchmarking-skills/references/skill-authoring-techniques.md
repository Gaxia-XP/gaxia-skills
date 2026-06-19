# เทคนิคการสร้าง SKILL.md ที่มีประสิทธิภาพ
*ค้นคว้าและตรวจสอบเมื่อ 2026-06-15 — ขุดจาก skill สอนเขียน skill ที่ติดตั้งในเครื่อง (superpowers:writing-skills, mattpocock:write-a-skill, skill-creator, creating-workflow-skills) + งานวิจัยเว็บ (เอกสารทางการ Anthropic) · 20 agents · verify 14 claim หลักแบบ adversarial*

> **กฎเหล็กของเอกสารนี้:** ทุกข้อกำกับว่าเป็น **[ทางการ]** (อยู่ในเอกสาร Anthropic อย่างเป็นทางการ) หรือ **[ชุมชน]** (ธรรมเนียมของ superpowers/obra/mattpocock — ได้ผลจริงแต่เป็น house style ไม่ใช่มาตรฐาน) — เพราะ verify phase พบว่าหลายเทคนิคที่คนเข้าใจว่า "เป็นกฎ" จริง ๆ เป็นความเห็นของ framework เดียว

---

## 0. โมเดลความคิดหลัก — Progressive Disclosure 3 ระดับ **[ทางการ]**

เข้าใจเรื่องนี้เรื่องเดียว เทคนิคที่เหลือจะตามมาเอง SKILL.md ทำงานเป็น 3 ชั้น แต่ละชั้นโหลดเข้า context คนละจังหวะ:

| ระดับ | สิ่งที่อยู่ | โหลดเมื่อไหร่ | ต้นทุน token |
|---|---|---|---|
| 1 | `name` + `description` (frontmatter) | โหลดเข้า system prompt **ตลอดเวลา** | เล็กมาก — ต้องประหยัดสุด |
| 2 | เนื้อ SKILL.md (body) | โหลด**เฉพาะตอนที่ skill ถูก trigger** | ปานกลาง — คุม <500 บรรทัด |
| 3 | ไฟล์แนบ (`references/`, `scripts/`, `assets/`) | โหลด**เมื่อถูกเรียกใช้จริงเท่านั้น** | ศูนย์ จนกว่าจะเปิด |

**นัยที่ตามมา:** `description` คือป้ายชี้ทาง ไม่ใช่คู่มือ · body คือสารบัญ ไม่ใช่สารานุกรม · รายละเอียดหนัก ๆ ผลักลง reference ได้ฟรี ("SKILL.md serves as an overview that points Claude to detailed materials as needed, like a table of contents")

---

## 1. `description` — สนามรบที่สำคัญที่สุด (และขัดแย้งที่สุด)

`description` คือสัญญาณเดียวที่ Claude ใช้เลือก skill จาก 100+ ตัว เขียนพลาดตรงนี้ = skill ดีแค่ไหนก็ไม่เคยถูกเรียก

### สิ่งที่ทุกแหล่ง**เห็นตรงกัน**
1. **เขียนเป็นบุรุษที่ 3 เสมอ** **[ทางการ]** — เพราะ description ถูกฉีดเข้า system prompt · ห้าม "I can help you..." (บุรุษที่ 1 ทำให้ discovery พัง)
2. **ใส่ trigger keywords ที่ผู้ใช้พูดจริง** **[ทางการ]** — อาการ, ข้อความ error, คำพ้อง, ชื่อเครื่องมือเฉพาะ · "เจาะจง" ชนะ "กว้าง ๆ" เสมอ — `Helps with documents` / `Processes data` คือโหมดเจ๊งแบบเงียบอันดับ 1
3. **อธิบาย "ปัญหา" ไม่ใช่ "อาการเฉพาะภาษา"** **[ชุมชน]** — เขียน "race conditions, timing-dependent" ไม่ใช่ "setTimeout, sleep" (เว้นแต่ skill นั้นผูกกับเทคโนโลยีเฉพาะ)
4. **อยู่ใต้ลิมิต 1024 ตัวอักษร** **[ทางการ]** · ของที่โหลดบ่อยควรเล็ง ~ต่ำกว่า 500 ตัวอักษร **[ชุมชน]**
5. **ทำให้ "ดันนิด ๆ" (pushy)** **[ทางการ-ish]** — Claude มักจะ *under-trigger* skill โดยปริยาย skill-creator ทางการบอกให้ "make the skill descriptions a little bit pushy"
6. **แยก skill ที่ซ้อนทับกัน** ด้วยขอบเขตที่ไม่ทับกัน + ประโยค "Do not use when…"

### จุดขัดแย้งที่ต้องรู้ — "บอกว่าทำอะไร" หรือ "บอกแค่ตอนไหน"?
นี่คือจุดที่ verify phase ชี้ชัดที่สุด มี 2 สำนักที่ขัดกันตรง ๆ:

- **สำนัก Anthropic ทางการ:** description ต้องมี **ทั้ง "ทำอะไร" และ "ใช้ตอนไหน"**
  > *"The description field enables Skill discovery and should include both what the Skill does and when to use it"*
  ตัวอย่างทางการ: `Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.`

- **สำนัก superpowers:** description ต้อง **"บอกแค่ตอนไหน" (triggers only) ห้ามสรุป workflow**
  > เพราะการทดสอบพบว่า ถ้า description สรุป workflow → Claude ทำตาม description แล้ว**ข้ามการอ่าน body** · มีเคสจริง: description บอก "code review between tasks" ทำให้ Claude รีวิว **1 ครั้ง** ทั้งที่ flowchart ใน body สั่ง **2 ครั้ง** — พอลบคำสรุป workflow ออก ก็หายเป็นปกติ

**คำตัดสินจาก verify (verdict: nuanced):** กฎ "triggers only, ห้ามบอกว่าทำอะไรเลย" คือ **การตีเกินจริง** — มันขัดกับเอกสารทางการ Anthropic โดยตรง · **แก่นที่ถูกต้องคือ: อย่าให้ description สรุป "ลำดับขั้น workflow"** (นั่นทำให้ Claude ลัดขั้นตอน) แต่ "บอกว่าทำอะไร + ใช้ตอนไหน" นั้นทำได้และควรทำ

> **สูตรปฏิบัติที่ปลอดภัย:** `<ทำอะไร 1 ประโยค> + Use when <เงื่อนไข/อาการ/คำที่ผู้ใช้พูด>` — แต่**ห้ามใส่ลำดับขั้นตอน** ("ขั้น 1 ทำ A แล้วขั้น 2 ทำ B") ลงใน description โดยเฉพาะ skill ที่เป็น workflow หลายสเต็ป

---

## 2. โครงสร้าง body + สไตล์เนื้อหา

### โครงสร้าง
- **ไฟล์เดียว (SKILL.md อย่างเดียว) เป็นโครงสร้างที่ถูกต้องและพบบ่อย** **[ทางการ]** — ไม่ต้องแตกไฟล์ถ้าไม่จำเป็น
- **body ต่ำกว่า 500 บรรทัด ถ้าใกล้ลิมิตให้แตกไฟล์** **[ทางการ]**
- **reference ลึกแค่ 1 ระดับจาก SKILL.md เท่านั้น** **[ทางการ]** — ห้าม SKILL→advanced→details เพราะ Claude อ่านแบบ partial (`head -100`) ไฟล์ที่ซ้อนลึกจะถูกอ่านไม่ครบ
- **ไฟล์ reference ที่ยาวเกิน 100 บรรทัด ใส่สารบัญ (TOC) ไว้บนสุด** **[ทางการ]** — กันกรณี Claude preview แบบอ่านบางส่วน
- **แตก reference ตาม "โดเมน/ตัวแปร" ไม่ใช่ตามเลขลำดับ** — `forms.md`, `tables.md` ไม่ใช่ `doc1.md`, `doc2.md` · ให้ context ที่ไม่เกี่ยวกันแยกกันอยู่

### สไตล์เนื้อหา
- **กระชับสุด ๆ — "context window คือสมบัติสาธารณะ"** **[ทางการ]** · ตั้งสมมติฐานว่า "Claude ฉลาดอยู่แล้ว" · ถามทุกย่อหน้าว่า *"ย่อหน้านี้คุ้มค่า token ที่กินไหม?"* (ตัวอย่างทางการ: เขียน PDF instruction แบบ ~50 token ชนะแบบ ~150 token ที่อธิบายว่า PDF คืออะไร)
- **อธิบาย "ทำไม" แทนการตะโกน MUST/ALWAYS/NEVER ล้วน ๆ** — เหตุผลทำให้ Claude ทำตามได้ทั่วถึงกว่าคำสั่งเปล่า (*มีจุดตึง*: skill วินัยบางตัวจงใจใช้ MUST เพื่อปิดช่องแถ — เลือกตามประเภท skill ดูข้อ 4)
- **ใช้ภาษาสั่งการ (imperative) + คำศัพท์สม่ำเสมอตลอดทั้ง skill** — อย่าสลับเรียกสิ่งเดียวกันหลายชื่อ
- **ตัวอย่างที่ดี 1 อันชนะหลายภาษาเจือจาง** — ยกตัวอย่างภาษาเดียวให้ลึก ดีกว่ายก 5 ภาษาแบบผิว ๆ
- **skill คือ "เอกสารอ้างอิงที่ใช้ซ้ำได้" ไม่ใช่ "เรื่องเล่าการแก้ปัญหาครั้งหนึ่ง"** — ตัด narrative เฉพาะเคสออก
- **เลี่ยงข้อมูลที่ผูกกับเวลา** (เวอร์ชัน/วันที่) — ถ้าจำเป็นให้ทำหัวข้อ "old patterns" แยก
- **flowchart ใช้เฉพาะจุดตัดสินใจที่ไม่ชัดเจน** — อย่าวาด flowchart สำหรับขั้นตอนเชิงเส้น โค้ด หรือเนื้อหา reference
- **ให้ "ค่าตั้งต้น 1 อย่าง ไม่ใช่เมนูตัวเลือก"** — ตัวเลือกเยอะ = instruction ไม่ determinstic

### Degrees of freedom — ปรับความเข้มงวดตามความเปราะของงาน **[ทางการ]**
- งานเปราะ/ผิดแล้วพัง (สะพานแคบ) → เขียนเป็นขั้นตอนตายตัว สคริปต์สำเร็จรูป
- งานยืดหยุ่น (สนามโล่ง) → ให้หลักการ ปล่อยให้ Claude เลือกวิธี
- จับคู่ระดับอิสระให้ตรงกับงาน อย่าให้สคริปต์ตายตัวกับงานสร้างสรรค์ หรือปล่อยอิสระกับงานที่ห้ามพลาด

---

## 3. ไฟล์แนบ (Bundled Resources) **[ทางการ]**

โครงไดเรกทอรีมาตรฐาน: `scripts/` · `references/` · `assets/`

- **มัด utility script ไว้สำหรับงาน deterministic/ทำซ้ำ** — แทนที่จะอธิบายเป็นร้อยแก้วให้ Claude reinvent ทุกครั้ง ให้แนบสคริปต์ที่รันได้เลย (ถ้าเทสต์รันเดิมซ้ำ ๆ = สัญญาณว่าควรเป็นสคริปต์)
- **ระบุเจตนา "ให้รัน" vs "ให้อ่าน" ให้ชัด** — บอกชัดว่าไฟล์ไหน execute ไฟล์ไหนอ่านประกอบ
- **สคริปต์ต้อง "แก้ปัญหา" ไม่ใช่ "โยนกลับ"** — มี error handling จริง ห้าม voodoo/magic constant ที่อธิบายไม่ได้ ห้าม path แบบ Windows hardcode
- **ใช้ forward slash เสมอ + ชื่อไฟล์สื่อความหมาย + ชื่อ MCP tool แบบเต็ม (fully-qualified)** — ช่วย navigation และพกข้ามแพลตฟอร์มได้
- **อย่าสมมติว่า package ติดตั้งแล้ว** — runtime/แพ็กเกจต่างกันตามแพลตฟอร์ม

---

## 4. Skill ประเภทยาก — Discipline & Orchestrator

skill 2 ประเภทนี้ต้องการเทคนิคพิเศษ เพราะ Claude มีแรงจูงใจจะ "แถ" ออกจากกระบวนการ

### Discipline skills (บังคับวินัย เช่น TDD, debugging) **[ชุมชน — superpowers]**
- **ปิดทุกช่องโหว่อย่างชัดเจน — อย่าแค่ระบุกฎ** เพราะ Claude จะหาเหตุผลแถ
- **ตาราง Rationalization (`ข้ออ้าง | ความจริง`)** — ดักข้ออ้างที่เจอจากการเทสต์จริง เขียนคู่กับคำโต้แบบ verbatim
- **รายการ Red Flags ให้ Claude เช็คตัวเอง** — "ถ้าคุณกำลังคิดประโยคพวกนี้ = หยุด คุณกำลังแถ"
- **วางหลักการรากตั้งแต่ต้น: "ละเมิดตัวอักษรของกฎ = ละเมิดเจตนาของกฎ"** **[verify: confirmed ว่าได้ผลจริง]** — ตัดข้ออ้างประเภท "ผมทำตามเจตนาแล้ว" ทั้งตระกูล (มีหลักฐาน meta-test: เพิ่มประโยคนี้แล้ว agent เปลี่ยนพฤติกรรมเป็น "ทำตามกฎ")
- **อัปเดต description ด้วย "อาการตอนละเมิด"** — CSO สำหรับ skill วินัย เพื่อให้มัน trigger ตอนที่ Claude กำลังจะทำผิด

### Orchestrator skills (ร้อย skill อื่นเป็น workflow) **[ชุมชน — creating-workflow-skills]**
- **ใช้คำไปกับ "ราว" ที่ agent มักพลาด ไม่ใช่ happy path** — pre-flight, ขอบเขต loop, การส่งต่อ artifact, การกู้คืนเมื่อ gate ไม่ผ่าน
- **description ต้องบอก "สถานการณ์" ไม่ใช่ "ลำดับ chain"** — (สอดคล้องกับข้อ 1: อย่าสรุป workflow ลง description)
- **กฎ body ของ orchestrator:** เรียกทุกสเต็ปผ่าน Skill tool จริง · ลำดับตายตัว · ย้อนกลับได้แต่ห้ามกระโดดข้ามไปข้างหน้า · ห้ามเคลมเสร็จก่อน gate สุดท้ายผ่าน · เดินสเต็ปอัตโนมัติไม่ถามว่า "ทำต่อไหม"
- **Nested orchestration: อย่าขับ sub-skill ซ้ำ** — ถ้า skill ลูกขับ phase ภายในของมันเอง ให้ gate ที่ "หลักฐานว่าเสร็จ" (build/test ผ่าน) ไม่ใช่คำรายงานตัวเอง
- **อย่าสอนซ้ำสิ่งที่ skill รากฐานที่อ้างถึงสอนไว้แล้ว**

> *(หมายเหตุ: skill `start-work` ที่คุณสร้างไว้ในเซสชันก่อน ใช้เทคนิคชุดนี้ครบ — รายละเอียดใน [[skill-collection-workspace]])*

---

## 5. Eval & Testing — หัวใจที่คนมองข้าม

### Eval-driven development **[ทางการ]** — verify: confirmed
- **สร้าง evaluation ก่อนเขียนเอกสารยาว ๆ** — *"Create evaluations BEFORE writing extensive documentation... solves real problems rather than documenting imagined ones"*
- ลำดับ 5 ขั้นทางการ: ระบุช่องว่าง → สร้าง 3 สถานการณ์ทดสอบ → วัด baseline (ไม่มี skill) → ใส่ instruction ขั้นต่ำ → วนปรับ
- schema eval ทางการ: `{skills, query, files, expected_behavior}` · checklist ทางการสั่ง "สร้างอย่างน้อย 3 evaluation"

### Subagent pressure-testing **[ชุมชน — superpowers]** — verify: nuanced
- **เทสต์ด้วย subagent แบบ A/B (มี skill vs ไม่มี)** บนงานจริง ไม่ใช่ quiz
- *"เทสต์ที่ดีรวมแรงกดดัน 3+ อย่าง"* (เวลาจำกัด + อำนาจสั่ง + ความเหนื่อย ฯลฯ) — **แต่ verify เตือน: เลข "3+" เป็น heuristic ของผู้เขียน ไม่ใช่ค่าที่ Anthropic ยืนยันเชิงประจักษ์**
- **Meta-testing: ถาม agent ที่ล้มเหลวว่า "skill ควรเขียนยังไงถึงจะกันพลาดนี้ได้"** แล้ว map คำตอบ: ไม่ชัด→เสริมหลักการ / "ควรบอก X"→เพิ่มแบบ verbatim / "ไม่เห็น Y"→ทำให้เด่นขึ้น

### วัดผลเชิงปริมาณ **[ทางการ — skill-creator]**
- **วัด trigger accuracy บนเคส should-trigger / should-NOT-trigger** แล้ววน optimize description
- **variance analysis: รันหลายรอบ** (เช่น 3 ครั้งต่อ query) เพื่อจับ flaky / non-discriminating / tradeoff pattern
- **เทสต์กับทุกโมเดลที่จะใช้จริง** (Haiku/Sonnet/Opus) — พฤติกรรมต่างกัน
- **สังเกตว่า Claude เดินผ่าน skill ยังไงในงานจริง** แล้ววนปรับ (Claude A เขียน / Claude B ทดสอบ)

### The Iron Law **[ชุมชน — superpowers]** — verify: nuanced
> *"NO SKILL WITHOUT A FAILING TEST FIRST"* — ใช้กับ skill ใหม่และการแก้ skill เดิม
- **verify เตือน:** เป็น house style ที่เข้มของ framework เดียว ไม่ใช่หลักทางการ · Anthropic แนะแบบอ่อนกว่า ("เริ่มจาก evaluation สังเกตจุดที่สะดุด แล้ววน") · และ "test" ในที่นี้คือ subagent pressure scenario ไม่ใช่ unit test อัตโนมัติ · เป็นหลักการที่ดี แต่กรอบ "ลบทิ้ง/เริ่มใหม่" เป็นสไตล์เฉพาะที่ขึ้นกับบริบท

---

## 6. Anti-patterns — เช็กลิสต์ "อย่าทำ"

| Anti-pattern | ทำไมพัง |
|---|---|
| description กว้าง/คลุมเครือ (`Helps with X`) | โหมดเจ๊งเงียบอันดับ 1 — ไม่เคย trigger |
| description สรุปลำดับ workflow | Claude ทำตาม description แล้วข้ามอ่าน body (ลัดขั้นตอน) |
| body อืด เกิน ~500 บรรทัด | กิน token เปล่า — ผลักลง reference |
| ใส่รายละเอียดระดับ reference ใน body | ทำลาย progressive disclosure |
| reference ซ้อนลึกหลายชั้น | Claude อ่าน partial → พลาดเนื้อหา (ลึกได้แค่ 1 ระดับ) |
| instruction ไม่ deterministic / ตัวเลือกเยอะ | ผลลัพธ์เดาไม่ได้ — ให้ค่าตั้งต้น 1 อย่าง |
| skill ทับซ้อนกันหลายตัว | แย่งกัน trigger ผิดตัว — ใส่ "Do not use when" |
| MUST/ALWAYS/NEVER ล้วนไม่มีเหตุผล | ทำตามไม่ทั่วถึง — อธิบาย why (ยกเว้น skill วินัยที่จงใจปิดช่องแถ) |
| ตัวอย่างเป็น narrative เฉพาะเคส / หลายภาษาเจือจาง | skill ต้องใช้ซ้ำได้ ไม่ใช่บันทึกการแก้ครั้งเดียว |
| สคริปต์โยน error กลับ / magic number / Windows path | ไม่ deterministic + พกข้ามเครื่องไม่ได้ |
| ข้อมูลผูกเวลา (เวอร์ชัน/วันที่) ใน body | ล้าสมัยเงียบ ๆ |
| ติดตั้ง skill เยอะเกิน / ปล่อยอิสระเกิน | แย่ง context + trigger มั่ว |

**เมื่อไหร่ที่ไม่ควรสร้าง skill:** ถ้าเป็นกฎพฤติกรรมอัตโนมัติ ("ทุกครั้งที่...") → ใช้ hook · ถ้าเป็นค่า setting → ใช้ config · skill เหมาะกับ "ความรู้/กระบวนการที่ Claude ดึงมาใช้ตอนทำงาน"

---

## 7. ตารางสรุป — "ทางการ Anthropic" vs "ธรรมเนียมชุมชน"

นี่คือผลสำคัญที่สุดจาก verify phase — แยกให้ชัดว่าอะไรอ้างอิงได้แน่ vs อะไรเป็นความเห็น framework

| เทคนิค | สถานะ | หมายเหตุจาก verify |
|---|---|---|
| description มี "ทำอะไร + ใช้ตอนไหน" | **ทางการ** ✅ | ยืนยันตรงเอกสาร best-practices |
| description "triggers only ห้ามบอกว่าทำอะไร" | ชุมชน ⚠️ | ตีเกินจริง — แก่นจริงคือ "อย่าสรุป workflow" |
| Progressive disclosure / SKILL.md เป็นสารบัญ | **ทางการ** ✅ | ตรงเอกสาร |
| body <500 บรรทัด | **ทางการ** ✅ | นับเป็น "บรรทัด" |
| word budget <150/<200/<500 คำ | ชุมชน ⚠️ | Anthropic นับบรรทัดไม่ใช่คำ ไม่มี tiering นี้ |
| reference ลึก 1 ระดับ | **ทางการ** ✅ | ตรงเอกสาร |
| TOC สำหรับไฟล์ >100 บรรทัด | **ทางการ** ✅ | (skill-creator ใช้ >300 — เลขไม่ตรงกันเองบ้าง) |
| "context window คือสมบัติสาธารณะ" | **ทางการ** ✅ | quote ตรง |
| สร้าง eval ก่อนเขียน doc | **ทางการ** ✅ | quote ตรง |
| CSO / keyword coverage | ทางการ-บางส่วน ⚠️ | เน้นที่ field description เป็นหลัก ไม่ใช่ heading/body |
| Iron Law (failing test first) | ชุมชน ⚠️ | house style เข้ม ไม่ใช่หลักทางการ |
| pressure-test "3+ แรงกดดัน" | ชุมชน ⚠️ | เลข 3+ เป็น heuristic ไม่ verified |
| "spirit vs letter" หลักการราก | ชุมชน ✅ | n=1 แต่มีหลักฐานว่าได้ผลจริง |
| persuasion principles ตามประเภท skill | ชุมชน ⚠️ | กลไกโอเค แต่ framing เชิงสถิติเกินหลักฐาน |

---

## 8. เทมเพลตเริ่มต้น + Pre-flight checklist

### frontmatter (กฎ validation)
```yaml
---
name: my-skill-name        # ≤64 ตัวอักษร, lowercase+ตัวเลข+hyphen เท่านั้น, ห้ามคำสงวน
description: <ทำอะไร 1 ประโยค>. Use when <เงื่อนไข/อาการ/คำที่ผู้ใช้พูด>.  # ≤1024 ตัวอักษร, บุรุษที่ 3
# --- ส่วนขยายเฉพาะ Claude Code (ออปชัน) ---
# allowed-tools: Read, Grep, Bash
# model: claude-opus-4-8
# disable-model-invocation: false
---
```
> **2 field ที่บังคับ:** `name` + `description` เท่านั้น · ที่เหลือ optional

### โครงร่าง body มาตรฐาน
```markdown
# <ชื่อ skill>
<1-2 ประโยคบอกว่าทำอะไร>

## When to use / When NOT to use
## <ขั้นตอน/หลักการหลัก>   ← imperative, กระชับ, ตัวอย่างเดียวลึก ๆ
## Red Flags (ถ้าเป็น skill วินัย)
## Rationalizations table (ถ้าเป็น skill วินัย)

# ไฟล์แนบ (โหลดเมื่อต้องการ):
# references/<โดเมน>.md   ← รายละเอียดหนัก, มี TOC ถ้า >100 บรรทัด
# scripts/<งานซ้ำ>.py     ← งาน deterministic
```

### Pre-flight checklist ก่อน deploy
- [ ] `description` มี "ทำอะไร + Use when" + คำ trigger ที่ผู้ใช้พูดจริง (ไม่สรุป workflow)
- [ ] บุรุษที่ 3, ≤1024 ตัวอักษร
- [ ] body <500 บรรทัด, รายละเอียดหนักผลักลง reference
- [ ] reference ลึกแค่ 1 ระดับ, ไฟล์ >100 บรรทัดมี TOC
- [ ] สร้าง eval/baseline แล้ว (อย่างน้อย 3 สถานการณ์) — มี skill ดีกว่าไม่มีจริงไหม
- [ ] (skill วินัย) ปิดช่องแถด้วย rationalization table + red flags + หลักการ "letter=spirit"
- [ ] เทสต์ trigger บนเคส should/should-NOT + เทสต์ข้ามโมเดลที่จะใช้
- [ ] forward slash, ไม่มี time-sensitive info, คำศัพท์สม่ำเสมอ

---

## แหล่งอ้างอิงหลัก
- **Anthropic ทางการ:** `platform.claude.com/docs/en/agents-and-tools/agent-skills/` (overview + best-practices) · `anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills` · repo `anthropics/skills` (skill-creator)
- **ชุมชน:** `github.com/obra/superpowers` (writing-skills, testing-skills-with-subagents) · mattpocock:write-a-skill · creating-workflow-skills (ในเครื่อง)
- **งานวิจัยอ้างอิงเรื่อง persuasion:** Meincke, Cialdini et al. "Call Me a Jerk" (Wharton/PNAS, 2026) — *ระวัง: วัดบน jailbreak request ไม่ใช่ instruction-following ทั่วไป*

*ข้อมูล verify ณ 2026-06-15 — เอกสารทางการ Anthropic อัปเดตได้ ตรวจ URL ก่อนอ้างเป็นมาตรฐาน*
