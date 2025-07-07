#!/usr/bin/env python3

import requests
import json

def test_google_oauth_endpoints():
    """Test the new Google OAuth API endpoints"""
    print("🔍 Testing Google OAuth API Endpoints...")
    
    base_url = 'http://127.0.0.1:8000'
    
    # Test endpoints to check
    endpoints = [
        ('/api/google/url/', 'GET', 'Google OAuth URL endpoint'),
        ('/api/google/login/', 'POST', 'Google OAuth Login endpoint'),
        ('/accounts/google/login/', 'GET', 'Google OAuth Web Flow'),
    ]
    
    for endpoint, method, description in endpoints:
        try:
            print(f"\n🔗 Testing {description}")
            print(f"   URL: {base_url}{endpoint}")
            
            if method == 'GET':
                response = requests.get(f'{base_url}{endpoint}', timeout=10)
            elif method == 'POST':
                response = requests.post(f'{base_url}{endpoint}', 
                                       json={}, 
                                       headers={'Content-Type': 'application/json'}, 
                                       timeout=10)
            
            print(f"   Status: {response.status_code}")
            print(f"   Content-Type: {response.headers.get('Content-Type', 'Not set')}")
            
            if response.status_code == 200:
                try:
                    if 'application/json' in response.headers.get('Content-Type', ''):
                        data = response.json()
                        print(f"   JSON Response: {json.dumps(data, indent=2)}")
                    else:
                        print(f"   Response (first 100 chars): {response.text[:100]}...")
                except:
                    print(f"   Response (first 100 chars): {response.text[:100]}...")
                    
            elif response.status_code == 302:
                redirect_url = response.headers.get('Location', 'Not set')
                print(f"   Redirect to: {redirect_url}")
                
            elif response.status_code == 404:
                print(f"   ❌ Endpoint not found")
                
            else:
                print(f"   Response (first 200 chars): {response.text[:200]}...")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print("\n" + "="*50)
    print("✅ Test completed!")

if __name__ == "__main__":
    test_google_oauth_endpoints()
