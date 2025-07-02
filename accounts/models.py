from django.contrib.auth.models import User
from django.db import models

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