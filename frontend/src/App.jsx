// frontend/src/App.jsx
import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldCheck, ShieldAlert, Activity, User, Lock, Terminal } from 'lucide-react';
import './App.css';

function App() {
  const [status, setStatus] = useState("idle"); // idle | analyzing | human | bot | logged-in
  const [mouseData, setMouseData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [logs, setLogs] = useState(["System initialized...", "Waiting for user interactions..."]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // New behavioral signals
  const [focusEvents, setFocusEvents] = useState(0);
  const [clipboardActions, setClipboardActions] = useState(0);
  // Simple check: if username filled too fast from page load or very short inter-key latency (not implemented fully here but placeholder)
  const [isAutoFill, setIsAutoFill] = useState(false);

  const hasSentData = useRef(false);

  const addLog = (msg) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 8));

  // --- 1. Event Listeners ---
  const handleMouseMove = (e) => {
    const now = Date.now();

    // Calculate speed for graph
    let speed = 0;
    if (mouseData.length > 0) {
      const last = mouseData[mouseData.length - 1];
      const dist = Math.sqrt(Math.pow(e.clientX - last.x, 2) + Math.pow(e.clientY - last.y, 2));
      speed = Math.round(dist);
    }

    // Collect data (Sample every 3rd event or so to reduce noise/load in real app, here we just cap at 100)
    if (mouseData.length < 100) {
      setMouseData(prev => [...prev, { x: e.clientX, y: e.clientY, time: now }]);
    }

    // Graph update
    setChartData(prev => [...prev, { time: now, velocity: speed }].slice(-30));
  };

  const handleFocus = () => {
    setFocusEvents(prev => prev + 1);
    addLog("Focus event detected");
  };

  const handlePaste = () => {
    setClipboardActions(prev => prev + 1);
    addLog("📋 Paste event detected (Suspicious if high frequency)");
  };

  // --- 2. Validation & Login Flow ---

  const handleLogin = async () => {
    if (!username || !password) {
      addLog("❌ Username/Password missing");
      return;
    }

    setStatus("analyzing");
    addLog("Validating human behavior (Passive Check)...");

    // 1. Passive Validation (POST /validate)
    const honeypotValue = document.getElementById("hp-field")?.value || "";

    const validatePayload = {
      username: username,
      mouse_movements: mouseData.length,
      focus_events: focusEvents,
      clipboard_actions: clipboardActions,
      form_autofill_patterns: isAutoFill,
      honeypot_field: honeypotValue,
      honeypot_clicked: false // We could track clicks on invisible button too
    };

    try {
      const valResponse = await fetch('http://127.0.0.1:5000/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatePayload),
      });

      if (!valResponse.ok) {
        const err = await valResponse.json();
        setStatus("bot");
        addLog(`⚠️ BLOCKED: ${err.message}`);
        return;
      }

      addLog("✅ Human Pass. Attempting Login...");

      // 2. Actual Login (POST /login)
      const loginResponse = await fetch('http://127.0.0.1:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const loginResult = await loginResponse.json();

      if (loginResponse.ok) {
        setStatus("logged-in");
        addLog(`🎉 Login Success! Welcome ${loginResult.user}`);
        // Trigger Deep Scan
        runDeepScan();
      } else {
        setStatus("idle");
        addLog(`❌ Login Failed: ${loginResult.message}`);
      }

    } catch (error) {
      addLog("❌ Network Error");
      console.error(error);
    }
  };

  // --- 3. Deep Analysis (POST /predict) ---
  const runDeepScan = async () => {
    addLog("🤖 Running Deep ML Analysis...");
    try {
      const response = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mouse_data: mouseData,
          typing_speed: [] // TODO: Add typing speed array
        }),
      });
      const result = await response.json();

      if (result.is_human) {
        addLog("✅ AI Confirmation: Human Behavior Verified");
      } else {
        setStatus("bot");
        addLog("⚠️ AI DETECTED BOT BEHAVIOR - Session flag");
      }
    } catch (e) {
      addLog("Model connection failed");
    }
  };


  return (
    <div className="dashboard" onMouseMove={handleMouseMove}>

      {/* LEFT: Login Portal */}
      <div className="card login-section">
        <div className="logo-area">
          <div className="logo-circle">
            <Lock size={24} color="#2563eb" />
          </div>
          <h2>Secure Portal</h2>
        </div>

        {/* HONEYPOT */}
        <input
          id="hp-field"
          type="text"
          style={{ opacity: 0, position: 'absolute', width: 0, height: 0, zIndex: -1 }}
          autoComplete="off"
          tabIndex="-1"
        />

        <div className="input-group">
          <label>Username</label>
          <input
            type="text"
            placeholder="e.g. gurwinder"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onFocus={handleFocus}
            onPaste={handlePaste}
          />
        </div>
        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={handleFocus}
          />
        </div>

        <button className="login-btn" onClick={handleLogin}>
          {status === 'analyzing' ? 'Verifying...' : 'Secure Login'}
        </button>

        {status === 'logged-in' && (
          <div className="success-banner">
            Session Active
          </div>
        )}
      </div>

      {/* RIGHT: Security Monitor Matrix */}
      <div className="card metrics-section">
        <div className="metrics-header">
          <h3><Terminal size={18} style={{ marginRight: 8 }} /> Security Monitor</h3>

          <div className={`status-badge ${status}`}>
            {status === 'idle' && <>Waiting...</>}
            {status === 'analyzing' && <><Activity size={16} /> Analyzing</>}
            {status === 'logged-in' && <><ShieldCheck size={16} /> Verified</>}
            {status === 'bot' && <><ShieldAlert size={16} /> Threat Blocked</>}
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-item">
            <span>Mouse Events</span>
            <strong>{mouseData.length}</strong>
          </div>
          <div className="stat-item">
            <span>Focus Events</span>
            <strong>{focusEvents}</strong>
          </div>
          <div className="stat-item">
            <span>Paste Actions</span>
            <strong>{clipboardActions}</strong>
          </div>
        </div>

        {/* Graph */}
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="time" hide />
              <YAxis hide domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
              <Line
                type="monotone"
                dataKey="velocity"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Logs */}
        <div className="live-feed">
          {logs.map((log, i) => (
            <div key={i} className="log-entry">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;