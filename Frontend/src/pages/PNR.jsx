import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkPNR } from '../services/api';

export default function PNR() {
  const [pnr, setPnr]         = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const navigate              = useNavigate();

  const check = async (e) => {
    e.preventDefault();
    if (pnr.length !== 10) { setError('PNR must be 10 digits'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await checkPNR(pnr);
      setResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'PNR not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>

      {/* Navbar */}
      <div style={styles.navbar}>
        <span style={styles.navLogo}>🚂 EkkWomm</span>
        <button style={styles.backBtn} onClick={() => navigate('/')}>← Back</button>
      </div>

      {/* Hero */}
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>PNR Status</h1>
        <p style={styles.heroSub}>Check your booking & seat confirmation</p>
        <form onSubmit={check} style={styles.searchBox}>
          <input
            style={styles.input}
            placeholder="Enter 10-digit PNR number"
            value={pnr}
            onChange={e => setPnr(e.target.value.replace(/\D/g, '').slice(0, 10))}
            maxLength={10}
          />
          <button style={styles.btn} type="submit">
            {loading ? 'Checking...' : 'Check PNR'}
          </button>
        </form>
        {error && <p style={styles.error}>{error}</p>}
      </div>

      {/* Result */}
      <div style={styles.body}>
        {result && (
          <div style={styles.card}>

            {/* Train Info */}
            <div style={styles.trainRow}>
              <div>
                <div style={styles.trainNum}>{result.trainNumber}</div>
                <div style={styles.trainName}>{result.trainName}</div>
              </div>
              <div style={{
                ...styles.statusBadge,
                background: result.status === 'Confirmed' ? '#e8f5e9' : '#fff3e0',
                color:      result.status === 'Confirmed' ? '#2e7d32' : '#e65100',
              }}>
                {result.status || 'WL'}
              </div>
            </div>

            <div style={styles.divider} />

            {/* Journey Info */}
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>From</span>
                <span style={styles.infoValue}>{result.from || '--'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>To</span>
                <span style={styles.infoValue}>{result.to || '--'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Date</span>
                <span style={styles.infoValue}>{result.journeyDate || '--'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Class</span>
                <span style={styles.infoValue}>{result.class || '--'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Coach</span>
                <span style={styles.infoValue}>{result.coach || '--'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Seat</span>
                <span style={styles.infoValue}>{result.seat || '--'}</span>
              </div>
            </div>

            <div style={styles.divider} />

            {/* Passengers */}
            {result.passengers?.length > 0 && (
              <div>
                <div style={styles.sectionTitle}>Passengers</div>
                {result.passengers.map((p, i) => (
                  <div key={i} style={styles.passengerRow}>
                    <span style={styles.passengerNum}>#{i + 1}</span>
                    <span style={styles.passengerName}>{p.name || `Passenger ${i + 1}`}</span>
                    <span style={{
                      ...styles.passengerStatus,
                      color: p.status === 'CNF' ? '#2e7d32' : '#e65100'
                    }}>
                      {p.status || 'WL'}
                    </span>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {!result && !loading && (
          <div style={styles.placeholder}>
            <div style={styles.placeholderIcon}>🎫</div>
            <p style={styles.placeholderText}>Enter your PNR number above to check status</p>
          </div>
        )}
      </div>

    </div>
  );
}

const styles = {
  container:       { minHeight: '100vh', background: '#f5f7fa', fontFamily: 'sans-serif' },
  navbar:          { background: '#1a237e', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navLogo:         { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  backBtn:         { background: 'transparent', border: '1px solid rgba(255,255,255,0.5)', color: '#fff', padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 14 },
  hero:            { background: '#1a237e', padding: '40px 24px', textAlign: 'center' },
  heroTitle:       { color: '#fff', fontSize: 32, margin: '0 0 8px', fontWeight: 'bold' },
  heroSub:         { color: '#90caf9', fontSize: 15, margin: '0 0 24px' },
  searchBox:       { display: 'flex', maxWidth: 500, margin: '0 auto', gap: 8 },
  input:           { flex: 1, padding: '14px 18px', borderRadius: 8, border: 'none', fontSize: 16, letterSpacing: 2 },
  btn:             { padding: '14px 24px', background: '#'}
}