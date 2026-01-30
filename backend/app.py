# backend/app.py
import os
import numpy as np
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load Model
try:
    model = joblib.load('bot_detector.pkl')
    print("ML Model loaded.")
except:
    model = None

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.json
    
    # 1. Honeypot Check
    if data.get('honeypot_field'):
        return jsonify({"is_human": False, "reason": "Honeypot Triggered"}), 200

    mouse_data = data.get('mouse_data', [])

    # 2. Minimal Interaction Check
    if len(mouse_data) < 5:
        return jsonify({"is_human": False, "reason": "Not enough data"}), 200

    # 3. Calculate Smarter Features (Speed & Variance)
    try:
        distances = []
        for i in range(1, len(mouse_data)):
            p1 = mouse_data[i-1]
            p2 = mouse_data[i]
            # Euclidean distance
            dist = np.sqrt((p2['x'] - p1['x'])**2 + (p2['y'] - p1['y'])**2)
            distances.append(dist)
        
        if not distances:
            return jsonify({"is_human": False, "reason": "No movement"}), 200

        avg_speed = np.mean(distances)
        std_dev_speed = np.std(distances) # Jitter/Variance
        
        # Simple Angle/Curvature metric (Placeholder for now)
        avg_angle = 0.5 

        features = [[avg_speed, std_dev_speed, avg_angle]]
        
        # Predict
        prediction = model.predict(features)[0]
        is_human = bool(prediction == 1)
        
        # DEBUG: Print what the model saw
        print(f"Stats -> Speed: {avg_speed:.2f}, Var: {std_dev_speed:.2f} -> Prediction: {is_human}")

        return jsonify({
            "is_human": is_human, 
            "reason": "Behavior Analysis" if is_human else "Robotic Movement Detected"
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"is_human": True, "reason": "Error (Default Allow)"}), 200

if __name__ == '__main__':
    app.run(port=5000, debug=True)