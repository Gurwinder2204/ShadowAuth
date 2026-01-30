# ShadowAuth: Passive Behavioral Biometrics Authentication

ShadowAuth is a security prototype that detects automated/bot interactions passively by collecting environmental and behavioral signals from the frontend (React) and analyzing them on the backend (Flask + ML).

## Features

- **Passive Detection**: Analyzes mouse movements, focus events, typing speed, and clipboard actions.
- **Honeypots**: Hidden form fields to trap bots that auto-fill forms.
- **Machine Learning**: Uses a Random Forest classifier to distinguish between human and robotic movement patterns.
- **Secure Login**: Flask-Login integration for session management.
- **Visual Dashboard**: Real-time graph of user interaction velocity and threat status.

## Architecture

1. **Frontend (React)**: Captures user signals (`mousemove`, `focus`, `paste`) and sends them to the backend.
2. **Backend (Flask)**:
    - `POST /validate`: Passive check (Honeypot + Basic Rules).
    - `POST /login`: Authenticates user.
    - `POST /predict`: Advanced ML analysis of behavioral data.
3. **ML Model**: Scikit-learn model (`bot_detector.pkl`) trained on human vs. bot cursor trajectories.

## Setup & Running

### Prerequisites

- Python 3.8+
- Node.js & npm

### Backend Setup

1. Navigate to `backend/`:

    ```bash
    cd backend
    ```

2. Create and activate virtual environment:

    ```bash
    python -m venv venv
    source venv/bin/activate  # Windows: venv\Scripts\activate
    ```

3. Install dependencies:

    ```bash
    pip install -r requirements.txt
    pip install Flask-Login flask-cors scikit-learn joblib
    ```

4. Train the model (if needed):

    ```bash
    python train_model.py
    ```

5. Run the server:

    ```bash
    python app.py
    ```

    Server runs on `http://127.0.0.1:5000`.

### Frontend Setup

1. Navigate to `frontend/`:

    ```bash
    cd frontend
    ```

2. Install dependencies:

    ```bash
    npm install
    npm install lucide-react recharts
    ```

3. Start the app:

    ```bash
    npm run dev
    ```

    App runs on `http://localhost:5173`.

## Testing Bot Detection

You can simulate a bot attack using the provided script:

```bash
python backend/bot.py
```

This script will:

1. Attempt to trigger the honeypot (Should get 403).
2. Attempt a robotic login flow (Should get flagged by ML).

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/validate` | Initial passive check (Honeypot, Username). |
| `POST` | `/login` | Authenticates user (username/password). |
| `POST` | `/predict` | Deep ML analysis (requires login). |
| `GET` | `/profile` | Returns current user info. |
