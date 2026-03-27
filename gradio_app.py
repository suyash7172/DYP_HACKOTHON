import gradio as gr
import numpy as np
import joblib
import os
import json

# Define paths and load models
script_dir = os.path.dirname(os.path.abspath(__file__))
model_dir = os.path.join(script_dir, 'backend', 'ml_models')

print(f"Loading models from: {model_dir}")

try:
    isolation_forest = joblib.load(os.path.join(model_dir, 'isolation_forest.pkl'))
    logistic_model = joblib.load(os.path.join(model_dir, 'logistic_regression.pkl'))
    scaler = joblib.load(os.path.join(model_dir, 'scaler.pkl'))
    print("✅ ML Models loaded successfully")
except Exception as e:
    print(f"⚠️ Error loading models: {e}")
    print("Please ensure the models have been trained and exist in backend/ml_models/")
    isolation_forest, logistic_model, scaler = None, None, None

# Risk Mappings
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

DEVICE_RISK = {'API': 0.7, 'Web Browser': 0.3, 'Mobile App': 0.2, 
               'POS Terminal': 0.1, 'ATM': 0.4, 'Phone Banking': 0.3}

def analyze_transaction(amount, category, location, device, hour, day, is_international):
    if scaler is None:
        return "Models not loaded. Please train models first."
    
    # Feature extraction exactly like the backend
    try:
        amount = float(amount)
        hour = int(hour)
        day = int(day)
        is_intl = 1 if is_international else 0
        
        cat_risk = CATEGORY_RISK.get(category, 0.3)
        loc_risk = LOCATION_RISK.get(location, 0.5)
        
        # Time risk
        if 0 <= hour <= 5: time_risk = 0.8
        elif hour >= 22: time_risk = 0.6
        elif 6 <= hour <= 8: time_risk = 0.3
        else: time_risk = 0.1
        
        amount_risk = min(1.0, amount / 10000)
        dev_risk = DEVICE_RISK.get(device, 0.5)
        
        features = np.array([
            amount, hour, day, is_intl, cat_risk,
            loc_risk, time_risk, amount_risk, dev_risk,
            amount * time_risk, amount * loc_risk,
        ]).reshape(1, -1)
        
        # Scale
        scaled_features = scaler.transform(features)
        
        # Model predictions
        iso_score = isolation_forest.decision_function(scaled_features)[0]
        anomaly_prob = max(0, min(1, 0.5 - iso_score))
        log_prob = float(logistic_model.predict_proba(scaled_features)[0][1])
        
        # Rule prediction
        rule_score = 0.0
        if amount > 5000: rule_score += 0.3
        elif amount > 2000: rule_score += 0.15
        elif amount > 1000: rule_score += 0.08
        
        if 0 <= hour <= 4: rule_score += 0.25
        elif hour >= 22 or hour <= 5: rule_score += 0.15
        
        rule_score += cat_risk * 0.3
        rule_score += loc_risk * 0.25
        if is_international: rule_score += 0.1
        rule_prob = min(1.0, rule_score)
        
        # Weighted Ensemble
        final_score = (anomaly_prob * 0.35) + (log_prob * 0.35) + (rule_prob * 0.30)
        final_score = float(round(min(1.0, max(0.0, final_score)), 4))
        
        # Determine risk level
        if final_score >= 0.8: level = "CRITICAL (Auto-Block)"
        elif final_score >= 0.6: level = "HIGH (Flag for Review)"
        elif final_score >= 0.35: level = "MEDIUM (Monitor)"
        else: level = "LOW (Approve)"
        
        # Output details
        return f"""
        # Fraud Probability: {final_score * 100:.2f}%
        ### Risk Level: {level}
        
        **Detailed Model Breakdown:**
        - **Isolation Forest (Anomaly):** {anomaly_prob * 100:.1f}% risk
        - **Logistic Regression (Pattern):** {log_prob * 100:.1f}% risk
        - **Rule-based Engine (Heuristics):** {rule_prob * 100:.1f}% risk
        
        **Risk Factors:**
        - Amount Risk: {amount_risk * 100:.1f}%
        - Location Risk: {loc_risk * 100:.1f}%
        - Category Risk: {cat_risk * 100:.1f}%
        - Time of Day Risk: {time_risk * 100:.1f}%
        """
        
    except Exception as e:
        return f"Error analyzing transaction: {str(e)}"

# Create Gradio Interface
with gr.Blocks(theme=gr.themes.Base(primary_hue="indigo", neutral_hue="slate")) as demo:
    gr.Markdown(
        """
        # 🛡️ SecurePay AI: Fraud Detection ML Interface
        Test the underlying Machine Learning ensemble model live without making API calls.
        Configure the transaction parameters below and click Analyze.
        """
    )
    
    with gr.Row():
        with gr.Column():
            gr.Markdown("### Input Transaction Data")
            amount_in = gr.Number(label="Transaction Amount ($)", value=50)
            category_in = gr.Dropdown(choices=list(CATEGORY_RISK.keys()), value='Grocery', label="Merchant Category")
            location_in = gr.Dropdown(choices=list(LOCATION_RISK.keys()), value='New York, US', label="Transaction Location")
            device_in = gr.Dropdown(choices=list(DEVICE_RISK.keys()), value='Mobile App', label="Device Used")
            
            with gr.Row():
                hour_in = gr.Number(label="Hour of Day (0-23)", value=14, minimum=0, maximum=23)
                day_in = gr.Number(label="Day of Week (0-6)", value=2, minimum=0, maximum=6)
                
            is_intl_in = gr.Checkbox(label="Is International Transaction?", value=False)
            
            analyze_btn = gr.Button("🧠 Run AI Analysis", variant="primary")
            
        with gr.Column():
            gr.Markdown("### AI Analysis Results")
            result_out = gr.Markdown("Enter transaction details and click Analyze.")
            
    # Sample Test Cases
    gr.Examples(
        examples=[
            [45.50, "Grocery", "New York, US", "Mobile App", 14, 2, False],
            [12500, "Crypto Exchange", "Lagos, Nigeria", "API", 3, 5, True],
            [800, "Wire Transfer", "Dubai, UAE", "Web Browser", 23, 6, True]
        ],
        inputs=[amount_in, category_in, location_in, device_in, hour_in, day_in, is_intl_in],
        outputs=result_out,
        fn=analyze_transaction,
        cache_examples=False,
    )
    
    analyze_btn.click(
        fn=analyze_transaction,
        inputs=[amount_in, category_in, location_in, device_in, hour_in, day_in, is_intl_in],
        outputs=result_out
    )

if __name__ == "__main__":
    print("Starting Gradio Web Server at http://localhost:7860/")
    demo.launch(server_name="0.0.0.0", server_port=7860)
