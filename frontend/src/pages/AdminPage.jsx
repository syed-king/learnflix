import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import {
  Users, CreditCard, Star, TrendingUp, Check, X, Trash2, LogOut,
  Upload, Radio, Plus, Play, Eye, Crown, Camera, Monitor, Image
} from 'lucide-react';
import toast from 'react-hot-toast';
import AgoraLiveStudio from '../components/AgoraLiveStudio';

// ── Shared: upload an image to Cloudinary and return its URL ──────────────
async function uploadImageToCloudinary(imageFile) {
  const { data: sig } = await api.get('/publisher/cloudinary-image-signature/');
  const fd = new FormData();
  fd.append('file', imageFile);
  fd.append('timestamp', sig.timestamp);
  fd.append('signature', sig.signature);
  fd.append('api_key', sig.api_key);
  fd.append('folder', 'pub_thumbnails');

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`, {
    method: 'POST',
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || 'Banner upload failed');
  }
  const data = await res.json();
  return data.secure_url;
}

// ── Banner picker sub-component ───────────────────────────────────────────
function BannerPicker({ banner, setBanner, label = 'Banner Image' }) {
  const [preview, setPreview] = useState(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setBanner(f);
    setPreview(URL.createObjectURL(f));
  };

  const clear = (e) => {
    e.stopPropagation();
    setBanner(null);
    setPreview(null);
  };

  return (
    <div>
      <label style={{ fontSize: '0.8rem', color: 'var(--text2)', marginBottom: '0.4rem', display: 'block' }}>
        {label} <span style={{ color: 'var(--text3)' }}>(optional — auto-generated if skipped)</span>
      </label>
      <div
        className="banner-picker"
        onClick={() => document.getElementById('banner-file-input').click()}
        style={preview ? { backgroundImage: `url(${preview})` } : {}}
      >
        {preview ? (
          <div className="banner-picker-overlay">
            <span style={{ fontSize: '0.85rem', color: 'white' }}>Click to change</span>
            <button className="banner-clear-btn" onClick={clear}><X size={14} /></button>
          </div>
        ) : (
          <div className="banner-picker-empty">
            <Image size={28} color="#555" />
            <span>Click to add banner image</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>JPG, PNG, WEBP — 16:9 recommended</span>
          </div>
        )}
        <input
          id="banner-file-input"
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
      </div>
    </div>
  );
}

// ── Upload Video Modal ────────────────────────────────────────────────────
function UploadVideoModal({ onClose, onUploaded }) {
  const [form, setForm] = useState({ title: '', description: '', is_premium: false });
  const [file, setFile] = useState(null);
  const [banner, setBanner] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState('');

  const submit = async e => {
    e.preventDefault();
    if (!file) return toast.error('Please select a video file');
    setUploading(true);

    try {
      // 1. Upload banner image if provided
      let thumbnailUrl = '';
      if (banner) {
        setUploadStage('Uploading banner...');
        thumbnailUrl = await uploadImageToCloudinary(banner);
      }

      // 2. Get video upload signature
      setUploadStage('Uploading video...');
      const { data: sig } = await api.get('/publisher/cloudinary-signature/');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('timestamp', sig.timestamp);
      fd.append('signature', sig.signature);
      fd.append('api_key', sig.api_key);
      fd.append('folder', 'pub_videos');

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', e => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded * 100) / e.total));
      });

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${sig.cloud_name}/video/upload`;
      const cloudinaryRes = await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
          else {
            const errBody = JSON.parse(xhr.responseText || '{}');
            reject(new Error(errBody?.error?.message || `Upload failed (${xhr.status})`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.open('POST', cloudinaryUrl);
        xhr.send(fd);
      });

      // 3. Save to backend
      setUploadStage('Saving...');
      const payload = {
        title: form.title,
        description: form.description,
        is_premium: form.is_premium,
        video_file: cloudinaryRes.secure_url,
      };
      if (thumbnailUrl) payload.thumbnail = thumbnailUrl;

      const { data } = await api.post('/publisher/videos/', payload);
      onUploaded(data);
      toast.success('Video uploaded!');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadStage('');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={20} /></button>
        <h2 style={{ marginBottom: '1.5rem' }}>Upload Video</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            className="pub-input" placeholder="Video Title" required
            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            className="pub-input" placeholder="Description" rows={2}
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
          />

          {/* Video file picker */}
          <div className="file-drop-zone" onClick={() => document.getElementById('video-file-input').click()}>
            {file ? (
              <div className="file-selected">
                <Play size={24} color="#e50914" />
                <span>{file.name}</span>
                <span style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
              </div>
            ) : (
              <>
                <Upload size={32} color="#555" />
                <p>Click to select video file</p>
                <span>MP4, MOV, AVI, MKV supported</span>
              </>
            )}
            <input
              id="video-file-input" type="file" accept="video/*"
              style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])}
            />
          </div>

          {/* Banner picker */}
          <BannerPicker banner={banner} setBanner={setBanner} label="Video Banner / Thumbnail" />

          {/* Progress */}
          {uploading && (
            <div className="upload-progress">
              <div style={{ fontSize: '0.8rem', color: 'var(--text2)', marginBottom: '0.4rem' }}>{uploadStage}</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span>{progress}%</span>
            </div>
          )}

          <label className="checkbox-label">
            <input type="checkbox" checked={form.is_premium} onChange={e => setForm({ ...form, is_premium: e.target.checked })} />
            Premium content (requires subscription)
          </label>
          <button type="submit" className="btn-primary" disabled={uploading}>
            {uploading ? <><span className="spinner" /> {uploadStage || 'Uploading...'}</> : <><Upload size={16} /> Upload Video</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Create Stream Modal ───────────────────────────────────────────────────
function CreateStreamModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ title: '', description: '' });
  const [banner, setBanner] = useState(null);
  const [saving, setSaving] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      let thumbnailUrl = '';
      if (banner) {
        thumbnailUrl = await uploadImageToCloudinary(banner);
      }
      const payload = { ...form };
      if (thumbnailUrl) payload.thumbnail = thumbnailUrl;

      const { data } = await api.post('/live/', payload);
      onCreate(data);
      toast.success('Stream created! Click Go Live to start.');
    } catch (err) {
      toast.error(err.message || 'Failed to create stream');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={20} /></button>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Radio size={36} color="#e50914" />
          <h2 style={{ marginTop: '0.75rem' }}>Create Live Stream</h2>
          <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>Set up your stream before going live</p>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            className="pub-input" placeholder="Stream Title" required
            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            className="pub-input" placeholder="What will you be streaming about?" rows={2}
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
          />

          {/* Banner picker */}
          <BannerPicker banner={banner} setBanner={setBanner} label="Stream Banner" />

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <><span className="spinner" /> Creating...</> : <><Radio size={16} /> Create Stream</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Admin Page ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [subs, setSubs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [subFilter, setSubFilter] = useState('');
  const [videos, setVideos] = useState([]);
  const [streams, setStreams] = useState([]);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [showStreamForm, setShowStreamForm] = useState(false);
  const [activeStudio, setActiveStudio] = useState(null);

  useEffect(() => {
    if (!user?.is_staff) { navigate('/home'); return; }
    api.get('/admin/users/').then(r => setUsers(r.data));
    api.get('/admin/reviews/').then(r => setReviews(r.data));
    api.get('/publisher/videos/').then(r => setVideos(r.data)).catch(() => {});
    api.get('/publisher/streams/').then(r => setStreams(r.data)).catch(() => {});
  }, [user]);

  useEffect(() => {
    const params = subFilter ? { status: subFilter } : {};
    api.get('/admin/subscriptions/', { params }).then(r => setSubs(r.data));
  }, [subFilter]);

  const updateSub = async (id, status) => {
    await api.put(`/admin/subscriptions/${id}/`, { status });
    const params = subFilter ? { status: subFilter } : {};
    api.get('/admin/subscriptions/', { params }).then(r => setSubs(r.data));
    toast.success(`Subscription ${status}`);
  };

  const deleteReview = async id => {
    await api.delete(`/admin/reviews/${id}/`);
    setReviews(reviews.filter(r => r.id !== id));
    toast.success('Review deleted');
  };

  const deleteVideo = async id => {
    await api.delete(`/publisher/videos/${id}/`);
    setVideos(videos.filter(v => v.id !== id));
    toast.success('Video deleted');
  };

  const goLive = async stream => {
    const { data } = await api.put(`/publisher/streams/control/${stream.id}/`, { action: 'go_live' });
    setStreams(streams.map(s => s.id === stream.id ? data : s));
    setActiveStudio(data);
    setTab('live');
  };

  const endStream = async () => {
    if (!activeStudio) return;
    const { data } = await api.put(`/publisher/streams/control/${activeStudio.id}/`, { action: 'end' });
    setStreams(streams.map(s => s.id === activeStudio.id ? data : s));
    setActiveStudio(null);
    toast.success('Stream ended');
  };

  const stats = {
    totalUsers: users.length,
    activeSubscriptions: subs.filter(s => s.status === 'active').length,
    pendingSubscriptions: subs.filter(s => s.status === 'pending').length,
    totalReviews: reviews.length,
    totalVideos: videos.length,
    liveStreams: streams.filter(s => s.status === 'live').length,
  };

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="logo" style={{ padding: '1.5rem', borderBottom: '1px solid #222' }}>
          <span style={{ color: '#e50914', fontSize: '1.4rem', fontWeight: 800 }}>Almiftah</span>
          <span style={{ color: '#888', fontSize: '0.75rem', display: 'block' }}>Admin Panel</span>
        </div>
        {[
          { key: 'dashboard',     icon: <TrendingUp size={18} />, label: 'Dashboard' },
          { key: 'users',         icon: <Users size={18} />,      label: 'Users' },
          { key: 'subscriptions', icon: <CreditCard size={18} />, label: 'Subscriptions' },
          { key: 'reviews',       icon: <Star size={18} />,       label: 'Reviews' },
          { key: 'videos',        icon: <Upload size={18} />,     label: 'Videos' },
          { key: 'live',          icon: <Radio size={18} />,      label: 'Live Streams', dot: activeStudio },
        ].map(item => (
          <button key={item.key} className={`sidebar-btn ${tab === item.key ? 'active' : ''}`} onClick={() => setTab(item.key)}>
            {item.icon} {item.label}
            {item.dot && <span className="live-dot" />}
          </button>
        ))}
        <button className="sidebar-btn" style={{ marginTop: 'auto', color: '#e50914' }} onClick={() => { logout(); navigate('/'); }}>
          <LogOut size={18} /> Logout
        </button>
      </aside>

      <main className="admin-main">

        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <div>
            <h1>Dashboard</h1>
            <div className="stats-grid">
              <div className="stat-card"><Users size={32} color="#e50914" /><div><h3>{stats.totalUsers}</h3><p>Total Users</p></div></div>
              <div className="stat-card"><CreditCard size={32} color="#22c55e" /><div><h3>{stats.activeSubscriptions}</h3><p>Active Subscriptions</p></div></div>
              <div className="stat-card"><CreditCard size={32} color="#f59e0b" /><div><h3>{stats.pendingSubscriptions}</h3><p>Pending Approvals</p></div></div>
              <div className="stat-card"><Star size={32} color="#a855f7" /><div><h3>{stats.totalReviews}</h3><p>Total Reviews</p></div></div>
              <div className="stat-card"><Upload size={32} color="#0070f3" /><div><h3>{stats.totalVideos}</h3><p>Total Videos</p></div></div>
              <div className="stat-card"><Radio size={32} color="#22c55e" /><div><h3>{stats.liveStreams}</h3><p>Live Now</p></div></div>
            </div>
          </div>
        )}

        {/* USERS */}
        {tab === 'users' && (
          <div>
            <h1>Users ({users.length})</h1>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Username</th><th>Email</th><th>Name</th><th>Role</th><th>Joined</th><th>Subscription</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td><strong>{u.username}</strong></td>
                      <td>{u.email}</td>
                      <td>{u.first_name} {u.last_name}</td>
                      <td><span className={`badge ${u.is_staff ? 'admin' : ''}`}>{u.is_staff ? 'Admin' : 'Viewer'}</span></td>
                      <td>{new Date(u.date_joined).toLocaleDateString()}</td>
                      <td><span className={`badge ${u.has_active_subscription ? 'active' : ''}`}>{u.has_active_subscription ? 'Active' : 'None'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBSCRIPTIONS */}
        {tab === 'subscriptions' && (
          <div>
            <div className="admin-header">
              <h1>Subscriptions</h1>
              <div className="filter-chips">
                {['', 'pending', 'active', 'expired', 'cancelled'].map(s => (
                  <button key={s} className={`chip ${subFilter === s ? 'active' : ''}`} onClick={() => setSubFilter(s)}>
                    {s || 'All'}
                  </button>
                ))}
              </div>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>User</th><th>Email</th><th>Plan</th><th>Price</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {subs.map(s => (
                    <tr key={s.id}>
                      <td><strong>{s.username}</strong></td>
                      <td>{s.email}</td>
                      <td>{s.plan_name}</td>
                      <td>${s.plan_price}</td>
                      <td><span className={`badge ${s.status}`}>{s.status}</span></td>
                      <td>{new Date(s.created_at).toLocaleDateString()}</td>
                      <td>
                        {s.status === 'pending' && (
                          <div className="action-btns">
                            <button className="icon-btn success" onClick={() => updateSub(s.id, 'active')}><Check size={16} /></button>
                            <button className="icon-btn danger" onClick={() => updateSub(s.id, 'cancelled')}><X size={16} /></button>
                          </div>
                        )}
                        {s.status === 'active' && (
                          <button className="icon-btn danger" onClick={() => updateSub(s.id, 'cancelled')}><X size={16} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REVIEWS */}
        {tab === 'reviews' && (
          <div>
            <h1>Reviews ({reviews.length})</h1>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>User</th><th>Content</th><th>Rating</th><th>Comment</th><th>Date</th><th>Action</th></tr></thead>
                <tbody>
                  {reviews.map(r => (
                    <tr key={r.id}>
                      <td><strong>{r.user}</strong></td>
                      <td>{r.content}</td>
                      <td>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</td>
                      <td>{r.comment || '—'}</td>
                      <td>{new Date(r.created_at).toLocaleDateString()}</td>
                      <td><button className="icon-btn danger" onClick={() => deleteReview(r.id)}><Trash2 size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIDEOS */}
        {tab === 'videos' && (
          <div>
            <div className="pub-header">
              <h1>Videos ({videos.length})</h1>
              <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setShowVideoForm(true)}>
                <Plus size={16} /> Upload Video
              </button>
            </div>
            {showVideoForm && (
              <UploadVideoModal
                onClose={() => setShowVideoForm(false)}
                onUploaded={v => { setVideos([v, ...videos]); setShowVideoForm(false); }}
              />
            )}
            <div className="videos-grid">
              {videos.length === 0 ? (
                <div className="empty-state"><Upload size={48} /><p>No videos yet. Upload your first video!</p></div>
              ) : videos.map(v => (
                <div key={v.id} className="video-card">
                  <div className="video-thumb" style={v.thumbnail ? { backgroundImage: `url(${v.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                    {!v.thumbnail && <Play size={28} color="white" />}
                    {v.is_premium && <span className="card-lock" style={{ position: 'absolute', bottom: 4, left: 4 }}><Crown size={10} /></span>}
                  </div>
                  <div className="video-info">
                    <h3>{v.title}</h3>
                    <p>{v.description?.slice(0, 60) || 'No description'}...</p>
                    <div className="video-meta">
                      <span><Eye size={12} /> {v.views} views</span>
                      <span>{new Date(v.created_at).toLocaleDateString()}</span>
                      {v.thumbnail ? <span style={{ color: '#22c55e' }}>✓ Banner</span> : <span style={{ color: 'var(--text3)' }}>Auto banner</span>}
                    </div>
                  </div>
                  <button className="icon-btn danger" onClick={() => deleteVideo(v.id)}><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LIVE */}
        {tab === 'live' && (
          <div>
            {activeStudio ? (
              <AgoraLiveStudio stream={activeStudio} onEnd={endStream} />
            ) : (
              <>
                <div className="pub-header">
                  <h1>Live Streams</h1>
                  <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setShowStreamForm(true)}>
                    <Plus size={16} /> New Stream
                  </button>
                </div>
                {showStreamForm && (
                  <CreateStreamModal
                    onClose={() => setShowStreamForm(false)}
                    onCreate={s => { setStreams([s, ...streams]); setShowStreamForm(false); }}
                  />
                )}
                <div className="streams-list">
                  {streams.length === 0 ? (
                    <div className="empty-state"><Radio size={48} /><p>No streams yet. Create your first live stream!</p></div>
                  ) : streams.map(s => (
                    <div key={s.id} className="stream-card">
                      {/* Stream banner preview */}
                      {s.thumbnail && (
                        <div className="stream-banner-preview" style={{ backgroundImage: `url(${s.thumbnail})` }} />
                      )}
                      <div className="stream-info">
                        <div className="stream-status-row">
                          <span className={`stream-status ${s.status}`}>{s.status === 'live' ? '🔴 LIVE' : s.status}</span>
                          <h3>{s.title}</h3>
                        </div>
                        <p>{s.description}</p>
                        <div className="stream-meta">
                          <span><Monitor size={12} /> Key: <code>{s.stream_key?.slice(0, 12)}...</code></span>
                          <span><Eye size={12} /> {s.viewer_count} viewers</span>
                          <span>{new Date(s.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="stream-actions">
                        {s.status === 'scheduled' && (
                          <button className="btn-live" onClick={() => goLive(s)}>
                            <Camera size={16} /> Go Live
                          </button>
                        )}
                        {s.status === 'live' && (
                          <button className="btn-live" onClick={() => setActiveStudio(s)}>
                            <Radio size={16} /> Open Studio
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
