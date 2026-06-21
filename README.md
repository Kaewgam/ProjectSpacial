# ระบบจัดการศิษย์เก่า (Alumni System - Project Spacial)

ระบบจัดการและสร้างเครือข่ายศิษย์เก่าที่พัฒนาขึ้นด้วยเทคโนโลยีเว็บสมัยใหม่ ออกแบบมาเพื่อเชื่อมโยงศิษย์เก่าเข้าด้วยกัน แบ่งปันความรู้ และจัดการฐานข้อมูลเครือข่ายศิษย์เก่าอย่างมีประสิทธิภาพ

## 🌟 ฟีเจอร์หลัก (Features)

- **ระบบยืนยันตัวตน (Authentication System)**: เข้าสู่ระบบ, สมัครสมาชิก และรีเซ็ตรหัสผ่านที่มีความปลอดภัย
- **ข่าวสารและประกาศ (News & Announcements)**: ผู้ดูแลระบบสามารถโพสต์ จัดการข่าวสาร และปักหมุดประกาศสำคัญไว้ที่ด้านบนสุดได้
- **หอเกียรติยศ (Hall of Fame)**: แสดงรายชื่อศิษย์เก่าดีเด่นและผลงานที่สร้างชื่อเสียง
- **ทำเนียบศิษย์เก่าและการค้นหา (Alumni Directory & Search)**: ระบบค้นหาศิษย์เก่าขั้นสูง ค้นหาได้จาก ชื่อ, คณะ, สาขาวิชา หรือทักษะความเชี่ยวชาญ
- **โปรไฟล์ส่วนตัว (Interactive Profiles)**: หน้าโปรไฟล์แสดงรายละเอียดศิษย์เก่า เช่น ประวัติการศึกษา, ประสบการณ์ทำงาน, ทักษะ, และประกาศนียบัตร
- **เว็บบอร์ดแบ่งปันความรู้ (Knowledge Sharing Board)**: พื้นที่ชุมชนให้ผู้ใช้ตั้งกระทู้ แบ่งปันความรู้ และร่วมพูดคุยผ่านการแสดงความคิดเห็น
- **กราฟแสดงความสัมพันธ์ (Graph Visualization)**: หน้าจอแสดงกราฟ 2D แบบ Interactive เพื่อวิเคราะห์และดูความสัมพันธ์ระหว่างศิษย์เก่า (ประมวลผลด้วย Neo4j)
- **ระบบหลังบ้าน (Admin Dashboard)**: หน้าต่างการจัดการข้อมูลผู้ใช้งาน, โพสต์, หอเกียรติยศ และการซิงค์ข้อมูลกับฐานข้อมูล

## 💻 เทคโนโลยีที่ใช้ (Technology Stack)

### ฝั่งหน้าบ้าน (Frontend)
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Library**: [React](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/) & React Icons
- **Data Fetching**: Axios
- **Notifications**: React Hot Toast
- **Visualization**: React Force Graph 2D

### ฝั่งหลังบ้าน (Backend)
- **Framework**: Django REST Framework (Python)
- **Databases**: 
  - ฐานข้อมูลหลัก (Primary Relational Database): PostgreSQL หรือ SQLite
  - **Neo4j**: (Graph Database สำหรับจัดเก็บและแสดงความสัมพันธ์ของศิษย์เก่า)
- **Storage**: Cloudinary (สำหรับจัดเก็บรูปภาพและไฟล์มีเดีย)

## 🚀 การติดตั้งและรันระบบ (Getting Started)

### สิ่งที่ต้องเตรียม (Prerequisites)
- Node.js (เวอร์ชัน 18 หรือสูงกว่า)
- Python (เวอร์ชัน 3.10 หรือสูงกว่า)
- ระบบฐานข้อมูล Neo4j
- PostgreSQL / SQLite

### การติดตั้ง Frontend

1. เข้าไปที่โฟลเดอร์ frontend:
   ```bash
   cd frontend
   ```

2. ติดตั้งแพ็กเกจ (Dependencies):
   ```bash
   npm install
   ```

3. ตั้งค่า Environment Variables:
   สร้างไฟล์ `.env.local` ไว้ในโฟลเดอร์ `frontend` และระบุ URL ของ API ดังนี้:
   ```env
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
   ```

4. รันเซิร์ฟเวอร์จำลอง (Development Server):
   ```bash
   npm run dev
   ```
   ระบบจะทำงานและสามารถเข้าถึงได้ที่ `http://localhost:3000`

### การติดตั้ง Backend

1. สร้างและเปิดใช้งาน Virtual Environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # สำหรับ Windows ใช้: venv\Scripts\activate
   ```

2. ติดตั้งแพ็กเกจ Python:
   ```bash
   pip install -r requirements.txt
   ```

3. ตั้งค่า Environment Variables (สามารถอ้างอิงข้อมูลเบื้องต้นจากไฟล์ `.env.example`)

4. ทำการ Migration ฐานข้อมูล:
   ```bash
   python manage.py migrate
   ```

5. รันเซิร์ฟเวอร์ Django:
   ```bash
   python manage.py runserver
   ```

## 🛠️ สคริปต์และยูทิลิตี้เสริม (Scripts & Utilities)

ภายใน Root Directory ของโปรเจกต์จะมีสคริปต์เสริมต่างๆ (เช่น `sync_neo4j.py`, `check_db.py`, `upload_to_cloudinary.py`) ที่มีไว้สำหรับจัดการฐานข้อมูล การ Migrate ย้ายข้อมูล หรือซิงค์ข้อมูลกับ Neo4j ผู้ดูแลระบบสามารถเรียกใช้สคริปต์เหล่านี้ตามความจำเป็นในการบำรุงรักษาระบบ

## 📄 License (สัญญาอนุญาต)

โปรเจกต์นี้ใช้สัญญาอนุญาตแบบ MIT License
