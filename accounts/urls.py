from django.urls import path, include
from .views import ProfileDetail

urlpatterns = [
    path('auth/', include('dj_rest_auth.urls')),           # login/logout/password reset
    path('auth/registration/', include('dj_rest_auth.registration.urls')),  # signup
    path('auth/', include('allauth.socialaccount.urls')),  # Google OAuth
    path('profile/', ProfileDetail.as_view(), name='profile-detail'),

]