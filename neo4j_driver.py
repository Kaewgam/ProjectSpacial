from neo4j import GraphDatabase
import os
from dotenv import load_dotenv

load_dotenv()

URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
USER = os.getenv("NEO4J_USER", "neo4j")
PASSWORD = os.getenv("NEO4J_PASSWORD", "")

driver = GraphDatabase.driver(
    URI, 
    auth=(USER, PASSWORD),
    connection_timeout=3,
    max_transaction_retry_time=3
)


# 📌 [สำหรับตอนพรีเซนต์: หัวใจของการสร้างกราฟ (Sync User to Neo4j)]
# ฟังก์ชันนี้ถูกเรียกใช้ตลอดเมื่อมีการ สมัครสมาชิก, แก้ไขโปรไฟล์, หรือกดปุ่ม Sync All Users จากหลังบ้าน
# หน้าที่ของมันคือเอาข้อมูลศิษย์เก่า 1 คน มาปั้นเป็นจุด (Node) และลากเส้นความสัมพันธ์ (Edges) เข้าหาคณะ สาขา และบริษัท 
def sync_user_to_neo4j(user):
    with driver.session() as session:
        profile = getattr(user, 'profile', None)
        first_name = profile.first_name if profile else ""
        last_name = profile.last_name if profile else ""
        avatar_url = profile.avatar.url if profile and profile.avatar else ""
        
        current_career = user.careers.filter(is_current=True).first() if hasattr(user, 'careers') else None
        occupation = current_career.occupation if current_career else ""

        session.run("""
            MERGE (u:User {student_id: $student_id})
            SET 
                u.first_name = $first_name,
                u.last_name = $last_name,
                u.name = $first_name + " " + $last_name,
                u.avatar = $avatar,
                u.occupation = $occupation
        """,
        student_id=user.student_id,
        first_name=first_name,
        last_name=last_name,
        avatar=avatar_url,
        occupation=occupation
        )

        # Clear old relationships
        session.run("""
            MATCH (u:User {student_id: $student_id})-[r:STUDIED_IN|BELONGS_TO|WORKS_AS|HAS_SKILL]->()
            DELETE r
        """, student_id=user.student_id)

        # 🔗 Faculty + Department
        if hasattr(user, 'educations'):
            for edu in user.educations.all():
                if edu.faculty_ref:
                    session.run("""
                        MATCH (u:User {student_id: $student_id})
                        MERGE (f:Faculty {id: $faculty_id})
                        SET f.name = $faculty
                        MERGE (u)-[:STUDIED_IN]->(f)
                    """, student_id=user.student_id, faculty_id=edu.faculty_ref.id, faculty=edu.faculty_ref.name)
                elif getattr(edu, 'other_faculty', None):
                    session.run("""
                        MATCH (u:User {student_id: $student_id})
                        MERGE (f:Faculty {id: $faculty_id})
                        SET f.name = $faculty
                        MERGE (u)-[:STUDIED_IN]->(f)
                    """, student_id=user.student_id, faculty_id=f"OTHER_{edu.other_faculty}", faculty=edu.other_faculty)

                if edu.department_ref:
                    session.run("""
                        MATCH (u:User {student_id: $student_id})
                        MERGE (d:Department {id: $department_id})
                        SET d.name = $department
                        MERGE (u)-[:BELONGS_TO]->(d)
                    """, student_id=user.student_id, department_id=edu.department_ref.id, department=edu.department_ref.name)
                elif getattr(edu, 'other_department', None):
                    session.run("""
                        MATCH (u:User {student_id: $student_id})
                        MERGE (d:Department {id: $department_id})
                        SET d.name = $department
                        MERGE (u)-[:BELONGS_TO]->(d)
                    """, student_id=user.student_id, department_id=f"OTHER_{edu.other_department}", department=edu.other_department)

        # 💼 Company & Occupation
        if hasattr(user, 'careers'):
            for car in user.careers.all():
                if car.company:
                    session.run("""
                        MATCH (u:User {student_id: $student_id})
                        MERGE (c:Company {name: $company})
                        MERGE (u)-[:WORKS_AS]->(c)
                    """, student_id=user.student_id, company=car.company)
                if car.occupation:
                    session.run("""
                        MATCH (u:User {student_id: $student_id})
                        MERGE (o:Occupation {name: $occupation})
                        MERGE (u)-[:WORKS_AS_ROLE]->(o)
                    """, student_id=user.student_id, occupation=car.occupation)

        # 🎯 Skills
        if hasattr(user, 'skills'):
            for us in user.skills.all():
                if us.skill.name:
                    session.run("""
                        MATCH (u:User {student_id: $student_id})
                        MERGE (s:Skill {name: $skill_name})
                        MERGE (u)-[:HAS_SKILL]->(s)
                    """, student_id=user.student_id, skill_name=us.skill.name)

    # 🤝 สร้าง KNOWS อัตโนมัติจาก Faculty / Department / Company เดียวกัน
    auto_create_knows()
    
    # 🧹 ลบโหนดขยะที่ไม่มีใครเชื่อมต่อ (เช่น บริษัทเก่าที่เคยพิมพ์ผิด)
    clean_orphan_nodes()

def clean_orphan_nodes():
    """
    ลบ Company และ Skill nodes ที่ไม่มี User คนไหนเชื่อมต่อแล้ว (Orphan nodes)
    """
    with driver.session() as session:
        session.run("""
            MATCH (c:Company)
            WHERE NOT (c)--()
            DELETE c
        """)
        session.run("""
            MATCH (s:Skill)
            WHERE NOT (s)--()
            DELETE s
        """)
        session.run("""
            MATCH (o:Occupation)
            WHERE NOT (o)--()
            DELETE o
        """)

# 📌 [สำหรับตอนพรีเซนต์: การเชื่อมโยงอัตโนมัติ (Auto Create Knows)]
# ฟังก์ชันนี้ใช้หลักการ Graph Traversal ทำให้โหนดเชื่อมกันเอง
# เช่น ถ้านาย A เรียนจบคณะเดียวกับนาย B ระบบจะลากเส้น [KNOWS] หากันให้อัตโนมัติ ทำให้เกิดเป็น "เครือข่าย" ขึ้นมา
def auto_create_knows():
    """
    สร้าง KNOWS ระหว่าง User ที่มีความสัมพันธ์ร่วมกัน:
    - เรียน Faculty เดียวกัน
    - อยู่ Department เดียวกัน
    - ทำงาน Company เดียวกัน
    """
    with driver.session() as session:
        # 🎓 KNOWS จาก Faculty เดียวกัน
        session.run("""
            MATCH (u1:User)-[:STUDIED_IN]->(f:Faculty)<-[:STUDIED_IN]-(u2:User)
            WHERE u1 <> u2 AND left(u1.student_id, 2) = left(u2.student_id, 2)
            MERGE (u1)-[r:KNOWS]->(u2)
            SET r.reason_faculty = f.name
        """)

        # 🏫 KNOWS จาก Department เดียวกัน
        session.run("""
            MATCH (u1:User)-[:BELONGS_TO]->(d:Department)<-[:BELONGS_TO]-(u2:User)
            WHERE u1 <> u2 AND left(u1.student_id, 2) = left(u2.student_id, 2)
            MERGE (u1)-[r:KNOWS]->(u2)
            SET r.reason_department = d.name
        """)

        # 💼 KNOWS จาก Company เดียวกัน
        session.run("""
            MATCH (u1:User)-[:WORKS_AS]->(c:Company)<-[:WORKS_AS]-(u2:User)
            WHERE u1 <> u2 AND left(u1.student_id, 2) = left(u2.student_id, 2)
            MERGE (u1)-[r:KNOWS]->(u2)
            SET r.reason_company = c.name
        """)

        # 🛠️ KNOWS จาก Occupation เดียวกัน
        session.run("""
            MATCH (u1:User)-[:WORKS_AS_ROLE]->(o:Occupation)<-[:WORKS_AS_ROLE]-(u2:User)
            WHERE u1 <> u2 AND left(u1.student_id, 2) = left(u2.student_id, 2)
            MERGE (u1)-[r:KNOWS]->(u2)
            SET r.reason_occupation = o.name
        """)

        # 🎯 KNOWS จาก ทักษะ (Skill) เดียวกัน
        session.run("""
            MATCH (u1:User)-[:HAS_SKILL]->(s:Skill)<-[:HAS_SKILL]-(u2:User)
            WHERE u1 <> u2 AND left(u1.student_id, 2) = left(u2.student_id, 2)
            MERGE (u1)-[r:KNOWS]->(u2)
            SET r.reason_skill = s.name
        """)

        # 🤝 KNOWS จากรุ่นเดียวกัน (รหัสนักศึกษา 2 ตัวแรก)
        session.run("""
            MATCH (u1:User), (u2:User)
            WHERE u1 <> u2 AND left(u1.student_id, 2) = left(u2.student_id, 2)
            MERGE (u1)-[r:KNOWS]->(u2)
            SET r.reason_year = left(u1.student_id, 2)
        """)


def delete_user_from_neo4j(student_id):
    """
    ลบ User ออกจาก Neo4j เมื่อถูกลบใน PostgreSQL (พร้อมลบความสัมพันธ์ที่เกี่ยวข้องทั้งหมด)
    """
    with driver.session() as session:
        session.run("""
            MATCH (u:User {student_id: $student_id})
            DETACH DELETE u
        """, student_id=student_id)

def cleanup_orphaned_users(valid_student_ids):
    """
    ดึงข้อมูล Node ทั้งหมด ควบคุมและลบ Node ใน Neo4j ที่ไม่มีอยู่ในฐานข้อมูล PostgreSQL
    """
    with driver.session() as session:
        result = session.run("MATCH (u:User) RETURN u.student_id AS student_id")
        neo4j_ids = {record["student_id"] for record in result if record["student_id"]}
        
        valid_ids_set = set(valid_student_ids)
        orphans = neo4j_ids - valid_ids_set
        
        if orphans:
            # ใช้ IN เพื่อลบทีเดียวทั้งหมด
            session.run("""
                MATCH (u:User)
                WHERE u.student_id IN $orphans
                DETACH DELETE u
            """, orphans=list(orphans))
            
        return list(orphans)
