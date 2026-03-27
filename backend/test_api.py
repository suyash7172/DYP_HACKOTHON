import requests

url = "http://127.0.0.1:5001/api/predictions/analyze"
payload = {
    'amount': 1500,
    'hour_of_day': 2,
    'merchant_category': 'Crypto Exchange',
    'location': 'Unknown Location',
    'device': 'API',
    'is_international': True,
    'day_of_week': 3
}
headers = {'Content-Type': 'application/json'}
try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
