# backend/app.py
import os
import logging
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
import ml_model  # Import our new separate ML handler

# Setup Flask-Login
app = Flask(__name__)
app.secret_key = 'super_secret_key_change_this_in_prod'
CORS(app, supports_credentials=True)

# Setup Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Ensure logs folder exists
if not os.path.exists('logs'):
    os.makedirs('logs')

# Setup Logging
logging.basicConfig(filename='logs/flask.log', level=logging.INFO, 
                    format='%(asctime)s %(levelname)s: %(message)s')

# Mock User Database
users = {'gurwinder': {'password': 'password123'}} # Example user

class User(UserMixin):
    def __init__(self, id):
        self.id = id

@login_manager.user_loader
def load_user(user_id):
    if user_id in users:
        return User(user_id)
    return None

# --- ROUTES ---

@app.route('/validate', methods=['POST'])
def validate():
    """
    Step 1: Passive Check (Pre-Login)
    Checks honeypot and basic behavior.
    """
    data = request.json
    username = data.get('username')
    honeypot_field = data.get('honeypot_field')
    honeypot_clicked = data.get('honeypot_clicked')

    # Security Check 1: Honeypot
    if honeypot_field or honeypot_clicked:
        logging.warning(f"Bot detected via honeypot. Target: {username}")
        return jsonify({"valid": False, "message": "Access Denied"}), 403

    if not username:
        return jsonify({"valid": False, "message": "Username is missing"}), 400

    # Basic human check passed
    logging.info(f"Human behavior check passed for: {username}")
    return jsonify({"valid": True, "message": "Human behavior detected"}), 200


@app.route('/login', methods=['POST'])
def login():
    """
    Step 2: Authentication
    """
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if username in users and users[username]['password'] == password:
        user = User(username)
        login_user(user)
        logging.info(f"User logged in: {username}")
        return jsonify({"message": "Login successful", "user": username}), 200
    
    return jsonify({"message": "Invalid credentials"}), 401


@app.route('/logout', methods=['GET'])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out"}), 200


@app.route('/profile', methods=['GET'])
@login_required
def profile():
    return jsonify({"user": current_user.id}), 200


@app.route('/predict', methods=['POST'])
@login_required
def predict():
    """
    Step 3: Advanced ML Analysis (Post-Login)
    """
    data = request.json
    mouse_data = data.get('mouse_data', [])
    typing_speed = data.get('typing_speed', [])
    
    # Run ML Prediction
    is_bot = ml_model.predict_bot("input_text_placeholder", mouse_data, typing_speed)
    
    if is_bot:
        logging.warning(f"ML Model detected BOT behavior for user: {current_user.id}")
        return jsonify({
            "is_human": False,
            "reason": "Abnormal behavior patterns detected by AI"
        }), 403
    
    logging.info(f"ML Model verified HUMAN behavior for user: {current_user.id}")
    return jsonify({
        "is_human": True,
        "reason": "Behavior Analysis Passed"
    }), 200


if __name__ == '__main__':
    # Ensure logs folder exists
    if not os.path.exists('logs'):
        os.makedirs('logs')
    app.run(port=5000, debug=True)