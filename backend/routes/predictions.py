"""
ML Prediction Routes - Real-time fraud detection with CSV upload support
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mock_firestore import get_db
import numpy as np
import joblib
import uuid
import csv
import io
from datetime import datetime
from config import Config

predictions_bp = Blueprint('predictions', __name__)
db = get_db()

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
    
    return float(round(min(1.0, max(0.0, float(final_score))), 4))


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


@predictions_bp.route('/upload-csv', methods=['POST'])
@jwt_required()
def upload_csv():
    """Upload CSV file with transaction data for analysis"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.lower().endswith('.csv'):
            return jsonify({'error': 'Only CSV files are supported'}), 400
        
        user_id = get_jwt_identity()
        
        # Read CSV
        stream = io.StringIO(file.stream.read().decode('UTF-8'))
        reader = csv.DictReader(stream)
        
        transactions_created = []
        transactions_analyzed = []
        alerts_created = 0
        errors = []
        
        # Map common CSV column names to our expected fields
        COLUMN_MAPPINGS = {
            'amount': ['amount', 'transaction_amount', 'amt', 'value', 'total', 'price'],
            'merchant_category': ['merchant_category', 'category', 'merchant_type', 'type', 'merchant_cat', 'mcc'],
            'location': ['location', 'city', 'country', 'merchant_location', 'loc', 'region'],
            'device': ['device', 'device_type', 'channel', 'source'],
            'hour_of_day': ['hour_of_day', 'hour', 'time_hour', 'transaction_hour'],
            'day_of_week': ['day_of_week', 'day', 'weekday'],
            'is_international': ['is_international', 'international', 'intl', 'is_intl', 'cross_border'],
            'merchant': ['merchant', 'merchant_name', 'vendor', 'payee'],
            'card_type': ['card_type', 'card', 'payment_method'],
            'is_fraud': ['is_fraud', 'fraud', 'fraudulent', 'label', 'class', 'target']
        }
        
        def find_column(row, field_name):
            """Find the matching column in CSV data"""
            possible_names = COLUMN_MAPPINGS.get(field_name, [field_name])
            for name in possible_names:
                # Try exact match first
                if name in row:
                    return row[name]
                # Try case-insensitive match
                for key in row.keys():
                    if key.lower().strip() == name.lower():
                        return row[key]
            return None
        
        row_count = 0
        for row in reader:
            row_count += 1
            if row_count > 500:  # Limit to 500 rows
                break
            
            try:
                # Extract data using flexible column mapping
                amount_str = find_column(row, 'amount')
                if amount_str is None:
                    errors.append(f"Row {row_count}: Missing amount field")
                    continue
                
                try:
                    amount = float(str(amount_str).replace(',', '').replace('$', '').strip())
                except (ValueError, TypeError):
                    errors.append(f"Row {row_count}: Invalid amount value '{amount_str}'")
                    continue
                
                # Get optional fields with defaults
                merchant_category = find_column(row, 'merchant_category') or 'Other'
                location = find_column(row, 'location') or 'Unknown Location'
                device = find_column(row, 'device') or 'Web Browser'
                
                hour_str = find_column(row, 'hour_of_day')
                try:
                    hour = int(hour_str) if hour_str else datetime.utcnow().hour
                except (ValueError, TypeError):
                    hour = datetime.utcnow().hour
                
                day_str = find_column(row, 'day_of_week')
                try:
                    day = int(day_str) if day_str else datetime.utcnow().weekday()
                except (ValueError, TypeError):
                    day = datetime.utcnow().weekday()
                
                intl_str = find_column(row, 'is_international')
                is_international = False
                if intl_str:
                    is_international = str(intl_str).lower() in ['true', '1', 'yes', 'y']
                
                merchant = find_column(row, 'merchant') or f"CSV_Import_{row_count}"
                card_type = find_column(row, 'card_type') or 'Visa'
                
                # Check if CSV has a ground-truth fraud label
                fraud_label = find_column(row, 'is_fraud')
                
                # Create transaction
                transaction_id = str(uuid.uuid4())
                transaction = {
                    'id': transaction_id,
                    'user_id': user_id,
                    'amount': amount,
                    'currency': 'USD',
                    'merchant': merchant,
                    'merchant_category': merchant_category,
                    'location': location,
                    'device': device,
                    'card_type': card_type,
                    'is_international': is_international,
                    'timestamp': datetime.utcnow().isoformat(),
                    'hour_of_day': hour,
                    'day_of_week': day,
                    'fraud_score': None,
                    'risk_level': 'pending',
                    'is_flagged': False,
                    'blockchain_hash': None,
                    'status': 'pending_review',
                    'source': 'csv_upload',
                    'original_filename': file.filename
                }
                
                # If CSV had ground truth, store it
                if fraud_label is not None:
                    try:
                        transaction['ground_truth_fraud'] = str(fraud_label).lower() in ['true', '1', 'yes', 'y']
                    except:
                        pass
                
                # Save to DB
                db.collection('transactions').document(transaction_id).set(transaction)
                transactions_created.append(transaction)
                
                # Run AI analysis immediately
                fraud_score = compute_fraud_score(transaction)
                risk_level = get_risk_level(fraud_score)
                
                update_data = {
                    'fraud_score': fraud_score,
                    'risk_level': risk_level,
                    'is_flagged': risk_level in ['high', 'critical'],
                    'analyzed_at': datetime.utcnow().isoformat(),
                    'status': 'blocked' if risk_level == 'critical' else 'flagged' if risk_level == 'high' else 'approved'
                }
                
                db.collection('transactions').document(transaction_id).update(update_data)
                transaction.update(update_data)
                transactions_analyzed.append(transaction)
                
                # Create alert for high-risk
                if risk_level in ['high', 'critical']:
                    alert_id = str(uuid.uuid4())
                    db.collection('alerts').document(alert_id).set({
                        'id': alert_id,
                        'transaction_id': transaction_id,
                        'type': 'csv_upload_detection',
                        'severity': risk_level,
                        'message': f"CSV Upload: {risk_level} risk - Amount: ${amount}, Score: {fraud_score}",
                        'fraud_score': fraud_score,
                        'created_at': datetime.utcnow().isoformat(),
                        'is_read': False
                    })
                    alerts_created += 1
                    
            except Exception as row_error:
                errors.append(f"Row {row_count}: {str(row_error)}")
        
        # Compute summary stats
        risk_summary = {'low': 0, 'medium': 0, 'high': 0, 'critical': 0}
        total_amount = 0
        total_fraud_amount = 0
        
        for tx in transactions_analyzed:
            rl = tx.get('risk_level', 'low')
            risk_summary[rl] = risk_summary.get(rl, 0) + 1
            total_amount += tx.get('amount', 0)
            if rl in ['high', 'critical']:
                total_fraud_amount += tx.get('amount', 0)
        
        return jsonify({
            'message': f'Successfully processed {len(transactions_analyzed)} transactions from CSV',
            'total_rows_processed': row_count,
            'transactions_created': len(transactions_created),
            'transactions_analyzed': len(transactions_analyzed),
            'alerts_created': alerts_created,
            'risk_summary': risk_summary,
            'total_amount': round(total_amount, 2),
            'total_fraud_amount': round(total_fraud_amount, 2),
            'fraud_rate': round((risk_summary.get('high', 0) + risk_summary.get('critical', 0)) / max(1, len(transactions_analyzed)) * 100, 2),
            'errors': errors[:10],  # Only return first 10 errors
            'sample_results': transactions_analyzed[:5]  # Return first 5 as sample
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
