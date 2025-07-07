from django.urls import path, include
from .views import (
    ProfileDetail, GoogleLogin, google_login_url, google_oauth_callback, 
    google_login_success, request_password_reset,
    verify_reset_code, reset_password_with_code
)

urlpatterns = [
    path('auth/', include('dj_rest_auth.urls')),           # login/logout/password reset
    path('auth/registration/', include('dj_rest_auth.registration.urls')),  # signup
    path('auth/', include('allauth.socialaccount.urls')),  # Google OAuth
    path('profile/', ProfileDetail.as_view(), name='profile-detail'),
    
    # Google OAuth endpoints
    path('google/login/', GoogleLogin.as_view(), name='google_login'),
    path('google/url/', google_login_url, name='google_login_url'),
    path('google/callback/', google_oauth_callback, name='google_oauth_callback'),
    path('google/success/', google_login_success, name='google_login_success'),
    
    # Custom 6-digit password reset endpoints
    path('password/reset/request/', request_password_reset, name='password_reset_request'),
    path('password/reset/verify/', verify_reset_code, name='password_reset_verify'),
    path('password/reset/confirm/', reset_password_with_code, name='password_reset_confirm'),
]