#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append('c:/Users/USER/backend2')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from allauth.socialaccount.models import SocialApp

def fix_google_social_apps():
    """Fix duplicate Google Social Apps issue"""
    
    print("🔍 Investigating Google Social Apps in detail...")
    
    # Get all social apps (not just Google)
    all_apps = SocialApp.objects.all()
    print(f"Total Social Apps: {all_apps.count()}")
    
    for app in all_apps:
        print(f"  - ID: {app.id}, Provider: '{app.provider}', Name: '{app.name}', Client ID: '{app.client_id}', Secret: {'***' if app.secret else 'EMPTY'}")
    
    # Get specifically Google apps
    google_apps = SocialApp.objects.filter(provider='google')
    print(f"\nGoogle Apps: {google_apps.count()}")
    
    # Delete all empty or invalid Google apps
    deleted_count = 0
    for app in google_apps:
        should_delete = False
        reason = ""
        
        if not app.name or app.name.strip() == '':
            should_delete = True
            reason = "empty name"
        elif not app.client_id or app.client_id.strip() == '':
            should_delete = True
            reason = "empty client_id"
        elif not app.secret or app.secret.strip() == '':
            should_delete = True
            reason = "empty secret"
        
        if should_delete:
            print(f"Deleting Google Social App (ID: {app.id}) - Reason: {reason}")
            app.delete()
            deleted_count += 1
        else:
            print(f"Keeping Google Social App (ID: {app.id}) - Name: '{app.name}'")
    
    print(f"\nDeleted {deleted_count} invalid Google Social Apps")
    
    # Check remaining apps
    remaining_google_apps = SocialApp.objects.filter(provider='google')
    print(f"Remaining Google Apps: {remaining_google_apps.count()}")
    
    if remaining_google_apps.count() == 0:
        print("❌ No Google apps remaining! Creating a new one...")
        
        # Create a new Google app
        from django.conf import settings
        google_settings = settings.SOCIALACCOUNT_PROVIDERS.get('google', {})
        app_settings = google_settings.get('APP', {})
        
        new_app = SocialApp.objects.create(
            provider='google',
            name='Google OAuth',
            client_id=app_settings.get('client_id', ''),
            secret=app_settings.get('secret', '')
        )
        
        # Add to current site
        from django.contrib.sites.models import Site
        site = Site.objects.get(pk=settings.SITE_ID)
        new_app.sites.add(site)
        
        print(f"✅ Created new Google Social App: {new_app.name}")
        
    elif remaining_google_apps.count() == 1:
        print("✅ Perfect! Exactly one Google app remaining.")
        app = remaining_google_apps.first()
        print(f"   Name: '{app.name}', Client ID: {app.client_id}")
    else:
        print(f"⚠️ Still have {remaining_google_apps.count()} Google apps!")
        for app in remaining_google_apps:
            print(f"   - ID: {app.id}, Name: '{app.name}', Client ID: {app.client_id}")

if __name__ == "__main__":
    print("🔧 Fixing Google Social Apps")
    print("=" * 50)
    fix_google_social_apps()
    print("=" * 50)
    print("✅ Done!")
