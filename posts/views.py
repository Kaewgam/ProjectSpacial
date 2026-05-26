from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework import status
from django.core.paginator import Paginator
from django.utils import timezone

from .models import Post, Category


def is_admin(request):
    return request.user.is_authenticated and request.user.role == 'ADMIN'


def post_to_dict(post, request):
    return {
        'id':          str(post.id),
        'title':       post.title,
        'excerpt':     post.excerpt,
        'content':     post.content,
        'category':    post.category.name if post.category else None,
        'author':      post.author,
        'pinned':      post.pinned,
        'is_active':   post.is_active,
        'created_at':  timezone.localtime(post.created_at).strftime('%d/%m/%Y'),
        'updated_at':  timezone.localtime(post.updated_at).strftime('%d/%m/%Y %H:%M'),
        'cover_image': request.build_absolute_uri(post.cover_image.url) if post.cover_image else None,
        'images':      [request.build_absolute_uri(img.image.url) for img in getattr(post, 'images').all()] if hasattr(post, 'images') else [],
        'created_by':  post.created_by.student_id if post.created_by else None,
    }


# ── GET /api/posts/ — ทุกคนดูได้ (no auth required)
# ── POST /api/posts/ — เฉพาะ ADMIN
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def post_list(request):
    if request.method == 'GET':
        qs = Post.objects.select_related('created_by').prefetch_related('images')
        if is_admin(request):
            pass # Keep qs as all() with select_related
        else:
            qs = qs.filter(is_active=True)

        # filter by category
        category = request.GET.get('category')
        if category:
            qs = qs.filter(category__name=category)

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
    category_name = (request.data.get('category') or '').strip()

    errors = {}
    if not title:    errors['title']    = 'กรุณากรอกหัวข้อ'
    if not content:  errors['content']  = 'กรุณากรอกเนื้อหา'
    
    cat_obj = None
    if not category_name:
        errors['category'] = 'กรุณาเลือกหมวดหมู่'
    else:
        try:
            cat_obj = Category.objects.get(name=category_name)
        except Category.DoesNotExist:
            errors['category'] = 'หมวดหมู่ไม่ถูกต้อง'
            
    if errors:
        return Response({'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

    post = Post(
        title      = title,
        excerpt    = (request.data.get('excerpt') or ''),
        content    = content,
        category   = cat_obj,
        author     = (request.data.get('author') or '').strip()[:100],
        pinned     = request.data.get('pinned') in [True, 'true', '1'],
        created_by = request.user,
    )
    if 'cover_image' in request.FILES:
        post.cover_image = request.FILES['cover_image']
    post.save()

    from .models import PostImage
    images_data = request.FILES.getlist('images')
    if images_data:
        for img in images_data:
            PostImage.objects.create(post=post, image=img)
    elif 'cover_image' in request.FILES:
        PostImage.objects.create(post=post, image=request.FILES['cover_image'])

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
        for field in ['title', 'excerpt', 'content', 'author']:
            if field in request.data:
                setattr(post, field, request.data[field])
        if 'category' in request.data:
            cat_name = request.data['category']
            try:
                cat_obj = Category.objects.get(name=cat_name)
                post.category = cat_obj
            except Category.DoesNotExist:
                return Response({'error': 'หมวดหมู่ไม่ถูกต้อง'}, status=status.HTTP_400_BAD_REQUEST)
        if 'pinned' in request.data:
            post.pinned = request.data['pinned'] in [True, 'true', '1']
        if 'is_active' in request.data:
            post.is_active = request.data['is_active'] in [True, 'true', '1']
        if 'cover_image' in request.FILES:
            post.cover_image = request.FILES['cover_image']
        post.save()

        if 'images' in request.FILES:
            from .models import PostImage
            post.images.all().delete()
            for img in request.FILES.getlist('images'):
                PostImage.objects.create(post=post, image=img)
        
        return Response({'message': 'อัปเดตสำเร็จ', 'post': post_to_dict(post, request)})

    if request.method == 'DELETE':
        post.delete()
        return Response({'message': 'ลบโพสต์สำเร็จ'})

@api_view(['GET'])
@permission_classes([AllowAny])
def category_list(request):
    cats = Category.objects.all()
    data = []
    for c in cats:
        data.append({
            'id': c.id,
            'value': c.name,
            'label': c.name,
            'icon': c.icon,
            'bg': c.color_bg,
            'text': c.color_text,
            'border': c.color_border,
            'dot': c.color_dot,
        })
    return Response(data)
