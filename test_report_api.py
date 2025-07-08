#!/usr/bin/env python
"""
Simple test script to verify the Report API endpoint is working.
Run this with: python test_report_api.py
"""

import requests
import json

# Test configuration
BASE_URL = "http://127.0.0.1:8000"
API_URL = f"{BASE_URL}/api/reports/"

def test_report_api():
    """Test the report API endpoint"""
    
    # Test data
    test_description = "Test problem report from API test script"
    
    # You'll need to replace this with a valid token
    # You can get a token by logging in through the frontend or creating one manually
    test_token = "your_test_token_here"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Token {test_token}"
    }
    
    data = {
        "description": test_description
    }
    
    print(f"Testing POST request to: {API_URL}")
    print(f"Data: {json.dumps(data, indent=2)}")
    
    try:
        response = requests.post(API_URL, json=data, headers=headers)
        
        print(f"\nResponse Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        try:
            response_data = response.json()
            print(f"Response Data: {json.dumps(response_data, indent=2)}")
        except json.JSONDecodeError:
            print(f"Response Text: {response.text}")
            
        if response.status_code == 201:
            print("✅ SUCCESS: Report submitted successfully!")
        elif response.status_code == 401:
            print("❌ AUTHENTICATION ERROR: Please provide a valid token")
        else:
            print(f"❌ ERROR: Request failed with status {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ NETWORK ERROR: {e}")
        print("Make sure the Django development server is running on localhost:8000")

if __name__ == "__main__":
    test_report_api()
