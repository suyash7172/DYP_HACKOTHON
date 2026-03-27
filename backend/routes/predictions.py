"""
ML Prediction Routes - Real-time fraud detection
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from firebase_admin import firestore
import numpy as np
import joblib
import os
import uuid
from datetime import datetime
from config import Config

predictions_bp = Blueprint('predictions', __name__)
db = firestore.client()

# Load models
MODEL_DIR = Config.MODEL_PATH
isolation_forest = None
logistic_model = None
scaler = None

def load_models():
    global isolation_forest, logistic_model, scaler
    try:
        model_dir = os.path.abspath(MODEL_DIR)
        if os.path.exists(os.path.join(model_dir, 'isolation_forest.pkl')):
            isolation_forest = joblib.load(os.path.join(model_dir, 'isolation_forest.pkl'))
        if os.path.exists(os.path.join(model_dir, 'logistic_regression.pkl')):
            logistic_model = joblib.load(os.path.join(model_dir, 'logistic_regression.pkl'))
        if os.path.exists(os.path.join(model_dir, 'scaler.pkl')):
            scaler = joblib.load(os.path.join(model_dir, 'scaler.pkl'))
        print("ML Models loaded successfully")
    except Exception as e:
        print(f"Model loading error: {e}")

# Try loading models on import
load_models()

# Category and location risk mappings
CATEGORY_RISK = {
    'Crypto Exchange': 0.9, 'Gambling': 0.85, 'Wire Transfer': 0.7,
    'Luxury Goods': 0.6, 'ATM Withdrawal': 0.5, 'Online Shopping': 0.4,
    'Travel': 0.35, 'Entertainment': 0.3, 'Electronics': 0.25,
    'Gas Station': 0.2, 'Restaurant': 0.15, 'Grocery': 0.1,
    'Healthcare': 0.1, 'Education': 0.05, 'Utilities': 0.05
}

LOCATION_RISK = {
    'Unknown Location': 0.9, 'Lagos, Nigeria': 0.7, 'Moscow, Russia': 0.6,
    'Hong Kong': 0.4, 'Dubai, UAE': 0.35, 'São Paulo, Brazil': 0.3,
    'Singapore': 0.2, 'Berlin, Germany': 0.15, 'Paris, France': 0.15,
    'London, UK': 0.1, 'New York, US': 0.1, 'Mumbai, India': 0.15,
    'Tokyo, Japan': 0.1, 'Sydney, Australia': 0.1, 'Toronto, Canada': 0.1
}


def extract_features(transaction):
    """Extract features from transaction for ML prediction"""
    amount = float(transaction.get('amount', 0))
    hour = int(transaction.get('hour_of_day', 12))
    day = int(transaction.get('day_of_week', 0))
    is_international = 1 if transaction.get('is_international', False) else 0
    
    category = transaction.get('merchant_category', 'Other')
    category_risk = CATEGORY_RISK.get(category, 0.3)
    
    location = transaction.get('location', 'Unknown')
    location_risk = LOCATION_RISK.get(location, 0.5)
    
    # Time risk (late night = higher risk)
    time_risk = 0.1
    if hour >= 0 and hour <= 5:
        time_risk = 0.8
    elif hour >= 22:
        time_risk = 0.6
    elif hour >= 6 and hour <= 8:
        time_risk = 0.3
    
    # Amount risk (log-scaled)
    amount_risk = min(1.0, amount / 10000)
    
    # Device risk
    device = transaction.get('device', 'Unknown')
    device_risk = {'API': 0.7, 'Web Browser': 0.3, 'Mobile App': 0.2, 
                   'POS Terminal': 0.1, 'ATM': 0.4, 'Phone Banking': 0.3}.get(device, 0.5)
    
    features = [
        amount,
        hour,
        day,
        is_international,
        category_risk,
        location_risk,
        time_risk,
        amount_risk,
        device_risk,
        amount * time_risk,  # interaction feature
        amount * location_risk,  # interaction feature
    ]
    
    return np.array(features).reshape(1, -1)


def compute_fraud_score(transaction):
    """Compute fraud probability using multiple signals"""
    features = extract_features(transaction)
    scores = []
    
    # Model-based prediction
    if scaler is not None:
        scaled_features = scaler.transform(features)
        
        if isolation_forest is not None:
            iso_score = isolation_forest.decision_function(scaled_features)[0]
            # Convert isolation forest score to probability (negative = anomaly)
            iso_prob = max(0, min(1, 0.5 - iso_score))
            scores.append(iso_prob)
        
        if logistic_model is not None:
            log_prob = logistic_model.predict_proba(scaled_features)[0][1]
            scores.append(log_prob)
    
    # Rule-based score as fallback/supplement
    amount = float(transaction.get('amount', 0))
    hour = int(transaction.get('hour_of_day', 12))
    category = transaction.get('merchant_category', 'Other')
    location = transaction.get('location', 'Unknown')
    is_international = transaction.get('is_international', False)
    
    rule_score = 0.0
    
    # Amount rules
    if amount > 5000:
        rule_score += 0.3
    elif amount > 2000:
        rule_score += 0.15
    elif amount > 1000:
        rule_score += 0.08
    
    # Time rules
    if hour >= 0 and hour <= 4:
        rule_score += 0.25
    elif hour >= 22 or hour <= 5:
        rule_score += 0.15
    
    # Category rules  
    rule_score += CATEGORY_RISK.get(category, 0.2) * 0.3
    
    # Location rules
    rule_score += LOCATION_RISK.get(location, 0.3) * 0.25
    
    # International
    if is_international:
        rule_score += 0.1
    
    rule_score = min(1.0, rule_score)
    scores.append(rule_score)
    
    # Weighted average
    if len(scores) == 3:
        final_score = scores[0] * 0.35 + scores[1] * 0.35 + scores[2] * 0.30
    elif len(scores) == 2:
        final_score = scores[0] * 0.5 + scores[1] * 0.5
    else:
        final_score = scores[0]
    
    return round(min(1.0, max(0.0, final_score)), 4)


def get_risk_level(score):
    if score >= 0.8:
        return 'critical'
    elif score >= 0.6:
        return 'high'
    elif score >= 0.35:
        return 'medium'
    else:
        return 'low'


@predictions_bp.route('/analyze', methods=['POST'])
@jwt_required()
def analyze_transaction():
    """Analyze a single transaction for fraud"""
    try:
        data = request.get_json()
        
        fraud_score = compute_fraud_score(data)
        risk_level = get_risk_level(fraud_score)
        
        # Build analysis breakdown
        features = extract_features(data)
        analysis = {
            'fraud_score': fraud_score,
            'risk_level': risk_level,
            'factors': {
                'amount_risk': 'High' if data.get('amount', 0) > 2000 else 'Medium' if data.get('amount', 0) > 500 else 'Low',
                'time_risk': 'High' if data.get('hour_of_day', 12) in range(0, 6) else 'Medium' if data.get('hour_of_day', 12) >= 22 else 'Low',
                'location_risk': 'High' if LOCATION_RISK.get(data.get('location', ''), 0.5) > 0.5 else 'Medium' if LOCATION_RISK.get(data.get('location', ''), 0.3) > 0.2 else 'Low',
                'category_risk': 'High' if CATEGORY_RISK.get(data.get('merchant_category', ''), 0.3) > 0.5 else 'Medium' if CATEGORY_RISK.get(data.get('merchant_category', ''), 0.3) > 0.2 else 'Low',
                'international_risk': 'High' if data.get('is_international', False) else 'Low'
            },
            'recommendation': 'BLOCK' if risk_level == 'critical' else 'REVIEW' if risk_level == 'high' else 'MONITOR' if risk_level == 'medium' else 'APPROVE',
            'model_used': 'ensemble' if isolation_forest and logistic_model else 'rule_based',
            'timestamp': datetime.utcnow().isoformat()
        }
        
        return jsonify(analysis), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@predictions_bp.route('/batch', methods=['POST'])
@jwt_required()
def batch_analyze():
    """Analyze all pending transactions"""
    try:
        # Get pending transactions
        pending = db.collection('transactions').where('risk_level', '==', 'pending').get()
        
        results = []
        alerts_created = 0
        
        for doc in pending:
            tx_data = doc.to_dict()
            fraud_score = compute_fraud_score(tx_data)
            risk_level = get_risk_level(fraud_score)
            
            # Update transaction
            update_data = {
                'fraud_score': fraud_score,
                'risk_level': risk_level,
                'is_flagged': risk_level in ['high', 'critical'],
                'analyzed_at': datetime.utcnow().isoformat(),
                'status': 'blocked' if risk_level == 'critical' else 'flagged' if risk_level == 'high' else 'approved'
            }
            
            db.collection('transactions').document(tx_data['id']).update(update_data)
            
            # Create alert for high-risk
            if risk_level in ['high', 'critical']:
                alert_id = str(uuid.uuid4())
                db.collection('alerts').document(alert_id).set({
                    'id': alert_id,
                    'transaction_id': tx_data['id'],
                    'type': 'ai_detection',
                    'severity': risk_level,
                    'message': f"AI detected {risk_level} risk transaction - Amount: ${tx_data.get('amount', 0)}, Score: {fraud_score}",
                    'fraud_score': fraud_score,
                    'created_at': datetime.utcnow().isoformat(),
                    'is_read': False
                })
                alerts_created += 1
            
            tx_data.update(update_data)
            results.append(tx_data)
        
        return jsonify({
            'analyzed': len(results),
            'alerts_created': alerts_created,
            'results': results
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@predictions_bp.route('/reload-models', methods=['POST'])
@jwt_required()
def reload_models():
    """Reload ML models from disk"""
    try:
        load_models()
        return jsonify({
            'message': 'Models reloaded',
            'isolation_forest': isolation_forest is not None,
            'logistic_regression': logistic_model is not None,
            'scaler': scaler is not None
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
