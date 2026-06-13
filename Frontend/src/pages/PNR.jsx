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
      setError(err.response?.data?.message || 'PNR not found. Please check the number and try again.');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status) => {
    if (!status) return { bg: '#f5f5f5', color: '#999' };
    const s = status.toUpperCase();
    if (s === 'CNF' || s === 'CONFIRMED') return { bg: '#e8f5e9', color: '#2e7d32' };
    if (s.startsWith('WL'))  return { bg: '#fff3e0', color: '#e65100' };
    if (s.startsWith('RAC')) return { bg: '#e3f2fd', color: '#1565c0' };
    return { bg: '#f5f5f5', color: '#555' };
  };

  const digits = pnr.length;

  return (
    <div className="pnr-page">

      {/* Navbar */}
      <nav className="pnr-nav">
        <span className="pnr-nav-logo" onClick={() => navigate('/')}>🚂 EkkWomm</span>
        <button className="pnr-nav-back" onClick={() => navigate('/')}>← Back</button>
      </nav>

      {/* Hero */}
      <div className="pnr-hero">
        <div className="pnr-hero-inner">
          <div className="pnr-hero-icon">🎫</div>
          <h1 className="pnr-hero-title">PNR Status</h1>
          <p className="pnr-hero-sub">Check your booking & seat confirmation instantly</p>

          <form onSubmit={check} className="pnr-form">
            <div className="pnr-input-wrap">
              <span className="pnr-input-icon">🎫</span>
              <input
                className="pnr-input"
                placeholder="Enter 10-digit PNR number"
                value={pnr}
                onChange={e => setPnr(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
              />
              {/* Digit counter */}
              <span className="pnr-digit-count" style={{ color: digits === 10 ? '#2e7d32' : '#aaa' }}>
                {digits}/10
              </span>
            </div>

            {/* Progress dots */}
            <div className="pnr-dots">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="pnr-dot"
                  style={{ background: i < digits ? '#ff6f00' : 'rgba(255,255,255,0.2)' }}
                />
              ))}
            </div>

            {error && (
              <div className="pnr-error">⚠️ {error}</div>
            )}

            <button className="pnr-btn" type="submit" disabled={loading || digits !== 10}>
              {loading ? '⏳ Checking...' : '🔍 Check PNR Status'}
            </button>
          </form>
        </div>
      </div>

      {/* Body */}
      <div className="pnr-body">

        {/* Loading */}
        {loading && (
          <div className="pnr-loading">
            <div className="pnr-loading-icon">🎫</div>
            <p>Fetching PNR details...</p>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="pnr-card">

            {/* Train header */}
            <div className="pnr-train-row">
              <div className="pnr-train-info">
                <span className="pnr-train-num">{result.trainNumber}</span>
                <span className="pnr-train-name">{result.trainName}</span>
              </div>
              <span
                className="pnr-status-badge"
                style={{
                  background: statusColor(result.status).bg,
                  color: statusColor(result.status).color
                }}
              >
                {result.status || 'WL'}
              </span>
            </div>

            <div className="pnr-divider" />

            {/* Journey grid */}
            <div className="pnr-journey">
              <div className="pnr-journey-route">
                <div className="pnr-station-block">
                  <span className="pnr-station-label">FROM</span>
                  <span className="pnr-station-name">{result.from || '--'}</span>
                  <span className="pnr-station-time">{result.departureTime || ''}</span>
                </div>
                <div className="pnr-route-line">
                  <div className="pnr-route-dot" />
                  <div className="pnr-route-dash" />
                  <span className="pnr-route-icon">🚂</span>
                  <div className="pnr-route-dash" />
                  <div className="pnr-route-dot" />
                </div>
                <div className="pnr-station-block pnr-station-right">
                  <span className="pnr-station-label">TO</span>
                  <span className="pnr-station-name">{result.to || '--'}</span>
                  <span className="pnr-station-time">{result.arrivalTime || ''}</span>
                </div>
              </div>
            </div>

            <div className="pnr-divider" />

            {/* Info grid */}
            <div className="pnr-info-grid">
              {[
                { label: '📅 Date',    value: result.journeyDate || '--' },
                { label: '🪑 Class',   value: result.class || '--' },
                { label: '🚃 Coach',   value: result.coach || '--' },
                { label: '💺 Seat',    value: result.seat  || '--' },
                { label: '🎫 PNR',     value: pnr },
                { label: '📊 Quota',   value: result.quota || 'GN' },
              ].map(item => (
                <div key={item.label} className="pnr-info-item">
                  <span className="pnr-info-label">{item.label}</span>
                  <span className="pnr-info-value">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Passengers */}
            {result.passengers?.length > 0 && (
              <>
                <div className="pnr-divider" />
                <div className="pnr-section-title">👥 Passengers</div>
                <div className="pnr-passengers">
                  {result.passengers.map((p, i) => (
                    <div key={i} className="pnr-passenger-row">
                      <div className="pnr-passenger-avatar">{i + 1}</div>
                      <div className="pnr-passenger-info">
                        <span className="pnr-passenger-name">{p.name || `Passenger ${i + 1}`}</span>
                        {p.age && <span className="pnr-passenger-age">Age {p.age}</span>}
                      </div>
                      <span
                        className="pnr-passenger-status"
                        style={{
                          background: statusColor(p.status).bg,
                          color: statusColor(p.status).color
                        }}
                      >
                        {p.status || 'WL'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Track train button */}
            {result.trainNumber && (
              <>
                <div className="pnr-divider" />
                <button
                  className="pnr-track-btn"
                  onClick={() => navigate(`/train/${result.trainNumber}`)}
                >
                  📍 Track This Train Live
                </button>
              </>
            )}

          </div>
        )}

        {/* Placeholder */}
        {!result && !loading && (
          <div className="pnr-placeholder">
            <span className="pnr-placeholder-icon">🎫</span>
            <p className="pnr-placeholder-title">Enter your PNR above</p>
            <p className="pnr-placeholder-sub">Your 10-digit PNR number can be found on your booking confirmation or IRCTC ticket</p>

            <div className="pnr-tip-grid">
              {[
                { icon: '✅', label: 'CNF', desc: 'Confirmed seat' },
                { icon: '⏳', label: 'WL',  desc: 'Waitlisted' },
                { icon: '🔄', label: 'RAC', desc: 'Reservation Against Cancellation' },
              ].map(t => (
                <div key={t.label} className="pnr-tip">
                  <span className="pnr-tip-icon">{t.icon}</span>
                  <span className="pnr-tip-label">{t.label}</span>
                  <span className="pnr-tip-desc">{t.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .pnr-page { min-height: 100vh; background: #f0f2f8; font-family: 'Inter', sans-serif; }

        /* Navbar */
        .pnr-nav {
          background: #0d1b5e; padding: 0 24px; height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 100;
          box-shadow: 0 2px 12px rgba(0,0,0,0.3);
        }
        .pnr-nav-logo { color: #fff; font-size: 20px; font-weight: 800; cursor: pointer; }
        .pnr-nav-back {
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
          color: #fff; padding: 7px 16px; border-radius: 8px; cursor: pointer;
          font-size: 13px; font-family: 'Inter', sans-serif; font-weight: 500;
        }
        .pnr-nav-back:hover { background: rgba(255,255,255,0.2); }

        /* Hero */
        .pnr-hero {
          background: linear-gradient(160deg, #0d1b5e 0%, #1a237e 60%, #283593 100%);
          padding: 48px 24px 52px; text-align: center; position: relative; overflow: hidden;
        }
        .pnr-hero::before {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0;
          height: 50px; background: #f0f2f8;
          clip-path: ellipse(55% 100% at 50% 100%);
        }
        .pnr-hero-inner { position: relative; z-index: 1; max-width: 560px; margin: 0 auto; }
        .pnr-hero-icon { font-size: 40px; margin-bottom: 12px; }
        .pnr-hero-title { color: #fff; font-size: 32px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px; }
        .pnr-hero-sub { color: #90caf9; font-size: 14px; margin-bottom: 28px; }

        /* Form */
        .pnr-form { display: flex; flex-direction: column; gap: 12px; }
        .pnr-input-wrap {
          display: flex; align-items: center; background: #fff;
          border-radius: 12px; padding: 6px 12px 6px 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        }
        .pnr-input-icon { font-size: 18px; margin-right: 10px; }
        .pnr-input {
          flex: 1; border: none; outline: none; font-size: 18px;
          font-family: 'Inter', sans-serif; letter-spacing: 3px;
          font-weight: 700; color: #1a237e; background: transparent;
        }
        .pnr-input::placeholder { color: #ccc; font-weight: 400; letter-spacing: 1px; font-size: 15px; }
        .pnr-digit-count { font-size: 13px; font-weight: 700; font-family: 'Inter', sans-serif; }

        .pnr-dots { display: flex; justify-content: center; gap: 6px; }
        .pnr-dot { width: 8px; height: 8px; border-radius: 50%; transition: background 0.2s; }

        .pnr-error {
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,100,100,0.4);
          color: #ffcdd2; padding: 10px 16px; border-radius: 8px; font-size: 13px;
          text-align: left;
        }

        .pnr-btn {
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, #ff6f00, #ff8f00);
          color: #fff; border: none; border-radius: 12px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          font-family: 'Inter', sans-serif;
          box-shadow: 0 4px 16px rgba(255,111,0,0.4);
          transition: all 0.2s;
        }
        .pnr-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .pnr-btn:not(:disabled):hover { transform: translateY(-1px); }

        /* Body */
        .pnr-body { max-width: 600px; margin: 32px auto; padding: 0 16px 48px; }

        /* Loading */
        .pnr-loading { text-align: center; padding: 48px; color: #888; }
        .pnr-loading-icon { font-size: 48px; animation: bounce 0.8s infinite alternate; }
        @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-10px); } }

        /* Result card */
        .pnr-card {
          background: #fff; border-radius: 16px; overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }

        .pnr-train-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 24px; background: linear-gradient(135deg, #0d1b5e, #1a237e);
        }
        .pnr-train-info { display: flex; flex-direction: column; gap: 4px; }
        .pnr-train-num { font-size: 24px; font-weight: 800; color: #ff6f00; }
        .pnr-train-name { font-size: 14px; color: #90caf9; font-weight: 500; }
        .pnr-status-badge {
          padding: 8px 18px; border-radius: 20px;
          font-size: 14px; font-weight: 800; letter-spacing: 0.5px;
        }

        .pnr-divider { height: 1px; background: #f0f0f0; }

        /* Journey route */
        .pnr-journey { padding: 20px 24px; }
        .pnr-journey-route { display: flex; align-items: center; gap: 12px; }
        .pnr-station-block { display: flex; flex-direction: column; gap: 3px; min-width: 80px; }
        .pnr-station-right { text-align: right; align-items: flex-end; }
        .pnr-station-label { font-size: 10px; color: #999; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .pnr-station-name { font-size: 15px; font-weight: 700; color: #1a237e; }
        .pnr-station-time { font-size: 12px; color: #888; }
        .pnr-route-line { display: flex; align-items: center; flex: 1; gap: 6px; }
        .pnr-route-dot { width: 8px; height: 8px; border-radius: 50%; background: #1a237e; flex-shrink: 0; }
        .pnr-route-dash { flex: 1; height: 2px; background: #e0e0e0; }
        .pnr-route-icon { font-size: 20px; }

        /* Info grid */
        .pnr-info-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 0; padding: 4px 24px 20px;
        }
        .pnr-info-item {
          display: flex; flex-direction: column; gap: 4px;
          padding: 12px 0; border-bottom: 1px solid #f5f5f5;
        }
        .pnr-info-label { font-size: 11px; color: #999; font-weight: 600; }
        .pnr-info-value { font-size: 15px; font-weight: 700; color: #222; }

        /* Passengers */
        .pnr-section-title { font-size: 14px; font-weight: 700; color: #1a237e; padding: 16px 24px 10px; }
        .pnr-passengers { padding: 0 24px 16px; display: flex; flex-direction: column; gap: 10px; }
        .pnr-passenger-row {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; background: #f8f9ff; border-radius: 10px;
        }
        .pnr-passenger-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: #1a237e; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; flex-shrink: 0;
        }
        .pnr-passenger-info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .pnr-passenger-name { font-size: 14px; font-weight: 600; color: #222; }
        .pnr-passenger-age { font-size: 12px; color: #888; }
        .pnr-passenger-status {
          padding: 4px 12px; border-radius: 6px;
          font-size: 12px; font-weight: 700;
        }

        /* Track button */
        .pnr-track-btn {
          width: calc(100% - 48px); margin: 0 24px 20px;
          padding: 13px; background: linear-gradient(135deg, #1a237e, #283593);
          color: #fff; border: none; border-radius: 10px;
          font-size: 14px; font-weight: 700; cursor: pointer;
          font-family: 'Inter', sans-serif; transition: opacity 0.2s;
        }
        .pnr-track-btn:hover { opacity: 0.9; }

        /* Placeholder */
        .pnr-placeholder { text-align: center; padding: 40px 24px; }
        .pnr-placeholder-icon { font-size: 56px; display: block; margin-bottom: 16px; }
        .pnr-placeholder-title { font-size: 18px; font-weight: 700; color: #333; margin-bottom: 8px; }
        .pnr-placeholder-sub { font-size: 13px; color: #888; line-height: 1.6; margin-bottom: 28px; max-width: 360px; margin-left: auto; margin-right: auto; }

        .pnr-tip-grid { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .pnr-tip {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          background: #fff; border-radius: 12px; padding: 16px 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06); min-width: 100px;
        }
        .pnr-tip-icon { font-size: 24px; }
        .pnr-tip-label { font-size: 14px; font-weight: 800; color: #1a237e; }
        .pnr-tip-desc { font-size: 11px; color: #888; text-align: center; }

        @media (max-width: 480px) {
          .pnr-info-grid { grid-template-columns: repeat(2, 1fr); }
          .pnr-journey-route { flex-wrap: wrap; }
        }
      `}</style>
    </div>
  );
}