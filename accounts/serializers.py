from rest_framework import serializers
from .models import Profile, Room, Booking, ReportProblem
from django.contrib.auth.models import User
from django.db import models
from datetime import datetime, time, date

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


class RoomSerializer(serializers.ModelSerializer):
    amenities_list = serializers.SerializerMethodField()
    availability_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Room
        fields = ['id', 'roomNumber', 'capacity', 'roomType', 'buildingName', 
                 'floorName', 'amenities_list', 'availability_status']
    
    def get_amenities_list(self, obj):
        return obj.get_amenities_list()
    
    def get_availability_status(self, obj):
        """Check if room is available for a specific date/time from context"""
        request = self.context.get('request')
        if not request:
            return None
            
        search_date = request.query_params.get('date')
        start_time = request.query_params.get('start_time')
        end_time = request.query_params.get('end_time')
        
        if not all([search_date, start_time, end_time]):
            return None
        
        try:
            search_date = datetime.strptime(search_date, '%Y-%m-%d').date()
            start_time = datetime.strptime(start_time, '%H:%M').time()
            end_time = datetime.strptime(end_time, '%H:%M').time()
            
            # Check for conflicting bookings
            conflicting_bookings = Booking.objects.filter(
                room=obj,
                booking_date=search_date,
                status__in=['pending', 'confirmed']
            ).filter(
                models.Q(start_time__lt=end_time) & models.Q(end_time__gt=start_time)
            )
            
            return {
                'is_available': not conflicting_bookings.exists(),
                'conflicting_bookings': conflicting_bookings.count()
            }
        except (ValueError, TypeError):
            return None


class BookingSerializer(serializers.ModelSerializer):
    room_details = RoomSerializer(source='room', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Booking
        fields = ['id', 'room', 'room_details', 'user_name', 'booking_date', 
                 'start_time', 'end_time', 'purpose', 'status', 'created_at']
        
    def validate(self, data):
        """Validate booking doesn't conflict with existing bookings"""
        room = data['room']
        booking_date = data['booking_date']
        start_time = data['start_time']
        end_time = data['end_time']
        
        # Check for time conflicts
        conflicting_bookings = Booking.objects.filter(
            room=room,
            booking_date=booking_date,
            status__in=['pending', 'confirmed']
        ).filter(
            models.Q(start_time__lt=end_time) & models.Q(end_time__gt=start_time)
        )
        
        # Exclude current booking if updating
        if self.instance:
            conflicting_bookings = conflicting_bookings.exclude(id=self.instance.id)
        
        if conflicting_bookings.exists():
            raise serializers.ValidationError(
                "This time slot conflicts with an existing booking."
            )
        
        return data


class ReportProblemSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = ReportProblem
        fields = ['id', 'description', 'created_at', 'username']
        read_only_fields = ['id', 'created_at', 'username']
    
    def create(self, validated_data):
        # Set the user from the request context
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
        return super().create(validated_data)