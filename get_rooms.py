import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import Room

print('Room Number -> Building Name mapping:')
for room in Room.objects.all()[:20]:
    print(f'{room.roomNumber} -> {room.buildingName}')
