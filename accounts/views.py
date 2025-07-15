from rest_framework import generics, permissions
from .models import Profile, PasswordResetCode, Room, Booking, ReportProblem
from .serializers import ProfileSerializer, RoomSerializer, BookingSerializer, ReportProblemSerializer
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from django.contrib.auth import get_user_model
from django.conf import settings
from rest_framework.authtoken.models import Token
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import random
import string
from django.db.models import Q
from datetime import datetime, date, time as datetime_time

User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    """Request password reset with 6-digit code"""
    email = request.data.get('email')
    
    if not email:
        return Response({'error': 'Email is required'}, status=400)
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Don't reveal that user doesn't exist for security
        return Response({'message': 'If the email exists, a reset code has been sent'}, status=200)
    
    # Create new password reset code
    reset_code = PasswordResetCode.objects.create(user=user)
    
    # Send email with 6-digit code
    try:
        context = {
            'user': user,
            'six_digit_code': reset_code.code,
        }
        
        html_message = render_to_string('email/password_reset_6digit.html', context)
        plain_message = strip_tags(html_message)
        
        send_mail(
            subject='Password Reset Code - RUPP Room Booking',
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        return Response({
            'message': 'Password reset code sent to your email',
            'email': email
        }, status=200)
        
    except Exception as e:
        return Response({'error': 'Failed to send email'}, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_reset_code(request):
    """Verify 6-digit code"""
    email = request.data.get('email')
    code = request.data.get('code')
    
    if not email or not code:
        return Response({'error': 'Email and code are required'}, status=400)
    
    try:
        user = User.objects.get(email=email)
        reset_code = PasswordResetCode.objects.filter(
            user=user,
            code=code,
            used=False
        ).first()
        
        if not reset_code or not reset_code.is_valid():
            return Response({'error': 'Invalid or expired code'}, status=400)
        
        return Response({
            'message': 'Code verified successfully',
            'email': email,
            'code': code
        }, status=200)
        
    except User.DoesNotExist:
        return Response({'error': 'Invalid email'}, status=400)

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_with_code(request):
    """Reset password using 6-digit code"""
    email = request.data.get('email')
    code = request.data.get('code')
    new_password = request.data.get('new_password')
    
    if not all([email, code, new_password]):
        return Response({'error': 'Email, code, and new password are required'}, status=400)
    
    try:
        user = User.objects.get(email=email)
        reset_code = PasswordResetCode.objects.filter(
            user=user,
            code=code,
            used=False
        ).first()
        
        if not reset_code or not reset_code.is_valid():
            return Response({'error': 'Invalid or expired code'}, status=400)
        
        # Update password
        user.set_password(new_password)
        user.save()
        
        # Mark code as used
        reset_code.mark_as_used()
        
        # Mark all other codes for this user as used
        PasswordResetCode.objects.filter(user=user, used=False).update(used=True)
        
        return Response({
            'message': 'Password reset successfully',
            'email': email
        }, status=200)
        
    except User.DoesNotExist:
        return Response({'error': 'Invalid email'}, status=400)



class ProfileDetail(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, created = Profile.objects.get_or_create(user=self.request.user)
        return profile
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def patch(self, request, *args, **kwargs):
        """Handle image uploads to database"""
        profile = self.get_object()
        
        # Check if this is an image upload
        if 'image' in request.FILES:
            image_file = request.FILES['image']
            
            # Validate file type
            if not image_file.content_type.startswith('image/'):
                return Response({'error': 'File must be an image'}, status=400)
            
            # Validate file size (5MB limit)
            if image_file.size > 5 * 1024 * 1024:
                return Response({'error': 'Image size must be less than 5MB'}, status=400)
            
            # Save image to database
            success = profile.save_image_to_db(image_file)
            if success:
                # Return updated profile data
                serializer = self.get_serializer(profile)
                return Response(serializer.data)
            else:
                return Response({'error': 'Failed to save image'}, status=500)
        
        # For other updates, use the default behavior
        return super().patch(request, *args, **kwargs)

@api_view(['GET'])
@permission_classes([AllowAny])
@api_view(['GET'])
def debug_profile(request):
    """Debug endpoint to test profile data"""
    if request.user.is_authenticated:
        profile, created = Profile.objects.get_or_create(user=request.user)
        serializer = ProfileSerializer(profile, context={'request': request})
        return Response({
            'user_id': request.user.id,
            'username': request.user.username,
            'profile_data': serializer.data,
            'image_field': str(profile.image),
            'image_url': profile.image.url if profile.image else None,
        })
    else:
        return Response({'error': 'Not authenticated'}, status=401)



class RoomSearchView(generics.ListAPIView):
    """API endpoint for searching available rooms"""
    serializer_class = RoomSerializer
    permission_classes = [permissions.AllowAny]  # Allow public search
    
    def get_queryset(self):
        queryset = Room.objects.all()  # Remove is_active filter for now
        
        # Get search parameters
        room_type = self.request.query_params.get('room_type')
        room_number = self.request.query_params.get('room_number')
        building = self.request.query_params.get('building')
        min_capacity = self.request.query_params.get('min_capacity')
        max_capacity = self.request.query_params.get('max_capacity')
        search_date = self.request.query_params.get('date')
        start_time = self.request.query_params.get('start_time')
        end_time = self.request.query_params.get('end_time')
        
        # Apply filters
        if room_type:
            queryset = queryset.filter(roomType__icontains=room_type)
        
        if room_number:
            queryset = queryset.filter(roomNumber__icontains=room_number)
        
        if building:
            queryset = queryset.filter(buildingName__icontains=building)
        
        if min_capacity:
            try:
                queryset = queryset.filter(capacity__gte=int(min_capacity))
            except ValueError:
                pass
        
        if max_capacity:
            try:
                queryset = queryset.filter(capacity__lte=int(max_capacity))
            except ValueError:
                pass
        
        # IMPORTANT: Availability checking requires room_number, date, and time
        # If any of these are missing, we cannot determine availability
        if all([room_number, search_date, start_time, end_time]):
            try:
                search_date = datetime.strptime(search_date, '%Y-%m-%d').date()
                start_time = datetime.strptime(start_time, '%H:%M').time()
                end_time = datetime.strptime(end_time, '%H:%M').time()
                
                # Get rooms that don't have conflicting bookings
                conflicting_rooms = Booking.objects.filter(
                    booking_date=search_date,
                    status__in=['pending', 'confirmed']
                ).filter(
                    Q(start_time__lt=end_time) & Q(end_time__gt=start_time)
                ).values_list('room_id', flat=True)
                
                queryset = queryset.exclude(id__in=conflicting_rooms)
                
            except (ValueError, TypeError):
                pass
        
        return queryset.order_by('buildingName', 'roomNumber')


class RoomDetailView(generics.RetrieveAPIView):
    """API endpoint for getting room details"""
    serializer_class = RoomSerializer
    queryset = Room.objects.all()  # Remove is_active filter for now
    permission_classes = [permissions.AllowAny]


class BookingCreateView(generics.CreateAPIView):
    """API endpoint for creating bookings"""
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class UserBookingsView(generics.ListAPIView):
    """API endpoint for getting user's bookings"""
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user).order_by('-created_at')


class BookingDeleteView(generics.DestroyAPIView):
    """API endpoint for deleting user's bookings"""
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users can only delete their own bookings
        return Booking.objects.filter(user=self.request.user)
    
    def perform_destroy(self, instance):
        # Optional: Add logging or additional checks before deletion
        print(f"Deleting booking {instance.id} by user {self.request.user.username}")
        super().perform_destroy(instance)


class RoomTypesView(generics.ListAPIView):
    """API endpoint for getting available room types"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        room_types = Room.objects.filter(is_active=True).values_list('roomType', flat=True).distinct()
        buildings = Room.objects.filter(is_active=True).values_list('buildingName', flat=True).distinct()
        
        return Response({
            'room_types': list(room_types),
            'buildings': list(filter(None, buildings)),
            'capacity_ranges': [
                {'label': '1-10 people', 'min': 1, 'max': 10},
                {'label': '11-25 people', 'min': 11, 'max': 25},
                {'label': '26-50 people', 'min': 26, 'max': 50},
                {'label': '51-100 people', 'min': 51, 'max': 100},
                {'label': '100+ people', 'min': 100, 'max': 1000},
            ]
        })


class ReportProblemCreateView(generics.CreateAPIView):
    queryset = ReportProblem.objects.all()
    serializer_class = ReportProblemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Problem report submitted successfully',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ReportProblemListView(generics.ListAPIView):
    queryset = ReportProblem.objects.all().order_by('-created_at')
    serializer_class = ReportProblemSerializer
    permission_classes = [permissions.IsAdminUser]  # Only admin can view all reports

@api_view(['GET'])
@permission_classes([AllowAny])
def get_room_building_mapping(request):
    """Get room number to building name mapping"""
    rooms = Room.objects.all()
    mapping = {}
    
    for room in rooms:
        mapping[room.roomNumber] = room.buildingName
    
    return Response({
        'room_building_mapping': mapping,
        'message': 'Room-building mapping retrieved successfully'
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_email(request):
    """Change user email with password verification"""
    user = request.user
    new_email = request.data.get('email')
    current_password = request.data.get('password')
    
    if not new_email or not current_password:
        return Response({
            'error': 'Both new email and current password are required'
        }, status=400)
    
    # Verify current password
    if not user.check_password(current_password):
        return Response({
            'error': 'Current password is incorrect'
        }, status=400)
    
    # Validate email format
    from django.core.validators import validate_email
    from django.core.exceptions import ValidationError
    
    try:
        validate_email(new_email)
    except ValidationError:
        return Response({
            'error': 'Please enter a valid email address'
        }, status=400)
    
    # Check if email is already in use
    if User.objects.filter(email=new_email).exclude(id=user.id).exists():
        return Response({
            'error': 'This email address is already in use'
        }, status=400)
    
    # Update email
    user.email = new_email
    user.save()
    
    return Response({
        'message': 'Email updated successfully',
        'email': new_email
    }, status=200)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_phone(request):
    """Change user phone number with password verification"""
    user = request.user
    new_phone = request.data.get('phone')
    current_password = request.data.get('password')
    
    if not new_phone or not current_password:
        return Response({
            'error': 'Both new phone number and current password are required'
        }, status=400)
    
    # Verify current password
    if not user.check_password(current_password):
        return Response({
            'error': 'Current password is incorrect'
        }, status=400)
    
    # Validate phone number format (basic validation)
    import re
    # Allow local and international formats, including leading zeros
    phone_pattern = r'^[\+]?[\d]{7,15}$'  # Allow 7-15 digits, with optional + prefix
    cleaned_phone = new_phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
    if not re.match(phone_pattern, cleaned_phone):
        return Response({
            'error': 'Please enter a valid phone number (7-15 digits)'
        }, status=400)
    
    # Get or create profile
    profile, created = Profile.objects.get_or_create(user=user)
    
    # Update phone number
    profile.phone = new_phone
    profile.save()
    
    return Response({
        'message': 'Phone number updated successfully',
        'phone': new_phone
    }, status=200)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """Change user password with current password verification"""
    user = request.user
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')
    
    if not all([current_password, new_password, confirm_password]):
        return Response({
            'error': 'Current password, new password, and confirmation are required'
        }, status=400)
    
    # Verify current password
    if not user.check_password(current_password):
        return Response({
            'error': 'Current password is incorrect'
        }, status=400)
    
    # Check if new passwords match
    if new_password != confirm_password:
        return Response({
            'error': 'New passwords do not match'
        }, status=400)
    
    # Validate new password strength
    if len(new_password) < 8:
        return Response({
            'error': 'Password must be at least 8 characters long'
        }, status=400)
    
    # Check if new password is different from current
    if user.check_password(new_password):
        return Response({
            'error': 'New password must be different from current password'
        }, status=400)
    
    # Additional password validation (optional)
    import re
    if not re.search(r'[A-Za-z]', new_password) or not re.search(r'[0-9]', new_password):
        return Response({
            'error': 'Password must contain at least one letter and one number'
        }, status=400)
    
    # Update password
    user.set_password(new_password)
    user.save()
    
    return Response({
        'message': 'Password updated successfully'
    }, status=200)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_username(request):
    """Change username with password verification"""
    user = request.user
    new_username = request.data.get('username')
    current_password = request.data.get('password')
    
    if not new_username or not current_password:
        return Response({
            'error': 'Both new username and current password are required'
        }, status=400)
    
    # Verify current password
    if not user.check_password(current_password):
        return Response({
            'error': 'Current password is incorrect'
        }, status=400)
    
    # Validate username format and length
    import re
    if len(new_username) < 3:
        return Response({
            'error': 'Username must be at least 3 characters long'
        }, status=400)
    
    if len(new_username) > 30:
        return Response({
            'error': 'Username must be less than 30 characters long'
        }, status=400)
    
    # Check if username contains only valid characters (letters, numbers, underscores, hyphens)
    if not re.match(r'^[a-zA-Z0-9_-]+$', new_username):
        return Response({
            'error': 'Username can only contain letters, numbers, underscores, and hyphens'
        }, status=400)
    
    # Check if username is already taken
    if User.objects.filter(username=new_username).exclude(id=user.id).exists():
        return Response({
            'error': 'This username is already taken'
        }, status=400)
    
    # Check if new username is different from current
    if user.username == new_username:
        return Response({
            'error': 'New username must be different from current username'
        }, status=400)
    
    # Update username
    user.username = new_username
    user.save()
    
    return Response({
        'message': 'Username updated successfully',
        'username': new_username
    }, status=200)

def test_api(request):
    """Simple test endpoint"""
    return JsonResponse({"status": "API is working", "method": request.method})
