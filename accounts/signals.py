from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Profile
from django_rest_passwordreset.signals import reset_password_token_created
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create profile when user is created"""
    if created:
        Profile.objects.get_or_create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save profile when user is saved"""
    profile, created = Profile.objects.get_or_create(user=instance)
    profile.save()

@receiver(reset_password_token_created)
def password_reset_token_created(sender, instance, reset_password_token, *args, **kwargs):
    """Send password reset email when token is created"""
    try:
        # Get or create user profile
        profile, created = Profile.objects.get_or_create(user=reset_password_token.user)
        
        # Email context
        context = {
            'user': reset_password_token.user,
            'token': reset_password_token.key,
            'reset_url': f"http://localhost:8000/reset/{reset_password_token.key}/",
        }
        
        # Render email template
        html_message = render_to_string('email/password_reset_email.html', context)
        plain_message = strip_tags(html_message)
        
        # Send email
        send_mail(
            subject='Password Reset for RUPP Room Booking',
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[reset_password_token.user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        print(f"Password reset email sent to {reset_password_token.user.email}")
        
    except Exception as e:
        print(f"Error sending password reset email: {e}")

