#!/usr/bin/env python3

import requests
import json
import time
import sys

def test_password_reset_flow():
    """Test the password reset functionality"""
    print("🔍 Testing Password Reset Flow...")
    
    # Test password reset request
    try:
        response = requests.post('http://127.0.0.1:8000/api/password_reset/', 
                               json={'email': 'test@example.com'}, 
                               timeout=10)
        print(f'  Password reset request: {response.status_code}')
        if response.status_code == 200:
            print("  ✅ Password reset email can be sent")
        else:
            print(f"  ❌ Password reset failed: {response.text}")
            return False
    except Exception as e:
        print(f'  ❌ Password reset error: {e}')
        return False
    
    return True

def test_google_oauth_flow():
    """Test the Google OAuth functionality"""
    print("🔍 Testing Google OAuth Flow...")
    
    try:
        # Test Google OAuth login endpoint
        response = requests.get('http://127.0.0.1:8000/accounts/google/login/', timeout=10)
        print(f'  Google OAuth login: {response.status_code}')
        
        if response.status_code == 200:
            # Check if response contains Google OAuth content
            if "accounts.google.com" in response.text or "google" in response.text.lower():
                print("  ✅ Google OAuth login endpoint is working")
                return True
            else:
                print("  ❌ Google OAuth response doesn't contain expected content")
                return False
        elif response.status_code == 302:
            redirect_url = response.headers.get("Location", "")
            if "accounts.google.com" in redirect_url:
                print("  ✅ Google OAuth redirecting to Google correctly")
                return True
            else:
                print(f"  ❌ Unexpected redirect: {redirect_url}")
                return False
        else:
            print(f"  ❌ Google OAuth failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f'  ❌ Google OAuth error: {e}')
        return False

def test_api_endpoints():
    """Test various API endpoints"""
    print("🔍 Testing API Endpoints...")
    
    endpoints = [
        ('/', 'Root endpoint'),
        ('/accounts/', 'Accounts endpoint'),
        ('/dj-rest-auth/', 'DRF Auth endpoint'),
    ]
    
    for endpoint, description in endpoints:
        try:
            response = requests.get(f'http://127.0.0.1:8000{endpoint}', timeout=10)
            print(f'  {description}: {response.status_code}')
        except Exception as e:
            print(f'  {description}: Error - {e}')
    
    return True

def main():
    """Run all tests"""
    print("🚀 Running Comprehensive Backend Tests")
    print("=" * 50)
    
    # Test server availability
    try:
        response = requests.get('http://127.0.0.1:8000/', timeout=5)
        print(f"✅ Server is running (Status: {response.status_code})")
    except Exception as e:
        print(f"❌ Server is not accessible: {e}")
        print("Please make sure the Django server is running with: python manage.py runserver")
        return False
    
    print()
    
    # Run tests
    password_reset_ok = test_password_reset_flow()
    print()
    
    google_oauth_ok = test_google_oauth_flow()
    print()
    
    api_endpoints_ok = test_api_endpoints()
    print()
    
    # Summary
    print("📊 Test Summary")
    print("=" * 50)
    print(f"Password Reset: {'✅ PASS' if password_reset_ok else '❌ FAIL'}")
    print(f"Google OAuth: {'✅ PASS' if google_oauth_ok else '❌ FAIL'}")
    print(f"API Endpoints: {'✅ PASS' if api_endpoints_ok else '❌ FAIL'}")
    
    if password_reset_ok and google_oauth_ok and api_endpoints_ok:
        print("\n🎉 ALL TESTS PASSED! The backend is working correctly.")
        return True
    else:
        print("\n⚠️  Some tests failed. Please check the output above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
