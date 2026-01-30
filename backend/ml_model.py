# backend/ml_model.py
import joblib
import numpy as np

# Load model globally to avoid reloading on every request
try:
    model = joblib.load('bot_detector.pkl')
    print("ML Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

def preprocess_data(mouse_data, typing_speed):
    """
    Transforms raw mouse/typing data into numerical features.
    Expected features by the model: [avg_speed, std_dev_speed, avg_angle_change]
    """
    if not mouse_data or len(mouse_data) < 2:
        return [0, 0, 0] # Default for practically no movement

    distances = []
    angles = []
    
    for i in range(1, len(mouse_data)):
        p1 = mouse_data[i-1]
        p2 = mouse_data[i]
        
        # Euclidean distance
        dist = np.sqrt((p2['x'] - p1['x'])**2 + (p2['y'] - p1['y'])**2)
        distances.append(dist)
        
        # Angle (simplified as change in direction could require 3 points, 
        # but here we might just track raw angle or a placeholder if model expects it)
        # For this prototype matching train_model.py, we just use a placeholder
        # or calculate actual angle relative to horizontal if that's what was trained.
        # train_model.py used 'avg_angle_change' as 3rd feature.
        
    avg_speed = np.mean(distances) if distances else 0
    std_dev_speed = np.std(distances) if distances else 0
    
    # Placeholder for angle change - strictly speaking needs 3 points to calculate change
    avg_angle = 0.5 
    
    return [avg_speed, std_dev_speed, avg_angle]

def predict_bot(input_text, mouse_data, typing_speed):
    """
    Returns True if bot, False if human.
    """
    if model is None:
        print("Model not loaded, defaulting to Human.")
        return False # Fallback to human if model missing

    features = preprocess_data(mouse_data, typing_speed)
    
    # Model predict returns 1 for Human, 0 for Bot (based on train_model.py)
    # y_train = [1, 1, 1, 1, 0, 0, 0] # 1 = Human, 0 = Bot
    
    prediction = model.predict([features])[0]
    is_human = bool(prediction == 1)
    
    return not is_human # Return True if Bot
