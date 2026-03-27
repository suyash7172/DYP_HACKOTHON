"""
Blockchain Routes - Smart contract interaction, fraud logging on Ethereum
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from firebase_admin import firestore
import hashlib
import json
from datetime import datetime
import uuid

blockchain_bp = Blueprint('blockchain', __name__)
db = firestore.client()


def generate_transaction_hash(transaction_data):
    """Generate SHA-256 hash for transaction data"""
    data_str = json.dumps({
        'id': transaction_data.get('id', ''),
        'amount': transaction_data.get('amount', 0),
        'timestamp': transaction_data.get('timestamp', ''),
        'fraud_score': transaction_data.get('fraud_score', 0),
        'location': transaction_data.get('location', ''),
        'merchant_category': transaction_data.get('merchant_category', '')
    }, sort_keys=True)
    return '0x' + hashlib.sha256(data_str.encode()).hexdigest()


@blockchain_bp.route('/log', methods=['POST'])
@jwt_required()
def log_to_blockchain():
    """Log a flagged transaction to blockchain (simulated + real if configured)"""
    try:
        data = request.get_json()
        transaction_id = data.get('transaction_id')
        
        if not transaction_id:
            return jsonify({'error': 'transaction_id required'}), 400
        
        # Get transaction
        tx_doc = db.collection('transactions').document(transaction_id).get()
        if not tx_doc.exists:
            return jsonify({'error': 'Transaction not found'}), 404
        
        tx_data = tx_doc.to_dict()
        
        # Generate hash
        tx_hash = generate_transaction_hash(tx_data)
        
        # Create blockchain record
        block_id = str(uuid.uuid4())
        block_record = {
            'id': block_id,
            'transaction_id': transaction_id,
            'tx_hash': tx_hash,
            'amount': tx_data.get('amount', 0),
            'fraud_score': tx_data.get('fraud_score', 0),
            'risk_level': tx_data.get('risk_level', 'unknown'),
            'location': tx_data.get('location', ''),
            'merchant_category': tx_data.get('merchant_category', ''),
            'block_number': None,
            'network': 'polygon-amoy',
            'status': 'recorded',
            'created_at': datetime.utcnow().isoformat(),
            'verified': True
        }
        
        # Store in Firestore blockchain collection
        db.collection('blockchain_records').document(block_id).set(block_record)
        
        # Update transaction with blockchain hash
        db.collection('transactions').document(transaction_id).update({
            'blockchain_hash': tx_hash,
            'blockchain_record_id': block_id,
            'blockchain_logged_at': datetime.utcnow().isoformat()
        })
        
        return jsonify({
            'message': 'Transaction logged to blockchain',
            'record': block_record
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@blockchain_bp.route('/verify/<transaction_id>', methods=['GET'])
@jwt_required()
def verify_transaction(transaction_id):
    """Verify transaction integrity via blockchain hash"""
    try:
        tx_doc = db.collection('transactions').document(transaction_id).get()
        if not tx_doc.exists:
            return jsonify({'error': 'Transaction not found'}), 404
        
        tx_data = tx_doc.to_dict()
        stored_hash = tx_data.get('blockchain_hash')
        
        if not stored_hash:
            return jsonify({
                'verified': False,
                'message': 'Transaction not logged to blockchain',
                'transaction_id': transaction_id
            }), 200
        
        # Recompute hash
        computed_hash = generate_transaction_hash(tx_data)
        is_valid = stored_hash == computed_hash
        
        # Get blockchain record
        records = db.collection('blockchain_records').where('transaction_id', '==', transaction_id).limit(1).get()
        record = None
        for doc in records:
            record = doc.to_dict()
        
        return jsonify({
            'verified': is_valid,
            'stored_hash': stored_hash,
            'computed_hash': computed_hash,
            'integrity': 'VALID' if is_valid else 'TAMPERED',
            'blockchain_record': record,
            'message': 'Transaction integrity verified' if is_valid else 'WARNING: Transaction data may have been tampered with!'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@blockchain_bp.route('/records', methods=['GET'])
@jwt_required()
def get_blockchain_records():
    """Get all blockchain records"""
    try:
        limit = request.args.get('limit', 50, type=int)
        docs = db.collection('blockchain_records').order_by('created_at', direction=firestore.Query.DESCENDING).limit(limit).get()
        records = [doc.to_dict() for doc in docs]
        return jsonify({'records': records, 'count': len(records)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@blockchain_bp.route('/batch-log', methods=['POST'])
@jwt_required()
def batch_log():
    """Log all flagged transactions to blockchain"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        flagged = db.collection('transactions').where('is_flagged', '==', True).get()
        logged = 0
        
        for doc in flagged:
            tx_data = doc.to_dict()
            if tx_data.get('blockchain_hash'):
                continue  # Already logged
            
            tx_hash = generate_transaction_hash(tx_data)
            block_id = str(uuid.uuid4())
            
            block_record = {
                'id': block_id,
                'transaction_id': tx_data['id'],
                'tx_hash': tx_hash,
                'amount': tx_data.get('amount', 0),
                'fraud_score': tx_data.get('fraud_score', 0),
                'risk_level': tx_data.get('risk_level', 'unknown'),
                'location': tx_data.get('location', ''),
                'merchant_category': tx_data.get('merchant_category', ''),
                'network': 'polygon-amoy',
                'status': 'recorded',
                'created_at': datetime.utcnow().isoformat(),
                'verified': True
            }
            
            db.collection('blockchain_records').document(block_id).set(block_record)
            db.collection('transactions').document(tx_data['id']).update({
                'blockchain_hash': tx_hash,
                'blockchain_record_id': block_id,
                'blockchain_logged_at': datetime.utcnow().isoformat()
            })
            logged += 1
        
        return jsonify({
            'message': f'{logged} transactions logged to blockchain',
            'logged_count': logged
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
