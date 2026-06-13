import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPosts, createPost, toggleUpvote } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['all', 'forum', 'sighting', 'journey-story', 'encyclopedia'];

const CATEGORY_COLORS = {
  forum:           { bg: '#e3f2fd', color: '#1565c0' },
  sighting:        { bg: '#e8f5e9', color: '#2e7d32' },
  'journey-story': { bg: '#fff3e0', color: '#e65100' },
  encyclopedia:    { bg: '#f3e5f5', color: '#6a1b9a' },
};

const CATEGORY_ICONS = {
  forum:           '💬',
  sighting:        '📸',
  'journey-story': '🗺️',
  encyclopedia:    '📖',
};

const XP_MAP = {
  forum: 30, sighting: 50, 'journey-story': 80, encyclopedia: 100
};

export default function Community() {
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [category, setCategory]     = useState('all');
  const [showForm, setShowForm]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [form, setForm]             = useState({
    title: '', body: '', category: 'forum', tags: '', trainNumber: ''
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchPosts(); }, [category]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = category !== 'all' ? { category } : {};
      const res = await getPosts(params);
      setPosts(res.data.data.posts);
    } catch {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
      };
      await createPost(payload);
      setShowForm(false);
      setForm({ title: '', body: '', category: 'forum', tags: '', trainNumber: '' });
      fetchPosts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (postId) => {
    try {
      await toggleUpvote(postId);
      fetchPosts();
    } catch {}
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="cm-page">

      {/* Navbar */}
      <nav className="cm-nav">
        <span className="cm-nav-logo" onClick={() => navigate('/')}>🚂 EkkWomm</span>
        <div className="cm-nav-links">
          <button className="cm-nav-btn" onClick={() => navigate('/')}>🏠 Home</button>
          <button className="cm-nav-btn" onClick={() => navigate('/profile')}>👤 {user?.name?.split(' ')[0]}</button>
        </div>
      </nav>

      {/* Hero */}
      <div className="cm-hero">
        <div className="cm-hero-inner">
          <div className="cm-hero-icon">🚉</div>
          <h1 className="cm-hero-title">Community</h1>
          <p className="cm-hero-sub">Train sightings · Journey stories · Discussions · Encyclopedia</p>
          <button className="cm-new-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '✏️ New Post'}
          </button>
        </div>
      </div>

      <div className="cm-body">

        {/* Create Post Form */}
        {showForm && (
          <div className="cm-form-card">
            <h3 className="cm-form-title">✏️ Create a Post</h3>
            {error && <div className="cm-error">⚠️ {error}</div>}

            <form onSubmit={handleCreate}>
              {/* Category selector */}
              <div className="cm-cat-row">
                {['forum','sighting','journey-story','encyclopedia'].map(cat => (
                  <button
                    key={cat} type="button"
                    className="cm-cat-chip"
                    style={{
                      background: form.category === cat ? CATEGORY_COLORS[cat].bg : '#f5f5f5',
                      color:      form.category === cat ? CATEGORY_COLORS[cat].color : '#999',
                      border:     form.category === cat ? `1.5px solid ${CATEGORY_COLORS[cat].color}` : '1.5px solid #eee',
                      fontWeight: form.category === cat ? '700' : '500',
                    }}
                    onClick={() => setForm({ ...form, category: cat })}
                  >
                    {CATEGORY_ICONS[cat]} {cat}
                  </button>
                ))}
              </div>

              <div className="cm-xp-hint">
                🏆 You'll earn <strong>{XP_MAP[form.category]} XP</strong> for posting in this category
              </div>

              <input
                className="cm-input"
                placeholder="Post title..."
                required
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
              <textarea
                className="cm-textarea"
                placeholder="Share your experience, sighting, or knowledge..."
                required
                rows={5}
                value={form.body}
                onChange={e => setForm({ ...form, body: e.target.value })}
              />
              <input
                className="cm-input"
                placeholder="🚂 Train number (optional, e.g. 12301)"
                value={form.trainNumber}
                onChange={e => setForm({ ...form, trainNumber: e.target.value })}
              />
              <input
                className="cm-input"
                placeholder="🏷️ Tags (comma separated, e.g. delay, rajdhani)"
                value={form.tags}
                onChange={e => setForm({ ...form, tags: e.target.value })}
              />
              <button className="cm-submit-btn" type="submit" disabled={submitting}>
                {submitting ? '⏳ Posting...' : '🚀 Publish Post'}
              </button>
            </form>
          </div>
        )}

        {/* Category Filter */}
        <div className="cm-filter-row">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className="cm-filter-btn"
              style={{
                background: category === cat ? '#1a237e' : '#fff',
                color:      category === cat ? '#fff' : '#555',
                borderColor: category === cat ? '#1a237e' : '#e0e0e0',
              }}
              onClick={() => setCategory(cat)}
            >
              {cat === 'all' ? '🌐 All' : `${CATEGORY_ICONS[cat]} ${cat}`}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="cm-loading">
            <div className="cm-loading-icon">🚉</div>
            <p>Loading posts...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && posts.length === 0 && (
          <div className="cm-empty">
            <span>📭</span>
            <p>No posts yet in this category.</p>
            <small>Be the first to share!</small>
          </div>
        )}

        {/* Posts */}
        {posts.map(post => (
          <div key={post._id} className="cm-post-card">

            {/* Header */}
            <div className="cm-post-header">
              <div className="cm-author-row">
                <div className="cm-avatar">
                  {post.author?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="cm-author-info">
                  <span className="cm-author-name">{post.author?.name || 'Unknown'}</span>
                  <span className="cm-author-rank">{post.author?.rank || 'New Passenger'}</span>
                </div>
              </div>
              <div className="cm-post-meta">
                <span
                  className="cm-cat-badge"
                  style={{
                    background: CATEGORY_COLORS[post.category]?.bg || '#f5f5f5',
                    color:      CATEGORY_COLORS[post.category]?.color || '#555',
                  }}
                >
                  {CATEGORY_ICONS[post.category]} {post.category}
                </span>
                <span className="cm-time-ago">{timeAgo(post.createdAt)}</span>
              </div>
            </div>

            {/* Content */}
            <div className="cm-post-title">{post.title}</div>
            <div className="cm-post-body">
              {post.body.length > 220 ? post.body.slice(0, 220) + '...' : post.body}
            </div>

            {/* Train tag */}
            {post.trainNumber && (
              <span
                className="cm-train-tag"
                onClick={() => navigate(`/train/${post.trainNumber}`)}
              >
                🚂 {post.trainNumber}
              </span>
            )}

            {/* Tags */}
            {post.tags?.length > 0 && (
              <div className="cm-tags-row">
                {post.tags.map(tag => (
                  <span key={tag} className="cm-tag">#{tag}</span>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="cm-post-footer">
              <button className="cm-footer-btn cm-upvote-btn" onClick={() => handleUpvote(post._id)}>
                👍 {post.upvotes?.length || 0}
              </button>
              <span className="cm-footer-btn">💬 {post.comments?.length || 0}</span>
              <span className="cm-footer-btn">👁️ {post.viewCount || 0}</span>
            </div>

          </div>
        ))}

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .cm-page { min-height: 100vh; background: #f0f2f8; font-family: 'Inter', sans-serif; }

        /* Navbar */
        .cm-nav {
          background: #0d1b5e; padding: 0 24px; height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 100;
          box-shadow: 0 2px 12px rgba(0,0,0,0.3);
        }
        .cm-nav-logo { color: #fff; font-size: 20px; font-weight: 800; cursor: pointer; }
        .cm-nav-links { display: flex; gap: 8px; }
        .cm-nav-btn {
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
          color: #fff; padding: 7px 14px; border-radius: 8px; cursor: pointer;
          font-size: 13px; font-family: 'Inter', sans-serif; font-weight: 500;
        }
        .cm-nav-btn:hover { background: rgba(255,255,255,0.2); }

        /* Hero */
        .cm-hero {
          background: linear-gradient(160deg, #0d1b5e 0%, #1a237e 60%, #283593 100%);
          padding: 48px 24px 52px; text-align: center; position: relative; overflow: hidden;
        }
        .cm-hero::before {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0;
          height: 50px; background: #f0f2f8;
          clip-path: ellipse(55% 100% at 50% 100%);
        }
        .cm-hero-inner { position: relative; z-index: 1; }
        .cm-hero-icon { font-size: 40px; margin-bottom: 12px; }
        .cm-hero-title { color: #fff; font-size: 34px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px; }
        .cm-hero-sub { color: #90caf9; font-size: 14px; margin-bottom: 24px; }
        .cm-new-btn {
          padding: 12px 28px; background: linear-gradient(135deg, #ff6f00, #ff8f00);
          color: #fff; border: none; border-radius: 10px; font-size: 15px;
          font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif;
          box-shadow: 0 4px 16px rgba(255,111,0,0.4); transition: all 0.2s;
        }
        .cm-new-btn:hover { transform: translateY(-1px); }

        /* Body */
        .cm-body { max-width: 720px; margin: 28px auto; padding: 0 16px 48px; }

        /* Form card */
        .cm-form-card {
          background: #fff; border-radius: 16px; padding: 24px;
          margin-bottom: 20px; box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          border-top: 4px solid #1a237e;
        }
        .cm-form-title { font-size: 17px; font-weight: 700; color: #1a237e; margin-bottom: 16px; }
        .cm-error {
          background: #fff3f3; border: 1px solid #ffcdd2; color: #c62828;
          padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 14px;
        }
        .cm-cat-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
        .cm-cat-chip {
          padding: 7px 14px; border-radius: 20px; font-size: 12px;
          cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s;
        }
        .cm-xp-hint {
          font-size: 13px; color: #666; background: #fffde7; border: 1px solid #fff176;
          padding: 8px 14px; border-radius: 8px; margin-bottom: 14px;
        }
        .cm-input {
          width: 100%; padding: 11px 14px; border: 1.5px solid #e0e0e0;
          border-radius: 10px; font-size: 14px; margin-bottom: 10px;
          font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s;
        }
        .cm-input:focus { border-color: #1a237e; }
        .cm-textarea {
          width: 100%; padding: 11px 14px; border: 1.5px solid #e0e0e0;
          border-radius: 10px; font-size: 14px; margin-bottom: 10px;
          font-family: 'Inter', sans-serif; resize: vertical; outline: none;
          transition: border-color 0.2s;
        }
        .cm-textarea:focus { border-color: #1a237e; }
        .cm-submit-btn {
          padding: 12px 28px; background: linear-gradient(135deg, #1a237e, #283593);
          color: #fff; border: none; border-radius: 10px; font-size: 14px;
          font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif;
          transition: opacity 0.2s;
        }
        .cm-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Filter */
        .cm-filter-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
        .cm-filter-btn {
          padding: 8px 16px; border-radius: 20px; border: 1.5px solid;
          font-size: 13px; cursor: pointer; font-weight: 500;
          font-family: 'Inter', sans-serif; transition: all 0.2s;
        }

        /* Loading */
        .cm-loading { text-align: center; padding: 48px; color: #888; }
        .cm-loading-icon { font-size: 48px; animation: bounce 0.8s infinite alternate; }
        @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-8px); } }

        /* Empty */
        .cm-empty { text-align: center; padding: 56px 24px; color: #888; }
        .cm-empty span { font-size: 48px; display: block; margin-bottom: 12px; }
        .cm-empty p { font-size: 16px; color: #555; margin-bottom: 6px; }
        .cm-empty small { font-size: 13px; }

        /* Post card */
        .cm-post-card {
          background: #fff; border-radius: 14px; padding: 20px;
          margin-bottom: 14px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .cm-post-card:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.09); }

        .cm-post-header {
          display: flex; justify-content: space-between;
          align-items: flex-start; margin-bottom: 12px;
        }
        .cm-author-row { display: flex; align-items: center; gap: 10px; }
        .cm-avatar {
          width: 40px; height: 40px; border-radius: 50%; background: #1a237e;
          color: #fff; display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 16px; flex-shrink: 0;
        }
        .cm-author-info { display: flex; flex-direction: column; gap: 2px; }
        .cm-author-name { font-size: 14px; font-weight: 700; color: #222; }
        .cm-author-rank { font-size: 11px; color: #ff6f00; font-weight: 600; }
        .cm-post-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
        .cm-cat-badge {
          padding: 3px 10px; border-radius: 12px;
          font-size: 11px; font-weight: 700;
        }
        .cm-time-ago { font-size: 11px; color: #bbb; }

        .cm-post-title { font-size: 16px; font-weight: 700; color: #1a237e; margin-bottom: 8px; line-height: 1.3; }
        .cm-post-body { font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 12px; }

        .cm-train-tag {
          display: inline-block; background: #e8eaf6; color: #1a237e;
          padding: 4px 12px; border-radius: 20px; font-size: 12px;
          cursor: pointer; margin-bottom: 10px; font-weight: 600;
          transition: background 0.2s;
        }
        .cm-train-tag:hover { background: #c5cae9; }

        .cm-tags-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
        .cm-tag {
          font-size: 12px; color: #888; background: #f5f5f5;
          padding: 3px 8px; border-radius: 10px;
        }

        .cm-post-footer {
          display: flex; gap: 6px; border-top: 1px solid #f5f5f5; padding-top: 12px;
        }
        .cm-footer-btn {
          background: #f5f7ff; border: none; font-size: 13px; color: #666;
          cursor: pointer; padding: 6px 14px; border-radius: 8px;
          font-family: 'Inter', sans-serif; font-weight: 500; transition: background 0.2s;
        }
        .cm-upvote-btn:hover { background: #e8eaf6; color: #1a237e; }

        @media (max-width: 480px) {
          .cm-hero-title { font-size: 26px; }
          .cm-post-header { flex-direction: column; gap: 10px; }
          .cm-post-meta { flex-direction: row; align-items: center; }
        }
      `}</style>
    </div>
  );
}