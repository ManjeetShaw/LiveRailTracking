import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register }   = useAuth();
  const navigate              = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) await login(form.email, form.password);
      else         await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ek-root">
      {/* Animated track lines in background */}
      <div className="ek-track ek-track-1" />
      <div className="ek-track ek-track-2" />
      <div className="ek-track ek-track-3" />

      <div className="ek-card">
        {/* Header */}
        <div className="ek-header">
          <div className="ek-logo-wrap">
            <span className="ek-logo">🚂</span>
          </div>
          <h1 className="ek-title">EkkWomm</h1>
          <p className="ek-subtitle">Track every train. Every journey. Live.</p>
        </div>

        {/* Tabs */}
        <div className="ek-tabs">
          <button
            className={`ek-tab ${isLogin ? 'ek-tab-active' : ''}`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Login
          </button>
          <button
            className={`ek-tab ${!isLogin ? 'ek-tab-active' : ''}`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Register
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="ek-error">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handle} className="ek-form">
          {!isLogin && (
            <div className="ek-field">
              <label className="ek-label">Full Name</label>
              <input
                className="ek-input"
                placeholder="Manjeet Shaw"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          )}
          <div className="ek-field">
            <label className="ek-label">Email</label>
            <input
              className="ek-input"
              placeholder="you@example.com"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="ek-field">
            <label className="ek-label">Password</label>
            <input
              className="ek-input"
              placeholder="••••••••"
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {isLogin && (
            <div className="ek-forgot">
              <a href="/forgot-password">Forgot password?</a>
            </div>
          )}

          <button className="ek-btn" type="submit" disabled={loading}>
            {loading ? (
              <span className="ek-spinner">⏳ Please wait...</span>
            ) : (
              isLogin ? '🚀 Login' : '✅ Create Account'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="ek-divider">
          <span>or</span>
        </div>

        {/* Google OAuth */}
        <button className="ek-google-btn">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={18} />
          Continue with Google
        </button>

        {/* Footer */}
        <p className="ek-footer">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span className="ek-link" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Register' : 'Login'}
          </span>
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .ek-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #0d1b5e 0%, #1a237e 50%, #0a1245 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Decorative background track lines */
        .ek-track {
          position: absolute;
          height: 2px;
          width: 100%;
          background: repeating-linear-gradient(
            90deg,
            rgba(255,255,255,0.06) 0px,
            rgba(255,255,255,0.06) 30px,
            transparent 30px,
            transparent 50px
          );
        }
        .ek-track-1 { top: 25%; transform: rotate(-8deg) scaleX(1.5); }
        .ek-track-2 { top: 50%; transform: rotate(-8deg) scaleX(1.5); }
        .ek-track-3 { top: 75%; transform: rotate(-8deg) scaleX(1.5); }

        .ek-card {
          background: #ffffff;
          border-radius: 20px;
          padding: 40px 36px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.4);
          position: relative;
          z-index: 1;
        }

        .ek-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .ek-logo-wrap {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #1a237e, #283593);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          box-shadow: 0 4px 16px rgba(26,35,126,0.3);
        }

        .ek-logo { font-size: 32px; }

        .ek-title {
          font-size: 26px;
          font-weight: 700;
          color: #1a237e;
          letter-spacing: -0.5px;
        }

        .ek-subtitle {
          font-size: 13px;
          color: #888;
          margin-top: 4px;
          font-weight: 400;
        }

        .ek-tabs {
          display: flex;
          background: #f0f2ff;
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 24px;
        }

        .ek-tab {
          flex: 1;
          padding: 9px 0;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #888;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif;
        }

        .ek-tab-active {
          background: #1a237e;
          color: #fff;
          box-shadow: 0 2px 8px rgba(26,35,126,0.3);
        }

        .ek-error {
          background: #fff3f3;
          border: 1px solid #ffcdd2;
          color: #c62828;
          font-size: 13px;
          padding: 10px 14px;
          border-radius: 8px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ek-form { display: flex; flex-direction: column; gap: 4px; }

        .ek-field { display: flex; flex-direction: column; margin-bottom: 12px; }

        .ek-label {
          font-size: 12px;
          font-weight: 600;
          color: #444;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ek-input {
          padding: 11px 14px;
          border: 1.5px solid #e0e0e0;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          color: #222;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
          background: #fafafa;
        }

        .ek-input:focus {
          border-color: #1a237e;
          box-shadow: 0 0 0 3px rgba(26,35,126,0.1);
          background: #fff;
        }

        .ek-input::placeholder { color: #bbb; }

        .ek-forgot {
          text-align: right;
          margin-bottom: 8px;
        }

        .ek-forgot a {
          font-size: 12px;
          color: #1a237e;
          text-decoration: none;
          font-weight: 500;
        }

        .ek-forgot a:hover { text-decoration: underline; }

        .ek-btn {
          width: 100%;
          padding: 13px 0;
          background: linear-gradient(135deg, #ff6f00, #ff8f00);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(255,111,0,0.35);
          margin-top: 4px;
        }

        .ek-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(255,111,0,0.45);
        }

        .ek-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .ek-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0;
          color: #ccc;
          font-size: 12px;
        }

        .ek-divider::before,
        .ek-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #eee;
        }

        .ek-google-btn {
          width: 100%;
          padding: 11px 0;
          background: #fff;
          border: 1.5px solid #e0e0e0;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          color: #444;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s;
        }

        .ek-google-btn:hover {
          border-color: #1a237e;
          background: #f8f9ff;
        }

        .ek-footer {
          text-align: center;
          font-size: 13px;
          color: #888;
          margin-top: 20px;
        }

        .ek-link {
          color: #1a237e;
          font-weight: 600;
          cursor: pointer;
        }

        .ek-link:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}