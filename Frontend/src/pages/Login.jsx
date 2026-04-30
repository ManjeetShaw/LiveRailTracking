import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [error, setError]     = useState('');
  const { login, register }   = useAuth();
  const navigate              = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) await login(form.email, form.password);
      else         await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.logo}>🚂</span>
          <h1 style={styles.title}>EkkWomm</h1>
          <p style={styles.subtitle}>Indian Railways Live Tracker</p>
        </div>

        <div style={styles.tabs}>
          <button style={isLogin ? styles.activeTab : styles.tab} onClick={() => setIsLogin(true)}>Login</button>
          <button style={!isLogin ? styles.activeTab : styles.tab} onClick={() => setIsLogin(false)}>Register</button>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handle}>
          {!isLogin && (
            <input style={styles.input} placeholder="Full Name" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required />
          )}
          <input style={styles.input} placeholder="Email" type="email" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} required />
          <input style={styles.input} placeholder="Password" type="password" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })} required />
          <button style={styles.btn} type="submit">{isLogin ? 'Login' : 'Register'}</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: '#1a237e', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  card:      { background: '#fff', borderRadius: 12, padding: 40, width: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' },
  header:    { textAlign: 'center', marginBottom: 24 },
  logo:      { fontSize: 48 },
  title:     { margin: '8px 0 4px', color: '#1a237e', fontSize: 28, fontWeight: 'bold' },
  subtitle:  { color: '#666', fontSize: 14, margin: 0 },
  tabs:      { display: 'flex', marginBottom: 20, borderRadius: 8, overflow: 'hidden', border: '1px solid #1a237e' },
  tab:       { flex: 1, padding: '10px 0', background: '#fff', color: '#1a237e', border: 'none', cursor: 'pointer', fontSize: 14 },
  activeTab: { flex: 1, padding: '10px 0', background: '#1a237e', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14 },
  input:     { width: '100%', padding: '12px 16px', m