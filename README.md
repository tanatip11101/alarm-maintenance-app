# Alarm & Maintenance Management System
ระบบบันทึกและติดตาม Alarm / งานซ่อมบำรุงเครื่องจักรในโรงงาน (Programming in Automation Systems)

**Vercel URL:** https://alarm-maintenance-app.vercel.app

## Function หลัก
- Login/Logout (Supabase Auth) และ Role: Admin, Technician (คุมสิทธิ์ด้วย RLS)
- Machine Master (CRUD, Machine ID ห้ามซ้ำ), Alarm Record, Maintenance Record
- Search + Filter (ข้อความ + สถานะ + ช่วงวันที่) และ Export CSV, Dashboard (จำนวนเครื่อง/สถานะ/Alarm/Maintenance + กราฟแท่ง)
- Input Validation พร้อมข้อความแจ้งเตือน

## สิทธิ์
| Role | สิทธิ์ |
|---|---|
| Admin | จัดการทุกตาราง |
| Technician | ดูเครื่อง, เพิ่ม/แก้ Maintenance, เปลี่ยนสถานะ Alarm, ดู Dashboard |
| Viewer | ดูข้อมูลและ Dashboard ได้อย่างเดียว (แก้ไขไม่ได้) |

## ฟีเจอร์พิเศษ (Bonus)
- **Role Viewer:** ดูข้อมูลได้อย่างเดียว ฐานข้อมูลบล็อกการเขียนด้วย RLS
- **Machine History:** ปุ่ม History ในหน้า Machines แสดง Alarm และ Maintenance ทั้งหมดของเครื่อง
- **Audit Log:** บันทึกการเพิ่ม/แก้/ลบทุกตารางอัตโนมัติด้วย trigger (Admin ดูได้ที่แท็บ Audit)
- **กราฟ Alarm:** Alarm ตามเครื่อง และ Alarm ย้อนหลัง 7 วัน ใน Dashboard
- **Notification:** แบนเนอร์แจ้งจำนวน Alarm ที่ยังเปิดอยู่
- **Responsive UI / Dark Mode:** ปุ่มสลับธีมมุมขวาบน
- **Export CSV** และ **Filter ตามช่วงวันที่**
- **Change Request:** เพิ่มสถานะ Waiting Part ใน Maintenance
- **จัดการผู้ใช้:** Admin เปลี่ยนบทบาทและชื่อที่แสดงของผู้ใช้ได้ที่แท็บ Users
- **ลืมรหัสผ่าน:** ส่งลิงก์รีเซ็ตทางอีเมลและตั้งรหัสผ่านใหม่ผ่าน Supabase Auth
- **หน้า Login แบบใหม่:** สลับสมัคร/เข้าสู่ระบบ แสดงรหัสผ่าน และตรวจรูปแบบอีเมล
- **กราฟแนวตั้ง:** สถานะเครื่อง สถานะ Alarm สถานะ Maintenance Alarm ตามเครื่อง และ Alarm ย้อนหลัง 7 วัน

ไฟล์ SQL ของฟีเจอร์เหล่านี้คือ `supabase/bonus.sql` (รันต่อจาก `schema.sql`)

## Tech
Next.js 14, Tailwind CSS, Supabase, GitHub Actions, Vercel

## Database
`profiles(id→auth.users, full_name, role)` · `machines(id, machine_id unique, name, type, location, status)` ·
`alarms(machine_ref→machines, alarm_code, description, occurred_at, cause, status)` ·
`maintenance_records(machine_ref→machines, maintenance_type, problem, action_taken, technician, maint_date, status)`
SQL อยู่ที่ `supabase/schema.sql`

## ติดตั้ง
1. สร้างโปรเจกต์ Supabase แล้วรัน `supabase/schema.sql` ใน SQL Editor แล้วรัน supabase/bonus.sql ต่อ
2. `cp .env.example .env.local` แล้วใส่ URL และ anon key
3. `npm install && npm run dev`
4. สมัครผู้ใช้ แล้วตั้ง Admin: `update profiles set role='admin' where full_name='อีเมล';`
5. Deploy: import repo ใน Vercel และตั้ง env 2 ตัวเดียวกัน

## การใช้ AI
ใช้ Claude ช่วยวิเคราะห์ requirement, ออกแบบ schema/RLS, เขียนโค้ด และ workflow CI (ผู้พัฒนาตรวจสอบและทดสอบเอง)
