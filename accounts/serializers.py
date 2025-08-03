from rest_framework import serializers
from .models import Profile, Room, Booking, ReportProblem, NotificationSettings
from django.contrib.auth.models import User
from django.db import models
from datetime import datetime, time, date

class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    image_url = serializers.SerializerMethodField()
    is_staff = serializers.SerializerMethodField()
    is_superuser = serializers.SerializerMethodField()
    
    class Meta:
        model = Profile
        fields = ['image', 'image_url', 'username', 'email', 'phone', 'is_staff', 'is_superuser']
        
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

    def get_is_staff(self, obj):
        return obj.user.is_staff

    def get_is_superuser(self, obj):
        return obj.user.is_superuser


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
    room_id = serializers.PrimaryKeyRelatedField(source='room', read_only=True)
    # Accept room_number and building_name instead of room ID
    room_number = serializers.CharField(write_only=True, required=False)
    building_name = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Booking
        fields = ['id', 'room_details', 'room_id', 'user_name', 'booking_date', 
                 'start_time', 'end_time', 'purpose', 'status', 'created_at',
                 'room_number', 'building_name']
        
    def validate(self, data):
        """Validate booking and find room by number and building"""
        
        # Handle room lookup if room_number and building_name are provided
        if 'room_number' in data and 'building_name' in data:
            try:
                room = Room.objects.get(
                    roomNumber=data['room_number'],
                    buildingName=data['building_name']
                )
                data['room'] = room
            except Room.DoesNotExist:
                raise serializers.ValidationError({
                    'room_number': f"Room {data['room_number']} not found in {data['building_name']}"
                })
            except Room.MultipleObjectsReturned:
                raise serializers.ValidationError({
                    'room_number': f"Multiple rooms found with number {data['room_number']} in {data['building_name']}"
                })
        elif 'room_number' in data:
            # Only room number provided, try to find it
            try:
                room = Room.objects.get(roomNumber=data['room_number'])
                data['room'] = room
            except Room.DoesNotExist:
                raise serializers.ValidationError({
                    'room_number': f"Room {data['room_number']} not found"
                })
            except Room.MultipleObjectsReturned:
                rooms = Room.objects.filter(roomNumber=data['room_number'])
                buildings = list(rooms.values_list('buildingName', flat=True))
                raise serializers.ValidationError({
                    'room_number': f"Multiple rooms found with number {data['room_number']}. Please specify building. Available in: {', '.join(buildings)}"
                })
        
        # Remove the temporary fields
        data.pop('room_number', None)
        data.pop('building_name', None)
        
        # Validate booking doesn't conflict with existing bookings
        room = data.get('room')
        booking_date = data.get('booking_date')
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        
        if room and booking_date and start_time and end_time:
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
                conflicting = conflicting_bookings.first()
                raise serializers.ValidationError({
                    'non_field_errors': [f"This time slot conflicts with an existing booking: {conflicting.start_time}-{conflicting.end_time}"]
                })
        
        return data
    
    def create(self, validated_data):
        """Create booking with the room set from validation"""
        # The room should have been set in the validate method
        if 'room' not in validated_data:
            raise serializers.ValidationError("Room information is required")
        
        # Set the user from the request context
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
        
        return super().create(validated_data)


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


class NotificationSettingsSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = NotificationSettings
        fields = ['id', 'username', 'email_notifications', 'booking_alerts', 
                 'system_alerts', 'notification_email', 'created_at', 'updated_at']
        read_only_fields = ['id', 'username', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Set the user from the request context
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
        return super().create(validated_data)