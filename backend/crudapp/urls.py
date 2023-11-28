from django.urls import path
from .views import *

urlpatterns = [
    path('personalinfo/', PersonalInfoListCreateAPIView.as_view(),name='personalinfo-list-create'),
    path('personalinfo/<int:pk>/', PersonalInfoRetrieveUpdateAPIView.as_view(),name='personalinfo-retrieve-update'),
]
