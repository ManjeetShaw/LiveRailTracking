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
  const [posts, setPosts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [category, setCategory]   = useState('all');
  const [showForm, setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [form, setForm]           = useState({
    title: '', body: '', category: 'forum', tags: '', trainNumber: ''
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, [category]);

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
    if (mins < 1)   return 'just now';
    if (mins < 60)  return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)   return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div style={s.page}>

      {/* Navbar */}
      <div style={s.navbar}>
        <span style={s.logo}>🚂 EkkWomm</span>
        <div style={s.navRight}>
          <button style={s.navBtn} onClick={() => navigate('/')}>🏠 Home</button>
          <span style={s.navUser}>👤 {user?.name}</span>
        </div>
      </div>

      {/* Hero */}
      <div style={s.hero}>
        <h1 style={s.heroTitle}>Community</h1>
        <p style={s.heroSub}>Train sightings, journey stories, discussions & more</p>
        <button style={s.newPostBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '✏️ New Post'}
        </button>
      </div>

      <div style={s.body}>

        {/* Create Post Form */}
        {showForm && (
          <div style={s.formCard}>
            <h3 style={s.formTitle}>Create a Post</h3>
            {error && <p style={s.errorMsg}>{error}</p>}
            <form onSubmit={handleCreate}>
              {/* Category selector */}
              <div style={s.categoryRow}>
                {['forum','sighting','journey-story','encyclopedia'].map(cat => (
                  <button key={cat} type="button"
                    style={{
                      ...s.catChip,
                      background: form.category === cat ? CATEGORY_COLORS[cat].bg : '#f5f5f5',
                      color:      form.category === cat ? CATEGORY_COLORS[cat].color : '#999',
                      border:     form.category === cat ? `1px solid ${CATEGORY_COLORS[cat].color}` : '1px solid #eee',
                    }}
                    onClick={() => setForm({ ...form, category: cat })}>
                    {CATEGORY_ICONS[cat]} {cat}
                  </button>
                ))}
              </div>

              <div style={s.xpHint}>
                🏆 You'll earn <strong>{XP_MAP[form.category]} XP</strong> for this post
              </div>

              <input style={s.input} placeholder="Title" required
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />

              <textarea style={s.textarea} placeholder="Write your post..." required rows={5}
                value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} />

              <input style={s.input} placeholder="Train number (optional, e.g. 13009)"
                value={form.trainNumber} onChange={e => setForm({ ...form, trainNumber: e.target.value })} />

              <input style={s.input} placeholder="Tags (comma separated, e.g. delay, rajdhani, hwh)"
                value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />

              <button style={s.submitBtn} type="submit" disabled={submitting}>
                {submitting ? 'Posting...' : '🚀 Post'}
              </button>
            </form>
          </div>
        )}

        {/* Category Filter */}
        <div style={s.filterRow}>
          {CATEGORIES.map(cat => (
            <button key={cat} style={{
              ...s.filterBtn,
              background: category === cat ? '#1a237e' : '#fff',
              color:      category === cat ? '#fff' : '#555',
            }} onClick={() => setCategory(cat)}>
              {cat === 'all' ? '🌐 All' : `${CATEGORY_ICONS[cat]} ${cat}`}
            </button>
          ))}
        </div>

        {/* Posts */}
        {loading && <p style={s.msg}>Loading posts...</p>}
        {!loading && posts.length === 0 && (
          <div style={s.empty}>
            <div style={{ fontSize: 48 }}>📭</div>
            <p>No posts yet. Be the first to post!</p>
          </div>
        )}

        {posts.map(post => (
          <div key={post._id} style={s.postCard}>

            {/* Post Header */}
            <div style={s.postHeader}>
              <div style={s.authorRow}>
                <div style={s.avatar}>{post.author?.name?.[0]?.toUpperCase() || '?'}</div>
                <div>
                  <div style={s.authorName}>{post.author?.name || 'Unknown'}</div>
                  <div style={s.authorRank}>{post.author?.rank || 'New Passenger'}</div>
                </div>
              </div>
              <div style={s.postMeta}>
                <span style={{
                  ...s.catBadge,
                  background: CATEGORY_COLORS[post.category]?.bg || '#f5f5f5',
                  color:      CATEGORY_COLORS[post.category]?.color || '#555',
                }}>
                  {CATEGORY_ICONS[post.category]} {post.category}
                </span>
                <span style={s.timeAgo}>{timeAgo(post.createdAt)}</span>
              </div>
            </div>

            {/* Post Body */}
            <div style={s.postTitle}>{post.title}</div>
            <div style={s.postBody}>
              {post.body.length > 200 ? post.body.slice(0, 200) + '...' : post.body}
            </div>

            {/* Train tag */}
            {post.trainNumber && (
              <div style={s.trainTag} onClick={() => navigate(`/train/${post.trainNumber}`)}>
                🚂 {post.trainNumber}
              </div>
            )}

            {/* Tags */}
            {post.tags?.length > 0 && (
              <div style={s.tagsRow}>
                {post.tags.map(tag => (
                  <span key={tag} style={s.tag}>#{tag}</span>
                ))}
              </div>
            )}

            {/* Post Footer */}
            <div style={s.postFooter}>
              <button style={s.footerBtn} onClick={() => handleUpvote(post._id)}>
                👍 {post.upvotes?.length || 0}
              </button>
              <span style={s.footerBtn}>💬 {post.comments?.length || 0}</span>
              <span style={s.footerBtn}>👁️ {post.viewCount || 0}</span>
            </div>

          </div>
        ))}

      </div>
    </div>
  );
}

const s = {
  page:        { minHeight: '100vh', background: '#f5f7fa', fontFamily: 'sans-serif' },
  navbar:      { background: '#1a237e', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logo:        { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  navRight:    { display: 'flex', alignItems: 'center', gap: 16 },
  navBtn:      { background: 'transparent', border: '1px solid rgba(255,255,255,0.5)', color: '#fff', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 14 },
  navUser:     { color: '#fff', fontSize: 14 },
  hero:        { background: '#1a237e', padding: '40px 24px', textAlign: 'center' },
  heroTitle:   { color: '#fff', fontSize: 32, margin: '0 0 8px', fontWeight: 'bold' },
  heroSub:     { color: '#90caf9', fontSize: 15, margin: '0 0 24px' },
  newPostBtn:  { padding: '12px 28px', background: '#ff6f00', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer', fontWeight: 'bold' },
  body:        { maxWidth: 700, margin: '24px auto', padding: '0 16px 40px' },

  formCard:    { background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  formTitle:   { fontSize: 18, fontWeight: 'bold', color: '#1a237e', marginBottom: 16 },
  categoryRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  catChip:     { padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer', fontWeight: '500' },
  xpHint:      { fontSize: 13, color: '#666', background: '#fffde7', padding: '8px 12px', borderRadius: 8, marginBottom: 12 },
  input:       { width: '100%', padding: '12px 14px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, marginBottom: 10, boxSizing: 'border-box' },
  textarea:    { width: '100%', padding: '12px 14px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, marginBottom: 10, boxSizing: 'border-box', resize: 'vertical' },
  submitBtn:   { padding: '12px 28px', background: '#1a237e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer', fontWeight: 'bold' },
  errorMsg:    { color: 'red', fontSize: 13, marginBottom: 10 },

  filterRow:   { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 },
  filterBtn:   { padding: '8px 16px', borderRadius: 20, border: '1px solid #e0e0e0', fontSize: 13, cursor: 'pointer', fontWeight: '500' },

  postCard:    { background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  postHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  authorRow:   { display: 'flex', alignItems: 'center', gap: 10 },
  avatar:      { width: 40, height: 40, borderRadius: '50%', background: '#1a237e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 16 },
  authorName:  { fontSize: 14, fontWeight: 'bold', color: '#222' },
  authorRank:  { fontSize: 12, color: '#ff6f00' },
  postMeta:    { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 },
  catBadge:    { padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: '600' },
  timeAgo:     { fontSize: 12, color: '#999' },
  postTitle:   { fontSize: 17, fontWeight: 'bold', color: '#1a237e', marginBottom: 8 },
  postBody:    { fontSize: 14, color: '#555', lineHeight: 1.6, marginBottom: 10 },
  trainTag:    { display: 'inline-block', background: '#e8eaf6', color: '#1a237e', padding: '4px 12px', borderRadius: 20, fontSize: 13, cursor: 'pointer', marginBottom: 8, fontWeight: '500' },
  tagsRow:     { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 },
  tag:         { fontSize: 12, color: '#666', background: '#f5f5f5', padding: '3px 8px', borderRadius: 10 },
  postFooter:  { display: 'flex', gap: 16, borderTop: '1px solid #f0f0f0', paddingTop: 10, marginTop: 4 },
  footerBtn:   { background: 'none', border: 'none', fontSize: 14, color: '#666', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 },
  msg:         { textAlign: 'center', color: '#666', padding: 40 },
  empty:       { textAlign: 'center', color: '#999', padding: '60px 0', fontSize: 16 },
};