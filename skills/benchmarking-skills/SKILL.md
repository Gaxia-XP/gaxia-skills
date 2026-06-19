---
name: benchmarking-skills
description: Use when the user wants to benchmark, test, score, evaluate, or measure how well another Claude Code skill performs — how an agent flows through its workflow, makes decisions at branch points, and holds up under pressure — or asks for tuning guidance to improve a skill. Triggers on "benchmark this skill", "ทดสอบ skill", "skill นี้ดีไหม", "ให้คะแนน skill", "ปรับจูน skill", and when a target SKILL.md path is given for evaluation.
---

# Benchmarking Skills

You orchestrate a 6-phase benchmark of a TARGET skill. Drive each phase by invoking the named subagent or script yourself. The output is a `scorecard.md` + `tuning-report.md` backed by real evidence — never a static opinion.

## Rules (rails — อ่านก่อนเริ่ม)
1. **ห้ามให้คะแนนโดยไม่รัน scenario จริง.** การวิจารณ์ skill จากการอ่าน SKILL.md เฉย ๆ คือการละเมิด ไม่ใช่ทางลัด — สิ่งที่ skill นี้วัด (การไหลของ workflow + การตัดสินใจ + ทนแรงกดดัน) มองไม่เห็นจาก static review
2. **ทุก score ต้องมีหลักฐาน** อ้าง quote จริงจาก transcript/Decision Log — score ที่ "รู้สึก" เป็นโมฆะ
3. **รัน baseline (with/without skill) เสมอ** เว้นผู้ใช้สั่งปิด — ไม่มี baseline = ไม่รู้ว่า skill สร้าง delta จริงไหม
4. **ผู้ใช้ต้อง approve scenarios.json ก่อน Phase 2** — scenario อ่อน = วัดอะไรไม่ออก
5. **Pressure changes depth, not steps** — ใช้กับทั้งตัวเรา (อย่าลัดเฟส) และเป็นเกณฑ์ตัดสิน robustness ของ skill เป้าหมาย

## The 6 Phases

### Phase 0 — Profile: สกัด Skill Contract
อ่าน SKILL.md เป้าหมาย (+ references/agents ของมัน) → สกัด **Skill Contract** (ดู `references/scenario-design.md` หัวข้อ "Skill Contract คืออะไร"): ลำดับสเต็ป, จุดแยก+เกณฑ์, gate/exit, sub-skill ที่ต้องเรียก **(เช็คว่ามีจริงใน available skills — ถ้าอ้าง skill ที่ไม่มี = banner เป็นบั๊กใน Contract)**, rails/red-flags, output คาดหวัง, เงื่อนไข trigger.
**Exit:** มี Contract ครบ 7 ข้อ. ถ้าไม่มีลำดับสเต็ป/จุดแยก → เปิด **fallback** (ดู rubric) แล้วแจ้งผู้ใช้

### Phase 1 — Scenario: สร้างสถานการณ์
ตาม `references/scenario-design.md` + `references/pressure-taxonomy.md`: neutral 3-5, adversarial 3-5 (เจาะ rail แต่ละตัว), trigger 8-10 (should/should-not). เขียน `scenarios.json`.
**Exit:** ผู้ใช้ approve scenarios.json

### Phase 2 — Run: spawn runner subagents
ต่อ scenario spawn **runner** (ตาม `agents/runner.md`) — รัน skill เป้าหมายจริง + บันทึก Decision Log. รัน **with_skill และ baseline** และ **×3 ต่อ config** เพื่อวัด variance. เก็บ transcript + decision-log.md + efficiency (tokens/duration จาก task notification) ลง `<target>-benchmark/iteration-N/<scenario_id>/<config>/run-<index>/`.
**Exit:** ทุก run มี decision-log.md + transcript

### Phase 3 — Judge: spawn judge subagents
ต่อ run spawn **judge** (ตาม `agents/judge.md`) อ่าน rubric + Contract + Decision Log + **transcript จริง** → เขียน `grading.json`. มิติที่เถียงได้ (workflow_adherence/decision_quality/robustness) spawn **judge 3 ตัว → median**. trigger records ตัดสิน correct = (should_fire==fired).
**Exit:** ทุก run มี grading.json ตาม schema

### Phase 4 — Aggregate: รวมเป็น scorecard
รัน (cwd = scripts dir):
```bash
python aggregate_scorecard.py <iteration_dir> --skill-name <target-name>
```
ได้ `scorecard.json` + `scorecard.md`: mean±stddev ต่อมิติ, overall+grade, delta with/without, flags (high_variance/non_discriminating).
**Exit:** scorecard.md สร้างแล้ว

### Phase 5 — Tune: รายงานแนวทางปรับ
ตาม `agents/tuning-advisor.md`: map คะแนนต่ำ/flag/จุดพัง → คำสั่งแก้รูปธรรม อ้างเทคนิคจาก `references/skill-authoring-techniques.md` → `tuning-report.md` เรียงตามความสำคัญ.
**Exit:** tuning-report.md ทุกข้อผูกหลักฐานจริง

## Scale & rate-limit robustness (Phase 2-3 fan-out)
Phase 2-3 spawn subagent จำนวนมาก (runner+judge รวมอาจ 100+). บทเรียนจริง: fan-out พร้อมกันที่ concurrency cap (~16) ทำให้ server ตอบ "Server is temporarily limiting requests (not your usage limit)" แล้ว **starve ตัวท้าย batch** — ล้มได้ ~ครึ่ง. recipe:
1. **Chunk fan-out:** ถ้า runner+judge รวม >50 อย่า parallel ทีเดียว — `await parallel()` ทีละ slice ~6 (บังคับ concurrency ≤6 + เว้นจังหวะระหว่าง chunk). หลักฐาน: chunk-6 ผ่าน 46/46 หลัง cap-16 ล้ม ~50%.
2. **Decouple runner (แพง, รอดแล้วเก็บไว้) จาก judge (ถูก, เติมใหม่ได้)** — อย่า re-run ทั้ง matrix เพื่อแก้ partial fail; runner เป็นส่วนที่แพงและไม่ควรทิ้ง.
3. **Recovery แบบ idempotent:** คำนวณ gap (run ไหนขาด grading-j ไหน / trigger ไหนยังไม่มี) แล้ว spawn เฉพาะรู; ให้ agent self-skip ถ้าไฟล์ปลายทางมีอยู่แล้ว → re-run ได้เรื่อย ๆ จน gap ปิด.
4. ถ้าใช้ Workflow tool: **bake พารามิเตอร์ลงตัว script ตรง ๆ** — `args` อาจไม่ถึง script (เคยเจอ script เห็น `{}` แล้วรัน default เต็ม).

## Fallback (reference / style skill)
ถ้า Phase 0 พบว่า skill เป้าหมายไม่มี workflow/จุดแยกชัด → ตัด workflow_adherence + decision_quality + robustness (applicable=false) เหลือ **triggering + output_quality** (ดู `references/rubric.md` หัวข้อ fallback). อย่าฝืนวัด workflow ที่ skill ไม่มี

## Rationalizations — สังเกตจาก baseline จริง ทั้งหมดผิด
| ข้ออ้าง | ความจริง |
|---|---|
| "อ่าน SKILL.md ก็ประเมินได้ ไม่ต้องรัน" | static review ไม่เห็นการไหล/การตัดสินใจจริง — นั่นคือสิ่งที่ skill นี้วัด ต้องรัน scenario |
| "ให้คะแนนจากความรู้สึกพอ" | score ไม่มีหลักฐาน = โมฆะ — judge บังคับ quote |
| "baseline ไม่จำเป็น" | ไม่มี baseline = ไม่รู้ว่า skill สร้าง delta จริงไหม (อาจได้ผลเท่า agent เปล่า) |
| "scenario เดียว/รอบเดียวพอ" | variance สูง — รันหลายรอบ + หลาย branch ถึงเชื่อได้ |
| "ข้าม adversarial ก็ได้ skill ดูดีแล้ว" | robustness คือจุดที่ workflow skill พังเงียบ — ห้ามข้าม |
| "Decision Log บอกว่าทำครบ เชื่อได้" | runner อาจเขียน log สวยกว่าจริง — judge ต้องเทียบ transcript |

## Red Flags — STOP แล้วกลับมาอ่าน skill นี้
- กำลังจะให้คะแนนแต่ยังไม่ได้ spawn runner / ยังไม่มี transcript
- score ไหนไม่มี evidence
- ข้าม adversarial หรือข้าม baseline โดยผู้ใช้ไม่ได้สั่ง
- เชื่อ Decision Log โดยไม่เทียบ transcript
- กำลังวัด workflow ของ skill ที่ไม่มี workflow (ควร fallback)

## Completion
จบเมื่อมี **scorecard.md + tuning-report.md** พร้อมหลักฐาน. สรุปให้ผู้ใช้: เกรดรวม with/without + delta, จุดเด่น/จุดพันที่มีหลักฐาน, คำแนะนำ P1 พร้อมข้อเสนอวน re-benchmark
