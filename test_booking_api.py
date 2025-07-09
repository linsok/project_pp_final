import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
import requests
import json

# Get test user token
try:
    user = User.objects.get(email='test@example.com')
    token, created = Token.objects.get_or_create(user=user)
    print(f'User: {user.email}')
    print(f'Token: {token.key}')
    
    # Test booking data
    booking_data = {
        'room_number': 'A101',
        'building_name': 'Building A', 
        'booking_date': '2025-07-10',
        'start_time': '10:00',
        'end_time': '11:00',
        'purpose': 'API Test booking'
    }
    
    # Make API request
    response = requests.post(
        'http://localhost:8000/api/bookings/',
        headers={
            'Authorization': f'Token {token.key}',
            'Content-Type': 'application/json'
        },
        json=booking_data
    )
    
    print(f'Response Status: {response.status_code}')
    print(f'Response Headers: {dict(response.headers)}')
    print(f'Response Body: {response.text}')
    
    if response.status_code == 201:
        print('✅ Booking created successfully!')
    else:
        print('❌ Booking failed!')
        
except Exception as e:
    print(f'Error: {e}')
