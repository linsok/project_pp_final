#!/usr/bin/env python3

import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.sites.models import Site
from allauth.socialaccount.models import SocialApp

def fix_google_oauth_configuration():
    """Fix Google OAuth configuration issues"""
    print("🔧 FIXING GOOGLE OAUTH CONFIGURATION")
    print("=" * 60)
    
    # 1. Update Site configuration to use exact domain
    print("\n1. Updating Site Configuration...")
    site = Site.objects.get(pk=1)
    
    # Update site domain to match callback URL exactly
    old_domain = site.domain
    site.domain = 'localhost:8000'
    site.name = 'RUPP Room Booking'
    site.save()
    
    print(f"   Site domain updated: {old_domain} → {site.domain}")
    
    # 2. Update Google OAuth app configuration
    print("\n2. Updating Google OAuth App...")
    google_app = SocialApp.objects.get(provider='google')
    
    # Make sure the callback URL uses the exact same domain
    old_callback = getattr(google_app, 'callback_url', 'Not set')
    
    # Ensure the app is associated with the correct site
    google_app.sites.clear()
    google_app.sites.add(site)
    
    print(f"   Google OAuth app re-associated with site: {site.domain}")
    
    # 3. Print the exact callback URLs that need to be configured
    print("\n3. REQUIRED GOOGLE OAUTH APP CONFIGURATION:")
    print("=" * 60)
    print("🔗 Go to Google Cloud Console:")
    print("   https://console.cloud.google.com/apis/credentials")
    print()
    print("🔗 Find your OAuth 2.0 Client ID:")
    print(f"   {google_app.client_id}")
    print()
    print("🔗 Add these EXACT URLs to 'Authorized redirect URIs':")
    print("   http://localhost:8000/accounts/google/login/callback/")
    print("   http://127.0.0.1:8000/accounts/google/login/callback/")
    print()
    print("⚠️  IMPORTANT NOTES:")
    print("   - URLs must be EXACT (including trailing slash)")
    print("   - Use http:// NOT https:// for localhost")
    print("   - Add BOTH localhost AND 127.0.0.1 URLs")
    print("   - Save changes and wait 5-10 minutes for propagation")
    
    # 4. Test the configuration
    print("\n4. TESTING CONFIGURATION...")
    print("=" * 60)
    
    import requests
    
    # Test OAuth login URL
    try:
        response = requests.get('http://localhost:8000/accounts/google/login/', timeout=5)
        if response.status_code in [200, 302]:
            print("   ✅ OAuth login URL is accessible")
        else:
            print(f"   ❌ OAuth login URL failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ OAuth login URL error: {e}")
    
    # Test callback URL (should return 200 but with error about missing code)
    try:
        response = requests.get('http://localhost:8000/accounts/google/login/callback/', timeout=5)
        if response.status_code == 200:
            print("   ✅ Callback URL is accessible")
        else:
            print(f"   ⚠️  Callback URL status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Callback URL error: {e}")
    
    print("\n5. NEXT STEPS:")
    print("=" * 60)
    print("1. ✅ Django configuration is now fixed")
    print("2. 🔧 Configure Google OAuth app callback URLs (see above)")
    print("3. ⏳ Wait 5-10 minutes for Google to propagate changes")
    print("4. 🧪 Test OAuth flow again")
    print("5. 📧 If still not working, check the exact email you're using")
    
    return True

if __name__ == "__main__":
    fix_google_oauth_configuration()
