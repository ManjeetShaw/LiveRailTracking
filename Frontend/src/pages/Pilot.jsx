import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

const LICENCE_COLORS = {
  'Assistant Loco Pilot': { bg: '#e3f2fd', color: '#1565c0' },
  'Loco Pilot':           { bg: '#e8f5e9', color: '#2e7d32' },
  'Senior Loco Pilot':    { bg: '#fff3e0', color: '#e65100' },
  'Loco Supervisor':      { bg: '#f3e5f5', color: '#6a1b9a' },
};

export default function Pilot() {
  const { id }                      = useParams();
  const { user }                    = useAuth();
  const navigate                    = useNavigate();
  const [pilot, setPilot]           = useState(null);
  const [recentRatings, setRatings] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [following, setFollowing]   = useState(false);
  const [showRateForm, setShowRate] = useState(false);
  const [rateForm, setRateForm]     = useState({ punctuality: 5, smoothness: 5, safetyFeel: 5, overall: 5, review: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [activeTab, setActiveTab]   = useState('overview');

  useEffect(() => { fetchPilot(); }, [id]);

  const fetchPilot = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/pilots/${id}`);
      setPilot(res.data.data.pilot);
      setRatings(res.data.data.recentRatings || []);
      setFollowing(user?.followedPilots?.includes(id));
    } catch {
      setError('Pilot not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      const res = await API.post(`/pilots/${id}/follow`);
      setFollowing(res.data.following);
      setPilot(p => ({ ...p, followerCount: res.data.followerCount }));
    } catch {}
  };

  const handleRate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await API.post(`/pilots/${id}/rate`, rateForm);
      setShowRate(false);
      fetchPilot();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const stars = (val) => {
    const full  = Math.round(val);
    const empty = 5 - full;
    return '★'.repeat(full) + '☆'.repeat(empty);
  };

  const timeAgo = (date) => {
    const days = Math.floor((Date.now() - new Date(date)) / 86400000);
    if (days < 1)  return 'today';
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  if (loading) return (
    <div className="pl-loading">
      <div className="pl-loading-icon">👨‍✈️</div>
      <p>Loading pilot profile...</p>
    </div>
  );

  if (error || !pilot) return (
    <div className="pl-loading">
      <span style={{ fontSize: 48 }}>🚫</span>
      <p>{error || 'Pilot not found'}</p>
      <button className="pl-back-btn" onClick={() => navigate('/')}>Go Home</button>
    </div>
  );

  const licenceStyle = LICENCE_COLORS[pilot.licenceClass] || { bg: '#f5f5f5', color: '#555' };
  const isOnDuty     = pilot.currentDuty?.isOnDuty;

  const tabs = [
    { id: 'overview',   label: '📊 Overview' },
    { id: 'ratings',    label: '⭐ Reviews' },
    { id: 'routes',     label: '🗺️ Routes' },
    { id: 'milestones', label: '🏆 Milestones' },
  ];

  return (
    <div className="pl-page">

      {/* Navbar */}
      <nav className="pl-nav">
        <span className="pl-nav-logo" onClick={() => navigate('/')}>🚂 EkkWomm</span>
        <div className="pl-nav-links">
          <button className="pl-nav-btn" onClick={() => navigate('/')}>🏠 Home</button>
          <button className="pl-nav-btn" onClick={() => navigate('/community')}>💬 Community</button>
          <button className="pl-nav-btn" onClick={() => navigate('/profile')}>👤 Profile</button>
        </div>
      </nav>

      {/* Hero */}
      <div className="pl-hero">
        <div className="pl-hero-inner">
          {isOnDuty && (
            <div className="pl-on-duty">
              <span className="pl-duty-dot" /> ON DUTY
            </div>
          )}

          <div className="pl-avatar">
            {pilot.avatar?.url
              ? <img src={pilot.avatar.url} alt="avatar" className="pl-avatar-img" />
              : <span className="pl-avatar-letter">{pilot.name?.[0]?.toUpperCase()}</span>
            }
          </div>

          <h1 className="pl-name">{pilot.name}</h1>
          <div className="pl-emp-id">Employee ID: {pilot.employeeId}</div>

          <span
            className="pl-licence-badge"
            style={{ background: licenceStyle.bg, color: licenceStyle.color }}
          >
            👨‍✈️ {pilot.licenceClass}
          </span>

          <div className="pl-hero-meta">
            {pilot.division && <span>📍 {pilot.division}</span>}
            {pilot.zone     && <span>🗺️ {pilot.zone}</span>}
            <span>👥 {pilot.followerCount || 0} followers</span>
            <span>⭐ {pilot.ratings?.average?.toFixed(1) || '0.0'} rating</span>
          </div>

          <div className="pl-hero-btns">
            <button
              className="pl-follow-btn"
              style={{
                background: following ? '#fff' : '#ff6f00',
                color:      following ? '#ff6f00' : '#fff',
                border:     following ? '2px solid #ff6f00' : '2px solid transparent',
              }}
              onClick={handleFollow}
            >
              {following ? '✓ Following' : '+ Follow'}
            </button>
            <button className="pl-rate-btn" onClick={() => setShowRate(!showRateForm)}>
              {showRateForm ? '✕ Cancel' : '⭐ Rate Pilot'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="pl-stats">
        {[
          { val: pilot.stats?.totalTrips || 0,                          label: 'Trips' },
          { val: (pilot.stats?.totalKilometres || 0).toLocaleString(), label: 'KM' },
          { val: `${pilot.stats?.onTimePercentage || 0}%`,              label: 'On Time' },
          { val: pilot.ratings?.average?.toFixed(1) || '0.0',          label: 'Rating' },
          { val: `${pilot.stats?.avgDelayMinutes || 0}m`,               label: 'Avg Delay' },
        ].map((s, i) => (
          <div key={i} className="pl-stat">
            <span className="pl-stat-val">{s.val}</span>
            <span className="pl-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="pl-body">

        {/* Rate Form */}
        {showRateForm && (
          <div className="pl-card pl-rate-card">
            <div className="pl-card-title">⭐ Rate This Pilot</div>
            {error && <div className="pl-error">{error}</div>}
            <form onSubmit={handleRate}>
              {[
                { key: 'punctuality', label: '⏱️ Punctuality' },
                { key: 'smoothness',  label: '🚦 Smoothness' },
                { key: 'safetyFeel', label: '🛡️ Safety Feel' },
                { key: 'overall',    label: '⭐ Overall' },
              ].map(({ key, label }) => (
                <div key={key} className="pl-rate-row">
                  <span className="pl-rate-label">{label}</span>
                  <div className="pl-stars">
                    {[1,2,3,4,5].map(n => (
                      <span
                        key={n}
                        className="pl-star"
                        style={{ color: n <= rateForm[key] ? '#ff6f00' : '#ddd' }}
                        onClick={() => setRateForm({ ...rateForm, [key]: n })}
                      >★</span>
                    ))}
                    <span className="pl-star-val">{rateForm[key]}/5</span>
                  </div>
                </div>
              ))}
              <textarea
                className="pl-textarea"
                placeholder="Share your experience with this pilot (optional)..."
                rows={3}
                value={rateForm.review}
                onChange={e => setRateForm({ ...rateForm, review: e.target.value })}
              />
              <button className="pl-submit-btn" type="submit" disabled={submitting}>
                {submitting ? '⏳ Submitting...' : '🚀 Submit Rating'}
              </button>
            </form>
          </div>
        )}

        {/* Tabs */}
        <div className="pl-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`pl-tab ${activeTab === tab.id ? 'pl-tab-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            {/* Rating Breakdown */}
            <div className="pl-card">
              <div className="pl-card-title">⭐ Rating Breakdown</div>
              <div className="pl-rating-big">
                <div className="pl-rating-score">
                  <span className="pl-rating-num">{pilot.ratings?.average?.toFixed(1) || '0.0'}</span>
                  <span className="pl-rating-stars" style={{ color: '#ff6f00' }}>
                    {stars(pilot.ratings?.average || 0)}
                  </span>
                  <span className="pl-rating-count">{pilot.ratings?.count || 0} reviews</span>
                </div>
                <div className="pl-rating-bars">
                  {[
                    { label: '⏱️ Punctuality', val: pilot.ratings?.punctuality || 0 },
                    { label: '🚦 Smoothness',  val: pilot.ratings?.smoothness  || 0 },
                    { label: '🛡️ Safety Feel', val: pilot.ratings?.safetyFeel  || 0 },
                  ].map(item => (
                    <div key={item.label} className="pl-bar-row">
                      <span className="pl-bar-label">{item.label}</span>
                      <div className="pl-bar-track">
                        <div className="pl-bar-fill" style={{ width: `${(item.val / 5) * 100}%` }} />
                      </div>
                      <span className="pl-bar-val">{item.val?.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Govt Score */}
            {pilot.stats?.govtScore?.overall && (
              <div className="pl-card">
                <div className="pl-card-title">🏛️ Government Performance Score</div>
                <div className="pl-govt-grid">
                  <div className="pl-govt-main">
                    <span className="pl-govt-grade">{pilot.stats.govtScore.overall}</span>
                    <span className="pl-govt-grade-label">Overall Grade</span>
                  </div>
                  <div className="pl-govt-stats">
                    {[
                      { val: pilot.stats.govtScore.energySaving,       label: '⚡ Energy' },
                      { val: pilot.stats.govtScore.scheduleAdherence,  label: '📅 Schedule' },
                      { val: pilot.stats.govtScore.safetyCompliance,   label: '🛡️ Safety' },
                      { val: pilot.stats.govtScore.speedRegulation,    label: '🚀 Speed' },
                    ].map(item => (
                      <div key={item.label} className="pl-govt-item">
                        <span className="pl-govt-item-val">{item.val}</span>
                        <span className="pl-govt-item-label">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Currently on duty */}
            {isOnDuty && pilot.currentDuty?.trainInstance && (
              <div className="pl-card pl-duty-card">
                <div className="pl-card-title">🚂 Currently Driving</div>
                <div className="pl-duty-row">
                  <div className="pl-duty-info">
                    <span className="pl-duty-train">Train {pilot.currentDuty.trainInstance.trainNumber}</span>
                    <span className="pl-duty-status">
                      <span className="pl-duty-pulse" /> Live now
                    </span>
                  </div>
                  <button
                    className="pl-view-btn"
                    onClick={() => navigate(`/train/${pilot.currentDuty.trainInstance.trainNumber}`)}
                  >
                    Track Live →
                  </button>
                </div>
              </div>
            )}

            {/* Certifications */}
            {pilot.certifications?.length > 0 && (
              <div className="pl-card">
                <div className="pl-card-title">📜 Certifications</div>
                <div className="pl-cert-list">
                  {pilot.certifications.map((cert, i) => (
                    <span key={i} className="pl-cert-chip">✓ {cert}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* RATINGS */}
        {activeTab === 'ratings' && (
          <div>
            {!recentRatings.length ? (
              <div className="pl-empty">
                <span>⭐</span>
                <p>No reviews yet</p>
                <small>Be the first to rate this pilot!</small>
                <button className="pl-empty-btn" onClick={() => setShowRate(true)}>
                  Rate Now
                </button>
              </div>
            ) : recentRatings.map((rating, i) => (
              <div key={i} className="pl-review-card">
                <div className="pl-review-header">
                  <div className="pl-review-author-row">
                    <div className="pl-review-avatar">
                      {rating.ratedBy?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="pl-review-author">{rating.ratedBy?.name || 'Passenger'}</div>
                      <div className="pl-review-rank">{rating.ratedBy?.rank || 'New Passenger'}</div>
                    </div>
                  </div>
                  <div className="pl-review-meta">
                    <span style={{ color: '#ff6f00', fontSize: 16 }}>{stars(rating.overall)}</span>
                    <span className="pl-review-time">{timeAgo(rating.createdAt)}</span>
                  </div>
                </div>
                {rating.review && <p className="pl-review-text">{rating.review}</p>}
                <div className="pl-review-scores">
                  <span>⏱️ {rating.punctuality}/5</span>
                  <span>🚦 {rating.smoothness}/5</span>
                  <span>🛡️ {rating.safetyFeel}/5</span>
                </div>
                {rating.trainInstance && (
                  <span className="pl-review-train">🚂 Train {rating.trainInstance.trainNumber}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ROUTES */}
        {activeTab === 'routes' && (
          <div>
            {!pilot.regularRoutes?.length ? (
              <div className="pl-empty">
                <span>🗺️</span>
                <p>No regular routes recorded yet</p>
              </div>
            ) : pilot.regularRoutes.map((route, i) => (
              <div key={i} className="pl-route-card">
                <div className="pl-route-row">
                  <span className="pl-route-station">{route.originCode}</span>
                  <div className="pl-route-line">
                    <div className="pl-route-dot" />
                    <div className="pl-route-dash" />
                    <span>🚂</span>
                    <div className="pl-route-dash" />
                    <div className="pl-route-dot" />
                  </div>
                  <span className="pl-route-station">{route.destinationCode}</span>
                </div>
                {route.trainNumber && (
                  <span
                    className="pl-route-train"
                    onClick={() => navigate(`/train/${route.trainNumber}`)}
                  >
                    🚂 {route.trainNumber}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* MILESTONES */}
        {activeTab === 'milestones' && (
          <div>
            {!pilot.milestones?.length ? (
              <div className="pl-empty">
                <span>🏆</span>
                <p>No milestones recorded yet</p>
              </div>
            ) : pilot.milestones.map((m, i) => (
              <div key={i} className="pl-milestone-card">
                <div className="pl-milestone-dot" />
                <div className="pl-milestone-content">
                  <div className="pl-milestone-title">{m.title}</div>
                  {m.description && <div className="pl-milestone-desc">{m.description}</div>}
                  {m.date && <div className="pl-milestone-date">📅 {new Date(m.date).toLocaleDateString()}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .pl-page { min-height: 100vh; background: #f0f2f8; font-family: 'Inter', sans-serif; }

        /* Loading */
        .pl-loading {
          min-height: 100vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 12px;
          color: #1a237e; font-size: 16px; font-family: 'Inter', sans-serif;
        }
        .pl-loading-icon { font-size: 56px; animation: bounce 0.8s infinite alternate; }
        @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-10px); } }
        .pl-back-btn {
          margin-top: 12px; padding: 10px 24px; background: #1a237e;
          color: #fff; border: none; border-radius: 8px; cursor: pointer;
          font-family: 'Inter', sans-serif; font-size: 14px;
        }

        /* Navbar */
        .pl-nav {
          background: #0d1b5e; padding: 0 24px; height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 100;
          box-shadow: 0 2px 12px rgba(0,0,0,0.3);
        }
        .pl-nav-logo { color: #fff; font-size: 20px; font-weight: 800; cursor: pointer; }
        .pl-nav-links { display: flex; gap: 8px; }
        .pl-nav-btn {
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
          color: #fff; padding: 7px 14px; border-radius: 8px; cursor: pointer;
          font-size: 13px; font-family: 'Inter', sans-serif; font-weight: 500;
        }
        .pl-nav-btn:hover { background: rgba(255,255,255,0.2); }

        /* Hero */
        .pl-hero {
          background: linear-gradient(160deg, #0d1b5e 0%, #1a237e 60%, #283593 100%);
          padding: 40px 24px 52px; text-align: center; position: relative; overflow: hidden;
        }
        .pl-hero::before {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0;
          height: 50px; background: #f0f2f8;
          clip-path: ellipse(55% 100% at 50% 100%);
        }
        .pl-hero-inner { position: relative; z-index: 1; }

        .pl-on-duty {
          display: inline-flex; align-items: center; gap: 6px;
          background: #2e7d32; color: #fff; padding: 5px 16px;
          border-radius: 20px; font-size: 12px; font-weight: 800;
          margin-bottom: 12px; letter-spacing: 1px;
        }
        .pl-duty-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #a5d6a7;
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }

        .pl-avatar {
          width: 96px; height: 96px; border-radius: 50%;
          background: linear-gradient(135deg, #ff6f00, #ff8f00);
          margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;
          overflow: hidden; box-shadow: 0 4px 24px rgba(255,111,0,0.4);
          border: 3px solid rgba(255,255,255,0.3);
        }
        .pl-avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .pl-avatar-letter { font-size: 42px; color: #fff; font-weight: 800; }

        .pl-name { color: #fff; font-size: 26px; font-weight: 800; margin-bottom: 4px; letter-spacing: -0.5px; }
        .pl-emp-id { color: #90caf9; font-size: 13px; margin-bottom: 12px; }
        .pl-licence-badge {
          display: inline-block; padding: 5px 16px; border-radius: 20px;
          font-size: 13px; font-weight: 700; margin-bottom: 14px;
        }
        .pl-hero-meta {
          display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;
          color: #b3c5e8; font-size: 13px; margin-bottom: 20px;
        }
        .pl-hero-btns { display: flex; gap: 12px; justify-content: center; }
        .pl-follow-btn {
          padding: 10px 28px; border-radius: 10px; font-size: 14px;
          cursor: pointer; font-weight: 700; font-family: 'Inter', sans-serif;
          transition: all 0.2s;
        }
        .pl-rate-btn {
          padding: 10px 28px; background: transparent; border: 2px solid rgba(255,255,255,0.5);
          color: #fff; border-radius: 10px; font-size: 14px; cursor: pointer;
          font-weight: 700; font-family: 'Inter', sans-serif; transition: all 0.2s;
        }
        .pl-rate-btn:hover { border-color: #fff; background: rgba(255,255,255,0.1); }

        /* Stats */
        .pl-stats {
          display: flex; background: #fff;
          box-shadow: 0 2px 12px rgba(0,0,0,0.07);
        }
        .pl-stat {
          display: flex; flex-direction: column; align-items: center;
          gap: 4px; flex: 1; padding: 16px 0;
          border-right: 1px solid #f0f0f0;
        }
        .pl-stat:last-child { border-right: none; }
        .pl-stat-val { font-size: 18px; font-weight: 800; color: #1a237e; }
        .pl-stat-label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }

        /* Body */
        .pl-body { max-width: 720px; margin: 24px auto; padding: 0 16px 48px; }

        /* Card */
        .pl-card {
          background: #fff; border-radius: 14px; padding: 20px;
          margin-bottom: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }
        .pl-card-title { font-size: 15px; font-weight: 700; color: #1a237e; margin-bottom: 16px; }
        .pl-rate-card { border-top: 4px solid #ff6f00; }

        /* Rate form */
        .pl-error {
          background: #fff3f3; border: 1px solid #ffcdd2; color: #c62828;
          padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 14px;
        }
        .pl-rate-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 0; border-bottom: 1px solid #f5f5f5;
        }
        .pl-rate-label { font-size: 14px; color: #333; font-weight: 600; }
        .pl-stars { display: flex; align-items: center; gap: 6px; }
        .pl-star { font-size: 28px; cursor: pointer; transition: transform 0.1s; }
        .pl-star:hover { transform: scale(1.2); }
        .pl-star-val { font-size: 13px; color: #999; font-weight: 600; margin-left: 4px; }
        .pl-textarea {
          width: 100%; padding: 11px 14px; border: 1.5px solid #e0e0e0;
          border-radius: 10px; font-size: 14px; margin: 14px 0 12px;
          font-family: 'Inter', sans-serif; resize: vertical; outline: none;
          transition: border-color 0.2s;
        }
        .pl-textarea:focus { border-color: #1a237e; }
        .pl-submit-btn {
          padding: 12px 28px; background: linear-gradient(135deg, #ff6f00, #ff8f00);
          color: #fff; border: none; border-radius: 10px; font-size: 14px;
          font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif;
          transition: opacity 0.2s;
        }
        .pl-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Tabs */
        .pl-tabs {
          display: flex; background: #fff; border-radius: 12px;
          margin-bottom: 20px; overflow: hidden;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06); padding: 4px;
        }
        .pl-tab {
          flex: 1; padding: 10px 4px; background: transparent; border: none;
          cursor: pointer; font-size: 12px; font-family: 'Inter', sans-serif;
          font-weight: 500; color: #999; border-radius: 8px; transition: all 0.2s;
        }
        .pl-tab-active { background: #1a237e; color: #fff; font-weight: 700; }

        /* Rating breakdown */
        .pl-rating-big { display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap; }
        .pl-rating-score { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 100px; }
        .pl-rating-num { font-size: 52px; font-weight: 800; color: #1a237e; line-height: 1; }
        .pl-rating-stars { font-size: 22px; }
        .pl-rating-count { font-size: 12px; color: #999; }
        .pl-rating-bars { flex: 1; display: flex; flex-direction: column; gap: 12px; min-width: 200px; }
        .pl-bar-row { display: flex; align-items: center; gap: 10px; }
        .pl-bar-label { font-size: 13px; color: #555; width: 120px; flex-shrink: 0; }
        .pl-bar-track { flex: 1; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
        .pl-bar-fill { height: 100%; background: linear-gradient(90deg, #ff6f00, #ffb300); border-radius: 4px; }
        .pl-bar-val { font-size: 13px; font-weight: 700; color: #1a237e; width: 30px; text-align: right; }

        /* Govt score */
        .pl-govt-grid { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
        .pl-govt-main { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .pl-govt-grade { font-size: 56px; font-weight: 800; color: #1a237e; line-height: 1; }
        .pl-govt-grade-label { font-size: 12px; color: #999; }
        .pl-govt-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; flex: 1; }
        .pl-govt-item {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          background: #f8f9ff; border-radius: 10px; padding: 12px 8px;
        }
        .pl-govt-item-val { font-size: 18px; font-weight: 800; color: #1a237e; }
        .pl-govt-item-label { font-size: 11px; color: #999; text-align: center; }

        /* Duty card */
        .pl-duty-card { border-left: 4px solid #2e7d32; }
        .pl-duty-row { display: flex; justify-content: space-between; align-items: center; }
        .pl-duty-info { display: flex; flex-direction: column; gap: 4px; }
        .pl-duty-train { font-size: 17px; font-weight: 700; color: #1a237e; }
        .pl-duty-status { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #2e7d32; font-weight: 600; }
        .pl-duty-pulse { width: 8px; height: 8px; border-radius: 50%; background: #43a047; animation: pulse 1s infinite; }
        .pl-view-btn {
          padding: 10px 20px; background: #1a237e; color: #fff; border: none;
          border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 700;
          font-family: 'Inter', sans-serif; transition: opacity 0.2s;
        }
        .pl-view-btn:hover { opacity: 0.85; }

        /* Certs */
        .pl-cert-list { display: flex; flex-wrap: wrap; gap: 8px; }
        .pl-cert-chip {
          background: #e8f5e9; color: #2e7d32; padding: 6px 14px;
          border-radius: 20px; font-size: 13px; font-weight: 600;
        }

        /* Reviews */
        .pl-review-card {
          background: #fff; border-radius: 14px; padding: 18px;
          margin-bottom: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.06);
          transition: transform 0.15s;
        }
        .pl-review-card:hover { transform: translateY(-1px); }
        .pl-review-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .pl-review-author-row { display: flex; align-items: center; gap: 10px; }
        .pl-review-avatar {
          width: 38px; height: 38px; border-radius: 50%; background: #1a237e;
          color: #fff; display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 15px; flex-shrink: 0;
        }
        .pl-review-author { font-size: 14px; font-weight: 700; color: #222; }
        .pl-review-rank { font-size: 11px; color: #ff6f00; font-weight: 600; }
        .pl-review-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
        .pl-review-time { font-size: 11px; color: #bbb; }
        .pl-review-text { font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 10px; }
        .pl-review-scores { display: flex; gap: 16px; font-size: 13px; color: #888; margin-bottom: 8px; }
        .pl-review-train {
          display: inline-block; font-size: 12px; color: #1a237e;
          background: #e8eaf6; padding: 3px 10px; border-radius: 10px; font-weight: 600;
        }

        /* Routes */
        .pl-route-card {
          background: #fff; border-radius: 12px; padding: 18px;
          margin-bottom: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.06);
        }
        .pl-route-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
        .pl-route-station { font-size: 20px; font-weight: 800; color: #1a237e; }
        .pl-route-line { display: flex; align-items: center; flex: 1; gap: 6px; }
        .pl-route-dot { width: 8px; height: 8px; border-radius: 50%; background: #1a237e; flex-shrink: 0; }
        .pl-route-dash { flex: 1; height: 2px; background: #e0e0e0; }
        .pl-route-train {
          display: inline-block; font-size: 12px; color: #1a237e;
          background: #e8eaf6; padding: 4px 12px; border-radius: 20px;
          cursor: pointer; font-weight: 600; transition: background 0.2s;
        }
        .pl-route-train:hover { background: #c5cae9; }

        /* Milestones */
        .pl-milestone-card {
          background: #fff; border-radius: 12px; padding: 18px;
          margin-bottom: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.06);
          display: flex; gap: 16px; align-items: flex-start;
        }
        .pl-milestone-dot {
          width: 14px; height: 14px; border-radius: 50%; background: #ff6f00;
          flex-shrink: 0; margin-top: 3px; box-shadow: 0 0 0 4px #ff6f0022;
        }
        .pl-milestone-content { flex: 1; }
        .pl-milestone-title { font-size: 15px; font-weight: 700; color: #1a237e; margin-bottom: 5px; }
        .pl-milestone-desc { font-size: 13px; color: #666; line-height: 1.5; margin-bottom: 6px; }
        .pl-milestone-date { font-size: 12px; color: #bbb; }

        /* Empty */
        .pl-empty { text-align: center; padding: 56px 24px; }
        .pl-empty span { font-size: 52px; display: block; margin-bottom: 14px; }
        .pl-empty p { font-size: 16px; font-weight: 700; color: #333; margin-bottom: 6px; }
        .pl-empty small { font-size: 13px; color: #999; display: block; margin-bottom: 20px; }
        .pl-empty-btn {
          padding: 10px 24px; background: #ff6f00; color: #fff; border: none;
          border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 700;
          font-family: 'Inter', sans-serif;
        }

        @media (max-width: 600px) {
          .pl-rating-big { flex-direction: column; }
          .pl-govt-grid { flex-direction: column; }
          .pl-stats .pl-stat-val { font-size: 14px; }
          .pl-tab { font-size: 11px; }
        }
      `}</style>
    </div>
  );
}