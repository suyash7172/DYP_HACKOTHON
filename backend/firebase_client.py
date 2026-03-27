"""
Firebase Firestore Client - Real Firebase integration for user data persistence
Uses firebase-admin SDK to connect to the actual Firebase Firestore database
"""

import firebase_admin
from firebase_admin import credentials, firestore
import os

_firestore_client = None
_firebase_initialized = False

def init_firebase():
    """Initialize Firebase Admin SDK"""
    global _firebase_initialized, _firestore_client
    
    if _firebase_initialized and _firestore_client:
        return _firestore_client
    
    try:
        # Check if already initialized (handles Flask debug reloader)
        try:
            app = firebase_admin.get_app()
            _firestore_client = firestore.client(app)
            _firebase_initialized = True
            print("✅ Firebase already initialized, reusing existing app")
            return _firestore_client
        except ValueError:
            pass  # App doesn't exist yet, continue with initialization
        
        # Try service account file
        sa_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'serviceAccountKey.json')
        if os.path.exists(sa_path):
            cred = credentials.Certificate(sa_path)
            app = firebase_admin.initialize_app(cred)
            _firestore_client = firestore.client(app)
            _firebase_initialized = True
            print("✅ Firebase initialized with service account key")
            print(f"   Project: {app.project_id}")
            return _firestore_client
        else:
            print("⚠️ serviceAccountKey.json not found in backend/")
            print("ℹ️ Falling back to mock Firestore (local JSON storage)")
            _firebase_initialized = False
            return None
    except Exception as e:
        print(f"⚠️ Firebase initialization failed: {e}")
        print("ℹ️ Falling back to mock Firestore (local JSON storage)")
        _firebase_initialized = False
        return None

def get_firestore_client():
    """Get the Firestore client, returns None if Firebase is not available"""
    global _firestore_client
    if _firestore_client is None:
        init_firebase()
    return _firestore_client

def is_firebase_available():
    """Check if Firebase is available"""
    return _firebase_initialized and _firestore_client is not None


class FirestoreSync:
    """Syncs data to real Firebase Firestore alongside mock DB"""
    
    def __init__(self):
        self.client = get_firestore_client()
    
    def sync_user(self, user_data):
        """Sync user data to Firebase Firestore"""
        if not self.client:
            return False
        try:
            user_copy = dict(user_data)
            doc_ref = self.client.collection('users').document(user_copy['id'])
            doc_ref.set(user_copy)
            print(f"✅ User synced to Firebase: {user_copy.get('email', 'unknown')}")
            return True
        except Exception as e:
            print(f"⚠️ Firebase sync error (user): {e}")
            return False
    
    def sync_transaction(self, tx_data):
        """Sync transaction data to Firebase Firestore"""
        if not self.client:
            return False
        try:
            doc_ref = self.client.collection('transactions').document(tx_data['id'])
            doc_ref.set(tx_data)
            return True
        except Exception as e:
            print(f"⚠️ Firebase sync error (transaction): {e}")
            return False
    
    def sync_alert(self, alert_data):
        """Sync alert data to Firebase Firestore"""
        if not self.client:
            return False
        try:
            doc_ref = self.client.collection('alerts').document(alert_data['id'])
            doc_ref.set(alert_data)
            return True
        except Exception as e:
            print(f"⚠️ Firebase sync error (alert): {e}")
            return False
    
    def update_user(self, user_id, update_data):
        """Update user in Firebase"""
        if not self.client:
            return False
        try:
            doc_ref = self.client.collection('users').document(user_id)
            doc_ref.update(update_data)
            return True
        except Exception as e:
            print(f"⚠️ Firebase update error (user): {e}")
            return False
    
    def get_users(self):
        """Get all users from Firebase"""
        if not self.client:
            return None
        try:
            docs = self.client.collection('users').stream()
            return {doc.id: doc.to_dict() for doc in docs}
        except Exception as e:
            print(f"⚠️ Firebase read error (users): {e}")
            return None


# Singleton
_sync_instance = None

def get_firebase_sync():
    global _sync_instance
    if _sync_instance is None:
        _sync_instance = FirestoreSync()
    return _sync_instance
