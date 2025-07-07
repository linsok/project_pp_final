from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.socialaccount.providers.google.provider import GoogleProvider
from allauth.core.exceptions import ImmediateHttpResponse
from django.shortcuts import redirect
from django.contrib import messages
import logging

logger = logging.getLogger(__name__)

class DebugSocialAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        """Debug pre-social login process"""
        logger.info(f"Pre-social login for {sociallogin.account.provider}")
        logger.info(f"User: {sociallogin.user}")
        logger.info(f"Email: {sociallogin.account.extra_data.get('email', 'No email')}")
        print(f"🔍 Pre-social login: {sociallogin.account.provider} - {sociallogin.account.extra_data.get('email', 'No email')}")
        
        # Call parent method
        super().pre_social_login(request, sociallogin)
    
    def save_user(self, request, sociallogin, form=None):
        """Debug user save process"""
        logger.info(f"Saving user for {sociallogin.account.provider}")
        print(f"🔍 Saving user: {sociallogin.account.extra_data.get('email', 'No email')}")
        
        # Call parent method
        user = super().save_user(request, sociallogin, form)
        
        logger.info(f"User saved: {user}")
        print(f"✅ User saved: {user}")
        
        return user
    
    def authentication_error(self, request, provider_id, error=None, exception=None, extra_context=None):
        """Handle authentication errors"""
        logger.error(f"Authentication error for {provider_id}: {error}")
        print(f"❌ Authentication error for {provider_id}: {error}")
        
        if exception:
            logger.error(f"Exception: {exception}")
            print(f"❌ Exception: {exception}")
        
        # Call parent method
        return super().authentication_error(request, provider_id, error, exception, extra_context)
    
    def get_login_redirect_url(self, request):
        """Debug login redirect"""
        url = super().get_login_redirect_url(request)
        logger.info(f"Login redirect URL: {url}")
        print(f"🔍 Login redirect URL: {url}")
        return url
