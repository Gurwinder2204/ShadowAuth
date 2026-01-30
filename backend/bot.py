import requests
import time
import random

BASE_URL = "http://127.0.0.1:5000"

def simulate_bot_attack():
    print(f"[*] Starting Bot Attack Simulation on {BASE_URL}...")

    # 1. Honeypot Trigger Attack
    print("\n[1] Attempting Honeypot Fill Attack...")
    payload = {
        "username": "bot_user_99",
        "mouse_movements": 5, # Low movement
        "focus_events": 0,
        "clipboard_actions": 0,
        "form_autofill_patterns": True,
        "honeypot_field": "I am a bot" # TRIGGER
    }
    
    try:
        res = requests.post(f"{BASE_URL}/validate", json=payload)
        print(f"Response: {res.status_code} - {res.text}")
        if res.status_code == 403:
            print("✅ SUCCESS: Honeypot blocked the bot.")
        else:
            print("❌ FAILURE: Honeypot did not block the bot.")
    except Exception as e:
        print(f"Error: {e}")

    # 2. Brute Force / Robotic Behavior (Valid Honeypot, but suspicious behavior)
    print("\n[2] Attempting Robotic Behavior Login...")
    payload_clean = {
        "username": "gurwinder",
        "mouse_movements": 0, # inhuman
        "focus_events": 0,
        "clipboard_actions": 0,
        "form_autofill_patterns": True,
        "honeypot_field": "" # Clean
    }
    
    # Validate first
    res = requests.post(f"{BASE_URL}/validate", json=payload_clean)
    print(f"Validate Response: {res.status_code} - {res.text}")
    
    # Try Login
    login_payload = {"username": "gurwinder", "password": "password123"}
    session = requests.Session()
    res_login = session.post(f"{BASE_URL}/login", json=login_payload)
    print(f"Login Response: {res_login.status_code} - {res_login.text}")

    if res_login.status_code == 200:
        print("Logged in. Now trying /predict with robotic data...")
        # Predict
        robot_data = {
            "mouse_data": [{"x": i*10, "y": i*10} for i in range(50)], # Perfect straight line
            "typing_speed": [50] * 20 # Perfect constant speed
        }
        res_predict = session.post(f"{BASE_URL}/predict", json=robot_data)
        print(f"Predict Response: {res_predict.status_code} - {res_predict.text}")
        
        if "False" in res_predict.text or "bot" in res_predict.text.lower():
             print("✅ SUCCESS: ML Model detected robotic movement.")
        else:
             print("⚠️ NOTE: Model might have accepted it (needs better model/training).")

if __name__ == "__main__":
    simulate_bot_attack()
