// frontend/src/App.jsx
import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldCheck, ShieldAlert, Activity, User } from 'lucide-react';
import './App.css';

function App() {
  const [status, setStatus] = useState("analyzing"); // analyzing | human | bot
  const [mouseData, setMouseData] = useState([]);
  const [chartData, setChartData] = useState([]); // For the visual graph
  const [logs, setLogs] = useState(["System initialized...", "Waiting for input..."]);
  
  const hasSentData = useRef(false);

  // Helper to add logs
  const addLog = (msg) => setLogs(prev => [msg, ...prev].slice(0, 5));

  const handleMouseMove = (e) => {
    const now = Date.now();
    
    // Calculate speed (simple distance formula)
    let speed = 0;
    if (mouseData.length > 0) {
      const last = mouseData[mouseData.length - 1];
      const dist = Math.sqrt(Math.pow(e.clientX - last.x, 2) + Math.pow(e.clientY - last.y, 2));
      speed = Math.round(dist);
    }

    // Update real data for backend
    if (mouseData.length < 50) {
      setMouseData(prev => [...prev, { x: e.clientX, y: e.clientY, time: now }]);
    }

    // Update visual graph (keep last 20 points)
    setChartData(prev => [...prev, { time: now, velocity: speed }].slice(-20));
  };

  const verifyUser = async () => {
    if (hasSentData.current) return;
    hasSentData.current = true;
    addLog("Analyzing patterns...");

    const honeypotValue = document.getElementById("hp-field")?.value || "";

    const payload = {
      mouse_data: mouseData,
      typing_speed: [], // We focus on mouse for this visual demo
      honeypot_field: honeypotValue 
    };

    try {
      const response = await fetch('http://127.0.0.1:5000/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      
      if (result.is_human) {
        setStatus("human");
        addLog("✅ User verified as Human");
      } else {
        setStatus("bot");
        addLog(`⚠️ BLOCK: ${result.reason}`);
      }
    } catch (error) {
      addLog("❌ Connection Failed");
    }
  };

  // Trigger verification automatically
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mouseData.length > 10) verifyUser();
    }, 2500);
    return () => clearTimeout(timer);
  }, [mouseData]);

  return (
    <div className="dashboard" onMouseMove={handleMouseMove}>
      
      {/* LEFT SIDE: Fake Login Portal */}
      <div className="card login-section">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ background: '#fff', width: 60, height: 60, borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="https://upload.wikimedia.org/wikipedia/en/c/cf/Aadhaar_Logo.svg" alt="Aadhaar" width="40" />
          </div>
          <h2 style={{ marginTop: '1rem' }}>Resident Portal</h2>
        </div>

        {/* The Hidden Trap */}
        <input id="hp-field" type="text" style={{ opacity: 0, position: 'absolute', width: 0 }} autoComplete="off" />

        <div className="input-group">
          <label>Aadhaar Number / UID</label>
          <input type="text" placeholder="Enter 12 digit UID" />
        </div>
        <div className="input-group">
          <label>Enter Security Code</label>
          <input type="password" placeholder="••••••" />
        </div>
        <button className="login-btn">
          {status === 'analyzing' ? 'Verifying...' : 'Login with OTP'}
        </button>
      </div>

      {/* RIGHT SIDE: The "Matrix" View */}
      <div className="card metrics-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>🛡️ Passive Security Monitor</h3>
          
          <div className={`status-badge ${status}`}>
            {status === 'analyzing' && <><Activity size={18} /> Analyzing Behavior</>}
            {status === 'human' && <><ShieldCheck size={18} /> Human Verified</>}
            {status === 'bot' && <><ShieldAlert size={18} /> Bot Detected</>}
          </div>
        </div>

        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Real-time analysis of mouse velocity, jitter, and path curvature.
        </p>

        {/* The Live Graph */}
        <div style={{ height: 200, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="time" hide />
              <YAxis hide domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ background: '#1e293b', border: 'none' }} 
                itemStyle={{ color: '#22d3ee' }}
              />
              <Line 
                type="monotone" 
                dataKey="velocity" 
                stroke="#22d3ee" 
                strokeWidth={3} 
                dot={false} 
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Live Logs */}
        <div className="live-feed">
          {logs.map((log, i) => (
            <div key={i} style={{ marginBottom: 4 }}>{`> ${log}`}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;