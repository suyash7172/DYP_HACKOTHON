"""
Authentication Routes - Signup/Login with JWT, Role-based access
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token, 
    jwt_required, get_jwt_identity, get_jwt
)
from firebase_admin import firestore
import bcrypt
import uuid
from datetime import datetime

auth_bp = Blueprint('auth', __name__)
db = firestore.client()

@auth_bp.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        name = data.get('name', '')
        role = data.get('role', 'analyst')  # admin or analyst
        
        if not email or not password or not name:
            return jsonify({'error': 'Name, email, and password are required'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        # Check if user exists
        users_ref = db.collection('users')
        existing = users_ref.where('email', '==', email).limit(1).get()
        
        if len(list(existing)) > 0:
            return jsonify({'error': 'User already exists with this email'}), 409
        
        # Hash password
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        
        user_id = str(uuid.uuid4())
        user_data = {
            'id': user_id,
            'name': name,
            'email': email,
            'password': hashed.decode('utf-8'),
            'role': role if role in ['admin', 'analyst'] else 'analyst',
            'created_at': datetime.utcnow().isoformat(),
            'is_active': True,
            'last_login': None
        }
        
        users_ref.document(user_id).set(user_data)
        
        # Generate tokens
        additional_claims = {'role': user_data['role'], 'name': name}
        access_token = create_access_token(identity=user_id, additional_claims=additional_claims)
        refresh_token = create_refresh_token(identity=user_id, additional_claims=additional_claims)
        
        return jsonify({
            'message': 'User created successfully',
            'user': {
                'id': user_id,
                'name': name,
                'email': email,
                'role': user_data['role']
            },
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user
        users_ref = db.collection('users')
        users = list(users_ref.where('email', '==', email).limit(1).get())
        
        if not users:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        user_doc = users[0]
        user_data = user_doc.to_dict()
        
        # Verify password
        if not bcrypt.checkpw(password.encode('utf-8'), user_data['password'].encode('utf-8')):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not user_data.get('is_active', True):
            return jsonify({'error': 'Account is deactivated'}), 403
        
        # Update last login
        users_ref.document(user_data['id']).update({
            'last_login': datetime.utcnow().isoformat()
        })
        
        # Generate tokens
        additional_claims = {'role': user_data['role'], 'name': user_data['name']}
        access_token = create_access_token(identity=user_data['id'], additional_claims=additional_claims)
        refresh_token = create_refresh_token(identity=user_data['id'], additional_claims=additional_claims)
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user_data['id'],
                'name': user_data['name'],
                'email': user_data['email'],
                'role': user_data['role']
            },
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    claims = get_jwt()
    additional_claims = {'role': claims.get('role', 'analyst'), 'name': claims.get('name', '')}
    access_token = create_access_token(identity=identity, additional_claims=additional_claims)
    return jsonify({'access_token': access_token}), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        user_id = get_jwt_identity()
        user_doc = db.collection('users').document(user_id).get()
        
        if not user_doc.exists:
            return jsonify({'error': 'User not found'}), 404
        
        user_data = user_doc.to_dict()
        user_data.pop('password', None)
        
        return jsonify({'user': user_data}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        users = db.collection('users').get()
        users_list = []
        for user in users:
            data = user.to_dict()
            data.pop('password', None)
            users_list.append(data)
        
        return jsonify({'users': users_list}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
