"""
Dashboard Routes - Analytics and insights
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from firebase_admin import firestore
from datetime import datetime, timedelta

dashboard_bp = Blueprint('dashboard', __name__)
db = firestore.client()


@dashboard_bp.route('/overview', methods=['GET'])
@jwt_required()
def get_overview():
    """Get dashboard overview stats"""
    try:
        transactions = db.collection('transactions').get()
        alerts = db.collection('alerts').get()
        
        total_txns = 0
        total_amount = 0
        fraud_count = 0
        legit_count = 0
        blocked_amount = 0
        risk_dist = {'low': 0, 'medium': 0, 'high': 0, 'critical': 0, 'pending': 0}
        hourly_fraud = [0] * 24
        hourly_legit = [0] * 24
        daily_counts = {}
        category_fraud = {}
        location_fraud = {}
        recent_flagged = []
        amount_ranges = {'0-100': 0, '100-500': 0, '500-1000': 0, '1000-5000': 0, '5000+': 0}
        
        for doc in transactions:
            data = doc.to_dict()
            total_txns += 1
            amount = data.get('amount', 0)
            total_amount += amount
            risk = data.get('risk_level', 'pending')
            risk_dist[risk] = risk_dist.get(risk, 0) + 1
            hour = data.get('hour_of_day', 0)
            
            # Amount ranges
            if amount < 100:
                amount_ranges['0-100'] += 1
            elif amount < 500:
                amount_ranges['100-500'] += 1
            elif amount < 1000:
                amount_ranges['500-1000'] += 1
            elif amount < 5000:
                amount_ranges['1000-5000'] += 1
            else:
                amount_ranges['5000+'] += 1
            
            if risk in ['high', 'critical']:
                fraud_count += 1
                blocked_amount += amount
                hourly_fraud[hour] += 1
                
                cat = data.get('merchant_category', 'Other')
                category_fraud[cat] = category_fraud.get(cat, 0) + 1
                
                loc = data.get('location', 'Unknown')
                location_fraud[loc] = location_fraud.get(loc, 0) + 1
                
                recent_flagged.append({
                    'id': data.get('id', ''),
                    'amount': amount,
                    'merchant_category': cat,
                    'location': loc,
                    'fraud_score': data.get('fraud_score', 0),
                    'risk_level': risk,
                    'timestamp': data.get('timestamp', ''),
                    'device': data.get('device', 'Unknown')
                })
            else:
                if risk != 'pending':
                    legit_count += 1
                hourly_legit[hour] += 1
            
            # Daily counts
            ts = data.get('timestamp', '')
            if ts:
                day = ts[:10]
                if day not in daily_counts:
                    daily_counts[day] = {'total': 0, 'fraud': 0}
                daily_counts[day]['total'] += 1
                if risk in ['high', 'critical']:
                    daily_counts[day]['fraud'] += 1
        
        # Sort recent flagged by score
        recent_flagged.sort(key=lambda x: x.get('fraud_score', 0), reverse=True)
        
        # Unread alerts
        unread_alerts = sum(1 for a in alerts if not a.to_dict().get('is_read', False))
        total_alerts = len(list(alerts))
        
        return jsonify({
            'overview': {
                'total_transactions': total_txns,
                'total_amount': round(total_amount, 2),
                'fraud_count': fraud_count,
                'legit_count': legit_count,
                'pending_count': risk_dist.get('pending', 0),
                'fraud_rate': round((fraud_count / total_txns * 100) if total_txns > 0 else 0, 2),
                'blocked_amount': round(blocked_amount, 2),
                'avg_transaction': round(total_amount / total_txns if total_txns > 0 else 0, 2),
                'unread_alerts': unread_alerts,
                'total_alerts': total_alerts
            },
            'risk_distribution': risk_dist,
            'hourly_fraud': hourly_fraud,
            'hourly_legit': hourly_legit,
            'daily_counts': daily_counts,
            'category_fraud': category_fraud,
            'location_fraud': location_fraud,
            'amount_ranges': amount_ranges,
            'recent_flagged': recent_flagged[:20]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dashboard_bp.route('/alerts', methods=['GET'])
@jwt_required()
def get_alerts():
    try:
        limit = request.args.get('limit', 50, type=int)
        docs = db.collection('alerts').order_by('created_at', direction=firestore.Query.DESCENDING).limit(limit).get()
        alerts_list = [doc.to_dict() for doc in docs]
        return jsonify({'alerts': alerts_list, 'count': len(alerts_list)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dashboard_bp.route('/alerts/<alert_id>/read', methods=['PUT'])
@jwt_required()
def mark_alert_read(alert_id):
    try:
        db.collection('alerts').document(alert_id).update({'is_read': True})
        return jsonify({'message': 'Alert marked as read'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dashboard_bp.route('/alerts/read-all', methods=['PUT'])
@jwt_required()
def mark_all_read():
    try:
        alerts = db.collection('alerts').where('is_read', '==', False).get()
        for alert in alerts:
            db.collection('alerts').document(alert.id).update({'is_read': True})
        return jsonify({'message': 'All alerts marked as read'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
