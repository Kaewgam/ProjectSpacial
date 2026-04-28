from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core.paginator import Paginator
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta

from .models import User
from neo4j_driver import cleanup_orphaned_users, sync_user_to_neo4j
from neo4j import GraphDatabase

NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "12345678"


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

    total_users = User.objects.count()
    role_counts = {
        "ALUMNI": User.objects.filter(role="ALUMNI").count(),
        "STUDENT": User.objects.filter(role="STUDENT").count(),
        "ADMIN": User.objects.filter(role="ADMIN").count(),
    }
    new_7d = User.objects.filter(date_joined__gte=seven_days_ago).count()
    new_30d = User.objects.filter(date_joined__gte=thirty_days_ago).count()
    active_users = User.objects.filter(is_active=True).count()

    # Faculty breakdown (top 5)
    faculty_stats = (
        User.objects.exclude(faculty="")
        .values("faculty")
        .annotate(count=Count("id"))
        .order_by("-count")[:5]
    )

    # Neo4j node count
    neo4j_stats = {"nodes": 0, "relationships": 0, "connected": False}
    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        with driver.session() as session:
            res = session.run("MATCH (n) RETURN count(n) AS cnt")
            neo4j_stats["nodes"] = res.single()["cnt"]
            res2 = session.run("MATCH ()-[r]->() RETURN count(r) AS cnt")
            neo4j_stats["relationships"] = res2.single()["cnt"]
            neo4j_stats["connected"] = True
        driver.close()
    except Exception:
        pass

    return Response({
        "total_users": total_users,
        "active_users": active_users,
        "role_counts": role_counts,
        "new_7d": new_7d,
        "new_30d": new_30d,
        "faculty_stats": list(faculty_stats),
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
            "faculty": u.faculty,
            "department": u.department,
            "occupation": u.occupation,
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
                   "faculty", "department", "occupation"]
        for field in allowed:
            if field in request.data:
                setattr(target, field, request.data[field])
        target.save()
        return Response({"message": "อัปเดตสำเร็จ"})

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

    # Validate required fields
    errors = {}
    if not student_id:
        errors["student_id"] = "กรุณากรอก Student ID"
    if not email:
        errors["email"] = "กรุณากรอก Email"
    if not password:
        errors["password"] = "กรุณากรอกรหัสผ่าน"
    elif len(password) < 6:
        errors["password"] = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"
    if role not in ["ALUMNI", "STUDENT", "ADMIN"]:
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
    user = User(
        student_id=student_id,
        email=email,
        role=role,
        prefix=request.data.get("prefix", ""),
        first_name=request.data.get("first_name", ""),
        last_name=request.data.get("last_name", ""),
        faculty=request.data.get("faculty", ""),
        department=request.data.get("department", ""),
        occupation=request.data.get("occupation", ""),
        is_active=True,
    )
    user.set_password(password)

    # Save ไป Django (Neo4j อาจล้มเหลวถ้าไม่ได้รัน ให้ graceful)
    neo4j_synced = True
    try:
        user.save()  # จะ trigger sync_user_to_neo4j ใน model
    except Exception as e:
        err_msg = str(e)
        if "neo4j" in err_msg.lower() or "bolt" in err_msg.lower() or "service" in err_msg.lower():
            # Neo4j ล้มเหลว บันทึก Django ก่อนแล้วค่อย sync ทีหลัง
            from django.db import transaction
            with transaction.atomic():
                from unittest.mock import patch
                with patch('accounts.models.sync_user_to_neo4j', return_value=None):
                    user.save()
            neo4j_synced = False
        else:
            return Response({"error": f"สร้างบัญชีไม่สำเร็จ: {err_msg}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
