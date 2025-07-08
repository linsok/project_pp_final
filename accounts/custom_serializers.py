from dj_rest_auth.serializers import UserDetailsSerializer
from rest_framework import serializers
from django.contrib.auth import authenticate, get_user_model

User = get_user_model()


class CustomUserDetailsSerializer(UserDetailsSerializer):
    """
    Custom User Details Serializer that adds password verification for email changes
    """
    password = serializers.CharField(write_only=True, required=False)

    class Meta(UserDetailsSerializer.Meta):
        fields = UserDetailsSerializer.Meta.fields + ('password',)

    def validate(self, attrs):
        # If email is being changed, require password
        request = self.context.get('request')
        user = request.user
        
        if 'email' in attrs and attrs['email'] != user.email:
            password = attrs.get('password')
            if not password:
                raise serializers.ValidationError({'password': 'Password required to change email.'})
            
            # Authenticate the user with the provided password
            authenticated_user = authenticate(username=user.username, password=password)
            if authenticated_user is None:
                raise serializers.ValidationError({'password': 'Incorrect password.'})
        
        return super().validate(attrs)

    def update(self, instance, validated_data):
        # Remove password from the data before updating the user
        validated_data.pop('password', None)
        return super().update(instance, validated_data)
