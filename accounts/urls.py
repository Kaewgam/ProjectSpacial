from django.urls import path
from .views import graph_page
from .views_graph import get_graph_data

urlpatterns = [
    path("graph-view/", graph_page),
    path("graph/", get_graph_data),
]