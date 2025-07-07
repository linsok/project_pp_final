#!/usr/bin/env python3

import os
import django
import requests
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.sites.models import Site
from allauth.socialaccount.models import SocialApp

def fix_oauth_configuration():
    """Fix common OAuth configuration issues"""
    print("🔧 Fixing OAuth Configuration Issues...")
    print("=" * 50)
    
    # 1. Check and fix Site configuration
    print("\n1. Checking Site Configuration...")
    site = Site.objects.get(pk=1)
    
    # Update to both localhost and 127.0.0.1
    if site.domain != 'localhost:8000':
        site.domain = 'localhost:8000'
        site.save()
        print("   ✅ Updated site domain to localhost:8000")
    else:
        print("   ✅ Site domain is correct")
    
    # 2. Check Google OAuth app
    print("\n2. Checking Google OAuth App...")
    google_apps = SocialApp.objects.filter(provider='google')
    
    if google_apps.count() == 0:
        print("   ❌ No Google OAuth app found!")
        return False
    elif google_apps.count() > 1:
        print("   ⚠️  Multiple Google OAuth apps found, using the first one")
    
    google_app = google_apps.first()
    
    # Make sure the app is associated with the site
    if not google_app.sites.filter(pk=site.pk).exists():
        google_app.sites.add(site)
        print("   ✅ Associated Google app with site")
    else:
        print("   ✅ Google app is associated with site")
    
    # 3. Test the OAuth URL
    print("\n3. Testing OAuth URL...")
    try:
        response = requests.get('http://127.0.0.1:8000/accounts/google/login/', timeout=5)
        if response.status_code in [200, 302]:
            print("   ✅ OAuth URL is accessible")
        else:
            print(f"   ❌ OAuth URL returned status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error accessing OAuth URL: {e}")
    
    # 4. Check callback URL
    print("\n4. Testing Callback URL...")
    try:
        response = requests.get('http://127.0.0.1:8000/accounts/google/login/callback/', timeout=5)
        print(f"   Callback URL status: {response.status_code}")
        if response.status_code == 400:
            print("   ✅ Callback URL is accessible (400 is expected without OAuth code)")
        else:
            print(f"   ⚠️  Callback URL returned: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error accessing callback URL: {e}")
    
    print("\n" + "=" * 50)
    print("📋 NEXT STEPS:")
    print("=" * 50)
    print("1. ✅ Django configuration is now fixed")
    print("2. 🔍 Check Google Cloud Console OAuth settings:")
    print("   - Go to Google Cloud Console")
    print("   - Navigate to APIs & Services > Credentials")
    print("   - Click on your OAuth 2.0 Client ID")
    print("   - Under 'Authorized redirect URIs', add:")
    print("     • http://127.0.0.1:8000/accounts/google/login/callback/")
    print("     • http://localhost:8000/accounts/google/login/callback/")
    print("   - Save the changes")
    print("3. 🧪 Test the OAuth flow using: oauth_debug_test.html")
    print("4. 📱 If still not working, check browser console for errors")
    
    return True

if __name__ == "__main__":
    fix_oauth_configuration()
