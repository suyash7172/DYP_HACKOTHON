"""
SecurePay AI - ML Model Training Script
Trains Isolation Forest and Logistic Regression for fraud detection
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import joblib
import os
import random

# Create models directory
os.makedirs('models', exist_ok=True)

print("=" * 60)
print("SecurePay AI - Fraud Detection Model Training")
print("=" * 60)

# =============================================
# 1. Generate Synthetic Training Dataset
# =============================================
print("\n[1/5] Generating synthetic transaction dataset...")

np.random.seed(42)
n_samples = 10000
fraud_ratio = 0.12

n_fraud = int(n_samples * fraud_ratio)
n_legit = n_samples - n_fraud

# Category risk mapping
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

DEVICE_RISK = {
    'API': 0.7, 'Web Browser': 0.3, 'Mobile App': 0.2,
    'POS Terminal': 0.1, 'ATM': 0.4, 'Phone Banking': 0.3
}


def generate_legit_transaction():
    amount = np.random.lognormal(mean=4, sigma=1)
    amount = min(amount, 3000)
    hour = int(np.random.normal(14, 4)) % 24
    if hour < 0:
        hour += 24
    day = random.randint(0, 6)
    is_international = 1 if random.random() < 0.15 else 0
    
    categories = ['Grocery', 'Restaurant', 'Gas Station', 'Online Shopping', 'Entertainment', 
                   'Electronics', 'Healthcare', 'Education', 'Utilities', 'Travel']
    cat = random.choice(categories)
    cat_risk = CATEGORY_RISK.get(cat, 0.2)
    
    locations = ['New York, US', 'London, UK', 'Mumbai, India', 'Tokyo, Japan',
                  'Sydney, Australia', 'Toronto, Canada', 'Paris, France', 'Berlin, Germany', 'Singapore']
    loc = random.choice(locations)
    loc_risk = LOCATION_RISK.get(loc, 0.15)
    
    devices = ['Mobile App', 'Web Browser', 'POS Terminal', 'Phone Banking']
    device = random.choice(devices)
    device_risk = DEVICE_RISK.get(device, 0.2)
    
    time_risk = 0.1
    if hour >= 0 and hour <= 5:
        time_risk = 0.8
    elif hour >= 22:
        time_risk = 0.6
    elif hour >= 6 and hour <= 8:
        time_risk = 0.3
    
    amount_risk = min(1.0, amount / 10000)
    
    return [amount, hour, day, is_international, cat_risk, loc_risk, 
            time_risk, amount_risk, device_risk, amount * time_risk, amount * loc_risk]


def generate_fraud_transaction():
    amount = np.random.lognormal(mean=7, sigma=1.5)
    amount = min(amount, 50000)
    amount = max(amount, 200)
    hour = random.choice([0, 1, 2, 3, 4, 5, 22, 23])
    day = random.randint(0, 6)
    is_international = 1 if random.random() < 0.75 else 0
    
    categories = ['Crypto Exchange', 'Gambling', 'Wire Transfer', 'Luxury Goods', 'ATM Withdrawal']
    cat = random.choice(categories)
    cat_risk = CATEGORY_RISK.get(cat, 0.6)
    
    locations = ['Unknown Location', 'Lagos, Nigeria', 'Moscow, Russia', 'Hong Kong', 'Dubai, UAE']
    loc = random.choice(locations)
    loc_risk = LOCATION_RISK.get(loc, 0.6)
    
    devices = ['API', 'Web Browser', 'ATM']
    device = random.choice(devices)
    device_risk = DEVICE_RISK.get(device, 0.5)
    
    time_risk = 0.8 if hour <= 5 or hour >= 22 else 0.3
    amount_risk = min(1.0, amount / 10000)
    
    return [amount, hour, day, is_international, cat_risk, loc_risk,
            time_risk, amount_risk, device_risk, amount * time_risk, amount * loc_risk]


# Generate data
print(f"   Generating {n_legit} legitimate transactions...")
legit_data = [generate_legit_transaction() for _ in range(n_legit)]

print(f"   Generating {n_fraud} fraudulent transactions...")
fraud_data = [generate_fraud_transaction() for _ in range(n_fraud)]

# Create DataFrame
feature_names = ['amount', 'hour_of_day', 'day_of_week', 'is_international',
                  'category_risk', 'location_risk', 'time_risk', 'amount_risk',
                  'device_risk', 'amount_time_interaction', 'amount_location_interaction']

X = np.array(legit_data + fraud_data)
y = np.array([0] * n_legit + [1] * n_fraud)

# Shuffle
indices = np.random.permutation(len(X))
X = X[indices]
y = y[indices]

df = pd.DataFrame(X, columns=feature_names)
df['is_fraud'] = y[:]

print(f"   Dataset: {len(df)} samples, {df['is_fraud'].sum()} fraud ({df['is_fraud'].mean()*100:.1f}%)")

# Save dataset
df.to_csv('training_data.csv', index=False)
print("   Saved training_data.csv")

# =============================================
# 2. Preprocessing
# =============================================
print("\n[2/5] Preprocessing data...")

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print(f"   Train: {len(X_train)} samples, Test: {len(X_test)} samples")

# =============================================
# 3. Train Isolation Forest
# =============================================
print("\n[3/5] Training Isolation Forest (anomaly detection)...")

iso_forest = IsolationForest(
    n_estimators=200,
    contamination=0.12,
    max_features=0.8,
    random_state=42,
    n_jobs=-1
)
iso_forest.fit(X_train_scaled)

# Evaluate
iso_predictions = iso_forest.predict(X_test_scaled)
# Convert: -1 (anomaly) -> 1 (fraud), 1 (normal) -> 0 (legit)
iso_labels = np.where(iso_predictions == -1, 1, 0)

print("\n   Isolation Forest Results:")
print(classification_report(y_test, iso_labels, target_names=['Legit', 'Fraud']))

# =============================================
# 4. Train Logistic Regression
# =============================================
print("\n[4/5] Training Logistic Regression (supervised classifier)...")

log_reg = LogisticRegression(
    C=1.0,
    class_weight='balanced',
    max_iter=1000,
    random_state=42
)
log_reg.fit(X_train_scaled, y_train)

log_predictions = log_reg.predict(X_test_scaled)
log_proba = log_reg.predict_proba(X_test_scaled)[:, 1]

print("\n   Logistic Regression Results:")
print(classification_report(y_test, log_predictions, target_names=['Legit', 'Fraud']))

# =============================================
# 5. Save Models
# =============================================
print("\n[5/5] Saving models...")

joblib.dump(iso_forest, 'models/isolation_forest.pkl')
joblib.dump(log_reg, 'models/logistic_regression.pkl')
joblib.dump(scaler, 'models/scaler.pkl')

# Save feature names
joblib.dump(feature_names, 'models/feature_names.pkl')

print("   ✓ isolation_forest.pkl")
print("   ✓ logistic_regression.pkl")
print("   ✓ scaler.pkl")
print("   ✓ feature_names.pkl")

# =============================================
# Summary
# =============================================
print("\n" + "=" * 60)
print("TRAINING COMPLETE")
print("=" * 60)
print(f"Dataset Size: {n_samples}")
print(f"Fraud Ratio: {fraud_ratio * 100}%")
print(f"Features: {len(feature_names)}")
print(f"Models saved to: models/")
print("=" * 60)
