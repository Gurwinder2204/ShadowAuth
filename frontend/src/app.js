// frontend/src/App.js
import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [status, setStatus] = useState("Analyzing...");
  const [mouseData, setMouseData] = useState([]);
  const [typingData, setTypingData] = useState([]);
  
  // Ref to track if we already sent data to avoid spamming the API
  const hasSentData = useRef(false);

  // 1. Capture Mouse Movements
  const handleMouseMove = (e) => {
    // We only keep the last 50 points to save memory
    if (mouseData.length < 50) {
      setMouseData((prev) => [
        ...prev,
        { x: e.clientX, y: e.clientY, time: Date.now() },
      ]);
    }
  };

  // 2. Capture Typing Speed (Keydown intervals)
  const handleKeyDown = () => {
    setTypingData((prev) => [...prev, Date.now()]);
  };

  // 3. Send Data to Backend
  const verifyUser = async () => {
    if (hasSentData.current) return;
    hasSentData.current = true;

    // Calculate typing intervals
    const typingIntervals = typingData.slice(1).map((time, i) => time - typingData[i]);

    const payload = {
      mouse_data: mouseData,
      typing_speed: typingIntervals,
      // The Honeypot: A real human won't fill this because it's hidden
      honeypot_field: document.getElementById("hp-field")?.value || "" 
    };

    try {
      const response = await fetch('http://localhost:5000/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      setStatus(result.is_human ? "✅ Human Verified" : "🤖 Bot Detected");
    } catch (error) {
      console.error("API Error", error);
      setStatus("Error connecting to server");
    }
  };

  // Trigger verification after 2 seconds of activity
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mouseData.length > 5) verifyUser();
    }, 2000);
    return () => clearTimeout(timer);
  }, [mouseData]);

  return (
    <div 
      onMouseMove={handleMouseMove} 
      onKeyDown={handleKeyDown} 
      tabIndex={0} 
      style={{ height: "100vh", padding: "50px", textAlign: "center" }}
    >
      <h1>UIDAI Passive Auth Prototype</h1>
      
      {/* 4. The Hidden Honeypot Field */}
      <input 
        id="hp-field" 
        type="text" 
        style={{ opacity: 0, position: 'absolute', top: 0, left: 0, height: 0, width: 0 }} 
        autoComplete="off"
      />

      <div style={{ marginTop: "50px", fontSize: "24px", fontWeight: "bold" }}>
        Status: {status}
      </div>

      <p>Move your mouse and type anywhere to verify...</p>
      <div style={{marginTop: "20px", color: "#888"}}>
        Mouse Points Captured: {mouseData.length}
      </div>
    </div>
  );
}

export default App;