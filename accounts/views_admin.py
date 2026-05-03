from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core.paginator import Paginator
from django.db.models import Q, Count, F
from django.utils import timezone
from datetime import timedelta
import os

from .models import User, Faculty, Department
from neo4j_driver import cleanup_orphaned_users, sync_user_to_neo4j
from neo4j import GraphDatabase

NEO4J_URI      = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER     = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "")


def is_admin(request):
    """Helper: ตรวจสอบว่า user ที่เรียก API เป็น ADMIN หรือไม่"""
    return request.user.is_authenticated and request.user.role == "ADMIN"


# ─────────────────────────────────────────────────────────────
# 1. Stats Overview
# ─────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_stats(request):
    if not is_admin(request):
        return Response({"error": "ไม่มีสิทธิ์เข้าถึง"}, status=status.HTTP_403_FORBIDDEN)

    now = timezone.now()
    seven_days_ago = now - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)

    alumni = User.objects.filter(role="ALUMNI")

    total_users = alumni.count()
    role_counts = {
        "ALUMNI": User.objects.filter(role="ALUMNI").count(),
        "ADMIN": User.objects.filter(role="ADMIN").count(),
    }
    new_7d = alumni.filter(date_joined__gte=seven_days_ago).count()
    new_30d = alumni.filter(date_joined__gte=thirty_days_ago).count()
    active_users = alumni.filter(is_active=True).count()

    # Faculty breakdown (top 5)
    faculty_stats = (
        alumni.exclude(faculty_ref__isnull=True)
        .values(faculty=F('faculty_ref__name'))
        .annotate(count=Count("id"))
        .order_by("-count")[:5]
    )

    # Department breakdown (top 5)
    department_stats = (
        alumni.exclude(department_ref__isnull=True)
        .values(department=F('department_ref__name'))
        .annotate(count=Count("id"))
        .order_by("-count")[:5]
    )

    # Neo4j node count
    neo4j_stats = {"nodes": 0, "relationships": 0, "connected": False, "companies": 0, "departments": 0}
    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        with driver.session() as session:
            res = session.run("MATCH (n) RETURN count(n) AS cnt")
            neo4j_stats["nodes"] = res.single()["cnt"]
            res2 = session.run("MATCH ()-[r]->() RETURN count(r) AS cnt")
            neo4j_stats["relationships"] = res2.single()["cnt"]
            res_comp = session.run("MATCH (c:Company) RETURN count(c) AS cnt")
            neo4j_stats["companies"] = res_comp.single()["cnt"]
            res_dept = session.run("MATCH (d:Department) RETURN count(d) AS cnt")
            neo4j_stats["departments"] = res_dept.single()["cnt"]
            neo4j_stats["connected"] = True
        driver.close()
    except Exception:
        pass

    # Generation stats (รุ่น)
    gen_counts = {}
    users_with_id = alumni.exclude(student_id="")
    for u in users_with_id:
        gen = str(u.student_id)[:2]
        if gen.isdigit():
            gen_counts[gen] = gen_counts.get(gen, 0) + 1
    
    # Sort by generation descending (e.g. 65, 64, 63)
    sorted_gens = sorted(gen_counts.items(), key=lambda x: x[0], reverse=True)
    generation_stats = [{"generation": g, "count": c} for g, c in sorted_gens[:5]]

    return Response({
        "total_users": total_users,
        "active_users": active_users,
        "role_counts": role_counts,
        "new_7d": new_7d,
        "new_30d": new_30d,
        "faculty_stats": list(faculty_stats),
        "department_stats": list(department_stats),
        "generation_stats": generation_stats,
        "neo4j": neo4j_stats,
    })


# ─────────────────────────────────────────────────────────────
# 2. User List (with search, filter, pagination)
# ─────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_users_list(request):
    if not is_admin(request):
        return Response({"error": "ไม่มีสิทธิ์เข้าถึง"}, status=status.HTTP_403_FORBIDDEN)

    q = request.GET.get("q", "").strip()
    role = request.GET.get("role", "").strip()
    active = request.GET.get("active", "").strip()
    page = int(request.GET.get("page", 1))
    page_size = 15

    queryset = User.objects.all().order_by("-date_joined")

    if q:
        queryset = queryset.filter(
            Q(student_id__icontains=q)
            | Q(email__icontains=q)
            | Q(first_name__icontains=q)
            | Q(last_name__icontains=q)
        )
    if role:
        queryset = queryset.filter(role=role.upper())
    if active == "true":
        queryset = queryset.filter(is_active=True)
    elif active == "false":
        queryset = queryset.filter(is_active=False)

    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)

    results = [
        {
            "id": str(u.id),
            "student_id": u.student_id,
            "email": u.email,
            "role": u.role,
            "prefix": u.prefix,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "faculty": u.faculty_ref.name if u.faculty_ref else "",
            "department": u.department_ref.name if u.department_ref else "",
            "faculty_id": u.faculty_ref.id if u.faculty_ref else None,
            "department_id": u.department_ref.id if u.department_ref else None,
            "occupation": u.occupation,
            "company": u.company,
            "is_active": u.is_active,
            "date_joined": u.date_joined.strftime("%d/%m/%Y %H:%M"),
            "avatar": request.build_absolute_uri(u.avatar.url) if u.avatar else None,
        }
        for u in page_obj
    ]

    return Response({
        "results": results,
        "total": paginator.count,
        "total_pages": paginator.num_pages,
        "page": page,
    })


# ─────────────────────────────────────────────────────────────
# 3. Edit / Delete single user
# ─────────────────────────────────────────────────────────────

@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_user_detail(request, user_id):
    if not is_admin(request):
        return Response({"error": "ไม่มีสิทธิ์เข้าถึง"}, status=status.HTTP_403_FORBIDDEN)

    try:
        target = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "ไม่พบ User"}, status=status.HTTP_404_NOT_FOUND)

    # ป้องกัน Admin ลบตัวเอง
    if target.id == request.user.id and request.method == "DELETE":
        return Response({"error": "ไม่สามารถลบบัญชีตัวเองได้"}, status=status.HTTP_400_BAD_REQUEST)

    if request.method == "PATCH":
        allowed = ["role", "is_active", "prefix", "first_name", "last_name",
                   "faculty", "department", "occupation", "company", "student_id", "email"]
        
        # Check Uniqueness for student_id
        new_student_id = request.data.get("student_id")
        if new_student_id and new_student_id != target.student_id:
            if User.objects.filter(student_id=new_student_id).exists():
                return Response({"error": "ไม่สามารถเปลี่ยนได้: มี Student ID นี้ในระบบแล้ว"}, status=status.HTTP_400_BAD_REQUEST)
                
        # Check Uniqueness for email
        new_email = request.data.get("email")
        if new_email and new_email != target.email:
            if User.objects.filter(email=new_email).exists():
                return Response({"error": "ไม่สามารถเปลี่ยนได้: มี Email นี้ในระบบแล้ว"}, status=status.HTTP_400_BAD_REQUEST)

        # Check Required Fields if they are in request
        for field in ["prefix", "first_name", "last_name"]:
            if field in request.data and not request.data[field]:
                return Response({"error": f"กรุณากรอก/เลือก {field}"}, status=status.HTTP_400_BAD_REQUEST)

        for field in ["role", "is_active", "prefix", "first_name", "last_name",
                      "occupation", "company", "student_id", "email"]:
            if field in request.data:
                setattr(target, field, request.data[field])

        # Handle faculty FK
        faculty_id = request.data.get('faculty_id')
        if faculty_id:
            try:
                fac = Faculty.objects.get(id=faculty_id)
                target.faculty_ref = fac
                target.department_ref = None
            except Faculty.DoesNotExist:
                pass
        elif 'faculty_id' in request.data and not faculty_id:
            target.faculty_ref = None
            target.department_ref = None

        # Handle department FK
        department_id = request.data.get('department_id')
        if department_id:
            try:
                dept = Department.objects.get(id=department_id)
                target.department_ref = dept
            except Department.DoesNotExist:
                pass

        target.save()
        neo4j_synced = getattr(target, "_neo4j_synced", True)
        return Response({
            "message": "อัปเดตสำเร็จ",
            "neo4j_synced": neo4j_synced
        })

    if request.method == "DELETE":
        target.delete()
        return Response({"message": "ลบ User สำเร็จ"})


# ─────────────────────────────────────────────────────────────
# 4. Create User (Admin only)
# ─────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_create_user(request):
    """Admin สร้างบัญชีผู้ใช้ใหม่ในระบบ"""
    if not is_admin(request):
        return Response({"error": "ไม่มีสิทธิ์เข้าถึง"}, status=status.HTTP_403_FORBIDDEN)

    student_id = request.data.get("student_id", "").strip()
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "").strip()
    role = request.data.get("role", "ALUMNI").strip().upper()

    prefix = request.data.get("prefix", "").strip()
    first_name = request.data.get("first_name", "").strip()
    last_name = request.data.get("last_name", "").strip()

    # Validate required fields
    errors = {}
    if not student_id:
        errors["student_id"] = "กรุณากรอก Student ID"
    if not email:
        errors["email"] = "กรุณากรอก Email"
    if not password:
        errors["password"] = "กรุณากรอกรหัสผ่าน"
    if not prefix:
        errors["prefix"] = "กรุณาเลือกคำนำหน้า"
    if not first_name:
        errors["first_name"] = "กรุณากรอกชื่อ"
    if not last_name:
        errors["last_name"] = "กรุณากรอกนามสกุล"
        
    if role not in ["ALUMNI", "ADMIN"]:
        errors["role"] = "Role ไม่ถูกต้อง"

    if errors:
        return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

    # Check duplicates
    if User.objects.filter(student_id=student_id).exists():
        return Response(
            {"errors": {"student_id": f"Student ID '{student_id}' มีอยู่ในระบบแล้ว"}},
            status=status.HTTP_400_BAD_REQUEST
        )
    if User.objects.filter(email=email).exists():
        return Response(
            {"errors": {"email": f"Email '{email}' มีอยู่ในระบบแล้ว"}},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Create user
    faculty_ref = None
    department_ref = None

    faculty_id = request.data.get("faculty_id")
    department_id = request.data.get("department_id")
    if faculty_id:
        try:
            faculty_ref = Faculty.objects.get(id=faculty_id)
        except Faculty.DoesNotExist:
            pass
    if department_id:
        try:
            department_ref = Department.objects.get(id=department_id)
        except Department.DoesNotExist:
            pass

    user = User(
        student_id=student_id,
        email=email,
        role=role,
        prefix=request.data.get("prefix", ""),
        first_name=request.data.get("first_name", ""),
        last_name=request.data.get("last_name", ""),
        faculty_ref=faculty_ref,
        department_ref=department_ref,
        occupation=request.data.get("occupation", ""),
        company=request.data.get("company", ""),
        is_active=True,
    )
    user.set_password(password)

    # Save ไป Django (Neo4j ล้มเหลวจะไม่พังแล้ว เพราะถูกครอบ try..except ไว้ใน models.py)
    user.save()
    neo4j_synced = getattr(user, "_neo4j_synced", True)

    return Response({
        "message": "สร้างบัญชีสำเร็จ",
        "user": {
            "id": str(user.id),
            "student_id": user.student_id,
            "email": user.email,
            "role": user.role,
            "first_name": user.first_name,
            "last_name": user.last_name,
        },
        "neo4j_synced": neo4j_synced,
    }, status=status.HTTP_201_CREATED)




# ─────────────────────────────────────────────────────────────
# 4. Neo4j Tools
# ─────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_neo4j_cleanup(request):
    if not is_admin(request):
        return Response({"error": "ไม่มีสิทธิ์เข้าถึง"}, status=status.HTTP_403_FORBIDDEN)

    valid_ids = list(User.objects.values_list("student_id", flat=True))
    deleted = cleanup_orphaned_users(valid_ids)

    return Response({
        "message": f"ลบ orphaned nodes สำเร็จ {len(deleted)} รายการ",
        "deleted": deleted,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_neo4j_syncall(request):
    if not is_admin(request):
        return Response({"error": "ไม่มีสิทธิ์เข้าถึง"}, status=status.HTTP_403_FORBIDDEN)

    users = User.objects.all()
    synced = 0
    failed = 0
    errors = []

    for user in users:
        try:
            sync_user_to_neo4j(user)
            synced += 1
        except Exception as e:
            failed += 1
            errors.append(f"{user.student_id}: {str(e)}")

    return Response({
        "message": f"Sync เสร็จสิ้น",
        "synced": synced,
        "failed": failed,
        "errors": errors[:10],  # แสดงแค่ 10 error แรก
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_neo4j_status(request):
    if not is_admin(request):
        return Response({"error": "ไม่มีสิทธิ์เข้าถึง"}, status=status.HTTP_403_FORBIDDEN)

    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        with driver.session() as session:
            r1 = session.run("MATCH (n) RETURN count(n) AS total, labels(n) AS lbl")
            node_counts = {}
            for rec in r1:
                for lbl in rec["lbl"]:
                    node_counts[lbl] = node_counts.get(lbl, 0) + 1

            r2 = session.run("""
                MATCH ()-[r]->()
                RETURN type(r) AS rel_type, count(r) AS cnt
            """)
            rel_counts = {rec["rel_type"]: rec["cnt"] for rec in r2}

        driver.close()
        return Response({
            "connected": True,
            "node_counts": node_counts,
            "rel_counts": rel_counts,
        })
    except Exception as e:
        return Response({"connected": False, "error": str(e)})


# ─────────────────────────────────────────────────────────────
# Neo4j Node Audit — เปรียบเทียบ Neo4j กับ PostgreSQL
# ─────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_neo4j_audit(request):
    """
    ตรวจสอบความสอดคล้องของ Node ใน Neo4j กับ PostgreSQL
    - orphaned: อยู่ใน Neo4j แต่ไม่มีใน PG (ควรลบ)
    - missing:  อยู่ใน PG แต่ยังไม่ได้ sync ไป Neo4j
    - isolated: node ที่ไม่มี relationship เลย
    - all_nodes: รายการ node ทั้งหมดแยกตามประเภท
    """
    if not is_admin(request):
        return Response({"error": "ไม่มีสิทธิ์เข้าถึง"}, status=status.HTTP_403_FORBIDDEN)

    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        with driver.session() as session:

            # ── User nodes ใน Neo4j ──
            neo4j_users_raw = session.run(
                "MATCH (u:User) RETURN u.student_id AS sid, u.first_name AS fn, u.last_name AS ln"
            )
            neo4j_users = {
                rec["sid"]: {"student_id": rec["sid"], "first_name": rec["fn"] or "", "last_name": rec["ln"] or ""}
                for rec in neo4j_users_raw if rec["sid"]
            }
            neo4j_ids = set(neo4j_users.keys())

            # ── Faculty nodes ──
            fac_nodes = [{"name": r["name"]} for r in session.run("MATCH (f:Faculty) RETURN f.name AS name")]

            # ── Department nodes ──
            dept_nodes = [{"name": r["name"]} for r in session.run("MATCH (d:Department) RETURN d.name AS name")]

            # ── Company nodes ──
            comp_nodes = [{"name": r["name"]} for r in session.run("MATCH (c:Company) RETURN c.name AS name")]

            # ── Relationship counts ──
            rel_rows = session.run(
                "MATCH ()-[r]->() RETURN type(r) AS t, count(r) AS cnt ORDER BY cnt DESC"
            )
            rel_counts = {r["t"]: r["cnt"] for r in rel_rows}

            # ── Isolated nodes (ไม่มี relationship) ──
            iso_rows = session.run(
                "MATCH (n) WHERE NOT (n)--() RETURN labels(n) AS lbl, "
                "n.student_id AS sid, n.name AS name"
            )
            isolated = [
                {"labels": list(r["lbl"]), "student_id": r["sid"] or "", "name": r["name"] or ""}
                for r in iso_rows
            ]

        driver.close()

        # ── PostgreSQL users ──
        pg_users = {
            u.student_id: {"student_id": u.student_id, "first_name": u.first_name, "last_name": u.last_name}
            for u in User.objects.all()
        }
        pg_ids = set(pg_users.keys())

        # ── เปรียบเทียบ ──
        orphaned_ids = neo4j_ids - pg_ids   # อยู่ใน Neo4j แต่ไม่อยู่ใน PG
        missing_ids  = pg_ids  - neo4j_ids  # อยู่ใน PG แต่ยังไม่ sync

        orphaned = [neo4j_users[sid] for sid in sorted(orphaned_ids)]
        missing  = [pg_users[sid] for sid in sorted(missing_ids)]

        return Response({
            "connected": True,
            "summary": {
                "neo4j_users":  len(neo4j_ids),
                "pg_users":     len(pg_ids),
                "orphaned":     len(orphaned),
                "missing":      len(missing),
                "isolated":     len(isolated),
            },
            "orphaned_nodes": orphaned,
            "missing_nodes":  missing,
            "isolated_nodes": isolated,
            "all_nodes": {
                "users":       list(neo4j_users.values()),
                "faculties":   fac_nodes,
                "departments": dept_nodes,
                "companies":   comp_nodes,
            },
            "rel_counts": rel_counts,
        })

    except Exception as e:
        return Response({"connected": False, "error": str(e)})
