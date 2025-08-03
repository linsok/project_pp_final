from rest_framework import generics, permissions
from .models import Profile, PasswordResetCode, Room, Booking, ReportProblem
from .serializers import ProfileSerializer, RoomSerializer, BookingSerializer, ReportProblemSerializer
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
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
from datetime import datetime, date, time as datetime_time, timedelta

User = get_user_model()

def send_booking_notification(user, booking, notification_type):
    """Send booking notification to user based on their settings"""
    print(f"DEBUG: send_booking_notification called for user {user.username}, notification_type: {notification_type}")
    try:
        from .models import NotificationSettings
        
        # Get user's notification settings
        settings = NotificationSettings.get_or_create_for_user(user)
        print(f"DEBUG: User notification settings - email_notifications: {settings.email_notifications}, booking_alerts: {settings.booking_alerts}, notification_email: {settings.notification_email}")
        
        # Check if user has enabled the specific notification type
        if not settings.email_notifications:
            return False
            
        if notification_type == 'booking_created' and not settings.booking_alerts:
            return False
            
        if notification_type == 'booking_updated' and not settings.booking_alerts:
            return False
            
        if notification_type == 'booking_cancelled' and not settings.booking_alerts:
            return False
        
        # Prepare email content based on notification type
        if notification_type == 'booking_created':
            subject = 'Booking Confirmation - RUPP Room Booking System'
            message = f"""
Hello {user.username},

Your room booking has been successfully created!

Booking Details:
- Room: {booking.room.roomNumber} ({booking.room.buildingName})
- Date: {booking.booking_date}
- Time: {booking.start_time} - {booking.end_time}
- Purpose: {booking.purpose or 'Not specified'}
- Status: {booking.status.title()}

You will receive a confirmation once your booking is approved.

Best regards,
RUPP Room Booking System Team
            """
        elif notification_type == 'booking_updated':
            subject = 'Booking Updated - RUPP Room Booking System'
            message = f"""
Hello {user.username},

Your room booking has been updated!

Booking Details:
- Room: {booking.room.roomNumber} ({booking.room.buildingName})
- Date: {booking.booking_date}
- Time: {booking.start_time} - {booking.end_time}
- Purpose: {booking.purpose or 'Not specified'}
- Status: {booking.status.title()}

Best regards,
RUPP Room Booking System Team
            """
        elif notification_type == 'booking_cancelled':
            subject = 'Booking Cancelled - RUPP Room Booking System'
            message = f"""
Hello {user.username},

Your room booking has been cancelled.

Booking Details:
- Room: {booking.room.roomNumber} ({booking.room.buildingName})
- Date: {booking.booking_date}
- Time: {booking.start_time} - {booking.end_time}

If you have any questions, please contact the administration.

Best regards,
RUPP Room Booking System Team
            """
        else:
            return False
        
        # Send email
        from django.conf import settings as django_settings
        print(f"DEBUG: Attempting to send email to {settings.notification_email}")
        print(f"DEBUG: From email: {django_settings.DEFAULT_FROM_EMAIL}")
        print(f"DEBUG: Subject: {subject}")
        
        send_mail(
            subject=subject,
            message=message,
            from_email=django_settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.notification_email],
            fail_silently=True,  # Don't fail if email sending fails
        )
        
        print(f"DEBUG: Email sent successfully to {settings.notification_email}")
        return True
        
    except Exception as e:
        print(f"Error sending notification: {e}")
        import traceback
        traceback.print_exc()
        return False

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


class RoomListView(generics.ListAPIView):
    """API endpoint for listing all rooms (admin only)"""
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        return Room.objects.all().order_by('buildingName', 'roomNumber')


class RoomCreateView(generics.CreateAPIView):
    """API endpoint for creating rooms (admin only)"""
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def perform_create(self, serializer):
        serializer.save()


class RoomUpdateView(generics.UpdateAPIView):
    """API endpoint for updating rooms (admin only)"""
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Room.objects.all()


class RoomDeleteView(generics.DestroyAPIView):
    """API endpoint for deleting rooms (admin only)"""
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Room.objects.all()


@api_view(['PATCH'])
@permission_classes([permissions.IsAdminUser])
def toggle_room_status(request, room_id):
    """Toggle room active/inactive status"""
    try:
        room = Room.objects.get(id=room_id)
        room.is_active = not room.is_active
        room.save()
        
        return Response({
            'id': room.id,
            'is_active': room.is_active,
            'message': f'Room {room.roomNumber} {"activated" if room.is_active else "deactivated"} successfully'
        })
    except Room.DoesNotExist:
        return Response({'error': 'Room not found'}, status=404)


class BookingCreateView(generics.CreateAPIView):
    """API endpoint for creating bookings"""
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        booking = serializer.save(user=self.request.user)
        # Send notification for new booking
        send_booking_notification(self.request.user, booking, 'booking_created')


class UserBookingsView(generics.ListAPIView):
    """API endpoint for getting user's bookings"""
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user).order_by('-created_at')

class UserBookingHistoryView(generics.ListAPIView):
    """API endpoint for getting user's booking history (confirmed and cancelled only)"""
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Booking.objects.filter(
            user=self.request.user,
            status__in=['confirmed', 'cancelled']
        ).order_by('-created_at')

class AdminBookingsView(generics.ListAPIView):
    """API endpoint for getting all bookings (admin only)"""
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        # Admin can see all bookings
        return Booking.objects.all().order_by('-created_at')


class BookingDeleteView(generics.DestroyAPIView):
    """API endpoint for deleting user's bookings"""
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users can only delete their own bookings
        return Booking.objects.filter(user=self.request.user)
    
    def perform_destroy(self, instance):
        # Send notification before deletion
        send_booking_notification(self.request.user, instance, 'booking_cancelled')
        # Optional: Add logging or additional checks before deletion
        print(f"Deleting booking {instance.id} by user {self.request.user.username}")
        super().perform_destroy(instance)

@api_view(['PATCH'])
@permission_classes([permissions.IsAdminUser])
def update_booking_status(request, booking_id):
    """Update booking status (admin only)"""
    try:
        booking = Booking.objects.get(id=booking_id)
        new_status = request.data.get('status')
        
        if new_status in ['pending', 'confirmed', 'cancelled', 'completed']:
            old_status = booking.status
            booking.status = new_status
            booking.save()
            
            # Send notification for status change
            if old_status != new_status:
                send_booking_notification(booking.user, booking, 'booking_updated')
            
            return JsonResponse({
                'message': f'Booking status updated to {new_status}',
                'booking_id': booking_id,
                'status': new_status
            })
        else:
            return JsonResponse({
                'error': 'Invalid status. Must be one of: pending, confirmed, cancelled, completed'
            }, status=400)
            
    except Booking.DoesNotExist:
        return JsonResponse({
            'error': 'Booking not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)


class RoomTypesView(generics.ListAPIView):
    """API endpoint for getting available room types and rooms"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        # Get all active rooms
        rooms = Room.objects.filter(is_active=True)
        rooms_data = []
        
        for room in rooms:
            rooms_data.append({
                'id': room.id,
                'roomNumber': room.roomNumber,
                'buildingName': room.buildingName,
                'capacity': room.capacity,
                'roomType': room.roomType,
                'is_active': room.is_active
            })
        
        room_types = rooms.values_list('roomType', flat=True).distinct()
        buildings = rooms.values_list('buildingName', flat=True).distinct()
        
        return Response({
            'rooms': rooms_data,
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

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_dashboard_data(request):
    """Return total users, rooms, and bookings counts for admin dashboard"""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    users_count = User.objects.count()
    rooms_count = Room.objects.count()
    bookings_count = Booking.objects.count()
    return JsonResponse({
        "users": users_count,
        "rooms": rooms_count,
        "bookings": bookings_count
    })

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_stats(request):
    """Return detailed booking statistics for admin manage bookings page and system info"""
    from django.utils import timezone
    from datetime import date
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    today = date.today()
    
    # Get user and room counts
    total_users = User.objects.count()
    total_rooms = Room.objects.count()
    
    # Get all bookings
    total_bookings = Booking.objects.count()
    
    # Get bookings by status
    pending_bookings = Booking.objects.filter(status='pending').count()
    confirmed_bookings = Booking.objects.filter(status='confirmed').count()
    cancelled_bookings = Booking.objects.filter(status='cancelled').count()
    completed_bookings = Booking.objects.filter(status='completed').count()
    
    # Get today's bookings
    today_bookings = Booking.objects.filter(booking_date=today).count()
    
    # Calculate active bookings (pending + confirmed)
    active_bookings = pending_bookings + confirmed_bookings
    
    return JsonResponse({
        # System Information for admin settings
        "total_users": total_users,
        "total_rooms": total_rooms,
        "active_bookings": active_bookings,
        
        # Detailed booking statistics for manage bookings page
        "total_bookings": total_bookings,
        "pending_bookings": pending_bookings,
        "confirmed_bookings": confirmed_bookings,
        "cancelled_bookings": cancelled_bookings,
        "completed_bookings": completed_bookings,
        "today_bookings": today_bookings
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_users_list(request):
    """Get list of all users for admin management"""
    try:
        users = User.objects.all().order_by('date_joined')
        user_data = []
        
        for user in users:
            user_data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'date_joined': user.date_joined.isoformat(),
                'last_login': user.last_login.isoformat() if user.last_login else None
            })
        
        return Response(user_data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def toggle_user_admin_status(request, user_id):
    """Toggle user admin status"""
    try:
        user = User.objects.get(id=user_id)
        
        # Prevent admin from removing their own admin status
        if user.id == request.user.id:
            return Response({'error': 'Cannot modify your own admin status'}, status=400)
        
        user.is_superuser = not user.is_superuser
        user.is_staff = user.is_superuser  # Staff status follows superuser status
        user.save()
        
        return Response({
            'id': user.id,
            'username': user.username,
            'is_superuser': user.is_superuser,
            'message': f'User {user.username} {"promoted to admin" if user.is_superuser else "removed from admin"} successfully'
        })
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_user(request, user_id):
    """Delete a user"""
    try:
        user = User.objects.get(id=user_id)
        
        # Prevent admin from deleting themselves
        if user.id == request.user.id:
            return Response({'error': 'Cannot delete your own account'}, status=400)
        
        username = user.username
        user.delete()
        
        return Response({
            'message': f'User {username} deleted successfully'
        })
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def update_admin_account(request):
    """Update admin account settings"""
    try:
        user = request.user
        
        # Store current admin status before any changes
        current_is_superuser = user.is_superuser
        current_is_staff = user.is_staff
        
        # Update basic info
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
        if 'email' in request.data:
            user.email = request.data['email']
        
        # Update password if provided
        if 'new_password' in request.data and request.data['new_password']:
            if not user.check_password(request.data.get('current_password', '')):
                return Response({'error': 'Current password is incorrect'}, status=400)
            
            user.set_password(request.data['new_password'])
        
        # Ensure admin status is preserved
        user.is_superuser = current_is_superuser
        user.is_staff = current_is_staff
        
        user.save()
        
        return Response({
            'message': 'Account updated successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_superuser': user.is_superuser,
                'is_staff': user.is_staff
            }
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def create_backup(request):
    """Create a system backup"""
    try:
        from django.core import serializers
        from django.utils import timezone
        import json
        import os
        
        # Create backup directory if it doesn't exist
        backup_dir = os.path.join(os.getcwd(), 'backups')
        if not os.path.exists(backup_dir):
            os.makedirs(backup_dir)
        
        # Generate backup filename with timestamp
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f'rupp_backup_{timestamp}.json'
        backup_path = os.path.join(backup_dir, backup_filename)
        
        # Collect data from all models
        backup_data = {
            'metadata': {
                'created_at': timezone.now().isoformat(),
                'created_by': request.user.username,
                'version': '1.0'
            },
            'data': {}
        }
        
        # Backup Users
        users = User.objects.all()
        backup_data['data']['users'] = serializers.serialize('json', users)
        
        # Backup Rooms
        rooms = Room.objects.all()
        backup_data['data']['rooms'] = serializers.serialize('json', rooms)
        
        # Backup Bookings
        bookings = Booking.objects.all()
        backup_data['data']['bookings'] = serializers.serialize('json', bookings)
        
        # Backup Profiles
        profiles = Profile.objects.all()
        backup_data['data']['profiles'] = serializers.serialize('json', profiles)
        
        # Backup Report Problems
        report_problems = ReportProblem.objects.all()
        backup_data['data']['report_problems'] = serializers.serialize('json', report_problems)
        
        # Save backup to file
        with open(backup_path, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, indent=2, ensure_ascii=False)
        
        # Get file size
        file_size = os.path.getsize(backup_path)
        
        return Response({
            'message': 'Backup created successfully',
            'backup_info': {
                'filename': backup_filename,
                'path': backup_path,
                'size': file_size,
                'created_at': backup_data['metadata']['created_at'],
                'created_by': backup_data['metadata']['created_by']
            }
        })
        
    except Exception as e:
        return Response({'error': f'Failed to create backup: {str(e)}'}, status=500)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_backups(request):
    """List all available backups"""
    try:
        import os
        from django.utils import timezone
        
        backup_dir = os.path.join(os.getcwd(), 'backups')
        backups = []
        
        if os.path.exists(backup_dir):
            for filename in os.listdir(backup_dir):
                if filename.endswith('.json') and filename.startswith('rupp_backup_'):
                    file_path = os.path.join(backup_dir, filename)
                    file_stats = os.stat(file_path)
                    
                    backups.append({
                        'filename': filename,
                        'size': file_stats.st_size,
                        'created_at': timezone.datetime.fromtimestamp(file_stats.st_ctime).isoformat(),
                        'modified_at': timezone.datetime.fromtimestamp(file_stats.st_mtime).isoformat()
                    })
        
        # Sort by creation date (newest first)
        backups.sort(key=lambda x: x['created_at'], reverse=True)
        
        return Response({
            'backups': backups,
            'total_backups': len(backups)
        })
        
    except Exception as e:
        return Response({'error': f'Failed to list backups: {str(e)}'}, status=500)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def restore_backup(request):
    """Restore system from backup"""
    try:
        from django.core import serializers
        from django.db import transaction
        import json
        import os
        
        backup_filename = request.data.get('filename')
        if not backup_filename:
            return Response({'error': 'Backup filename is required'}, status=400)
        
        backup_dir = os.path.join(os.getcwd(), 'backups')
        backup_path = os.path.join(backup_dir, backup_filename)
        
        if not os.path.exists(backup_path):
            return Response({'error': 'Backup file not found'}, status=404)
        
        # Read backup file
        with open(backup_path, 'r', encoding='utf-8') as f:
            backup_data = json.load(f)
        
        # Validate backup format
        if 'data' not in backup_data or 'metadata' not in backup_data:
            return Response({'error': 'Invalid backup format'}, status=400)
        
        # Perform restore in transaction
        with transaction.atomic():
            # Clear existing data (optional - you might want to add confirmation)
            # User.objects.all().delete()
            # Room.objects.all().delete()
            # Booking.objects.all().delete()
            # Profile.objects.all().delete()
            # ReportProblem.objects.all().delete()
            
            # For now, just return success without actually restoring
            # This prevents accidental data loss
            return Response({
                'message': 'Restore functionality is available but requires confirmation',
                'backup_info': {
                    'filename': backup_filename,
                    'created_at': backup_data['metadata'].get('created_at'),
                    'created_by': backup_data['metadata'].get('created_by'),
                    'data_models': list(backup_data['data'].keys())
                },
                'note': 'Restore is disabled for safety. Contact system administrator for manual restore.'
            })
        
    except Exception as e:
        return Response({'error': f'Failed to restore backup: {str(e)}'}, status=500)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_backup(request, filename):
    """Delete a specific backup file"""
    import os
    from django.conf import settings
    
    backup_dir = os.path.join(settings.BASE_DIR, 'backups')
    backup_path = os.path.join(backup_dir, filename)
    
    if not os.path.exists(backup_path):
        return Response({'error': 'Backup file not found'}, status=404)
    
    try:
        os.remove(backup_path)
        return Response({'message': f'Backup {filename} deleted successfully'}, status=200)
    except Exception as e:
        return Response({'error': f'Failed to delete backup: {str(e)}'}, status=500)


# Notification Settings Views
@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_notification_settings(request):
    """Get notification settings for the current admin user"""
    from .models import NotificationSettings
    from .serializers import NotificationSettingsSerializer
    
    settings = NotificationSettings.get_or_create_for_user(request.user)
    serializer = NotificationSettingsSerializer(settings)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def update_notification_settings(request):
    """Update notification settings for the current admin user"""
    from .models import NotificationSettings
    from .serializers import NotificationSettingsSerializer
    
    settings = NotificationSettings.get_or_create_for_user(request.user)
    serializer = NotificationSettingsSerializer(settings, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        return Response({
            'message': 'Notification settings updated successfully',
            'settings': serializer.data
        })
    else:
        return Response({'error': serializer.errors}, status=400)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def test_notification_email(request):
    """Send a test notification email to verify settings"""
    from .models import NotificationSettings
    from django.core.mail import send_mail
    from django.conf import settings
    
    try:
        notification_settings = NotificationSettings.get_or_create_for_user(request.user)
        
        if not notification_settings.email_notifications:
            return Response({'error': 'Email notifications are disabled'}, status=400)
        
        # Send test email
        subject = 'Test Notification - RUPP Room Booking System'
        message = f"""
        This is a test notification email from the RUPP Room Booking System.
        
        Notification Settings:
        - Email Notifications: {'Enabled' if notification_settings.email_notifications else 'Disabled'}
        - Booking Alerts: {'Enabled' if notification_settings.booking_alerts else 'Disabled'}
        - System Alerts: {'Enabled' if notification_settings.system_alerts else 'Disabled'}
        - Notification Email: {notification_settings.notification_email}
        
        This email confirms that your notification settings are working correctly.
        
        Best regards,
        RUPP Room Booking System
        """
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[notification_settings.notification_email],
            fail_silently=False,
        )
        
        return Response({
            'message': 'Test notification email sent successfully',
            'email': notification_settings.notification_email
        })
        
    except Exception as e:
        return Response({'error': f'Failed to send test email: {str(e)}'}, status=500)


def test_api(request):
    """Simple test endpoint"""
    return JsonResponse({"status": "API is working", "method": request.method})


# Admin Dashboard Table API Endpoints
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_recent_bookings(request):
    """Get recent bookings for admin dashboard table"""
    try:
        # Get the 10 most recent bookings
        recent_bookings = Booking.objects.select_related('user', 'room').order_by('-created_at')[:10]
        
        bookings_data = []
        for booking in recent_bookings:
            bookings_data.append({
                'id': booking.id,
                'user_name': booking.user.username,
                'room_details': {
                    'roomNumber': booking.room.roomNumber,
                    'buildingName': booking.room.buildingName
                },
                'booking_date': booking.booking_date.isoformat(),
                'start_time': booking.start_time.strftime('%H:%M'),
                'end_time': booking.end_time.strftime('%H:%M'),
                'purpose': booking.purpose,
                'status': booking.status,
                'created_at': booking.created_at.isoformat()
            })
        
        return Response(bookings_data, status=200)
        
    except Exception as e:
        return Response({
            'error': 'Failed to fetch recent bookings',
            'details': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_users_table(request):
    """Get users data for admin dashboard table"""
    try:
        # Get all users with their profiles
        users = User.objects.select_related('profile').all()
        
        users_data = []
        for user in users:
            profile = getattr(user, 'profile', None)
            users_data.append({
                'username': user.username,
                'email': user.email,
                'phone': profile.phone if profile else None,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'date_joined': user.date_joined.isoformat(),
                'last_login': user.last_login.isoformat() if user.last_login else None
            })
        
        return Response(users_data, status=200)
        
    except Exception as e:
        return Response({
            'error': 'Failed to fetch users data',
            'details': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_rooms_table(request):
    """Get rooms data for admin dashboard table"""
    try:
        # Get all rooms
        rooms = Room.objects.all()
        
        rooms_data = []
        for room in rooms:
            # Check availability for today
            today = date.today()
            current_time = datetime.now().time()
            
            # Check for conflicting bookings today
            conflicting_bookings = Booking.objects.filter(
                room=room,
                booking_date=today,
                status__in=['pending', 'confirmed']
            ).filter(
                Q(start_time__lt=current_time) & Q(end_time__gt=current_time)
            )
            
            is_available = not conflicting_bookings.exists()
            
            rooms_data.append({
                'id': room.id,
                'roomNumber': room.roomNumber,
                'buildingName': room.buildingName,
                'floorName': room.floorName,
                'roomType': room.roomType,
                'capacity': room.capacity,
                'availability_status': {
                    'is_available': is_available,
                    'conflicting_bookings': conflicting_bookings.count()
                }
            })
        
        return Response(rooms_data, status=200)
        
    except Exception as e:
        return Response({
            'error': 'Failed to fetch rooms data',
            'details': str(e)
        }, status=500)

# User Notification Settings Views
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_notification_settings(request):
    """Get notification settings for the current user"""
    from .models import NotificationSettings
    from .serializers import NotificationSettingsSerializer
    
    settings = NotificationSettings.get_or_create_for_user(request.user)
    serializer = NotificationSettingsSerializer(settings)
    
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def update_user_notification_settings(request):
    """Update notification settings for the current user"""
    from .models import NotificationSettings
    from .serializers import NotificationSettingsSerializer
    
    settings = NotificationSettings.get_or_create_for_user(request.user)
    serializer = NotificationSettingsSerializer(settings, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        return Response({
            'message': 'Notification settings updated successfully',
            'data': serializer.data
        })
    return Response(serializer.errors, status=400)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def test_user_notification_email(request):
    """Send a test notification email to verify user settings"""
    from .models import NotificationSettings
    from django.core.mail import send_mail
    from django.conf import settings
    
    try:
        notification_settings = NotificationSettings.get_or_create_for_user(request.user)
        
        if not notification_settings.email_notifications:
            return Response({'error': 'Email notifications are disabled'}, status=400)
        
        # Send test email
        subject = 'Test Notification - RUPP Room Booking System'
        message = f"""
Hello {request.user.username},

This is a test notification email from the RUPP Room Booking System.

Your Notification Settings:
- Email Notifications: {'Enabled' if notification_settings.email_notifications else 'Disabled'}
- Booking Alerts: {'Enabled' if notification_settings.booking_alerts else 'Disabled'}
- System Alerts: {'Enabled' if notification_settings.system_alerts else 'Disabled'}
- Notification Email: {notification_settings.notification_email}

This email confirms that your notification settings are working correctly.

Best regards,
RUPP Room Booking System Team
        """
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[notification_settings.notification_email],
            fail_silently=False,
        )
        
        return Response({
            'message': 'Test notification email sent successfully',
            'email': notification_settings.notification_email
        })
        
    except Exception as e:
        return Response({'error': f'Failed to send test email: {str(e)}'}, status=500)

# --- New API endpoints for frontend schedule ---
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

@api_view(['GET'])
@permission_classes([AllowAny])
def bookings_by_date(request, date_str):
    """Return all bookings for all rooms for a specific date (YYYY-MM-DD)"""
    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)
    bookings = Booking.objects.filter(booking_date=target_date)
    serializer = BookingSerializer(bookings, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def bookings_by_week(request, week_start_str):
    """Return all bookings for all rooms for a week starting from the given date (YYYY-MM-DD, should be Monday)"""
    try:
        week_start = datetime.strptime(week_start_str, '%Y-%m-%d').date()
    except ValueError:
        return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)
    week_end = week_start + timedelta(days=5)  # Monday to Saturday
    bookings = Booking.objects.filter(booking_date__gte=week_start, booking_date__lte=week_end)
    serializer = BookingSerializer(bookings, many=True)
    return Response(serializer.data)
