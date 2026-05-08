from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.core.paginator import Paginator

from .models import KnowledgePost, KnowledgeComment

def get_author_info(user):
    profile = getattr(user, 'profile', None)
    return {
        'id': user.student_id,
        'first_name': getattr(profile, 'first_name', '') if profile else '',
        'last_name': getattr(profile, 'last_name', '') if profile else '',
        'role': user.role,
        'profile_image': profile.avatar.url if profile and getattr(profile, 'avatar', None) and profile.avatar else None
    }

def comment_to_dict(comment, request):
    data = {
        'id': comment.id,
        'post_id': comment.post_id,
        'content': comment.content,
        'created_at': timezone.localtime(comment.created_at).strftime('%d/%m/%Y %H:%M'),
        'author': get_author_info(comment.author) if comment.author else None,
        'parent_id': comment.parent_id,
    }
    # For a detail view with prefetch, we should ideally use the prefetched related objects to avoid N+1 here too.
    # But since this is only for one post (detail), it's less critical. 
    replies = comment.replies.filter(is_active=True)
    if replies.exists():
        data['replies'] = [comment_to_dict(r, request) for r in replies]
    return data

def post_to_dict(post, request, include_comments=False):
    data = {
        'id': post.id,
        'title': post.title,
        'description': post.description,
        'url': post.url,
        'created_at': timezone.localtime(post.created_at).strftime('%d/%m/%Y %H:%M'),
        'is_active': post.is_active,
        'author': get_author_info(post.author) if post.author else None,
        'comment_count': getattr(post, 'comment_count_annotated', post.comments.filter(is_active=True).count()),
    }
    if include_comments:
        data['comments'] = [comment_to_dict(c, request) for c in post.comments.filter(is_active=True, parent__isnull=True)]
    return data

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def knowledge_post_list(request):
    if request.method == 'GET':
        qs = KnowledgePost.objects.select_related('author')
        if request.user.is_authenticated and request.user.role == 'ADMIN':
            qs = qs.all()
        else:
            qs = qs.filter(is_active=True)
            
        q = request.GET.get('q')
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q))
            
        qs = qs.annotate(comment_count_annotated=Count('comments', filter=Q(comments__is_active=True)))
        
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 12))
        paginator = Paginator(qs, limit)
        page_obj = paginator.get_page(page)
        results = [post_to_dict(p, request) for p in page_obj]
        
        return Response({
            'results': results,
            'total': paginator.count,
            'total_pages': paginator.num_pages,
            'page': page,
        })
        
    # POST
    if not request.user.is_authenticated:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        
    title = (request.data.get('title') or '').strip()
    description = (request.data.get('description') or '').strip()
    url = (request.data.get('url') or '').strip()
    
    if not title:
        return Response({'errors': {'title': 'กรุณากรอกหัวข้อ'}}, status=status.HTTP_400_BAD_REQUEST)
        
    post = KnowledgePost(
        title=title,
        description=description,
        url=url,
        author=request.user
    )
    post.save()
    return Response({'message': 'Created successfully', 'post': post_to_dict(post, request)}, status=status.HTTP_201_CREATED)

@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([AllowAny])
def knowledge_post_detail(request, post_id):
    try:
        post = KnowledgePost.objects.select_related('author').prefetch_related(
            'comments__author',
            'comments__replies__author'
        ).get(id=post_id)
    except KnowledgePost.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        
    if request.method == 'GET':
        return Response(post_to_dict(post, request, include_comments=True))
        
    if request.method == 'PATCH':
        if not request.user.is_authenticated or (request.user != post.author and request.user.role != 'ADMIN'):
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
            
        title = request.data.get('title')
        description = request.data.get('description')
        url = request.data.get('url')
        is_active = request.data.get('is_active')
        
        if title is not None: post.title = title
        if description is not None: post.description = description
        if url is not None: post.url = url
        if is_active is not None: post.is_active = is_active in [True, 'true', '1']
        
        post.save()
        return Response({'message': 'Updated successfully', 'post': post_to_dict(post, request)})
        
    if request.method == 'DELETE':
        if not request.user.is_authenticated or (request.user != post.author and request.user.role != 'ADMIN'):
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        post.delete()
        return Response({'message': 'Deleted successfully'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def knowledge_comment_create(request, post_id):
    try:
        post = KnowledgePost.objects.get(id=post_id)
    except KnowledgePost.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        
    content = (request.data.get('content') or '').strip()
    parent_id = request.data.get('parent_id')
    
    parent = None
    if parent_id:
        try:
            parent = KnowledgeComment.objects.get(id=parent_id, post=post)
        except KnowledgeComment.DoesNotExist:
            pass

    if not content:
        return Response({'error': 'Content required'}, status=status.HTTP_400_BAD_REQUEST)
        
    comment = KnowledgeComment(
        post=post,
        content=content,
        author=request.user,
        parent=parent
    )
    comment.save()
    return Response({'message': 'Comment added', 'comment': comment_to_dict(comment, request)}, status=status.HTTP_201_CREATED)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def knowledge_comment_delete(request, post_id, comment_id):
    try:
        comment = KnowledgeComment.objects.get(id=comment_id, post_id=post_id)
    except KnowledgeComment.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        
    if request.user != comment.author and request.user.role != 'ADMIN':
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
    comment.delete()
    return Response({'message': 'Deleted successfully'})
