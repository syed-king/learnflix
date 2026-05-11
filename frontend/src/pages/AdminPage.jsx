import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import { Users, CreditCard, Star, TrendingUp, Check, X, Trash2, LogOut, Upload, Radio, Plus, Play, Eye, Crown, Camera, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';
import AgoraLiveStudio from '../components/AgoraLiveStudio';

// Upload Video Modal
function UploadVideoModal({ onClose, onUploaded }) {
  const [form, setForm] = useState({ title: '', description: '', is_premium: false });
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (!file) return toast.error('Please select a video file');
    setUploading(true);
    
    try {
      const { data: sig } = await api.get('/publisher/cloudinary-signature/');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', sig.upload_preset);
      fd.append('timestamp', sig.timestamp);
      fd.append('signature', sig.signature);
      fd.append('api_key', sig.api_key);
      fd.append('folder', 'pub_videos');
      
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', e => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded * 100) / e.total));
      });
      
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${sig.cloud_name}/video/upload`;
      
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => xhr.status === 200 ? resolve(JSON.parse(xhr.responseText)) : reject();
        xhr.onerror = reject;
        xhr.open('POST', cloudinaryUrl);
        xhr.send(fd);
      });
      
      const cloudinaryRes = await uploadPromise;
      const { data } = await api.post('/publisher/videos/', {
        title: form.title,
        description: form.description,
        is_premium: form.is_premium,
        video_file: cloudinaryRes.secure_url
      });
      
      onUploaded(data);
      toast.success('Video uploaded!');
    } catch (err) {
      console.error(err);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={20} /></button>
        <h2 style={{ marginBottom: '1.5rem' }}>Upload Video</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input className="pub-input" placeholder="Video Title" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <textarea className="pub-input" placeholder="Description" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
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
            <input id="video-file-input" type="file" accept="video/*" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
          </div>
          {uploading && (
            <div className="upload-progress">
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
              <span>{progress}%</span>
            </div>
          )}
          <label className="checkbox-label">
            <input type="checkbox" checked={form.is_premium} onChange={e => setForm({ ...form, is_premium: e.target.checked })} />
            Premium content (requires subscription)
          </label>
          <button type="submit" className="btn-primary" disabled={uploading}>
            {uploading ? <><span className="spinner" /> Uploading {progress}%</> : <><Upload size={16} /> Upload Video</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// Create Stream Modal
function CreateStreamModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ title: '', description: '' });

  const submit = async e => {
    e.preventDefault();
    try {
      const { data } = await api.post('/live/', form);
      onCreate(data);
      toast.success('Stream created! Click Go Live to start.');
    } catch { toast.error('Failed to create stream'); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={20} /></button>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Radio size={36} color="#e50914" />
          <h2 style={{ marginTop: '0.75rem' }}>Create Live Stream</h2>
          <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>Set up your stream details before going live</p>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input className="pub-input" placeholder="Stream Title" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <textarea className="pub-input" placeholder="What will you be streaming about?" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <button type="submit" className="btn-primary"><Radio size={16} /> Create Stream</button>
        </form>
      </div>
    </div>
  );
}

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
          { key: 'dashboard', icon: <TrendingUp size={18} />, label: 'Dashboard' },
          { key: 'users', icon: <Users size={18} />, label: 'Users' },
          { key: 'subscriptions', icon: <CreditCard size={18} />, label: 'Subscriptions' },
          { key: 'reviews', icon: <Star size={18} />, label: 'Reviews' },
          { key: 'videos', icon: <Upload size={18} />, label: 'Videos' },
          { key: 'live', icon: <Radio size={18} />, label: 'Live Streams', dot: activeStudio },
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
                      <td><span className={`badge ${u.is_staff ? 'admin' : ''}`}>{u.is_staff ? 'Admin' : 'User'}</span></td>
                      <td>{new Date(u.date_joined).toLocaleDateString()}</td>
                      <td><span className={`badge ${u.has_active_subscription ? 'active' : ''}`}>{u.has_active_subscription ? 'Active' : 'None'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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

        {tab === 'videos' && (
          <div>
            <div className="pub-header">
              <h1>Videos ({videos.length})</h1>
              <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setShowVideoForm(true)}>
                <Plus size={16} /> Upload Video
              </button>
            </div>
            {showVideoForm && <UploadVideoModal onClose={() => setShowVideoForm(false)} onUploaded={v => { setVideos([v, ...videos]); setShowVideoForm(false); }} />}
            <div className="videos-grid">
              {videos.length === 0 ? (
                <div className="empty-state"><Upload size={48} /><p>No videos yet. Upload your first video!</p></div>
              ) : videos.map(v => (
                <div key={v.id} className="video-card">
                  <div className="video-thumb">
                    <Play size={28} color="white" />
                    {v.is_premium && <span className="card-lock" style={{ position: 'absolute', bottom: 4, left: 4 }}><Crown size={10} /></span>}
                  </div>
                  <div className="video-info">
                    <h3>{v.title}</h3>
                    <p>{v.description?.slice(0, 60) || 'No description'}...</p>
                    <div className="video-meta">
                      <span><Eye size={12} /> {v.views} views</span>
                      <span>{new Date(v.created_at).toLocaleDateString()}</span>
                      {v.video_file && <span style={{ color: '#22c55e' }}>✓ Uploaded</span>}
                    </div>
                  </div>
                  <button className="icon-btn danger" onClick={() => deleteVideo(v.id)}><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

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
                {showStreamForm && <CreateStreamModal onClose={() => setShowStreamForm(false)} onCreate={s => { setStreams([s, ...streams]); setShowStreamForm(false); }} />}
                <div className="streams-list">
                  {streams.length === 0 ? (
                    <div className="empty-state"><Radio size={48} /><p>No streams yet. Create your first live stream!</p></div>
                  ) : streams.map(s => (
                    <div key={s.id} className="stream-card">
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
