from neo4j import GraphDatabase

URI = "bolt://localhost:7687"
USER = "neo4j"
PASSWORD = "12345678"

driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))


def sync_user_to_neo4j(user):
    with driver.session() as session:
        avatar_url = user.avatar.url if user.avatar else ""
        session.run("""
            MERGE (u:User {student_id: $student_id})
            SET 
                u.first_name = $first_name,
                u.last_name = $last_name,
                u.name = $first_name + " " + $last_name,
                u.avatar = $avatar
        """,
        student_id=user.student_id,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        role=user.role,
        avatar=avatar_url
        )

        # 🔗 Faculty + Department
        if user.faculty:
            session.run("""
                MATCH (u:User {student_id: $student_id})
                MERGE (f:Faculty {name: $faculty})
                MERGE (u)-[:STUDIED_IN]->(f)
            """, student_id=user.student_id, faculty=user.faculty)

        if user.department:
            session.run("""
                MATCH (u:User {student_id: $student_id})
                MERGE (d:Department {name: $department})
                MERGE (u)-[:BELONGS_TO]->(d)
            """, student_id=user.student_id, department=user.department)

        # 💼 Occupation → Company
        if user.occupation:
            session.run("""
                MATCH (u:User {student_id: $student_id})
                MERGE (c:Company {name: $occupation})
                MERGE (u)-[:WORKS_AS]->(c)
            """, student_id=user.student_id, occupation=user.occupation)

    # 🤝 สร้าง KNOWS อัตโนมัติจาก Faculty / Department / Company เดียวกัน
    auto_create_knows()


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
            WHERE u1 <> u2
            MERGE (u1)-[:KNOWS]->(u2)
        """)

        # 🏫 KNOWS จาก Department เดียวกัน
        session.run("""
            MATCH (u1:User)-[:BELONGS_TO]->(d:Department)<-[:BELONGS_TO]-(u2:User)
            WHERE u1 <> u2
            MERGE (u1)-[:KNOWS]->(u2)
        """)

        # 💼 KNOWS จาก Company เดียวกัน
        session.run("""
            MATCH (u1:User)-[:WORKS_AS]->(c:Company)<-[:WORKS_AS]-(u2:User)
            WHERE u1 <> u2
            MERGE (u1)-[:KNOWS]->(u2)
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
