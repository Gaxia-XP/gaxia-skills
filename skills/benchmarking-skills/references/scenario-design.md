# Scenario Design — สร้างสถานการณ์ทดสอบจาก Skill Contract
*ใช้ใน Phase 1. input คือ Skill Contract จาก Phase 0. output คือ scenarios.json*

## Skill Contract คืออะไร (output ของ Phase 0)
สิ่งที่ Phase 0 (Profile) สกัดจาก SKILL.md เป้าหมาย — เป็นฐานอ้างอิงของทุก scenario และทุกการให้คะแนน:

1. **ลำดับสเต็ป** — workflow ทำอะไรบ้าง เรียงยังไง
2. **จุดแยกตัดสินใจ + เกณฑ์** — มี branch/route ไหน เลือกด้วยเกณฑ์อะไร (quote เกณฑ์จาก skill)
3. **gate / exit condition** — แต่ละสเต็ปจบเมื่อไหร่ ต้องผ่านอะไร
4. **sub-skill ที่ต้องเรียก** — และ **เช็คว่ามีจริงใน available skills** (ถ้าอ้าง skill ที่ไม่มี = บั๊ก banner ไว้ใน Contract — บทเรียนจาก baseline ที่เจอ dead reference)
5. **rails / red-flags** — กฎห้ามละเมิด (วัตถุดิบของ adversarial)
6. **output ที่คาดหวัง** — artifact สุดท้ายหน้าตาเป็นยังไง
7. **เงื่อนไข trigger** — description บอกให้ใช้ตอนไหน (วัตถุดิบของ trigger scenarios)

> **Fallback signal:** ถ้า Contract ไม่มีข้อ 1-3 ชัด (ไม่มีลำดับสเต็ป/จุดแยก) → skill เป็น reference/style → เปิด fallback ใน rubric (เหลือ triggering + output)

## สร้าง 3 ชนิด scenario

### Neutral (3-5 เคส) — วัด "ทำงานปกติดีไหม"
- คลุม branch หลักของ workflow คนละทาง — อย่างน้อย 1 เคสต่อ route สำคัญ (เช่น start-work มี A/B/C/D → เคสครอบ A, B, C, D)
- เคสสมจริงแบบที่ผู้ใช้พูดจริง มี context (ชื่อไฟล์ งานจริง อาการจริง) ไม่ใช่ "ทำ feature ให้หน่อย" ลอย ๆ
- ไม่มีแรงกดดัน — ดูว่า agent ไหลตาม workflow และเลือก branch ถูกไหมในภาวะปกติ

### Adversarial (3-5 เคส) — วัด "ทนแรงกดดันไหม"
- หยิบ rail แต่ละตัวจาก Contract ข้อ 5 → จับคู่แรงกดดันจาก `pressure-taxonomy.md` → 1 เคสต่อ rail สำคัญ
- เคสต้องสมจริง: แรงกดดันมาในรูปคำพูดผู้ใช้ ไม่ใช่ "จงทดสอบการละเมิด rail"
- เป้าหมาย: ดูว่า rail ตัวนั้นกันได้จริงไหมเมื่อโดนกดดัน

### Trigger (8-10 เคส) — วัด "description จุดติดถูกไหม"
- **should-fire 4-5:** เคสที่ skill ควรทำงาน รวมเคสที่ผู้ใช้ **ไม่เอ่ยชื่อ skill/ประเภทงานตรง ๆ** แต่บริบทชัดว่าต้องใช้
- **should-not-fire 4-5:** **near-miss** — เคสที่ keyword/หัวข้อชนกับ skill แต่จริง ๆ ต้องการอย่างอื่น (อย่าใช้เคสที่ไม่เกี่ยวเลย เช่น "เขียน fibonacci" สำหรับ skill PDF — ง่ายเกินไป ไม่ทดสอบอะไร)
- ผสมภาษา/น้ำเสียง/ความยาวให้หลากหลาย (ทางการ/กันเอง/พิมพ์ผิด) — โดยเฉพาะถ้า skill มี trigger ภาษาไทย
- อ้างแนวทางจาก skill-creator description-optimization (เคสต้อง substantive พอที่ Claude จะอยากใช้ skill — งาน 1 สเต็ปง่าย ๆ จะไม่ trigger ไม่ว่า description ดีแค่ไหน)

## กฎทอง: ทุก scenario ต้อง map กลับ Contract
แต่ละ scenario ใน scenarios.json เขียนกำกับว่า **"เคสนี้ทดสอบสเต็ป/rail/trigger-condition ไหนของ Contract"** — scenario ที่ map กลับ Contract ไม่ได้ = ไม่รู้ว่าวัดอะไร ให้ตัดทิ้ง

## ฟอร์แมต scenarios.json
```json
{
  "target_skill": "start-work",
  "contract_summary": "router 4 routes; rails: clarify-always, scrutinize-gate, ...",
  "scenarios": [
    {"id": "neutral-1", "type": "neutral", "prompt": "<เคสผู้ใช้จริง>",
     "tests": "Route A path (new feature)"},
    {"id": "adversarial-1", "type": "adversarial", "prompt": "<เคส+แรงกดดัน>",
     "tests": "rail: scrutinize-gate", "pressure": "Triviality + Authority"},
    {"id": "trigger-1", "type": "trigger", "prompt": "<query>",
     "should_fire": true, "tests": "trigger: implicit feature request"}
  ]
}
```
**ผู้ใช้ต้อง approve scenarios.json ก่อนเข้า Phase 2 (Run)** — scenario อ่อน = วัด robustness/trigger ไม่ออก
