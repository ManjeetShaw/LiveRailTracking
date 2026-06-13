import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyContributions, updateMe } from '../services/api';
import { useAuth } from '../context/AuthContext';

const RANK_COLORS = {
  'New Passenger':     { bg: '#f5f5f5', color: '#757575' },
  'Regular Traveller': { bg: '#e3f2fd', color: '#1565c0' },
  'Frequent Flyer':    { bg: '#e8f5e9', color: '#2e7d32' },
  'Rail Enthusiast':   { bg: '#fff3e0', color: '#e65100' },
  'Rail Veteran':      { bg: '#f3e5f5', color: '#6a1b9a' },
  'Iron Road Legend':  { bg: '#ffd700', color: '#5d4037' },
};

const RANK_ORDER = [
  { name: 'New Passenger',     minXP: 0     },
  { name: 'Regular Traveller', minXP: 200   },
  { name: 'Frequent Flyer',    minXP: 800   },
  { name: 'Rail Enthusiast',   minXP: 2000  },
  { name: 'Rail Veteran',      minXP: 5000  },
  { name: 'Iron Road Legend',  minXP: 10000 },
];

const CATEGORY_ICONS = {
  forum: '💬', sighting: '📸', 'journey-story': '🗺️', encyclopedia: '📖'
};

export default function Profile() {
  const { user, logout }             = useAuth();
  const [contributions, setContribs] = useState(null);
  const [activeTab, setActiveTab]    = useState('overview');
  const [editing, setEditing]        = useState(false);
  const [form, setForm]              = useState({ name: '', theme: 'system' });
  const [saving, setSaving]          = useState(false);
  const [error, setError]            = useState('');
  const navigate                     = useNavigate();

  useEffect(() => {
    if (user) setForm({ name: user.name, theme: user.theme || 'system' });
    fetchContributions();
  }, [user]);

  const fetchContributions = async () => {
    try {
      const res = await getMyContributions();
      setContribs(res.data.data);
    } catch {}
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateMe(form);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const currentRankIdx = RANK_ORDER.findIndex(r => r.name === user?.rank) ?? 0;
  const nextRank       = RANK_ORDER[currentRankIdx + 1];
  const currentMin     = RANK_ORDER[currentRankIdx]?.minXP || 0;
  const nextMin        = nextRank?.minXP || 10000;
  const xpProgress     = Math.min((((user?.xp || 0) - currentMin) / (nextMin - currentMin)) * 100, 100);
  const rankStyle      = RANK_COLORS[user?.rank] || RANK_COLORS['New Passenger'];

  const timeAgo = (date) => {
    const days = Math.floor((Date.now() - new Date(date)) / 86400000);
    if (days < 1)  return 'today';
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'posts',    label: '📝 My Posts' },
    { id: 'badges',   label: '🏅 Badges' },
    { id: 'settings', label: '⚙️ Settings' },
  ];

  return (
    <div className="pr-page">

      {/* Navbar */}
      <nav className="pr-nav">
        <span className="pr-nav-logo" onClick={() => navigate('/')}>🚂 EkkWomm</span>
        <div className="pr-nav-links">
          <button className="pr-nav-btn" onClick={() => navigate('/')}>🏠 Home</button>
          <button className="pr-nav-btn" onClick={() => navigate('/community')}>💬 Community</button>
          <button className="pr-nav-logout" onClick={logout}>Logout</button>
        </div>
      </nav>

      {/* Hero */}
      <div className="pr-hero">
        <div className="pr-hero-inner">
          <div className="pr-avatar">
            {user?.avatar?.url
              ? <img src={user.avatar.url} alt="avatar" className="pr-avatar-img" />
              : <span className="pr-avatar-letter">{user?.name?.[0]?.toUpperCase()}</span>
            }
          </div>
          <h1 className="pr-user-name">{user?.name}</h1>
          <span
            className="pr-rank-badge"
            style={{ background: rankStyle.bg, color: rankStyle.color }}
          >
            {user?.rank}
          </span>
          <div className="pr-xp-row">
            <span className="pr-xp-text">⚡ {user?.xp || 0} XP</span>
            {nextRank && (
              <span className="pr-next-rank">→ {nextRank.name} at {nextMin} XP</span>
            )}
          </div>
          <div className="pr-progress-track">
            <div className="pr-progress-fill" style={{ width: `${xpProgress}%` }} />
          </div>
          <div className="pr-progress-label">{Math.round(xpProgress)}% to next rank</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="pr-stats-row">
        {[
          { val: contributions?.posts?.length || 0,          label: 'Posts' },
          { val: contributions?.ratings?.length || 0,        label: 'Ratings' },
          { val: contributions?.hygieneReports?.length || 0, label: 'Reports' },
          { val: user?.badges?.length || 0,                  label: 'Badges' },
        ].map((s, i) => (
          <div key={i} className="pr-stat-block">
            <span className="pr-stat-val">{s.val}</span>
            <span className="pr-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="pr-body">

        {/* Tabs */}
        <div className="pr-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`pr-tab ${activeTab === tab.id ? 'pr-tab-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div>
            {contributions?.xpBreakdown && (
              <div className="pr-card">
                <div className="pr-card-title">⚡ XP Breakdown</div>
                <div className="pr-xp-grid">
                  {[
                    { val: contributions.xpBreakdown.fromPosts,   label: 'From Posts',   color: '#1565c0' },
                    { val: contributions.xpBreakdown.fromRatings, label: 'From Ratings', color: '#2e7d32' },
                    { val: contributions.xpBreakdown.fromHygiene, label: 'From Reports', color: '#6a1b9a' },
                    { val: contributions.xpBreakdown.total,       label: 'Total XP',     color: '#ff6f00' },
                  ].map(item => (
                    <div key={item.label} className="pr-xp-item">
                      <span className="pr-xp-val" style={{ color: item.color }}>{item.val}</span>
                      <span className="pr-xp-label">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pr-card">
              <div className="pr-card-title">🗺️ Rank Roadmap</div>
              <div className="pr-rank-road">
                {RANK_ORDER.map((rank, i) => {
                  const reached  = (user?.xp || 0) >= rank.minXP;
                  const isCurrent = rank.name === user?.rank;
                  return (
                    <div key={rank.name} className="pr-rank-step">
                      <div
                        className="pr-rank-dot"
                        style={{
                          background: reached ? '#ff6f00' : '#e0e0e0',
                          boxShadow:  isCurrent ? '0 0 0 4px #ff6f0033' : 'none',
                          border:     isCurrent ? '3px solid #fff' : 'none',
                        }}
                      />
                      <div className="pr-rank-info">
                        <span style={{ fontSize: 12, fontWeight: isCurrent ? '700' : '400', color: reached ? '#1a237e' : '#bbb' }}>
                          {rank.name}
                        </span>
                        <span style={{ fontSize: 10, color: '#bbb' }}>{rank.minXP} XP</span>
                      </div>
                      {i < RANK_ORDER.length - 1 && (
                        <div className="pr-rank-line" style={{ background: reached ? '#ff6f00' : '#e0e0e0' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Posts */}
        {activeTab === 'posts' && (
          <div>
            {!contributions?.posts?.length ? (
              <div className="pr-empty">
                <span>📭</span>
                <p>No posts yet</p>
                <small>Share your first train story in the community!</small>
                <button className="pr-empty-btn" onClick={() => navigate('/community')}>
                  Go to Community
                </button>
              </div>
            ) : contributions.posts.map(post => (
              <div key={post._id} className="pr-post-card">
                <div className="pr-post-top">
                  <span className="pr-post-cat">{CATEGORY_ICONS[post.category]} {post.category}</span>
                  <span className="pr-post-time">{timeAgo(post.createdAt)}</span>
                </div>
                <div className="pr-post-title">{post.title}</div>
                <div className="pr-post-footer">
                  <span>👍 {post.upvotes?.length || 0}</span>
                  <span>💬 {post.comments?.length || 0}</span>
                  {post.trainNumber && (
                    <span
                      className="pr-train-tag"
                      onClick={() => navigate(`/train/${post.trainNumber}`)}
                    >
                      🚂 {post.trainNumber}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Badges */}
        {activeTab === 'badges' && (
          <div>
            {!user?.badges?.length ? (
              <div className="pr-empty">
                <span>🏅</span>
                <p>No badges yet</p>
                <small>Keep contributing to earn your first badge!</small>
              </div>
            ) : (
              <div className="pr-badge-grid">
                {user.badges.map((badge, i) => (
                  <div key={i} className="pr-badge-card">
                    <div className="pr-badge-icon">🏅</div>
                    <div className="pr-badge-name">{badge.name}</div>
                    <div className="pr-badge-date">{timeAgo(badge.awardedAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <div className="pr-card">
            <div className="pr-card-title">⚙️ Profile Settings</div>
            {error && <div className="pr-error">{error}</div>}

            {!editing ? (
              <div>
                {[
                  { label: '👤 Name',         value: user?.name },
                  { label: '📧 Email',        value: user?.email },
                  { label: '🎨 Theme',        value: user?.theme || 'system' },
                  { label: '📅 Member since', value: new Date(user?.createdAt).toLocaleDateString() },
                ].map(item => (
                  <div key={item.label} className="pr-setting-row">
                    <span className="pr-setting-label">{item.label}</span>
                    <span className="pr-setting-val">{item.value}</span>
                  </div>
                ))}
                <button className="pr-edit-btn" onClick={() => setEditing(true)}>
                  ✏️ Edit Profile
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpdate}>
                <label className="pr-label">Full Name</label>
                <input
                  className="pr-input"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
                <label className="pr-label">Theme</label>
                <select
                  className="pr-input"
                  value={form.theme}
                  onChange={e => setForm({ ...form, theme: e.target.value })}
                >
                  <option value="system">System Default</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
                <div className="pr-btn-row">
                  <button className="pr-edit-btn" type="submit" disabled={saving}>
                    {saving ? '⏳ Saving...' : '💾 Save Changes'}
                  </button>
                  <button className="pr-cancel-btn" type="button" onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="pr-danger-zone">
              <button className="pr-logout-btn" onClick={logout}>🚪 Logout</button>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .pr-page { min-height: 100vh; background: #f0f2f8; font-family: 'Inter', sans-serif; }

        /* Navbar */
        .pr-nav {
          background: #0d1b5e; padding: 0 24px; height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 100;
          box-shadow: 0 2px 12px rgba(0,0,0,0.3);
        }
        .pr-nav-logo { color: #fff; font-size: 20px; font-weight: 800; cursor: pointer; }
        .pr-nav-links { display: flex; gap: 8px; align-items: center; }
        .pr-nav-btn {
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
          color: #fff; padding: 7px 14px; border-radius: 8px; cursor: pointer;
          font-size: 13px; font-family: 'Inter', sans-serif; font-weight: 500;
        }
        .pr-nav-btn:hover { background: rgba(255,255,255,0.2); }
        .pr-nav-logout {
          background: #ff6f00; border: none; color: #fff; padding: 7px 14px;
          border-radius: 8px; cursor: pointer; font-size: 13px;
          font-family: 'Inter', sans-serif; font-weight: 600;
        }

        /* Hero */
        .pr-hero {
          background: linear-gradient(160deg, #0d1b5e 0%, #1a237e 60%, #283593 100%);
          padding: 40px 24px 52px; text-align: center; position: relative; overflow: hidden;
        }
        .pr-hero::before {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0;
          height: 50px; background: #f0f2f8;
          clip-path: ellipse(55% 100% at 50% 100%);
        }
        .pr-hero-inner { position: relative; z-index: 1; }
        .pr-avatar {
          width: 88px; height: 88px; border-radius: 50%;
          background: linear-gradient(135deg, #ff6f00, #ff8f00);
          margin: 0 auto 14px; display: flex; align-items: center; justify-content: center;
          overflow: hidden; box-shadow: 0 4px 20px rgba(255,111,0,0.4);
          border: 3px solid rgba(255,255,255,0.3);
        }
        .pr-avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .pr-avatar-letter { font-size: 38px; color: #fff; font-weight: 800; }
        .pr-user-name { color: #fff; font-size: 26px; font-weight: 800; margin-bottom: 10px; letter-spacing: -0.5px; }
        .pr-rank-badge {
          display: inline-block; padding: 5px 16px; border-radius: 20px;
          font-size: 13px; font-weight: 700; margin-bottom: 14px;
        }
        .pr-xp-row { display: flex; align-items: center; justify-content: center; gap: 14px; margin-bottom: 12px; }
        .pr-xp-text { color: #ffd700; font-size: 17px; font-weight: 800; }
        .pr-next-rank { color: #90caf9; font-size: 13px; }
        .pr-progress-track {
          height: 8px; background: rgba(255,255,255,0.2); border-radius: 10px;
          max-width: 380px; margin: 0 auto 6px; overflow: hidden;
        }
        .pr-progress-fill {
          height: 100%; background: linear-gradient(90deg, #ff6f00, #ffb300);
          border-radius: 10px; transition: width 1s ease;
        }
        .pr-progress-label { color: rgba(255,255,255,0.5); font-size: 12px; }

        /* Stats */
        .pr-stats-row {
          display: flex; background: #fff;
          box-shadow: 0 2px 12px rgba(0,0,0,0.07);
        }
        .pr-stat-block {
          display: flex; flex-direction: column; align-items: center;
          gap: 4px; flex: 1; padding: 16px 0;
          border-right: 1px solid #f0f0f0;
        }
        .pr-stat-block:last-child { border-right: none; }
        .pr-stat-val { font-size: 22px; font-weight: 800; color: #1a237e; }
        .pr-stat-label { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }

        /* Body */
        .pr-body { max-width: 700px; margin: 24px auto; padding: 0 16px 48px; }

        /* Tabs */
        .pr-tabs {
          display: flex; background: #fff; border-radius: 12px;
          margin-bottom: 20px; overflow: hidden;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06); padding: 4px;
        }
        .pr-tab {
          flex: 1; padding: 10px 4px; background: transparent; border: none;
          cursor: pointer; font-size: 12px; font-family: 'Inter', sans-serif;
          font-weight: 500; color: #999; border-radius: 8px; transition: all 0.2s;
        }
        .pr-tab-active { background: #1a237e; color: #fff; font-weight: 700; }

        /* Card */
        .pr-card {
          background: #fff; border-radius: 14px; padding: 20px;
          margin-bottom: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }
        .pr-card-title { font-size: 15px; font-weight: 700; color: #1a237e; margin-bottom: 16px; }

        /* XP grid */
        .pr-xp-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .pr-xp-item {
          display: flex; flex-direction: column; align-items: center; gap: 5px;
          background: #f8f9ff; border-radius: 10px; padding: 14px 8px;
        }
        .pr-xp-val { font-size: 22px; font-weight: 800; }
        .pr-xp-label { font-size: 11px; color: #999; text-align: center; font-weight: 500; }

        /* Rank road */
        .pr-rank-road { display: flex; align-items: center; overflow-x: auto; padding: 8px 0; gap: 0; }
        .pr-rank-step { display: flex; align-items: center; flex-shrink: 0; }
        .pr-rank-dot { width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0; transition: all 0.3s; }
        .pr-rank-info { display: flex; flex-direction: column; align-items: center; padding: 0 8px; }
        .pr-rank-line { width: 28px; height: 3px; flex-shrink: 0; }

        /* Post cards */
        .pr-post-card {
          background: #fff; border-radius: 12px; padding: 16px;
          margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border-left: 3px solid #1a237e;
        }
        .pr-post-top { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .pr-post-cat {
          font-size: 12px; color: #1565c0; background: #e3f2fd;
          padding: 2px 10px; border-radius: 10px; font-weight: 600;
        }
        .pr-post-time { font-size: 12px; color: #bbb; }
        .pr-post-title { font-size: 15px; font-weight: 700; color: #1a237e; margin-bottom: 10px; }
        .pr-post-footer { display: flex; gap: 14px; font-size: 13px; color: #888; align-items: center; }
        .pr-train-tag {
          background: #e8eaf6; color: #1a237e; padding: 2px 10px;
          border-radius: 10px; font-size: 12px; cursor: pointer; font-weight: 600;
        }

        /* Badges */
        .pr-badge-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .pr-badge-card {
          background: #fff; border-radius: 12px; padding: 20px;
          text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          transition: transform 0.15s;
        }
        .pr-badge-card:hover { transform: translateY(-2px); }
        .pr-badge-icon { font-size: 36px; margin-bottom: 10px; }
        .pr-badge-name { font-size: 13px; font-weight: 700; color: #1a237e; margin-bottom: 4px; }
        .pr-badge-date { font-size: 11px; color: #bbb; }

        /* Settings */
        .pr-setting-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 13px 0; border-bottom: 1px solid #f5f5f5;
        }
        .pr-setting-label { font-size: 13px; color: #888; font-weight: 500; }
        .pr-setting-val { font-size: 14px; font-weight: 600; color: #222; }
        .pr-label { font-size: 12px; color: #666; display: block; margin: 14px 0 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .pr-input {
          width: 100%; padding: 11px 14px; border: 1.5px solid #e0e0e0;
          border-radius: 10px; font-size: 14px; font-family: 'Inter', sans-serif;
          outline: none; transition: border-color 0.2s;
        }
        .pr-input:focus { border-color: #1a237e; }
        .pr-btn-row { display: flex; gap: 10px; margin-top: 16px; }
        .pr-edit-btn {
          padding: 11px 24px; background: #1a237e; color: #fff; border: none;
          border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 700;
          font-family: 'Inter', sans-serif; transition: opacity 0.2s; margin-top: 16px;
        }
        .pr-edit-btn:disabled { opacity: 0.6; }
        .pr-cancel-btn {
          padding: 11px 24px; background: #f0f2f8; color: #555; border: none;
          border-radius: 10px; cursor: pointer; font-size: 14px;
          font-family: 'Inter', sans-serif; margin-top: 16px;
        }
        .pr-error {
          background: #fff3f3; border: 1px solid #ffcdd2; color: #c62828;
          padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 12px;
        }
        .pr-danger-zone { margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0f0f0; }
        .pr-logout-btn {
          padding: 10px 20px; background: #fff3f3; color: #c62828; border: 1px solid #ffcdd2;
          border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600;
          font-family: 'Inter', sans-serif;
        }

        /* Empty */
        .pr-empty { text-align: center; padding: 56px 24px; }
        .pr-empty span { font-size: 52px; display: block; margin-bottom: 14px; }
        .pr-empty p { font-size: 17px; font-weight: 700; color: #333; margin-bottom: 6px; }
        .pr-empty small { font-size: 13px; color: #999; display: block; margin-bottom: 20px; }
        .pr-empty-btn {
          padding: 10px 24px; background: #1a237e; color: #fff; border: none;
          border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600;
          font-family: 'Inter', sans-serif;
        }

        @media (max-width: 480px) {
          .pr-xp-grid { grid-template-columns: repeat(2, 1fr); }
          .pr-badge-grid { grid-template-columns: repeat(2, 1fr); }
          .pr-tab { font-size: 11px; padding: 8px 2px; }
        }
      `}</style>
    </div>
  );
}