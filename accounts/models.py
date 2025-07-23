from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone
import random
import string
import base64

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    # Keep the old image field for backward compatibility during migration
    image = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    
    # Phone number field
    phone = models.CharField(max_length=20, blank=True, null=True, help_text="User's phone number")
    
    # New fields for storing image in database
    image_data = models.BinaryField(blank=True, null=True, help_text="Binary image data stored in database")
    image_name = models.CharField(max_length=255, blank=True, null=True, help_text="Original filename")
    image_content_type = models.CharField(max_length=100, blank=True, null=True, help_text="MIME type (e.g., image/jpeg)")
    
    def __str__(self):
        return f"{self.user.username}'s Profile"
    
    @property
    def image_url(self):
        """Return base64 data URL for the image stored in database"""
        if self.image_data and self.image_content_type:
            # Convert binary data to base64 string
            image_base64 = base64.b64encode(self.image_data).decode('utf-8')
            return f"data:{self.image_content_type};base64,{image_base64}"
        elif self.image:
            # Fallback to file-based image during migration
            return self.image.url
        return None
    
    def save_image_to_db(self, image_file):
        """Save uploaded image file to database as binary data"""
        if image_file:
            # Read the image file
            image_file.seek(0)  # Reset file pointer
            self.image_data = image_file.read()
            self.image_name = image_file.name
            self.image_content_type = image_file.content_type
            self.save()
            return True
        return False
    
    def get_image_size(self):
        """Get size of image stored in database"""
        if self.image_data:
            return len(self.image_data)
        return 0
    
    
class Room(models.Model):
    roomNumber = models.CharField(max_length=100)
    capacity = models.PositiveIntegerField()
    roomType = models.CharField(max_length=50)
    buildingName = models.CharField(max_length=100, blank=True, null=True)
    floorName = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True, help_text="Whether the room is available for booking")

    def __str__(self):
        return f"{self.roomNumber} - {self.buildingName} ({self.roomType})"
    
    def get_amenities_list(self):
        """Return amenities as a list - placeholder for now"""
        return []


class PasswordResetCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    
    class Meta:
        db_table = 'password_reset_codes'
    
    def save(self, *args, **kwargs):
        if not self.code:
            self.code = ''.join(random.choices(string.digits, k=6))
        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(minutes=15)
        super().save(*args, **kwargs)
    
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    def is_valid(self):
        return not self.used and not self.is_expired()
    
    def mark_as_used(self):
        self.used = True
        self.save()
    
    @property
    def is_used(self):
        return self.used
    
    def __str__(self):
        return f"Password reset code for {self.user.email}"


class Booking(models.Model):
    BOOKING_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    booking_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    purpose = models.CharField(max_length=200, blank=True, null=True)
    status = models.CharField(max_length=20, choices=BOOKING_STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['room', 'booking_date', 'start_time', 'end_time']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.room.roomNumber} - {self.booking_date} ({self.start_time}-{self.end_time})"
    
    def is_conflicting_with(self, booking_date, start_time, end_time):
        """Check if this booking conflicts with the given time slot"""
        if self.booking_date != booking_date:
            return False
        
        # Check time overlap
        return not (end_time <= self.start_time or start_time >= self.end_time)


class ReportProblem(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Report by {self.user.username if self.user else 'Anonymous'} at {self.created_at}"


class NotificationSettings(models.Model):
    """Model to store admin notification preferences"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_settings')
    email_notifications = models.BooleanField(default=True, help_text="Enable email notifications")
    booking_alerts = models.BooleanField(default=True, help_text="Receive alerts for new bookings")
    system_alerts = models.BooleanField(default=True, help_text="Receive system alerts and maintenance notifications")
    notification_email = models.EmailField(default="admin@rupp.edu.kh", help_text="Email address for notifications")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Notification Setting"
        verbose_name_plural = "Notification Settings"
    
    def __str__(self):
        return f"Notification settings for {self.user.username}"
    
    @classmethod
    def get_or_create_for_user(cls, user):
        """Get notification settings for user or create default ones"""
        settings, created = cls.objects.get_or_create(
            user=user,
            defaults={
                'email_notifications': True,
                'booking_alerts': True,
                'system_alerts': True,
                'notification_email': user.email or "admin@rupp.edu.kh"
            }
        )
        return settings