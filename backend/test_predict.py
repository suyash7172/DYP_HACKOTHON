from routes.predictions import compute_fraud_score, load_models
import json

load_models()

txInput = {
    'amount': 1500,
    'hour_of_day': 2,
    'merchant_category': 'Crypto Exchange',
    'location': 'Unknown Location',
    'device': 'API',
    'is_international': True,
    'day_of_week': 3
}

score = compute_fraud_score(txInput)
print(f"Computed Score: {score}")
print(f"Type: {type(score)}")

import json
try:
    print(json.dumps({'score': score}))
except Exception as e:
    print(f"JSON Dump Error: {e}")
