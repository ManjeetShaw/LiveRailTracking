import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchTrains } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const [query, setQuery]     = useState('');
  const [trains, setTrains]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const { user, logout }      = useAuth();
  const navigate              = useNavigate();

  const search = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await searchTrains(query);
      setTrains(res.data.data.trains);
    } catch (err) {
      setError('Failed to search trains. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <div style={styles.navbar}>
        <span style={styles.navLogo}>🚂 EkkWomm</span>
        <div style={styles.navRight}>
          <button style={styles.navBtn} onClick={() => navigate('/pnr')}>PNR Status</button>
          <button style={styles.navBtn} onClick={() => navigate('/community')}>💬 Community</button>
          <button style={styles.navBtn} onClick={() => navigate('/profile')}>👤 Profile</button>
          <span style={styles.navUser}>👤 {user?.name}</span>
          <button style={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </div>

      {/* Hero */}
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>Track Any Train Live</h1>
        <p style={styles.heroSub}>Real-time position, delay updates & PNR status</p>
        <form onSubmit={search} style={styles.searchBox}>
          <input style={styles.searchInput} placeholder="Search by train name or number..."
            value={query} onChange={e => setQuery(e.target.value)} />
          <button style={styles.searchBtn} type="submit">🔍 Search</button>
        </form>
      </div>

      {/* Results */}
      <div style={styles.results}>
        {loading && <p style={styles.msg}>Searching trains...</p>}
        {error   && <p style={styles.errMsg}>{error}</p>}
        {trains.map(train => (
          <div key={train._id} style={styles.card} onClick={() => navigate(`/train/${train.trainNumber}`)}>
            <div style={styles.cardLeft}>
              <span style={styles.trainNum}>{train.trainNumber}</span>
              <span style={styles.trainName}>{train.trainName}</span>
              <span style={styles.trainType}>{train.trainType}</span>
            </div>
            <div style={styles.cardRight}>
              <span style={styles.route}>{train.originStation} → {train.destinationStation}</span>
              <span style={styles.delay}>Avg Delay: {train.analytics?.avgDelayMinutes || 0} min</span>
              <span style={styles.ontime}>On Time: {train.analytics?.onTimePercentage || 0}%</span>
            </div>
            <span style={styles.arrow}>›</span>
          </div>
        ))}
        {!loading && trains.length === 0 && query && (
          <p style={styles.msg}>No trains found. Try a different search.</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container:   { minHeight: '100vh', background: '#f5f5f5' },
  navbar:      { background: '#1a237e', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navLogo:     { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  navRight:    { display: 'flex', alignItems: 'center', gap: 16 },
  navBtn:      { background: 'transparent', border: '1px solid #fff', color: '#fff', padding: '6px 14px', borderRadius: 6, cursor: 'pointer' },
  navUser:     { color: '#fff', fontSize: 14 },
  logoutBtn:   { background: '#ff6f00', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: 6, cursor: 'pointer' },
  hero:        { background: '#1a237e', padding: '48px 24px', textAlign: 'center' },
  heroTitle:   { color: '#fff', fontSize: 36, margin: '0 0 8px' },
  heroSub:     { color: '#90caf9', fontSize: 16, margin: '0 0 24px' },
  searchBox:   { display: 'flex', maxWidth: 600, margin: '0 auto', gap: 8 },
  searchInput: { flex: 1, padding: '14px 18px', borderRadius: 8, border: 'none', fontSize: 16 },
  searchBtn:   { padding: '14px 24px', background: '#ff6f00', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer', fontWeight: 'bold' },
  results:     { maxWidth: 800, margin: '32px auto', padding: '0 16px' },
  card:        { background: '#fff', borderRadius: 10, padding: '20px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #1a237e' },
  cardLeft:    { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 },
  trainNum:    { fontSize: 20, fontWeight: 'bold', color: '#1a237e' },
  trainName:   { fontSize: 14, color: '#333' },
  trainType:   { fontSize: 12, color: '#ff6f00', fontWeight: 'bold' },
  cardRight:   { display: 'flex', flexDirection: 'column', gap: 4, flex: 1 },
  route:       { fontSize: 14, color: '#333', fontWeight: 'bold' },
  delay:       { fontSize: 13, color: '#e53935' },
  ontime:      { fontSize: 13, color: '#43a047' },
  arrow:       { fontSize: 28, color: '#1a237e' },
  msg:         { textAlign: 'center', color: '#666', fontSize: 16 },
  errMsg:      { textAlign: 'center', color: 'red', fontSize: 16 },
};