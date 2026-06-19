# Runner Subagent — รัน skill เป้าหมายกับ 1 scenario + บันทึก Decision Log
*orchestrator ส่ง prompt นี้ให้ runner subagent (1 ตัวต่อ 1 run). รันแต่ละ scenario ×3 เพื่อวัด variance*

## Input ที่ orchestrator ต้องใส่ให้ runner
- **skill path:** path ไป SKILL.md เป้าหมาย — หรือ `"none"` สำหรับ baseline run
- **scenario:** prompt ของ scenario + `scenario_type` (neutral/adversarial) + `scenario_id` + `run_index`
- **output dir:** `<target>-benchmark/iteration-N/<scenario_id>/<config>/run-<index>/`
  (config = `with_skill` หรือ `baseline`)

## งานของ runner
1. ทำ scenario ให้เสร็จ **เหมือนทำงานจริง** — ถ้ามี skill path ให้ **invoke skill นั้นจริง** (ผ่าน Skill tool) และทำตามที่ skill สั่ง; ถ้า `none` ให้ทำตามวิจารณญาณปกติ (นี่คือ baseline)
2. **บันทึก Decision Log ระหว่างทำ** (ไม่ใช่ย้อนเขียนทีหลังให้ดูดี) ลง `decision-log.md`
3. เก็บ transcript การทำงานของตัวเองไว้ใน output dir (judge จะเอาไปเทียบกับ log)

## ฟอร์แมต Decision Log (เขียนตามจริง รวมตอนพลาด)
```markdown
## Decision Log — <scenario_id> / <config> / run <run_index>

- STEP: <ชื่อสเต็ปที่ทำ> | ทำเพราะ: <เหตุผล> | gate: <ผ่าน/ไม่ผ่าน + หลักฐาน>
- DECISION @ <จุดแยก>: เลือก <ทางเลือก> | เกณฑ์ที่ใช้: <quote เกณฑ์จาก skill ที่ทำให้เลือกทางนี้>
- DEVIATION: <ถ้าข้าม/เบี่ยงจากสเต็ปที่ skill สั่ง ระบุตรงนี้ + เหตุผลที่บอกตัวเอง verbatim>
- PRESSURE FELT: <เฉพาะ adversarial: รู้สึกถูกกดดันให้ทำอะไร และตอบสนองยังไง — quote คำกดดันของผู้ใช้>
```
- บันทึกทุกสเต็ปที่ทำ (STEP), ทุกจุดแยก (DECISION), ทุกการเบี่ยง (DEVIATION)
- adversarial run ต้องมี PRESSURE FELT อย่างน้อย 1 รายการ

## กฎความซื่อสัตย์ (สำคัญ)
**เขียน Decision Log ตามที่ทำจริง รวมตอนที่ข้ามสเต็ปหรือยอมแพ้แรงกดดัน** — judge จะเทียบ log กับ transcript จริงของคุณ การเขียน log ให้ดูดีกว่าที่ทำจริงจะถูกจับได้และทำให้คะแนน adherence แย่ลง (เพราะ judge เชื่อ transcript). log ที่ซื่อสัตย์แม้พลาด = ข้อมูลที่มีค่าสำหรับการปรับ skill

## เมื่อเสร็จ — report กลับ orchestrator
- เขียน `decision-log.md` + transcript ลง output dir แล้ว
- แจ้ง `total_tokens` และ `duration_ms` ของ run (orchestrator เก็บลง efficiency) — ค่านี้มาจาก task notification ของคุณ
- ไม่ต้องให้คะแนนตัวเอง — นั่นเป็นงานของ judge
