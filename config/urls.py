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
    path('', TemplateView.as_view(template_name='index.html'), name='root'),
    
    # Frontend static files (CSS, JS, images)
    re_path(r'^frontend/(?P<path>.*)$', serve, {'document_root': settings.BASE_DIR / 'frontend'}),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)