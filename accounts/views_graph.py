import os
from django.http import JsonResponse
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()

URI      = os.getenv("NEO4J_URI", "bolt://localhost:7687")
USER     = os.getenv("NEO4J_USER", "neo4j")
PASSWORD = os.getenv("NEO4J_PASSWORD", "")

driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))


# 📌 [สำหรับตอนพรีเซนต์: โหลดข้อมูลกราฟความสัมพันธ์ (Graph Tracking)]
# API ตัวนี้เป็นพระเอกของหน้าเครือข่าย ทำหน้าที่วิ่งไปดึงข้อมูล Node และเส้น (Relationship) ทั้งหมดจาก Neo4j
# แล้วเอามาแปลงเป็น JSON โยนกลับไปให้หน้าเว็บวาดเป็นรูปใยแมงมุมครับ
def get_graph_data(request):
    with driver.session() as session:
        # ดึง Node ทั้งหมด (ไม่เอา Node ขยะที่ไม่มีเส้นเชื่อม ยกเว้น User)
        all_nodes_result = session.run("""
            MATCH (n)
            WHERE (n:User) OR (n)--()
            RETURN n, labels(n) AS n_labels
        """)

        # ดึง Relationship ทั้งหมด
        result = session.run("""
            MATCH (n)-[r]->(m)
            RETURN
                n, labels(n) AS n_labels,
                r, type(r) AS r_type,
                m, labels(m) AS m_labels
        """)

        nodes_dict = {}
        links = []

        def label_to_type(labels):
            """แปลง Neo4j labels → type string ที่ frontend ใช้"""
            priority = ["User", "Faculty", "Department", "Company"]
            for p in priority:
                if p in labels:
                    return p.lower()
            return "unknown"

        def node_to_id(node, labels):
            """ใช้ student_id สำหรับ User, ใช้ name สำหรับ Faculty/Department/Company"""
            if "User" in labels:
                return node.get("student_id", str(node.element_id))
            return node.get("name", str(node.element_id))

        def node_to_dict(node, labels):
            node_type = label_to_type(labels)
            node_id = node_to_id(node, labels)
            return {
                "id": node_id,
                "name": node.get("name", node_id),
                "type": node_type,
                "avatar": node.get("avatar"),
                "faculty": node.get("faculty"),
                "department": node.get("department"),
                "occupation": node.get("occupation"),
                "company": node.get("company"),
            }

        # ขั้นที่ 1: ใส่ Node ทุกตัวก่อน (รวมถึง User ที่ไม่มี relationship)
        for record in all_nodes_result:
            n = record["n"]
            labels = list(record["n_labels"])
            node_id = node_to_id(n, labels)
            if node_id not in nodes_dict:
                nodes_dict[node_id] = node_to_dict(n, labels)

        # ขั้นที่ 2: เพิ่ม links และ node ที่แสดงใน relationship
        for record in result:
            n1 = record["n"]
            n2 = record["m"]
            n1_labels = list(record["n_labels"])
            n2_labels = list(record["m_labels"])
            r_type = record["r_type"]

            n1_id = node_to_id(n1, n1_labels)
            n2_id = node_to_id(n2, n2_labels)

            if n1_id not in nodes_dict:
                nodes_dict[n1_id] = node_to_dict(n1, n1_labels)
            if n2_id not in nodes_dict:
                nodes_dict[n2_id] = node_to_dict(n2, n2_labels)

            links.append({
                "source": n1_id,
                "target": n2_id,
                "type": r_type,
                "reason_faculty": record["r"].get("reason_faculty"),
                "reason_department": record["r"].get("reason_department"),
                "reason_company": record["r"].get("reason_company"),
                "reason_year": record["r"].get("reason_year"),
            })

        return JsonResponse({
            "nodes": list(nodes_dict.values()),
            "links": links,
        })