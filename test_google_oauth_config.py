#!/usr/bin/env python
import os
import sys
import django
import requests

# Add the project directory to the Python path
sys.path.append('c:/Users/USER/backend2')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
from allauth.socialaccount.providers.google.provider import GoogleProvider
from allauth.socialaccount.models import SocialApp
from django.contrib.sites.models import Site

def check_google_oauth_config():
    """Check Google OAuth configuration"""
    print("🔍 Checking Google OAuth Configuration")
    print("=" * 50)
    
    # Check Django settings
    print("📋 Django Settings:")
    print(f"  SITE_ID: {settings.SITE_ID}")
    print(f"  DEBUG: {settings.DEBUG}")
    print(f"  ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
    
    # Check installed apps
    oauth_apps = [
        'allauth',
        'allauth.account', 
        'allauth.socialaccount',
        'allauth.socialaccount.providers.google',
        'dj_rest_auth',
        'dj_rest_auth.registration'
    ]
    
    print("\n📦 Required Apps:")
    for app in oauth_apps:
        if app in settings.INSTALLED_APPS:
            print(f"  ✅ {app}")
        else:
            print(f"  ❌ {app} - MISSING!")
    
    # Check Google OAuth provider settings
    print("\n🔧 Google OAuth Provider Settings:")
    google_settings = settings.SOCIALACCOUNT_PROVIDERS.get('google', {})
    if google_settings:
        app_settings = google_settings.get('APP', {})
        print(f"  ✅ Client ID: {app_settings.get('client_id', 'Not set')}")
        print(f"  ✅ Secret: {'*' * 20 if app_settings.get('secret') else 'Not set'}")
        print(f"  ✅ Scopes: {google_settings.get('SCOPE', [])}")
    else:
        print("  ❌ Google OAuth not configured!")
    
    # Check database configuration
    print("\n🗄️ Database Configuration:")
    try:
        site = Site.objects.get(pk=settings.SITE_ID)
        print(f"  ✅ Site: {site.domain} - {site.name}")
        
        # Check if Google social app is configured
        try:
            google_app = SocialApp.objects.get(provider='google')
            print(f"  ✅ Google Social App found: {google_app.name}")
            print(f"  ✅ Client ID: {google_app.client_id}")
            print(f"  ✅ Sites: {[s.domain for s in google_app.sites.all()]}")
        except SocialApp.DoesNotExist:
            print("  ❌ Google Social App not found in database!")
            print("  💡 You need to create a Google Social App in Django Admin")
            return False
        
    except Exception as e:
        print(f"  ❌ Database error: {e}")
        return False
    
    print("\n✅ Google OAuth configuration looks good!")
    return True

def create_google_social_app():
    """Create Google Social App in database"""
    print("\n🔧 Creating Google Social App in database...")
    
    try:
        # Get Google OAuth settings
        google_settings = settings.SOCIALACCOUNT_PROVIDERS.get('google', {})
        app_settings = google_settings.get('APP', {})
        
        client_id = app_settings.get('client_id')
        secret = app_settings.get('secret')
        
        if not client_id or not secret:
            print("❌ Google OAuth client ID or secret not found in settings!")
            return False
        
        # Create or get the Google social app
        google_app, created = SocialApp.objects.get_or_create(
            provider='google',
            defaults={
                'name': 'Google OAuth',
                'client_id': client_id,
                'secret': secret,
            }
        )
        
        # Add current site to the app
        site = Site.objects.get(pk=settings.SITE_ID)
        google_app.sites.add(site)
        
        if created:
            print(f"✅ Created Google Social App: {google_app.name}")
        else:
            print(f"✅ Google Social App already exists: {google_app.name}")
            
        print(f"✅ Added site {site.domain} to Google Social App")
        return True
        
    except Exception as e:
        print(f"❌ Error creating Google Social App: {e}")
        return False

def test_google_oauth_urls():
    """Test Google OAuth URLs"""
    print("\n🌐 Testing Google OAuth URLs:")
    
    base_url = "http://localhost:8000"
    test_urls = [
        "/accounts/google/login/",
        "/accounts/google/login/callback/",
        "/auth/google/",
    ]
    
    for url in test_urls:
        try:
            response = requests.get(f"{base_url}{url}", timeout=5)
            if response.status_code in [200, 302, 400]:  # 400 is expected for callback without code
                print(f"  ✅ {url} - Status: {response.status_code}")
            else:
                print(f"  ❌ {url} - Status: {response.status_code}")
        except requests.exceptions.ConnectionError:
            print(f"  ❌ {url} - Connection error (server not running?)")
        except Exception as e:
            print(f"  ❌ {url} - Error: {e}")

def main():
    print("🔐 Google OAuth Configuration Checker")
    print("=" * 50)
    
    # Check configuration
    config_ok = check_google_oauth_config()
    
    if not config_ok:
        print("\n🔧 Attempting to fix configuration...")
        create_google_social_app()
        
        # Check again
        print("\n🔍 Rechecking configuration...")
        config_ok = check_google_oauth_config()
    
    # Test URLs
    test_google_oauth_urls()
    
    print("\n" + "=" * 50)
    if config_ok:
        print("🎉 Google OAuth should be working!")
        print("\n📋 Next steps:")
        print("1. Start Django server: python manage.py runserver")
        print("2. Open test_google_oauth.html in browser")
        print("3. Test Google OAuth login")
        print("4. Make sure Google Cloud Console is configured with:")
        print("   - Authorized redirect URI: http://localhost:8000/accounts/google/login/callback/")
        print("   - Authorized JavaScript origin: http://localhost:8000")
    else:
        print("❌ Google OAuth configuration has issues!")
        print("Please check the errors above and fix them.")

if __name__ == "__main__":
    main()
