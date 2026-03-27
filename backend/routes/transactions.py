"""
Transaction Routes - CRUD operations and simulation
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from firebase_admin import firestore
import uuid
import random
from datetime import datetime, timedelta

transactions_bp = Blueprint('transactions', __name__)
db = firestore.client()

MERCHANT_CATEGORIES = [
    'Electronics', 'Grocery', 'Restaurant', 'Gas Station', 'Online Shopping',
    'Travel', 'Entertainment', 'Healthcare', 'Education', 'Utilities',
    'ATM Withdrawal', 'Wire Transfer', 'Crypto Exchange', 'Gambling', 'Luxury Goods'
]

LOCATIONS = [
    'New York, US', 'London, UK', 'Mumbai, India', 'Tokyo, Japan', 'Lagos, Nigeria',
    'Sydney, Australia', 'Berlin, Germany', 'São Paulo, Brazil', 'Dubai, UAE',
    'Singapore', 'Toronto, Canada', 'Paris, France', 'Moscow, Russia',
    'Hong Kong', 'Unknown Location'
]

DEVICES = ['Mobile App', 'Web Browser', 'POS Terminal', 'ATM', 'Phone Banking', 'API']


@transactions_bp.route('/', methods=['GET'])
@jwt_required()
def get_transactions():
    try:
        limit = request.args.get('limit', 50, type=int)
        status_filter = request.args.get('status', None)
        
        query = db.collection('transactions').order_by('timestamp', direction=firestore.Query.DESCENDING)
        
        if status_filter:
            query = query.where('risk_level', '==', status_filter)
        
        docs = query.limit(limit).get()
        transactions = [doc.to_dict() for doc in docs]
        
        return jsonify({'transactions': transactions, 'count': len(transactions)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@transactions_bp.route('/<transaction_id>', methods=['GET'])
@jwt_required()
def get_transaction(transaction_id):
    try:
        doc = db.collection('transactions').document(transaction_id).get()
        if not doc.exists:
            return jsonify({'error': 'Transaction not found'}), 404
        return jsonify({'transaction': doc.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@transactions_bp.route('/', methods=['POST'])
@jwt_required()
def create_transaction():
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        transaction_id = str(uuid.uuid4())
        transaction = {
            'id': transaction_id,
            'user_id': user_id,
            'amount': float(data.get('amount', 0)),
            'currency': data.get('currency', 'USD'),
            'merchant': data.get('merchant', 'Unknown'),
            'merchant_category': data.get('merchant_category', 'Other'),
            'location': data.get('location', 'Unknown'),
            'device': data.get('device', 'Unknown'),
            'card_type': data.get('card_type', 'Visa'),
            'is_international': data.get('is_international', False),
            'timestamp': datetime.utcnow().isoformat(),
            'hour_of_day': datetime.utcnow().hour,
            'day_of_week': datetime.utcnow().weekday(),
            'fraud_score': None,
            'risk_level': 'pending',
            'is_flagged': False,
            'blockchain_hash': None,
            'status': 'pending_review'
        }
        
        db.collection('transactions').document(transaction_id).set(transaction)
        
        return jsonify({
            'message': 'Transaction created',
            'transaction': transaction
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@transactions_bp.route('/simulate', methods=['POST'])
@jwt_required()
def simulate_transactions():
    """Generate a batch of simulated transactions for testing"""
    try:
        data = request.get_json()
        count = min(data.get('count', 10), 100)
        user_id = get_jwt_identity()
        
        transactions = []
        for i in range(count):
            is_fraud = random.random() < 0.15  # 15% fraud rate
            
            if is_fraud:
                amount = round(random.uniform(500, 15000), 2)
                hour = random.choice([0, 1, 2, 3, 4, 23, 22])
                location = random.choice(['Unknown Location', 'Lagos, Nigeria', 'Moscow, Russia'])
                merchant_cat = random.choice(['Crypto Exchange', 'Gambling', 'Wire Transfer', 'Luxury Goods'])
                is_international = random.random() < 0.8
                device = random.choice(['API', 'Web Browser'])
            else:
                amount = round(random.uniform(5, 500), 2)
                hour = random.randint(8, 21)
                location = random.choice(LOCATIONS[:8])
                merchant_cat = random.choice(MERCHANT_CATEGORIES[:10])
                is_international = random.random() < 0.2
                device = random.choice(DEVICES)
            
            ts = datetime.utcnow() - timedelta(minutes=random.randint(0, 1440))
            
            transaction_id = str(uuid.uuid4())
            transaction = {
                'id': transaction_id,
                'user_id': user_id,
                'amount': amount,
                'currency': 'USD',
                'merchant': f"Merchant_{random.randint(1000, 9999)}",
                'merchant_category': merchant_cat,
                'location': location,
                'device': device,
                'card_type': random.choice(['Visa', 'Mastercard', 'Amex']),
                'is_international': is_international,
                'timestamp': ts.isoformat(),
                'hour_of_day': hour,
                'day_of_week': ts.weekday(),
                'fraud_score': None,
                'risk_level': 'pending',
                'is_flagged': False,
                'blockchain_hash': None,
                'status': 'pending_review',
                'simulated': True
            }
            
            db.collection('transactions').document(transaction_id).set(transaction)
            transactions.append(transaction)
        
        return jsonify({
            'message': f'{count} transactions simulated',
            'transactions': transactions,
            'count': count
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@transactions_bp.route('/<transaction_id>/flag', methods=['PUT'])
@jwt_required()
def flag_transaction(transaction_id):
    try:
        claims = get_jwt()
        if claims.get('role') not in ['admin', 'analyst']:
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        doc_ref = db.collection('transactions').document(transaction_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return jsonify({'error': 'Transaction not found'}), 404
        
        doc_ref.update({
            'is_flagged': True,
            'flagged_by': get_jwt_identity(),
            'flagged_at': datetime.utcnow().isoformat(),
            'status': 'flagged'
        })
        
        # Create alert
        alert_id = str(uuid.uuid4())
        tx_data = doc.to_dict()
        db.collection('alerts').document(alert_id).set({
            'id': alert_id,
            'transaction_id': transaction_id,
            'type': 'manual_flag',
            'severity': 'high',
            'message': f"Transaction {transaction_id[:8]}... manually flagged - Amount: ${tx_data.get('amount', 0)}",
            'created_at': datetime.utcnow().isoformat(),
            'is_read': False,
            'created_by': get_jwt_identity()
        })
        
        return jsonify({'message': 'Transaction flagged successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@transactions_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_transaction_stats():
    try:
        all_txns = db.collection('transactions').get()
        
        total = 0
        total_amount = 0
        fraud_count = 0
        legit_count = 0
        pending_count = 0
        risk_distribution = {'low': 0, 'medium': 0, 'high': 0, 'critical': 0, 'pending': 0}
        category_counts = {}
        hourly_counts = [0] * 24
        location_counts = {}
        
        for doc in all_txns:
            data = doc.to_dict()
            total += 1
            total_amount += data.get('amount', 0)
            risk = data.get('risk_level', 'pending')
            risk_distribution[risk] = risk_distribution.get(risk, 0) + 1
            
            if risk in ['high', 'critical']:
                fraud_count += 1
            elif risk in ['low', 'medium']:
                legit_count += 1
            else:
                pending_count += 1
            
            cat = data.get('merchant_category', 'Other')
            category_counts[cat] = category_counts.get(cat, 0) + 1
            
            hour = data.get('hour_of_day', 0)
            hourly_counts[hour] += 1
            
            loc = data.get('location', 'Unknown')
            location_counts[loc] = location_counts.get(loc, 0) + 1
        
        return jsonify({
            'total_transactions': total,
            'total_amount': round(total_amount, 2),
            'fraud_count': fraud_count,
            'legit_count': legit_count,
            'pending_count': pending_count,
            'fraud_rate': round((fraud_count / total * 100) if total > 0 else 0, 2),
            'risk_distribution': risk_distribution,
            'category_counts': category_counts,
            'hourly_counts': hourly_counts,
            'location_counts': location_counts,
            'avg_transaction_amount': round(total_amount / total if total > 0 else 0, 2)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
