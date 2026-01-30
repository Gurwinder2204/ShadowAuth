# backend/train_model.py
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier

# FEATURES: [avg_speed, std_dev_speed, avg_angle_change]
# Humans: Move with variable speed (high std_dev) and curvy paths
# Bots: Move with constant speed (low std_dev) and straight lines

X_train = [
    # Human Examples (Variable speed, jittery)
    [5.5,  2.1,  0.5], 
    [3.2,  1.5,  0.8],
    [8.0,  3.5,  0.4],
    [4.5,  1.9,  0.6],
    
    # Bot Examples (Constant speed, perfect lines)
    [20.0, 0.1,  0.0], # Fast, constant
    [30.0, 0.0,  0.0], # Super fast, no variance
    [5.0,  0.0,  0.0], # Slow but robotic (perfectly constant)
]

y_train = [1, 1, 1, 1, 0, 0, 0] # 1 = Human, 0 = Bot

print("Training Smarter Model...")
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

joblib.dump(model, 'bot_detector.pkl')
print("Success! Smarter 'bot_detector.pkl' saved.")