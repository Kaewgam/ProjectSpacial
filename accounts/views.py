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
    queryset = User.objects.filter(role='ALUMNI').select_related('profile').prefetch_related(
        'educations__faculty_ref', 'educations__department_ref', 'careers'
    ).order_by('student_id')

    # ค้นหาทั่วไป (ชื่อ, รหัส, อีเมล)
    if q:
        queryset = queryset.filter(
            Q(student_id__icontains=q) |
            Q(profile__email__icontains=q)      |
            Q(profile__first_name__icontains=q) |
            Q(profile__last_name__icontains=q)
        ).distinct()

    # กรองตามคณะ
    if faculty:
        queryset = queryset.filter(educations__faculty_ref__name__icontains=faculty).distinct()

    # กรองตามภาควิชา/สาขา
    if department:
        queryset = queryset.filter(educations__department_ref__name__icontains=department).distinct()

    # กรองตามอาชีพ/บริษัท
    if occupation:
        queryset = queryset.filter(careers__occupation__icontains=occupation).distinct()
        
    if company:
        queryset = queryset.filter(careers__company__icontains=company).distinct()

    paginator = Paginator(queryset, page_size)
    page_obj  = paginator.get_page(page)

    results = []
    for user in page_obj:
        profile = getattr(user, 'profile', None)
        edu = user.educations.first()
        career = user.careers.first()
        
        results.append({
            "id":          str(user.id),
            "student_id":  user.student_id,
            "email":       profile.email if profile else "",
            "role":        user.role,
            "first_name":  profile.first_name if profile else "",
            "last_name":   profile.last_name if profile else "",
            "faculty":     edu.faculty_ref.name if edu and edu.faculty_ref else "",
            "department":  edu.department_ref.name if edu and edu.department_ref else "",
            "occupation":  career.occupation if career else "",
            "company":     career.company if career else "",
            "educations": [
                {
                    "faculty": e.faculty_ref.name if e.faculty_ref else "",
                    "department": e.department_ref.name if e.department_ref else "",
                    "degree_level": e.degree_level,
                    "graduation_year": e.graduation_year
                } for e in user.educations.all()
            ],
            "careers": [
                {
                    "occupation": c.occupation,
                    "company": c.company,
                    "is_current": c.is_current,
                    "start_year": c.start_year,
                    "end_year": c.end_year
                } for c in user.careers.all()
            ],
            "date_joined": timezone.localtime(user.date_joined).strftime("%d/%m/%Y"),
            "avatar":      request.build_absolute_uri(profile.avatar.url) if profile and profile.avatar else None,
        })

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
    profile = getattr(user, 'profile', None)
    edu = user.educations.first()
    career = user.careers.first()
    
    return Response({
        "id": str(user.id),
        "student_id": user.student_id,
        "email": profile.email if profile else "",
        "role": user.role,
        "prefix": profile.prefix if profile else "",
        "first_name": profile.first_name if profile else "",
        "last_name": profile.last_name if profile else "",
        "faculty": edu.faculty_ref.name if edu and edu.faculty_ref else "",
        "faculty_id": edu.faculty_ref.id if edu and edu.faculty_ref else None,
        "department": edu.department_ref.name if edu and edu.department_ref else "",
        "department_id": edu.department_ref.id if edu and edu.department_ref else None,
        "occupation": career.occupation if career else "",
        "company": career.company if career else "",
        "educations": [
            {
                "id": e.id,
                "faculty_id": e.faculty_ref.id if e.faculty_ref else None,
                "faculty_name": e.faculty_ref.name if e.faculty_ref else "",
                "department_id": e.department_ref.id if e.department_ref else None,
                "department_name": e.department_ref.name if e.department_ref else "",
                "degree_level": e.degree_level,
                "graduation_year": e.graduation_year
            } for e in user.educations.all()
        ],
        "careers": [
            {
                "id": c.id,
                "occupation": c.occupation,
                "company": c.company,
                "is_current": c.is_current,
                "start_year": c.start_year,
                "end_year": c.end_year
            } for c in user.careers.all()
        ],
        "date_joined": timezone.localtime(user.date_joined).strftime("%d/%m/%Y"),
        "avatar": request.build_absolute_uri(profile.avatar.url) if profile and profile.avatar else None,
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    from .models import UserProfile, UserEducation, UserCareer
    profile, _ = UserProfile.objects.get_or_create(user=user)
    
    simple_fields = ['prefix', 'first_name', 'last_name', 'email']
    for field in simple_fields:
        if field in request.data:
            setattr(profile, field, request.data[field])
    profile.save()

    # Handle single education update for now (fallback for old UI)
    if 'faculty_id' in request.data or 'department_id' in request.data:
        edu = user.educations.first()
        if not edu:
            edu = UserEducation(user=user)
            
        faculty_id = request.data.get('faculty_id')
        if faculty_id:
            try:
                edu.faculty_ref = Faculty.objects.get(id=faculty_id)
            except Faculty.DoesNotExist:
                pass
        elif 'faculty_id' in request.data:
            edu.faculty_ref = None
            edu.department_ref = None

        department_id = request.data.get('department_id')
        if department_id:
            try:
                edu.department_ref = Department.objects.get(id=department_id)
            except Department.DoesNotExist:
                pass
        elif 'department_id' in request.data:
            edu.department_ref = None
            
        edu.save()

    # Handle multiple educations
    if 'educations' in request.data and isinstance(request.data['educations'], list):
        user.educations.all().delete()
        for ed in request.data['educations']:
            try:
                fac = Faculty.objects.get(id=ed['faculty_id']) if ed.get('faculty_id') else None
                dept = Department.objects.get(id=ed['department_id']) if ed.get('department_id') else None
                UserEducation.objects.create(
                    user=user,
                    faculty_ref=fac,
                    department_ref=dept,
                    degree_level=ed.get('degree_level', ''),
                    graduation_year=ed.get('graduation_year', '')
                )
            except Exception:
                pass

    # Handle single career (fallback for old UI)
    if 'occupation' in request.data or 'company' in request.data:
        career = user.careers.first()
        if not career:
            career = UserCareer(user=user, is_current=True)
            
        if 'occupation' in request.data:
            career.occupation = request.data['occupation']
        if 'company' in request.data:
            career.company = request.data['company']
        career.save()

    # Handle multiple careers
    if 'careers' in request.data and isinstance(request.data['careers'], list):
        user.careers.all().delete()
        for car in request.data['careers']:
            UserCareer.objects.create(
                user=user,
                occupation=car.get('occupation', ''),
                company=car.get('company', ''),
                is_current=car.get('is_current', True),
                start_year=car.get('start_year', ''),
                end_year=car.get('end_year', '')
            )

    user.save() # trigger Neo4j sync
    return Response({"message": "อัปเดตข้อมูลสำเร็จ"})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_avatar(request):
    if 'avatar' not in request.FILES:
        return Response({"error": "ไม่พบไฟล์รูปภาพ"}, status=status.HTTP_400_BAD_REQUEST)

    user = request.user
    from .models import UserProfile
    profile, _ = UserProfile.objects.get_or_create(user=user)
    
    # ลบรูปเก่าออกถ้ามี
    if profile.avatar:
        profile.avatar.delete(save=False)

    profile.avatar = request.FILES['avatar']
    profile.save()
    user.save() # trigger Neo4j sync

    avatar_url = request.build_absolute_uri(profile.avatar.url)
    return Response({"avatar": avatar_url})


# ──────────────────── Password Reset ────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    email = request.data.get('email', '').strip()
    if not email:
        return Response({"error": "กรุณากรอกอีเมล"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(profile__email=email)
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
            f"สวัสดีคุณ {user.profile.first_name if hasattr(user, 'profile') and user.profile.first_name else user.student_id},\n\n"
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
            "faculty_id": d.faculty_id,
            "faculty_name": d.faculty.name,
        }
        for d in qs
    ]
    return Response(data)