"""
URL configuration for alumni_system project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from accounts.views import (
    test_protected, register, search_alumni,
    me_view, update_profile, upload_avatar,
    request_password_reset, confirm_password_reset, graph_page,
    list_faculties, list_departments,
)
from accounts.views_graph import get_graph_data
from accounts.views_admin import (
    admin_stats, admin_users_list, admin_user_detail,
    admin_neo4j_cleanup, admin_neo4j_syncall, admin_neo4j_status,
    admin_create_user, admin_neo4j_audit,
)
from posts.views import post_list, post_detail

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/register/', register),
    path('api/token/', TokenObtainPairView.as_view()),
    path('api/token/refresh/', TokenRefreshView.as_view()),
    path('api/test/', test_protected),
    path('api/alumni/search/', search_alumni),
    path('api/me/', me_view),
    path('api/me/update/', update_profile),
    path('api/me/avatar/', upload_avatar),
    path('api/password-reset/', request_password_reset),
    path('api/password-reset/confirm/', confirm_password_reset),
    path("graph/", graph_page),
    path("graph-data/", get_graph_data),
    # ── Admin API ──
    path('api/admin/stats/', admin_stats),
    path('api/admin/users/', admin_users_list),
    path('api/admin/users/create/', admin_create_user),
    path('api/admin/users/<uuid:user_id>/', admin_user_detail),
    path('api/admin/neo4j/cleanup/', admin_neo4j_cleanup),
    path('api/admin/neo4j/sync-all/', admin_neo4j_syncall),
    path('api/admin/neo4j/status/', admin_neo4j_status),
    path('api/admin/neo4j/audit/', admin_neo4j_audit),
    # ── Post API ──
    path('api/posts/', post_list),
    path('api/posts/<uuid:post_id>/', post_detail),
    # ── Faculty & Department API ──
    path('api/faculties/', list_faculties),
    path('api/departments/', list_departments),
    path('api/', include('knowledge.urls')),
    path('', include('accounts.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

