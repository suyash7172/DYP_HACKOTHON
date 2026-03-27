import sys
import json
from urllib import request as urllib_request

try:
    # 1. Signup user
    signup_url = "http://127.0.0.1:5001/api/auth/signup"
    signup_payload = json.dumps({
        "name": "Test User",
        "email": "test@test.com",
        "password": "password123",
        "role": "admin"
    }).encode('utf-8')
    req1 = urllib_request.Request(signup_url, data=signup_payload, headers={'Content-Type': 'application/json'})
    
    token = None
    try:
        with urllib_request.urlopen(req1) as f:
            resp = json.loads(f.read().decode('utf-8'))
            token = resp['access_token']
            print("Signup successful")
    except Exception as e:
        # Might already exist
        pass

    # 2. Login User if signup failed
    if not token:
        login_url = "http://127.0.0.1:5001/api/auth/login"
        login_payload = json.dumps({
            "email": "test@test.com",
            "password": "password123"
        }).encode('utf-8')
        req2 = urllib_request.Request(login_url, data=login_payload, headers={'Content-Type': 'application/json'})
        with urllib_request.urlopen(req2) as f:
            resp = json.loads(f.read().decode('utf-8'))
            token = resp['access_token']
            print("Login successful")
    
    # 3. Test Analyze
    analyze_url = "http://127.0.0.1:5001/api/predictions/analyze"
    analyze_payload = json.dumps({
        'amount': 1500,
        'hour_of_day': 2,
        'merchant_category': 'Crypto Exchange',
        'location': 'Unknown Location',
        'device': 'API',
        'is_international': True,
        'day_of_week': 3
    }).encode('utf-8')
    req3 = urllib_request.Request(analyze_url, data=analyze_payload, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'})
    with urllib_request.urlopen(req3) as f:
        print(f"Analyze Status: {f.status}")
        print(f"Analyze Output: {f.read().decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")
