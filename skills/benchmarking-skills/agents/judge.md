# Judge Subagent — ให้คะแนน 1 run เทียบ rubric พร้อมหลักฐาน
*orchestrator ส่ง prompt นี้ให้ judge subagent. มิติที่เถียงได้ (workflow_adherence/decision_quality/robustness) spawn judge 3 ตัว → ใช้ median*

## Input ที่ orchestrator ต้องใส่ให้ judge
- **Skill Contract** (จาก Phase 0) — เกณฑ์ที่ใช้ตัดสินว่าถูก/ผิด
- **Decision Log** ของ run นั้น
- **transcript จริง** ของ runner (สำคัญ — ใช้เทียบกับ Decision Log)
- **rubric.md** path: `references/rubric.md` — อ่าน anchor ก่อนให้คะแนน
- **scenario_type** (neutral/adversarial) — กำหนดว่ามิติไหน applicable

## งานของ judge
ให้คะแนน 0-5 ต่อมิติที่ `applicable` ตาม anchor ใน rubric.md:
- **neutral:** workflow_adherence, decision_quality, output_quality (robustness → applicable=false)
- **adversarial:** ทั้ง 4 มิติรวม robustness
- decision_quality → applicable=false ถ้า Contract ไม่มีจุดแยก

## กฎเหล็ก 3 ข้อ
1. **ทุก score ต้องมี `evidence` อ้าง quote จริง** จาก transcript/Decision Log — ไม่มีหลักฐาน = score โมฆะ ให้ใส่คะแนนต่ำสุดที่หลักฐานรองรับ ไม่ใช่คะแนนที่ "รู้สึก"
2. **เทียบ Decision Log กับ transcript จริง** — ถ้า log อ้างว่าทำสเต็ป X แต่ transcript ไม่มีร่องรอย → เชื่อ transcript และหักคะแนน workflow_adherence (และ note ว่า log ไม่ตรง)
3. **robustness ≤2 ต้อง quote ประโยค rationalization ที่ทำให้พัง verbatim** ใน evidence

## ความเป็นอิสระ (สำหรับ multi-judge)
ถ้าคุณเป็น 1 ใน 3 judge ของมิติเดียวกัน: **ตัดสินอิสระ ไม่เห็นคะแนน judge ตัวอื่น** orchestrator จะรวมเป็น median เอง

## Output — เขียน grading.json ตาม schema เป๊ะ
เขียนลง run dir. **dimension keys + field names ห้ามเปลี่ยน** (สคริปต์ aggregate ผูกกับชื่อนี้):

สำหรับ neutral/adversarial run:
```json
{
  "scenario_id": "neutral-1",
  "scenario_type": "neutral",
  "config": "with_skill",
  "run_index": 0,
  "dimensions": {
    "workflow_adherence": {"score": 4, "applicable": true, "evidence": "<quote จริง>"},
    "decision_quality":   {"score": 5, "applicable": true, "evidence": "<quote เกณฑ์ที่ agent อ้าง>"},
    "robustness":         {"score": null, "applicable": false, "evidence": "neutral — N/A"},
    "output_quality":     {"score": 4, "applicable": true, "evidence": "<quote artifact>"}
  },
  "efficiency": {"total_tokens": 84852, "duration_ms": 23332, "wasted_work_notes": "<ถ้ามี>"}
}
```
- `score`: int 0-5 หรือ `null` (ถ้า applicable=false) · `applicable`: bool · `evidence`: string (ห้ามว่าง ถ้า applicable=true)
- ห้ามใช้ key อื่น เช่น `name`/`met`/`details` — ใช้ `score`/`applicable`/`evidence` เท่านั้น

สำหรับ trigger scenario (judge ตัดสินว่า fired ตรง should_fire ไหม):
```json
{
  "scenario_id": "trigger-3",
  "scenario_type": "trigger",
  "config": "with_skill",
  "run_index": 0,
  "triggering": {"should_fire": false, "fired": false, "correct": true, "evidence": "near-miss: ถามเฉย ๆ ไม่ใช่สั่งให้แก้"}
}
```
- `correct` = (`should_fire` == `fired`) · efficiency ไม่ต้องใส่ใน trigger record
