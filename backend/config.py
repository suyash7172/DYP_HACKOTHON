import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'securepay-ai-secret-key-2024')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-securepay-secret-2024')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # Firebase
    FIREBASE_CONFIG = {
        "apiKey": "AIzaSyCuBxOgLIXHT54Q6oTO06fFohugieAYsiI",
        "authDomain": "ai-blockchain-9c14e.firebaseapp.com",
        "projectId": "ai-blockchain-9c14e",
        "storageBucket": "ai-blockchain-9c14e.firebasestorage.app",
        "messagingSenderId": "917986154808",
        "appId": "1:917986154808:web:b2dfa851558e0c4fa889cd",
        "measurementId": "G-Q7K04VP0EK"
    }
    
    # Blockchain
    ETHEREUM_RPC_URL = os.environ.get('ETHEREUM_RPC_URL', 'https://rpc-amoy.polygon.technology/')
    CONTRACT_ADDRESS = os.environ.get('CONTRACT_ADDRESS', '')
    WALLET_PRIVATE_KEY = os.environ.get('WALLET_PRIVATE_KEY', '')
    
    # ML Model
    MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'ml-model', 'models')
    FRAUD_THRESHOLD = 0.7
    
    # CORS
    CORS_ORIGINS = ['http://localhost:4200', 'http://localhost:5000']
