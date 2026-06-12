import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchTrains } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const [query, setQuery]     = useState('');
  const [trains, setTrains]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [searched, setSearched] = useState(false);
  const { user, logout }      = useAuth();
  const navigate              = useNavigate();

  const search = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await searchTrains(query);
      setTrains(res.data.data.trains);
    } catch (err) {
      setError('Failed to search trains. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDelayColor = (minutes) => {
    if (minutes === 0) return '#43a047';
    if (minutes <= 15) return '#fb8c00';
    return '#e53935';
  };

  const getDelayLabel = (minutes) => {
    if (minutes === 0) return 'On Time';
    if (minutes <= 15) return `~${minutes}m delay`;
    return `${minutes}m delay`;
  };

  const trainTypeColor = (type) => {
    const map = {
      'Rajdhani': '#6a1b9a',
      'Shatabdi': '#1565c0',
      'Express': '#2e7d32',
      'Mail': '#e65100',
      'Superfast': '#c62828',
    };
    return map[type] || '#37474f';
  };

  return (
    <div className="ek-home">

      {/* ── Navbar ── */}
      <nav className="ek-nav">
        <span className="ek-nav-logo" onClick={() => navigate('/')}>🚂 EkkWomm</span>
        <div className="ek-nav-links">
          <button className="ek-nav-btn" onClick={() => navigate('/pnr')}>📋 PNR</button>
          <button className="ek-nav-btn" onClick={() => navigate('/community')}>💬 Community</button>
          <button className="ek-nav-btn" onClick={() => navigate('/profile')}>👤 {user?.name?.split(' ')[0]}</button>
          <button className="ek-nav-logout" onClick={logout}>Logout</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="ek-hero">
        <div className="ek-hero-inner">
          <div className="ek-hero-badge">🇮🇳 Indian Railways Live</div>
          <h1 className="ek-hero-title">Where is my train?</h1>
          <p className="ek-hero-sub">Live position · Real-time delays · PNR status</p>

          <form onSubmit={search} className="ek-search-form">
            <div className="ek-search-wrap">
              <span className="ek-search-icon">🔍</span>
              <input
                className="ek-search-input"
                placeholder="Train name or number... e.g. 12301 or Rajdhani"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <button className="ek-search-btn" type="submit" disabled={loading}>
                {loading ? '...' : 'Search'}
              </button>
            </div>
          </form>

          {/* Quick links */}
          <div className="ek-quick-links">
            <span className="ek-quick-label">Popular:</span>
            {['12301', '12951', '22221', '12002'].map(num => (
              <button key={num} className="ek-quick-chip"
                onClick={() => { setQuery(num); }}>
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      <div className="ek-results">

        {/* Loading */}
        {loading && (
          <div className="ek-loading">
            <div className="ek-loading-train">🚂</div>
            <p>Searching trains...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="ek-error-box">
            ⚠️ {error}
          </div>
        )}

        {/* Train cards */}
        {!loading && trains.length > 0 && (
          <>
            <p className="ek-result-count">{trains.length} train{trains.length > 1 ? 's' : ''} found</p>
            {trains.map(train => (
              <div
                key={train._id}
                className="ek-card"
                onClick={() => navigate(`/train/${train.trainNumber}`)}
              >
                {/* Left — train number + name */}
                <div className="ek-card-left">
                  <span className="ek-card-num">{train.trainNumber}</span>
                  <span className="ek-card-name">{train.trainName}</span>
                  <span
                    className="ek-card-type"
                    style={{ background: trainTypeColor(train.trainType) + '18', color: trainTypeColor(train.trainType) }}
                  >
                    {train.trainType}
                  </span>
                </div>

                {/* Middle — route */}
                <div className="ek-card-mid">
                  <div className="ek-route">
                    <span className="ek-station">{train.originStation}</span>
                    <div className="ek-route-line">
                      <div className="ek-route-dot" />
                      <div className="ek-route-dash" />
                      <span className="ek-route-train">🚂</span>
                      <div className="ek-route-dash" />
                      <div className="ek-route-dot" />
                    </div>
                    <span className="ek-station">{train.destinationStation}</span>
                  </div>
                </div>

                {/* Right — delay stats */}
                <div className="ek-card-right">
                  <span
                    className="ek-delay-badge"
                    style={{ background: getDelayColor(train.analytics?.avgDelayMinutes || 0) + '18', color: getDelayColor(train.analytics?.avgDelayMinutes || 0) }}
                  >
                    {getDelayLabel(train.analytics?.avgDelayMinutes || 0)}
                  </span>
                  <span className="ek-ontime">✅ {train.analytics?.onTimePercentage || 0}% on time</span>
                </div>

                <span className="ek-arrow">›</span>
              </div>
            ))}
          </>
        )}

        {/* Empty state */}
        {!loading && searched && trains.length === 0 && !error && (
          <div className="ek-empty">
            <span>🔍</span>
            <p>No trains found for "<strong>{query}</strong>"</p>
            <small>Try a train number like 12301 or a name like Rajdhani</small>
          </div>
        )}

        {/* Default state — before search */}
        {!searched && !loading && (
          <div className="ek-default">
            <div className="ek-feature-grid">
              {[
                { icon: '📍', title: 'Live Position', desc: 'See exactly where your train is right now' },
                { icon: '⏱️', title: 'Delay Alerts', desc: 'Real-time delay updates at every station' },
                { icon: '📋', title: 'PNR Status', desc: 'Instant PNR confirmation & seat details' },
                { icon: '👨‍✈️', title: 'Pilot Profiles', desc: 'Know your loco pilot & their safety score' },
                { icon: '💬', title: 'Community', desc: 'Train sightings, stories & discussions' },
                { icon: '🏆', title: 'Earn XP', desc: 'Level up by contributing to the community' },
              ].map(f => (
                <div key={f.title} className="ek-feature-card">
                  <span className="ek-feature-icon">{f.icon}</span>
                  <h3 className="ek-feature-title">{f.title}</h3>
                  <p className="ek-feature-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .ek-home { min-height: 100vh; background: #f0f2f8; font-family: 'Inter', sans-serif; }

        /* Navbar */
        .ek-nav {
          background: #0d1b5e;
          padding: 0 24px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 12px rgba(0,0,0,0.3);
        }
        .ek-nav-logo {
          color: #fff;
          font-size: 20px;
          font-weight: 800;
          cursor: pointer;
          letter-spacing: -0.5px;
        }
        .ek-nav-links { display: flex; align-items: center; gap: 8px; }
        .ek-nav-btn {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          color: #fff;
          padding: 7px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          transition: background 0.2s;
        }
        .ek-nav-btn:hover { background: rgba(255,255,255,0.2); }
        .ek-nav-logout {
          background: #ff6f00;
          border: none;
          color: #fff;
          padding: 7px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
        }

        /* Hero */
        .ek-hero {
          background: linear-gradient(160deg, #0d1b5e 0%, #1a237e 60%, #283593 100%);
          padding: 56px 24px 48px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .ek-hero::before {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 60px;
          background: #f0f2f8;
          clip-path: ellipse(55% 100% at 50% 100%);
        }
        .ek-hero-inner { position: relative; z-index: 1; }
        .ek-hero-badge {
          display: inline-block;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          color: #90caf9;
          font-size: 12px;
          font-weight: 600;
          padding: 5px 14px;
          border-radius: 20px;
          margin-bottom: 16px;
          letter-spacing: 0.5px;
        }
        .ek-hero-title {
          color: #fff;
          font-size: 42px;
          font-weight: 800;
          letter-spacing: -1px;
          margin-bottom: 8px;
        }
        .ek-hero-sub {
          color: #90caf9;
          font-size: 15px;
          margin-bottom: 32px;
          font-weight: 400;
        }

        /* Search */
        .ek-search-form { max-width: 620px; margin: 0 auto 16px; }
        .ek-search-wrap {
          display: flex;
          align-items: center;
          background: #fff;
          border-radius: 14px;
          padding: 6px 6px 6px 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        }
        .ek-search-icon { font-size: 18px; margin-right: 10px; }
        .ek-search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 15px;
          font-family: 'Inter', sans-serif;
          color: #222;
          background: transparent;
        }
        .ek-search-input::placeholder { color: #aaa; }
        .ek-search-btn {
          background: linear-gradient(135deg, #ff6f00, #ff8f00);
          color: #fff;
          border: none;
          padding: 11px 24px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: opacity 0.2s;
        }
        .ek-search-btn:disabled { opacity: 0.6; }

        /* Quick links */
        .ek-quick-links {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .ek-quick-label { color: rgba(255,255,255,0.5); font-size: 12px; }
        .ek-quick-chip {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: background 0.2s;
        }
        .ek-quick-chip:hover { background: rgba(255,255,255,0.2); }

        /* Results container */
        .ek-results { max-width: 860px; margin: 32px auto; padding: 0 16px 48px; }

        .ek-result-count { font-size: 13px; color: #888; margin-bottom: 16px; font-weight: 500; }

        /* Train card */
        .ek-card {
          background: #fff;
          border-radius: 14px;
          padding: 20px 24px;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 20px;
          cursor: pointer;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          border-left: 4px solid #1a237e;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .ek-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        }
        .ek-card-left { display: flex; flex-direction: column; gap: 5px; min-width: 130px; }
        .ek-card-num { font-size: 22px; font-weight: 800; color: #1a237e; }
        .ek-card-name { font-size: 13px; color: #333; font-weight: 500; }
        .ek-card-type {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
          width: fit-content;
          letter-spacing: 0.3px;
        }

        /* Route */
        .ek-card-mid { flex: 1; }
        .ek-route { display: flex; align-items: center; gap: 8px; }
        .ek-station { font-size: 12px; font-weight: 700; color: #333; text-align: center; max-width: 80px; }
        .ek-route-line { display: flex; align-items: center; flex: 1; gap: 4px; }
        .ek-route-dot { width: 8px; height: 8px; border-radius: 50%; background: #1a237e; flex-shrink: 0; }
        .ek-route-dash { flex: 1; height: 2px; background: #e0e0e0; }
        .ek-route-train { font-size: 16px; }

        /* Right stats */
        .ek-card-right { display: flex; flex-direction: column; gap: 6px; align-items: flex-end; min-width: 110px; }
        .ek-delay-badge {
          font-size: 12px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
        }
        .ek-ontime { font-size: 12px; color: #666; }
        .ek-arrow { font-size: 26px; color: #ccc; font-weight: 300; }

        /* Loading */
        .ek-loading { text-align: center; padding: 48px; color: #888; }
        .ek-loading-train { font-size: 48px; animation: chug 0.6s infinite alternate; }
        @keyframes chug { from { transform: translateX(-4px); } to { transform: translateX(4px); } }

        /* Error */
        .ek-error-box {
          background: #fff3f3;
          border: 1px solid #ffcdd2;
          color: #c62828;
          padding: 14px 18px;
          border-radius: 10px;
          font-size: 14px;
        }

        /* Empty */
        .ek-empty {
          text-align: center;
          padding: 56px 24px;
          color: #888;
        }
        .ek-empty span { font-size: 48px; }
        .ek-empty p { font-size: 16px; margin: 12px 0 6px; color: #444; }
        .ek-empty small { font-size: 13px; }

        /* Feature grid */
        .ek-feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
          margin-top: 8px;
        }
        .ek-feature-card {
          background: #fff;
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
          transition: transform 0.15s;
        }
        .ek-feature-card:hover { transform: translateY(-2px); }
        .ek-feature-icon { font-size: 28px; display: block; margin-bottom: 12px; }
        .ek-feature-title { font-size: 15px; font-weight: 700; color: #1a237e; margin-bottom: 6px; }
        .ek-feature-desc { font-size: 13px; color: #777; line-height: 1.5; }

        @media (max-width: 600px) {
          .ek-hero-title { font-size: 28px; }
          .ek-card { flex-wrap: wrap; }
          .ek-card-mid { display: none; }
          .ek-nav-links { gap: 4px; }
          .ek-nav-btn { padding: 6px 10px; font-size: 12px; }
        }
      `}</style>
    </div>
  );
}