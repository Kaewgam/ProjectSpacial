from django.shortcuts import render

# Create your views here.
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from django.core.paginator import Paginator
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
from .serializers import RegisterSerializer
from .models import User, PasswordResetToken, Faculty, Department
from django.shortcuts import render


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_protected(request):
    return Response({
        "message": "คุณผ่าน JWT แล้ว",
        "user": request.user.student_id
    })

@api_view(['POST'])
def register(request):
    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response(
            {"message": "สมัครสมาชิกสำเร็จ"},
            status=status.HTTP_201_CREATED
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def search_alumni(request):
    q          = request.GET.get('q', '').strip()
    faculty    = request.GET.get('faculty', '').strip()
    department = request.GET.get('department', '').strip()
    occupation = request.GET.get('occupation', '').strip()
    company    = request.GET.get('company', '').strip()
    page       = int(request.GET.get('page', 1))
    page_size  = 10

    # แสดงเฉพาะ ALUMNI เสมอ และดึงข้อมูล faculty/department มาพร้อมกันเพื่อลด N+1 Query
    queryset = User.objects.filter(role='ALUMNI').select_related('faculty_ref', 'department_ref').order_by('student_id')

    # ค้นหาทั่วไป (ชื่อ, รหัส, อีเมล)
    if q:
        queryset = queryset.filter(
            Q(student_id__icontains=q) |
            Q(email__icontains=q)      |
            Q(first_name__icontains=q) |
            Q(last_name__icontains=q)
        )

    # กรองตามคณะ
    if faculty:
        queryset = queryset.filter(faculty_ref__name__icontains=faculty)

    # กรองตามภาควิชา/สาขา
    if department:
        queryset = queryset.filter(department_ref__name__icontains=department)

    # กรองตามอาชีพ/บริษัท
    if occupation:
        queryset = queryset.filter(occupation__icontains=occupation)
        
    if company:
        queryset = queryset.filter(company__icontains=company)

    paginator = Paginator(queryset, page_size)
    page_obj  = paginator.get_page(page)

    results = [
        {
            "id":          str(user.id),
            "student_id":  user.student_id,
            "email":       user.email,
            "role":        user.role,
            "first_name":  user.first_name or "",
            "last_name":   user.last_name  or "",
            "faculty":     user.faculty_ref.name if user.faculty_ref else "",
            "department":  user.department_ref.name if user.department_ref else "",
            "occupation":  user.occupation or "",
            "company":     user.company or "",
            "date_joined": timezone.localtime(user.date_joined).strftime("%d/%m/%Y"),
            "avatar":      request.build_absolute_uri(user.avatar.url) if user.avatar else None,
        }
        for user in page_obj
    ]

    return Response({
        "results":     results,
        "total":       paginator.count,
        "total_pages": paginator.num_pages,
        "page":        page,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    user = request.user
    return Response({
        "id": str(user.id),
        "student_id": user.student_id,
        "email": user.email,
        "role": user.role,
        "prefix": user.prefix,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "faculty": user.faculty_ref.name if user.faculty_ref else "",
        "faculty_id": user.faculty_ref.id if user.faculty_ref else None,
        "department": user.department_ref.name if user.department_ref else "",
        "department_id": user.department_ref.id if user.department_ref else None,
        "occupation": user.occupation,
        "company": user.company,
        "date_joined": timezone.localtime(user.date_joined).strftime("%d/%m/%Y"),
        "avatar": request.build_absolute_uri(user.avatar.url) if user.avatar else None,
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    simple_fields = ['prefix', 'first_name', 'last_name', 'occupation', 'company', 'email']

    for field in simple_fields:
        if field in request.data:
            setattr(user, field, request.data[field])

    # Handle faculty FK
    faculty_id = request.data.get('faculty_id')
    if faculty_id:
        try:
            faculty_obj = Faculty.objects.get(id=faculty_id)
            user.faculty_ref = faculty_obj
        except Faculty.DoesNotExist:
            pass
    elif 'faculty_id' in request.data and not faculty_id:
        user.faculty_ref = None
        user.department_ref = None
    
    # Handle department FK
    department_id = request.data.get('department_id')
    if department_id:
        try:
            dept_obj = Department.objects.get(id=department_id)
            user.department_ref = dept_obj
        except Department.DoesNotExist:
            pass
    elif 'department_id' in request.data and not department_id:
        user.department_ref = None

    user.save()
    return Response({"message": "อัปเดตข้อมูลสำเร็จ"})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_avatar(request):
    if 'avatar' not in request.FILES:
        return Response({"error": "ไม่พบไฟล์รูปภาพ"}, status=status.HTTP_400_BAD_REQUEST)

    user = request.user
    # ลบรูปเก่าออกถ้ามี
    if user.avatar:
        user.avatar.delete(save=False)

    user.avatar = request.FILES['avatar']
    user.save()

    avatar_url = request.build_absolute_uri(user.avatar.url)
    return Response({"avatar": avatar_url})


# ──────────────────── Password Reset ────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    email = request.data.get('email', '').strip()
    if not email:
        return Response({"error": "กรุณากรอกอีเมล"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # ไม่บอกว่าอีเมลไม่มีในระบบ (security)
        return Response({"message": "ถ้าอีเมลนี้มีในระบบ คุณจะได้รับลิงก์รีเซ็ตรหัสผ่านทางอีเมล"})

    # ลบ token เก่าของ user นี้
    PasswordResetToken.objects.filter(user=user, used=False).delete()

    # สร้าง token ใหม่ หมดอายุใน 1 ชั่วโมง
    token_obj = PasswordResetToken.objects.create(
        user=user,
        expires_at=timezone.now() + timedelta(hours=1),
    )

    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    reset_link = f"{frontend_url}/reset-password?token={token_obj.token}"

    send_mail(
        subject="รีเซ็ตรหัสผ่าน — Alumni System",
        message=(
            f"สวัสดีคุณ {user.first_name or user.student_id},\n\n"
            f"คุณได้ขอรีเซ็ตรหัสผ่าน กรุณาคลิกลิงก์ด้านล่างภายใน 1 ชั่วโมง:\n\n"
            f"{reset_link}\n\n"
            f"หากคุณไม่ได้ทำการร้องขอนี้ กรุณาเพิกเฉยต่ออีเมลนี้"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )

    return Response({"message": "ถ้าอีเมลนี้มีในระบบ คุณจะได้รับลิงก์รีเซ็ตรหัสผ่านทางอีเมล"})


@api_view(['POST'])
@permission_classes([AllowAny])
def confirm_password_reset(request):
    token_str = request.data.get('token', '').strip()
    new_password = request.data.get('password', '').strip()

    if not token_str or not new_password:
        return Response({"error": "ข้อมูลไม่ครบถ้วน"}, status=status.HTTP_400_BAD_REQUEST)

    import re
    if len(new_password) <= 6:
        return Response({"error": "รหัสผ่านต้องมีความยาวมากกว่า 6 ตัวอักษร"}, status=status.HTTP_400_BAD_REQUEST)
    if not re.search(r'[A-Z]', new_password):
        return Response({"error": "รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว"}, status=status.HTTP_400_BAD_REQUEST)
    if not re.search(r'\d', new_password):
        return Response({"error": "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        token_obj = PasswordResetToken.objects.get(token=token_str)
    except (PasswordResetToken.DoesNotExist, ValueError):
        return Response({"error": "ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว"}, status=status.HTTP_400_BAD_REQUEST)

    if not token_obj.is_valid():
        return Response({"error": "ลิงก์หมดอายุแล้ว กรุณาขอลิงก์ใหม่"}, status=status.HTTP_400_BAD_REQUEST)

    user = token_obj.user
    user.set_password(new_password)
    user.save()

    token_obj.used = True
    token_obj.save()

    return Response({"message": "เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบใหม่"})

def graph_page(request):
    return render(request, "graph.html")


# ──────────────────── Faculty & Department API ────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def list_faculties(request):
    """Return all faculties for dropdown."""
    faculties = Faculty.objects.all().order_by('name')
    data = [{"id": f.id, "name": f.name} for f in faculties]
    return Response(data)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_departments(request):
    """Return departments, optionally filtered by faculty_id."""
    faculty_id = request.GET.get('faculty_id')
    qs = Department.objects.select_related('faculty').order_by('name')
    if faculty_id:
        qs = qs.filter(faculty_id=faculty_id)
    data = [
        {
            "id": d.id,
            "name": d.name,
            "short_name": d.short_name,
            "code": d.code,
            "faculty_id": d.faculty_id,
            "faculty_name": d.faculty.name,
        }
        for d in qs
    ]
    return Response(data)