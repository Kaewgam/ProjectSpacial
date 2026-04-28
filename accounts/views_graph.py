from django.http import JsonResponse
from neo4j import GraphDatabase

URI = "bolt://localhost:7687"
USER = "neo4j"
PASSWORD = "12345678"

driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))


def get_graph_data(request):
    with driver.session() as session:
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
                "faculty": node.get("faculty"),
                "department": node.get("department"),
                "occupation": node.get("occupation"),
            }

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
            })

        return JsonResponse({
            "nodes": list(nodes_dict.values()),
            "links": links,
        })