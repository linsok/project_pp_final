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

def clean_google_social_apps():
    """Clean up duplicate Google Social Apps"""
    
    # List all Google social apps
    google_apps = SocialApp.objects.filter(provider='google')
    print(f'Found {google_apps.count()} Google Social Apps:')
    for app in google_apps:
        print(f'  - ID: {app.id}, Name: "{app.name}", Client ID: {app.client_id}')

    # Remove empty/duplicate ones
    deleted_count = 0
    for app in google_apps:
        if not app.name or app.name.strip() == '':
            print(f'Deleting empty Google Social App (ID: {app.id})')
            app.delete()
            deleted_count += 1
        elif not app.client_id or app.client_id.strip() == '':
            print(f'Deleting Google Social App with empty client_id (ID: {app.id})')
            app.delete()
            deleted_count += 1

    print(f'\nDeleted {deleted_count} duplicate/empty Google Social Apps')
    
    print('\nRemaining Google Social Apps:')
    remaining_apps = SocialApp.objects.filter(provider='google')
    for app in remaining_apps:
        print(f'  - ID: {app.id}, Name: "{app.name}", Client ID: {app.client_id}')
        
    return remaining_apps.count()

if __name__ == "__main__":
    print("🧹 Cleaning up Google Social Apps")
    print("=" * 40)
    count = clean_google_social_apps()
    print("=" * 40)
    if count == 1:
        print("✅ Google OAuth should now work correctly!")
    elif count == 0:
        print("❌ No Google Social Apps found!")
    else:
        print(f"⚠️ Still have {count} Google Social Apps - there might be duplicates")
