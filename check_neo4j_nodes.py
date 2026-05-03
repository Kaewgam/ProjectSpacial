"""
check_neo4j_nodes.py
ตรวจสอบ Node ทั้งหมดใน Neo4j และเปรียบเทียบกับ PostgreSQL
เพื่อหา orphaned / stale nodes ที่ควรลบออก
"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from accounts.models import User
from neo4j import GraphDatabase

# ── connection ──
URI      = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
NEO4J_U  = os.environ.get("NEO4J_USER", "neo4j")
NEO4J_PW = os.environ.get("NEO4J_PASSWORD", "12345678")

driver = GraphDatabase.driver(URI, auth=(NEO4J_U, NEO4J_PW))

SEP = "=" * 60

def run(q, **params):
    with driver.session() as s:
        return list(s.run(q, **params))

print(SEP)
print("  Neo4j Node Audit Report")
print(SEP)

# ──────────────────────────────────────────
# 1. นับ Node ทุกประเภท
# ──────────────────────────────────────────
print("\n[1] Node counts by label:")
rows = run("MATCH (n) RETURN labels(n) AS lbl, count(n) AS cnt ORDER BY cnt DESC")
for r in rows:
    print(f"    {r['lbl']} : {r['cnt']}")

# ──────────────────────────────────────────
# 2. User nodes ใน Neo4j ทั้งหมด
# ──────────────────────────────────────────
print("\n[2] User nodes in Neo4j:")
neo4j_users = run("MATCH (u:User) RETURN u.student_id AS sid, u.first_name AS fn, u.last_name AS ln")
neo4j_ids = set()
for r in neo4j_users:
    sid = r["sid"]
    neo4j_ids.add(sid)
    print(f"    {sid:<14} | {r['fn']} {r['ln']}")

# ──────────────────────────────────────────
# 3. User IDs ใน PostgreSQL
# ──────────────────────────────────────────
pg_ids = set(User.objects.values_list("student_id", flat=True))
print(f"\n[3] PostgreSQL users: {sorted(pg_ids)}")

# ──────────────────────────────────────────
# 4. เปรียบเทียบ
# ──────────────────────────────────────────
orphans  = neo4j_ids - pg_ids   # อยู่ใน Neo4j แต่ไม่อยู่ใน PG
missing  = pg_ids  - neo4j_ids  # อยู่ใน PG แต่ไม่อยู่ใน Neo4j

print(f"\n[4] Comparison:")
print(f"    Neo4j total   : {len(neo4j_ids)}")
print(f"    PostgreSQL    : {len(pg_ids)}")

if orphans:
    print(f"\n    [WARN] ORPHANED in Neo4j (ไม่มีใน PG) — ควรลบ:")
    for sid in sorted(orphans):
        print(f"      - student_id = '{sid}'")
else:
    print("\n    [OK] ไม่มี orphaned User node")

if missing:
    print(f"\n    [WARN] MISSING in Neo4j (มีใน PG แต่ไม่ sync) — ควร sync:")
    for sid in sorted(missing):
        u = User.objects.get(student_id=sid)
        print(f"      - {sid} ({u.first_name} {u.last_name})")
else:
    print("    [OK] ทุก PG user มีใน Neo4j แล้ว")

# ──────────────────────────────────────────
# 5. Relationships ทั้งหมด
# ──────────────────────────────────────────
print(f"\n[5] Relationship counts:")
rels = run("MATCH ()-[r]->() RETURN type(r) AS t, count(r) AS cnt ORDER BY cnt DESC")
for r in rels:
    print(f"    {r['t']:<20} : {r['cnt']}")

# ──────────────────────────────────────────
# 6. Faculty / Department / Company nodes
# ──────────────────────────────────────────
print(f"\n[6] Faculty nodes in Neo4j:")
for r in run("MATCH (f:Faculty) RETURN f.name AS name"):
    print(f"    - {r['name']}")

print(f"\n[7] Department nodes in Neo4j:")
for r in run("MATCH (d:Department) RETURN d.name AS name"):
    print(f"    - {r['name']}")

print(f"\n[8] Company nodes in Neo4j:")
for r in run("MATCH (c:Company) RETURN c.name AS name"):
    print(f"    - {r['name']}")

# ──────────────────────────────────────────
# 7. Nodes ที่ไม่มี relationship เลย
# ──────────────────────────────────────────
print(f"\n[9] Isolated nodes (ไม่มี relationship เลย):")
isolated = run("MATCH (n) WHERE NOT (n)--() RETURN labels(n) AS lbl, n")
if isolated:
    for r in isolated:
        n = r["n"]
        sid  = n.get("student_id", "")
        name = n.get("name", "")
        print(f"    {r['lbl']} | student_id={sid} | name={name}")
else:
    print("    (ไม่มี)")

print(f"\n{SEP}")
print("  [DONE] ตรวจสอบเสร็จสิ้น")
print(SEP)

driver.close()
