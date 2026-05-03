from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework import status
from django.core.paginator import Paginator

from .models import Post


def is_admin(request):
    return request.user.is_authenticated and request.user.role == 'ADMIN'


def post_to_dict(post, request):
    return {
        'id':          str(post.id),
        'title':       post.title,
        'excerpt':     post.excerpt,
        'content':     post.content,
        'category':    post.category,
        'author':      post.author,
        'pinned':      post.pinned,
        'is_active':   post.is_active,
        'created_at':  post.created_at.strftime('%d/%m/%Y'),
        'updated_at':  post.updated_at.strftime('%d/%m/%Y %H:%M'),
        'cover_image': request.build_absolute_uri(post.cover_image.url) if post.cover_image else None,
        'created_by':  post.created_by.student_id if post.created_by else None,
    }


# ── GET /api/posts/ — ทุกคนดูได้ (no auth required)
# ── POST /api/posts/ — เฉพาะ ADMIN
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def post_list(request):
    if request.method == 'GET':
        if is_admin(request):
            qs = Post.objects.all()
        else:
            qs = Post.objects.filter(is_active=True)

        # filter by category
        category = request.GET.get('category')
        if category:
            qs = qs.filter(category=category)

        # search
        q = request.GET.get('q')
        if q:
            qs = qs.filter(title__icontains=q) | qs.filter(excerpt__icontains=q)

        page    = int(request.GET.get('page', 1))
        limit   = int(request.GET.get('limit', 12))
        pinned  = request.GET.get('pinned')
        if pinned == '1':
            qs = qs.filter(pinned=True)
        elif pinned == '0':
            qs = qs.filter(pinned=False)

        paginator = Paginator(qs, limit)
        page_obj  = paginator.get_page(page)
        results   = [post_to_dict(p, request) for p in page_obj]
        return Response({
            'results':     results,
            'total':       paginator.count,
            'total_pages': paginator.num_pages,
            'page':        page,
        })

    # POST — Admin เท่านั้น
    if not request.user.is_authenticated or not is_admin(request):
        return Response({'error': 'ไม่มีสิทธิ์สร้างโพสต์'}, status=status.HTTP_403_FORBIDDEN)

    title    = (request.data.get('title') or '').strip()
    content  = (request.data.get('content') or '').strip()
    category = (request.data.get('category') or '').strip()

    errors = {}
    if not title:    errors['title']    = 'กรุณากรอกหัวข้อ'
    if not content:  errors['content']  = 'กรุณากรอกเนื้อหา'
    valid_cats = [c[0] for c in Post.CATEGORY_CHOICES]
    if not category or category not in valid_cats:
        errors['category'] = 'หมวดหมู่ไม่ถูกต้อง'
    if errors:
        return Response({'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

    post = Post(
        title      = title[:120],
        excerpt    = (request.data.get('excerpt') or '')[:200],
        content    = content[:5000],
        category   = category,
        author     = (request.data.get('author') or '').strip()[:100],
        pinned     = request.data.get('pinned') in [True, 'true', '1'],
        created_by = request.user,
    )
    if 'cover_image' in request.FILES:
        post.cover_image = request.FILES['cover_image']
    post.save()

    return Response({'message': 'สร้างโพสต์สำเร็จ', 'post': post_to_dict(post, request)},
                    status=status.HTTP_201_CREATED)


# ── GET/PATCH/DELETE /api/posts/<id>/
@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def post_detail(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response({'error': 'ไม่พบโพสต์'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(post_to_dict(post, request))

    # PATCH / DELETE — Admin เท่านั้น
    if not request.user.is_authenticated or not is_admin(request):
        return Response({'error': 'ไม่มีสิทธิ์'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'PATCH':
        for field in ['title', 'excerpt', 'content', 'category', 'author']:
            if field in request.data:
                setattr(post, field, request.data[field])
        if 'pinned' in request.data:
            post.pinned = request.data['pinned'] in [True, 'true', '1']
        if 'is_active' in request.data:
            post.is_active = request.data['is_active'] in [True, 'true', '1']
        if 'cover_image' in request.FILES:
            post.cover_image = request.FILES['cover_image']
        post.save()
        return Response({'message': 'อัปเดตสำเร็จ', 'post': post_to_dict(post, request)})

    if request.method == 'DELETE':
        post.delete()
        return Response({'message': 'ลบโพสต์สำเร็จ'})
