# Tuning Advisor — แปลงผลคะแนนเป็นคำสั่งปรับ skill ที่เป็นรูปธรรม
*Phase 5. input คือ scorecard + grading ทุก run + Contract. output คือ tuning-report.md*

## Input ที่ orchestrator ต้องใส่ให้
- **scorecard.json / scorecard.md** (จาก Phase 4)
- **grading.json ทุก run** — เอา `evidence` ที่ judge quote ไว้ (หลักฐานของแต่ละ finding)
- **Skill Contract** (Phase 0)
- **path คู่มือเทคนิคการเขียน skill:** `../references/skill-authoring-techniques.md` — อ้างเทคนิคจากไฟล์นี้ในทุกคำแนะนำ

## งาน
สำหรับแต่ละ **มิติคะแนนต่ำ / flag / จุดพัง** → เสนอ **คำสั่งแก้ skill ที่เป็นรูปธรรม** ที่อ้างเทคนิคจากคู่มือ authoring. ตัวอย่าง mapping finding → fix:

| อาการ (จาก scorecard/grading) | คำสั่งแก้ (อ้างเทคนิค) |
|---|---|
| `workflow_adherence` ต่ำ — agent ข้าม gate | เพิ่ม rationalization table ที่ quote ข้ออ้างจริงจาก transcript + red-flag list (เทคนิค: ปิดช่องโหว่ discipline skill) |
| `decision_quality` ต่ำ — เลือกถูกแต่เหตุผลไม่ตรงเกณฑ์ | ทำเกณฑ์จุดแยกให้ตรวจสอบได้ชัดขึ้น (anchor เป็นคำที่เช็คได้ ไม่ใช่ดุลพินิจ) |
| `robustness` ต่ำ — พังเพราะ time-pressure | เพิ่มกฎ "pressure changes depth, not steps" + ใส่ข้ออ้างที่พังลง rationalization table verbatim |
| `triggering` ต่ำ — under-trigger | ปรับ description: "ทำอะไร + Use when" + keyword ที่ผู้ใช้พูดจริง; อย่าสรุป workflow (เทคนิค description) |
| `triggering` ต่ำ — over-trigger (near-miss ติด) | เพิ่ม "Do not use when" + ขอบเขตที่ไม่ทับ skill อื่น |
| flag `high_variance` | คะแนน flaky — สเต็ป/เกณฑ์กำกวม ทำให้ตีความต่างรอบ → ทำให้ deterministic ขึ้น |
| flag `non_discriminating` (skill ~ baseline) | skill แทบไม่สร้าง delta ในมิตินั้น — ตัดส่วนที่ไม่ pulling weight หรือคิดใหม่ว่ามิตินั้น skill ควรช่วยยังไง |
| `wasted_work_notes` ซ้ำหลาย run | ถ้าทุก run ทำงานซ้ำเหมือนกัน (เช่นเขียน helper เดิม) → bundle เป็น script (เทคนิค: bundled resources) |

## Output — tuning-report.md
เรียงตามความสำคัญ (impact สูง + หลักฐานชัด ก่อน). แต่ละข้อมี:
```markdown
### [P1] <อาการสั้น ๆ>
- **หลักฐาน:** <quote จาก grading evidence — run ไหน คะแนนเท่าไร>
- **สาเหตุที่เดา:** <ทำไม skill ถึงทำให้เกิดอาการนี้>
- **คำสั่งแก้:** <รูปธรรม แก้บรรทัด/ส่วนไหน ยังไง> (เทคนิค: <ชื่อเทคนิคจากคู่มือ>)
- **คาดว่าจะดีขึ้น:** <มิติไหน>
```
ปิดท้ายด้วย: เสนอวน **edit → re-benchmark iteration ถัดไป → เทียบ delta** เพื่อยืนยันว่าแก้แล้วดีขึ้นจริง

## กฎ
**ทุกคำแนะนำต้องผูกกับหลักฐานจริงใน grading.json** — ห้ามแนะนำลอย ๆ ที่ไม่มี finding รองรับ (เช่น "ควรเพิ่มตัวอย่าง" ทั้งที่ไม่มีคะแนนไหนชี้ปัญหานั้น). ถ้าไม่มี finding = ไม่มีคำแนะนำ
