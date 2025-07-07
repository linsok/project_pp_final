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
from django.db import connection

def inspect_database():
    """Inspect the database directly for all social apps"""
    
    print("🔍 Direct Database Inspection")
    print("=" * 50)
    
    # Query the database directly
    with connection.cursor() as cursor:
        cursor.execute("SELECT id, provider, name, client_id, secret FROM socialaccount_socialapp ORDER BY id")
        rows = cursor.fetchall()
        
        print(f"Direct SQL Query Results ({len(rows)} rows):")
        for row in rows:
            id_val, provider, name, client_id, secret = row
            secret_display = '***' if secret else 'EMPTY'
            print(f"  ID: {id_val}, Provider: '{provider}', Name: '{name}', Client ID: '{client_id}', Secret: {secret_display}")
    
    # Also check via Django ORM
    print(f"\nDjango ORM Results:")
    all_apps = SocialApp.objects.all()
    for app in all_apps:
        secret_display = '***' if app.secret else 'EMPTY'
        print(f"  ID: {app.id}, Provider: '{app.provider}', Name: '{app.name}', Client ID: '{app.client_id}', Secret: {secret_display}")
    
    # Find and delete problematic apps
    print(f"\nCleaning up problematic apps...")
    deleted_count = 0
    
    # Delete all apps without names or client IDs
    for app in all_apps:
        should_delete = False
        reason = ""
        
        if app.provider == 'google':
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
            print(f"  Deleting app ID {app.id}: {reason}")
            app.delete()
            deleted_count += 1
    
    print(f"\nDeleted {deleted_count} problematic apps")
    
    # Check what's left
    remaining_apps = SocialApp.objects.filter(provider='google')
    print(f"\nRemaining Google apps: {remaining_apps.count()}")
    for app in remaining_apps:
        print(f"  - ID: {app.id}, Name: '{app.name}', Client ID: {app.client_id}")
    
    return remaining_apps.count()

if __name__ == "__main__":
    count = inspect_database()
    
    if count == 1:
        print("\n✅ Perfect! Exactly one Google app remaining.")
    elif count == 0:
        print("\n❌ No Google apps remaining - need to create one!")
    else:
        print(f"\n⚠️ Still have {count} Google apps - there may still be issues")
