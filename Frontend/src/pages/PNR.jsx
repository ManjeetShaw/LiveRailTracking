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
      <div style={styles.navbar}>
        <span style={styles.navLogo}>🚂 EkkWomm</span>
        <button style={styles.backBtn} onClick={() => navigate('/')}>← Back</button>
      </div>

      <div style={styles.hero}>
        <h1 style={styles.title}>PNR Status</h1>
        <p style={styles.sub}>Check your ticket booking status</p>
        <form onSubmit={check} style={styles.searchBox}>
          <input style={styles.input} placeholder="Enter 10-digit PNR number"
            value={pnr} onChange={e => setPnr(e.target.value.replace(/\D/g, '').slice(0, 10))} />
          <button style={styles.btn} type="submit">Check Status</button>
        </form>
      </div>

      <div style={styles.content}>
        {loading && <p style={styles.msg}>Checking PNR...</p>}
        {error   && <p style={styles.errMsg}>{error}</p>}

        {result && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.pnrNum}>PNR: {pnr}</span>
              <span style={styles.status}>{result.status || 'Confirmed'}</span>
            </div>
            <div style={styles.row}>
              <div style={styles.col}>
                <span style={styles.label}>Train</span>
                <span style={styles.value}>{result.trainName} ({result.trainNumber})</span>
              </div>
              <div style={styles.col}>
                <span style={styles.label}>Date</span>
                <span style={styles.value}>{result.journeyDate}</span>
              </div>
            </div>
            <div style={styles.row}>
              <div style={styles.col}>
                <span style={styles.label}>From</span>
                <span style={styles.value}>{result.from}</span>
              </div>
              <div style={styles.col}>
                <span style={styles.label}>To</span>
                <span style={styles.value}>{result.to}</span>
              </div>
            </div>
            <div style={styles.row}>
              <div style={styles.col}>
                <span style={styles.label}>Class</span>
                <span style={styles.value}>{result.class}</span>
              </div>
              <div style={styles.col}>
                <span style={styles.label}>Passengers</span>
                <span style={styles.value}>{result.passengers?.length || 0}</span>
              </div>
            </div>
            {result.passengers?.map((p, i) => (
              <div key={i} style={styles.passenger}>
                <span>Passenger {i + 1}</span>
                <span style={{ color: p.status === 'CNF' ? '#43a047' : '#e53935' }}>{p.status} - {p.coach} {p.seat}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container:  { minHeight: '100vh', background: '#f5f5f5' },
  navbar:     { background: '#1a237e', padding: '12px 24px', display: 'flex', jus