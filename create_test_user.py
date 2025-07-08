import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User

# Create test user
user, created = User.objects.get_or_create(
    email='test@example.com',
    defaults={'username': 'testuser'}
)
user.set_password('testpassword')
user.save()

print(f'Test user {"created" if created else "already exists"}: {user.email}')
print(f'User ID: {user.id}')
