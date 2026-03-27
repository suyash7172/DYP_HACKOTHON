"""
SecurePay AI - Backend Application
Flask REST API with JWT Authentication, Firebase Firestore, ML Fraud Detection
"""

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
import firebase_admin
from firebase_admin import credentials, firestore
import os

# Initialize Flask
app = Flask(__name__)
app.config.from_object(Config)

# CORS
CORS(app, resources={r"/api/*": {"origins": Config.CORS_ORIGINS}}, supports_credentials=True)

# JWT
jwt = JWTManager(app)

# Firebase Admin SDK - Mock for hackathon to avoid service account requirements
import mock_firestore
firestore.client = mock_firestore.get_db

try:
    firebase_admin.initialize_app()
except ValueError:
    pass  # Already initialized

db = firestore.client()

# Register Blueprints
from routes.auth import auth_bp
from routes.transactions import transactions_bp
from routes.predictions import predictions_bp
from routes.dashboard import dashboard_bp
from routes.blockchain import blockchain_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
app.register_blueprint(predictions_bp, url_prefix='/api/predictions')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
app.register_blueprint(blockchain_bp, url_prefix='/api/blockchain')

@app.route('/api/health', methods=['GET'])
def health_check():
    return {'status': 'healthy', 'service': 'SecurePay AI', 'version': '1.0.0'}

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
