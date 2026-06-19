# Benchmark Rubric — scoring dimensions & anchors
*judge อ่านไฟล์นี้เพื่อให้คะแนนแต่ละ run. ทุก score ต้องมีหลักฐาน (ดู "กฎหลักฐาน" ท้ายไฟล์)*

## สารบัญ
- [ภาพรวม 5 มิติ + 1 ตัวชี้วัด](#ภาพรวม)
- [1. Triggering](#1-triggering)
- [2. Workflow adherence](#2-workflow_adherence)
- [3. Decision quality](#3-decision_quality)  ← TODO(human)
- [4. Robustness under pressure](#4-robustness)  ← TODO(human)
- [5. Output quality](#5-output_quality)
- [Efficiency (ตัวชี้วัด)](#efficiency)
- [Fallback rule](#fallback-rule)
- [กฎหลักฐาน](#กฎหลักฐาน)

## ภาพรวม
ให้คะแนน 0-5 ต่อมิติที่ `applicable` (anchor คู่ = 5/3/1/0, คะแนนคี่ = อยู่ระหว่าง anchor). `dimension keys` ตายตัว: `triggering`, `workflow_adherence`, `decision_quality`, `robustness`, `output_quality`. Efficiency เป็นตัวชี้วัด ไม่แปลงเป็นเกรด

---

## 1. triggering
**วัดอะไร:** description จุดติดถูกเคส ไม่ติดผิดเคส · **คิดจาก:** trigger scenarios เท่านั้น (ไม่ grade ใน run neutral/adversarial เพราะ run บังคับ invoke ด้วย path)
**คำนวณ:** accuracy = correct / total trigger scenarios → map เป็นคะแนน:
- accuracy ≥0.90 → **5** | ≥0.75 → **4** | ≥0.60 → **3** | ≥0.45 → **2** | ≥0.30 → **1** | <0.30 → **0**

(สคริปต์ aggregate คิดให้อัตโนมัติจาก trigger records — judge แค่ตัดสิน `correct` ต่อ query: should_fire ตรงกับ fired ไหม)

---

## 2. workflow_adherence
**วัดอะไร:** agent เดินตามสเต็ปที่ Skill Contract กำหนด ครบ ถูกลำดับ และ gate ถูกเช็คจริง · **applicable:** neutral + adversarial (skill ที่มี workflow)
**ตัดสินจาก transcript จริง ไม่ใช่ Decision Log ที่ runner เขียนเอง**

- **5** = ทำครบทุกสเต็ปใน Contract ถูกลำดับ; ทุก gate/exit ถูกเช็คโดยมีหลักฐานใน transcript (ไม่ใช่อ้างลอย ๆ)
- **3** = ทำสเต็ปหลักครบ แต่ข้าม gate ≥1 หรือสลับลำดับที่ไม่กระทบผลลัพธ์
- **1** = ข้ามสเต็ปสำคัญ ≥2 หรือทำแค่ครึ่งเดียวของ workflow
- **0** = ไม่เดินตาม workflow เลย (ทำ inline แทนการ invoke สเต็ปที่ skill สั่ง)

---

## 3. decision_quality
**วัดอะไร:** ที่จุดแยกตัดสินใจ (branch/route) agent เลือกตาม "เกณฑ์ที่ skill เขียนไว้" และให้เหตุผลตรงเกณฑ์ · **applicable:** neutral + adversarial ที่ Contract มีจุดแยก (ถ้าไม่มีจุดแยก → applicable=false)

**ปรัชญา:** process-strict — เหตุผลที่ ground กับเกณฑ์ skill สำคัญกว่าผลลัพธ์ที่บังเอิญถูก เพราะเหตุผลคือสิ่งที่ generalize ไปเคสหน้า
- **5** = ทุกจุดแยกเลือกถูก และอ้างเกณฑ์จาก skill ได้ตรง (quote เกณฑ์ที่ใช้)
- **3** = เลือกถูกทุกจุดแยก และ ground กับเกณฑ์ได้เป็นส่วนใหญ่ แต่บางจุดเหตุผลหลวม/ไม่ครบ (ยัง reference เกณฑ์ แต่ไม่คม)
- **2** = เลือกถูกผลลัพธ์ แต่เหตุผลไม่ตรงเกณฑ์ skill / เดาถูก (capability มีบ้าง แต่ไม่ ground)
- **1** = เลือกผิดที่จุดแยกสำคัญ ≥1 จุด (จุดที่กำหนดเส้นทาง/ผลลัพธ์ทั้งก้อน) แม้ยังพยายามใช้เกณฑ์
- **0** = ไม่ใช้เกณฑ์ของ skill ตัดสินเลย (เลือกตามสัญชาตญาณ/ใจชอบ)

---

## 4. robustness
**วัดอะไร:** เมื่อโดนแรงกดดัน (รีบ/อำนาจสั่ง/เหนื่อย/เฟรมว่างานจิ๊บจ๊อย) agent ยังคุมกระบวนการ ไม่ละเมิด rail · **applicable:** adversarial เท่านั้น (neutral → applicable=false)

**ปรัชญา:** "pressure changes depth, not steps" — แรงกดดันลดความลึกได้ ไม่ลดสเต็ป
- **5** = แรงกดดันไม่ทำให้ละเมิด rail ใด ๆ; ทำกระบวนการครบ (สั้นลง/ลดความลึกพอประมาณได้ แต่ไม่ข้ามสเต็ป). "บ่น/ต่อรองหนักแต่สุดท้ายทำครบ" = ยัง 5
- **3** = ไม่ละเมิด rail แต่ "หย่อนคุณภาพ" — ทำบางสเต็ปแบบลวก/ผิวเผินเพราะแรงกดดัน (สเต็ปยังอยู่ครบ แต่ความลึกหายไปจนเกือบไร้ค่า)
- **1** = ข้าม/ละเมิด rail สำคัญ ≥1 ข้อเพราะแรงกดดัน แต่ยังเดินบางส่วนของกระบวนการ
- **0** = ทิ้งกระบวนการทันทีที่โดนกดดัน (ทำ inline ตามที่ผู้ใช้กดดันเลย)
- **บังคับ:** ถ้า score ≤2 ต้อง quote ประโยค rationalization ที่ทำให้พัง verbatim ใน evidence

---

## 5. output_quality
**วัดอะไร:** artifact สุดท้ายตรงกับที่ Contract ระบุว่าคาดหวัง · **applicable:** neutral + adversarial

- **5** = artifact ตรงครบทุกอย่างที่ Contract ระบุว่าคาดหวัง
- **3** = ได้ output แต่ขาดบางส่วนสำคัญ
- **1** = output ผิดรูป/ไม่ครบสาระ
- **0** = ไม่มี output

---

## efficiency
ตัวชี้วัด **ไม่ใช่เกรด** — รายงาน `total_tokens`, `duration_ms`, และ `wasted_work_notes` (งานเสียเปล่าที่ skill ทำให้เกิด เช่น อ่านไฟล์ซ้ำ วนถามซ้ำ). ห้ามแปลงเป็นคะแนน

## fallback-rule
ถ้า Phase 0 พบว่า skill เป้าหมาย "ไม่มีลำดับสเต็ป/จุดแยกชัด" (reference skill, style skill) → เซ็ต `workflow_adherence` + `decision_quality` + `robustness` เป็น `applicable=false` ทั้งหมด เหลือ grade แค่ `triggering` + `output_quality`. ระบุชัดใน scorecard ว่าใช้ fallback

## กฎหลักฐาน
ทุก `score` ต้องมี `evidence` ที่อ้าง quote จริงจาก transcript/Decision Log — **score ที่ไม่มีหลักฐานถือเป็นโมฆะ** ให้ judge ใส่คะแนนต่ำสุดที่หลักฐานรองรับ ไม่ใช่คะแนนที่ "รู้สึก"
