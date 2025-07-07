from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone
import random
import string

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    image = models.ImageField(upload_to='profile_pics/', default='default.png')
    
    
class Room(models.Model):
    roomNumber = models.CharField(max_length=100)
    capacity = models.PositiveIntegerField()
    roomType = models.CharField(max_length=50)
    buildingName = models.CharField(max_length=100, blank=True, null=True)
    floorName = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.roomNumber} - {self.buildingName} ({self.roomType})"


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