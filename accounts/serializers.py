from rest_framework import serializers
from .models import Profile
from django.contrib.auth.models import User

class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Profile
        fields = ['image', 'image_url', 'username', 'email']
        
    def get_image_url(self, obj):
        """Return image URL - either from database or file system"""
        # First priority: database-stored image
        if obj.image_data and obj.image_content_type:
            return obj.image_url  # This returns the base64 data URL
        
        # Second priority: file-based image (for backward compatibility)
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        
        return None