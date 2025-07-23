"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
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
from django.conf import settings
from django.contrib import admin
from django.urls import path, include
from accounts import views
from django.conf import settings
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.views.static import serve
from django.urls import re_path


urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('dj_rest_auth.urls')),            # login/logout only
    path('auth/registration/', include('dj_rest_auth.registration.urls')),  # registration
    path('api/', include('accounts.urls')),  # Custom API endpoints
    path('api/password_reset/', include('django_rest_passwordreset.urls', namespace='password_reset')),
    
    # Frontend HTML files
    path('frontend/home.html', TemplateView.as_view(template_name='home.html'), name='home'),
    path('frontend/index.html', TemplateView.as_view(template_name='index.html'), name='index'),
    path('frontend/admin_dashboard.html', TemplateView.as_view(template_name='admin_dashboard.html'), name='admin_dashboard'),
    path('frontend/admin_manage_bookings.html', TemplateView.as_view(template_name='admin_manage_bookings.html'), name='admin_manage_bookings'),
    path('frontend/admin_room_management.html', TemplateView.as_view(template_name='admin_room_management.html'), name='admin_room_management'),
    path('frontend/admin_settings.html', TemplateView.as_view(template_name='admin_settings.html'), name='admin_settings'),
    path('frontend/book_room.html', TemplateView.as_view(template_name='book_room.html'), name='book_room'),
    path('frontend/view_booking.html', TemplateView.as_view(template_name='view_booking.html'), name='view_booking'),
    path('frontend/available_room.html', TemplateView.as_view(template_name='available_room.html'), name='available_room'),
    path('frontend/booking_history.html', TemplateView.as_view(template_name='booking_history.html'), name='booking_history'),
    path('frontend/map.html', TemplateView.as_view(template_name='map.html'), name='map'),
    path('frontend/setting.html', TemplateView.as_view(template_name='setting.html'), name='setting'),
    path('frontend/about.html', TemplateView.as_view(template_name='about.html'), name='about'),
    path('frontend/report.html', TemplateView.as_view(template_name='report.html'), name='report'),
    path('frontend/privacy_security.html', TemplateView.as_view(template_name='privacy_security.html'), name='privacy_security'),
    path('frontend/test_login_redirect.html', TemplateView.as_view(template_name='test_login_redirect.html'), name='test_login_redirect'),
    path('frontend/debug_admin_dashboard.html', TemplateView.as_view(template_name='debug_admin_dashboard.html'), name='debug_admin_dashboard'),
    path('frontend/admin_login_helper.html', TemplateView.as_view(template_name='admin_login_helper.html'), name='admin_login_helper'),
    path('', TemplateView.as_view(template_name='index.html'), name='root'),
    
    # Frontend static files (CSS, JS, images)
    re_path(r'^frontend/(?P<path>.*)$', serve, {'document_root': settings.BASE_DIR / 'frontend'}),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)