from django.urls import path
from . import views

urlpatterns = [
    path('knowledge/', views.knowledge_post_list, name='knowledge-list'),
    path('knowledge/<int:post_id>/', views.knowledge_post_detail, name='knowledge-detail'),
    path('knowledge/<int:post_id>/comments/', views.knowledge_comment_create, name='knowledge-comment-create'),
    path('knowledge/<int:post_id>/comments/<int:comment_id>/', views.knowledge_comment_delete, name='knowledge-comment-delete'),
]
