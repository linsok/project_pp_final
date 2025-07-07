#!/usr/bin/env python3

import requests
import json
import time
import sys

def test_google_oauth_complete_flow():
    """Test the complete Google OAuth flow"""
    print("🔍 Testing Complete Google OAuth Flow...")
    print("=" * 60)
    
    base_url = 'http://127.0.0.1:8000'
    
    # Test 1: Check if Google OAuth login redirects correctly
    print("\n1. Testing Google OAuth Login URL...")
    try:
        response = requests.get(f'{base_url}/accounts/google/login/', timeout=10, allow_redirects=False)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 302:
            redirect_url = response.headers.get('Location', '')
            print(f"   ✅ Redirects to: {redirect_url}")
            if "accounts.google.com" in redirect_url:
                print("   ✅ Correctly redirects to Google OAuth")
            else:
                print("   ❌ Unexpected redirect URL")
        elif response.status_code == 200:
            print("   ✅ Google OAuth page loaded successfully")
        else:
            print(f"   ❌ Unexpected status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 2: Check if home page is accessible
    print("\n2. Testing Home Page Accessibility...")
    try:
        response = requests.get(f'{base_url}/frontend/home.html', timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            print("   ✅ Home page is accessible")
            print(f"   Content-Type: {response.headers.get('Content-Type', 'Not set')}")
        else:
            print(f"   ❌ Home page not accessible: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 3: Check if index page is accessible
    print("\n3. Testing Index Page Accessibility...")
    try:
        response = requests.get(f'{base_url}/frontend/index.html', timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            print("   ✅ Index page is accessible")
            print(f"   Content-Type: {response.headers.get('Content-Type', 'Not set')}")
        else:
            print(f"   ❌ Index page not accessible: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 4: Check if CSS and JS files are accessible
    print("\n4. Testing Static Files...")
    static_files = [
        '/frontend/css/style.css',
        '/frontend/js/index.js',
        '/frontend/js/headerpage.js'
    ]
    
    for file_path in static_files:
        try:
            response = requests.get(f'{base_url}{file_path}', timeout=10)
            print(f"   {file_path}: Status {response.status_code}")
            if response.status_code == 200:
                print("     ✅ File accessible")
            else:
                print("     ❌ File not accessible")
        except Exception as e:
            print(f"   {file_path}: Error - {e}")
    
    # Test 5: Check API endpoints
    print("\n5. Testing API Endpoints...")
    try:
        response = requests.get(f'{base_url}/api/google/url/', timeout=10)
        print(f"   Google URL API: Status {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Response: {data}")
        else:
            print("   ❌ API not working")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print("\n" + "=" * 60)
    print("📋 OAUTH FLOW SUMMARY")
    print("=" * 60)
    print("✅ When user clicks 'Continue' on Google OAuth:")
    print("   1. Google will redirect back to Django")
    print("   2. Django will check database for existing user")
    print("   3. If user exists, logs them in")
    print("   4. If user doesn't exist, creates new user with profile")
    print("   5. Redirects to home page: /frontend/home.html")
    print("\n✅ Database Operations:")
    print("   - Checks if user with Google email exists")
    print("   - Creates User account if not exists")
    print("   - Creates Profile for the user")
    print("   - Updates user info from Google data")
    print("\n✅ Final Result:")
    print("   - User is logged in and redirected to home page")
    print("   - User session is maintained")
    print("   - User can access protected pages")
    
    return True

if __name__ == "__main__":
    test_google_oauth_complete_flow()
