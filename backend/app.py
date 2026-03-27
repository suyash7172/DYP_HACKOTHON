"""
SecurePay AI - Backend Application
Flask REST API with JWT Authentication, Firebase Sync, ML Fraud Detection
"""

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from mock_firestore import get_db

# Initialize Flask
app = Flask(__name__)
app.config.from_object(Config)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file upload

# CORS
CORS(app, resources={r"/api/*": {"origins": Config.CORS_ORIGINS}}, supports_credentials=True)

# JWT
jwt = JWTManager(app)

# Initialize Firebase (in background, non-blocking)
try:
    from firebase_client import init_firebase
    init_firebase()
except Exception as e:
    print(f"Firebase init skipped: {e}")

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
    from firebase_client import is_firebase_available
    return {
        'status': 'healthy', 
        'service': 'SecurePay AI', 
        'version': '2.0.0',
        'firebase_connected': is_firebase_available()
    }

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
