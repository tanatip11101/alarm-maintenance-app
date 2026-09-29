# รายงานการใช้ AI ในการพัฒนา
**เครื่องมือ:** Claude (Anthropic)

| ขั้นตอน | สิ่งที่ AI ช่วย | สิ่งที่ผู้พัฒนาทำเอง |
|---|---|---|
| วิเคราะห์ Requirement | สรุปโจทย์เป็นรายการฟีเจอร์และเกณฑ์คะแนน | ตรวจกับเอกสารโจทย์ |
| ออกแบบ Database | ร่างตาราง ความสัมพันธ์ และ RLS ตาม Role | รัน SQL ใน Supabase, ตั้ง Admin |
| เขียนโค้ด | สร้างโครง Next.js, CRUD, Dashboard, Validation, Export CSV | ทดสอบใช้งานจริง แก้ตามผลทดสอบ |
| CI/CD | เขียน GitHub Actions workflow | ตั้ง env ใน Vercel และ Deploy |
| Debug | อธิบาย error และเสนอวิธีแก้ | นำไปทดสอบซ้ำ |

**ข้อสังเกต:** AI ช่วยให้ได้โครงเร็ว แต่ต้องตรวจสิทธิ์ (RLS/trigger) และ Validation ด้วยตัวเองเสมอ
**Checklist ทดสอบ:** สมัคร 2 บัญชี (Admin/Technician), Technician ลบเครื่องไม่ได้, Technician แก้ได้เฉพาะสถานะ Alarm, Machine ID ซ้ำต้องแจ้งเตือน
