"""
ทดสอบตรวจข้อมูล KNOWS ใน Neo4j ว่ามี reason properties หรือยัง
"""
from neo4j import GraphDatabase

URI = "bolt://localhost:7687"
USER = "neo4j"
PASSWORD = "12345678"

driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))

with driver.session() as session:
    # 1. ตรวจจำนวน KNOWS ทั้งหมด
    total = session.run("MATCH ()-[r:KNOWS]->() RETURN count(r) AS c").single()["c"]
    print(f"[1] จำนวนเส้น KNOWS ทั้งหมด: {total}")

    # 2. ตรวจว่ามีเส้นไหนที่มี reason properties บ้าง
    with_reason = session.run("""
        MATCH ()-[r:KNOWS]->()
        WHERE r.reason_faculty IS NOT NULL 
           OR r.reason_department IS NOT NULL 
           OR r.reason_company IS NOT NULL 
           OR r.reason_year IS NOT NULL
        RETURN count(r) AS c
    """).single()["c"]
    print(f"[2] จำนวนเส้น KNOWS ที่มี reason: {with_reason}")

    # 3. แสดงตัวอย่างเส้น KNOWS 5 รายการ
    print("\n[3] ตัวอย่างเส้น KNOWS:")
    result = session.run("""
        MATCH (a:User)-[r:KNOWS]->(b:User)
        RETURN a.student_id AS from_id, a.name AS from_name,
               b.student_id AS to_id, b.name AS to_name,
               r.reason_faculty AS rf, r.reason_department AS rd,
               r.reason_company AS rc, r.reason_year AS ry
        LIMIT 5
    """)
    for rec in result:
        reasons = []
        if rec["rf"]: reasons.append(f"คณะ: {rec['rf']}")
        if rec["rd"]: reasons.append(f"สาขา: {rec['rd']}")
        if rec["rc"]: reasons.append(f"บริษัท: {rec['rc']}")
        if rec["ry"]: reasons.append(f"รุ่น: {rec['ry']}")
        reason_str = ", ".join(reasons) if reasons else "(ไม่มี reason)"
        print(f"  {rec['from_name']}({rec['from_id']}) -> {rec['to_name']}({rec['to_id']}) | {reason_str}")

    # 4. ตรวจ Node ทั้งหมด
    nodes = session.run("MATCH (n) RETURN labels(n) AS lbl, count(n) AS c").data()
    print("\n[4] จำนวน Node แต่ละประเภท:")
    for n in nodes:
        print(f"  {n['lbl']}: {n['c']}")

driver.close()
print("\n✅ ทดสอบเสร็จสิ้น")
