from rest_framework import generics, permissions
from .models import Profile, PasswordResetCode
from .serializers import ProfileSerializer
from django.http import JsonResponse
from .models import Room
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from allauth.socialaccount.models import SocialAccount
from django.contrib.auth import get_user_model
from django.conf import settings
from rest_framework.authtoken.models import Token
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import random
import string

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

class GoogleLogin(SocialLoginView):
    """
    Google OAuth2 login view that returns JSON response
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    adapter_class = GoogleOAuth2Adapter
    callback_url = 'http://localhost:8000/accounts/google/login/callback/'
    client_class = OAuth2Client

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

@api_view(['GET'])
@permission_classes([AllowAny])
def google_login_url(request):
    """
    Return Google OAuth login URL
    """
    return Response({
        'login_url': '/accounts/google/login/'
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def google_oauth_callback(request):
    """
    Handle Google OAuth callback
    """
    # Get the user from the request (if authenticated)
    if request.user.is_authenticated:
        # Create or get auth token
        token, created = Token.objects.get_or_create(user=request.user)
        
        # Return JSON response with token
        return Response({
            'status': 'success',
            'message': 'Google OAuth completed successfully',
            'token': token.key,
            'user': {
                'id': request.user.id,
                'email': request.user.email,
                'username': request.user.username,
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
            }
        })
    else:
        return Response({
            'status': 'error',
            'message': 'Authentication failed'
        }, status=400)

@api_view(['GET'])
@permission_classes([AllowAny])
def google_login_success(request):
    """
    Handle successful Google OAuth login
    This can be called from your frontend after OAuth completes
    """
    if request.user.is_authenticated:
        # Create or get auth token
        token, created = Token.objects.get_or_create(user=request.user)
        
        # Return JSON response with user data and token
        return Response({
            'status': 'success',
            'message': 'Login successful',
            'token': token.key,
            'user': {
                'id': request.user.id,
                'email': request.user.email,
                'username': request.user.username,
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
            }
        })
    else:
        return Response({
            'status': 'error',
            'message': 'Not authenticated'
        }, status=401)
