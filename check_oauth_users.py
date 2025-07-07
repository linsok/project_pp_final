#!/usr/bin/env python3

import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from accounts.models import Profile
from allauth.socialaccount.models import SocialAccount

print("Current Users in Database:")
print("=" * 40)
for user in User.objects.all():
    print(f"User: {user.username} ({user.email})")
    try:
        profile = Profile.objects.get(user=user)
        print(f"  Profile: ✅ Exists")
    except Profile.DoesNotExist:
        print(f"  Profile: ❌ Missing")
    
    social_accounts = SocialAccount.objects.filter(user=user)
    if social_accounts.exists():
        for sa in social_accounts:
            print(f"  Social Account: {sa.provider} - {sa.extra_data.get('email', 'No email')}")
    else:
        print(f"  Social Account: None")
    print()

print("Recent OAuth Attempts:")
print("=" * 40)
print("If OAuth was successful, you should see a new user above with a Google social account.")
print()
print("If no new user was created, the OAuth flow is failing.")
print("This could be due to:")
print("1. Callback URL not configured in Google OAuth app")
print("2. OAuth flow not completing properly")
print("3. User creation/login process failing")
