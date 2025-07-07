#!/usr/bin/env python3

import requests
import json

def test_google_oauth():
    print("Testing Google OAuth login endpoint...")
    try:
        response = requests.get('http://127.0.0.1:8000/accounts/google/login/', timeout=10)
        print(f'Status: {response.status_code}')
        print(f'Content-Type: {response.headers.get("Content-Type", "Not set")}')
        
        if response.status_code == 302:
            redirect_url = response.headers.get("Location", "Not set")
            print(f'Redirect URL: {redirect_url}')
            
            # Check if the redirect is to Google OAuth
            if "accounts.google.com" in redirect_url:
                print("✅ SUCCESS: Google OAuth login endpoint is working correctly!")
                print("   - Redirecting to Google OAuth as expected")
                return True
            else:
                print("❌ ISSUE: Redirect URL is not to Google OAuth")
                return False
                
        elif response.status_code == 200:
            print('Response content (first 200 chars):')
            print(response.text[:200])
            
        else:
            print(f'❌ ERROR: Status {response.status_code}')
            print(f'Response: {response.text[:500]}')
            return False
            
    except Exception as e:
        print(f'❌ ERROR: {e}')
        return False

if __name__ == "__main__":
    test_google_oauth()
