import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function SetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      setMsg('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setMsg('Passwords do not match.');
      return;
    }
    setLoading(true);
    setMsg('');
    const res = await fetch('/set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      setMsg('Password set! You can now log in.');
    } else {
      setMsg(data.error || 'Failed to set password.');
    }
  };

  if (!token) return <div className="login-page"><div className="login-box"><h2>Invalid Link</h2><p>Missing or invalid token.</p></div></div>;

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="logo">🔒</div>
        <h1>Set Your Password</h1>
        <p>Choose a strong password to activate your account.</p>
        <form onSubmit={handleSubmit}>
          <label>New Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="full-width" minLength={8} required disabled={loading || success} />
          <label>Confirm Password</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="full-width" minLength={8} required disabled={loading || success} />
          {msg && <div style={{ color: success ? '#388e3c' : '#FE3E3D', margin: '1em 0' }}>{msg}</div>}
          <button className="btn btn-primary full-width" type="submit" disabled={loading || success}>{loading ? 'Setting...' : success ? 'Done' : 'Set Password'}</button>
        </form>
      </div>
    </div>
  );
}
