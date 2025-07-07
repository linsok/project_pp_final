#!/usr/bin/env python3

import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from allauth.socialaccount.models import SocialApp
from django.contrib.sites.models import Site

print('Current Google OAuth Configuration:')
print('=' * 50)

for app in SocialApp.objects.filter(provider='google'):
    print(f'SocialApp ID: {app.id}')
    print(f'Name: {app.name}')
    print(f'Provider: {app.provider}')
    print(f'Client ID: {app.client_id}')
    print(f'Secret: {app.secret[:10]}...')
    print(f'Sites: {[f"{site.domain}" for site in app.sites.all()]}')
    print()

print('Expected callback URL should be:')
print('http://127.0.0.1:8000/accounts/google/login/callback/')
print('http://localhost:8000/accounts/google/login/callback/')
print()

print('Current Site configuration:')
for site in Site.objects.all():
    print(f'Site ID: {site.id}')
    print(f'Domain: {site.domain}')
    print(f'Name: {site.name}')
    print()

print('IMPORTANT: Check Google OAuth App Settings')
print('=' * 50)
print('1. Go to Google Cloud Console')
print('2. Navigate to APIs & Services > Credentials')
print('3. Click on your OAuth 2.0 Client ID')
print('4. Under "Authorized redirect URIs", make sure you have:')
print('   - http://127.0.0.1:8000/accounts/google/login/callback/')
print('   - http://localhost:8000/accounts/google/login/callback/')
print('5. Save the changes')
print()
print('If the callback URLs are not configured correctly in Google,')
print('the OAuth flow will fail silently or show an error.')
