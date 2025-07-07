#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append('c:/Users/USER/backend2')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.socialaccount.models import SocialApp
from django.test import RequestFactory

def debug_list_apps():
    """Debug the list_apps method that's causing the MultipleObjectsReturned error"""
    
    print("🔍 Debugging list_apps method")
    print("=" * 50)
    
    # Create a fake request
    factory = RequestFactory()
    request = factory.get('/test/')
    
    # Create adapter
    adapter = DefaultSocialAccountAdapter()
    
    # Call list_apps method directly
    try:
        apps = adapter.list_apps(request, provider='google')
        print(f"list_apps returned {len(apps)} apps:")
        for i, app in enumerate(apps):
            print(f"  App {i+1}: ID={app.id}, Name='{app.name}', Client ID='{app.client_id}', Provider='{app.provider}'")
        
        # Check if any are marked as hidden
        for app in apps:
            hidden = app.settings.get('hidden', False)
            print(f"  App {app.id} hidden status: {hidden}")
            
    except Exception as e:
        print(f"Error in list_apps: {e}")
    
    # Also try the get_app method directly
    try:
        print(f"\nTesting get_app method:")
        app = adapter.get_app(request, provider='google')
        print(f"get_app returned: ID={app.id}, Name='{app.name}'")
        
    except Exception as e:
        print(f"Error in get_app: {e}")
        
    # Check if there are multiple sites configurations
    print(f"\nChecking site configurations:")
    from django.contrib.sites.models import Site
    sites = Site.objects.all()
    for site in sites:
        print(f"  Site: {site.id} - {site.domain} ({site.name})")
        
    # Check which sites the Google app is associated with
    google_app = SocialApp.objects.get(provider='google')
    app_sites = google_app.sites.all()
    print(f"\nGoogle app is associated with {app_sites.count()} sites:")
    for site in app_sites:
        print(f"  - {site.id}: {site.domain} ({site.name})")

if __name__ == "__main__":
    debug_list_apps()
