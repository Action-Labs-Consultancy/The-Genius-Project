// src/LoginPage.js
import React, { useState } from 'react';
import './styles.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Login successful! ✅');
        // TODO: Navigate to dashboard or set login state
      } else {
        setMessage(data.error || 'Login failed');
      }
    } catch (err) {
      setMessage('Something went wrong. Try again.');
    }
  };

  return (
    <div className="login-layout">
      {/* Left panel with marketing copy */}
      <div className="login-left">
        <h1>Social Media Hub</h1>
        <p>Manage all your social media platforms in one powerful dashboard.</p>
        <ul>
          <li>Multi-platform integration</li>
          <li>AI-powered responses</li>
          <li>Real-time analytics</li>
          <li>Team collaboration</li>
        </ul>
      </div>

      {/* Right panel with form */}
      <div className="login-right">
        <div>
          <h2 className="login-form-title">Welcome Back</h2>
          <p className="login-form-subtext">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleLogin}>
          <input
            className="login-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <button className="login-button" type="submit">
            Sign In
          </button>
        </form>

        {message && (
          <p
            className={`login-message ${
              message.includes('successful') ? 'success' : 'error'
            }`}
          >
            {message}
          </p>
        )}

        <div className="login-footer">
          Need access to this platform?
          <button className="login-footer-button">Request Access</button>
        </div>
      </div>
    </div>
);
}
