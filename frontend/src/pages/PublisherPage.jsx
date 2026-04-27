import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { Upload, Radio, Settings, Plus, Trash2, Play, Eye, X, Save, Crown } from 'lucide-react';

export default function PublisherPage() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('videos');
  const [videos, setVideos] = useState([]);
  const [streams, setStreams] = useState([]);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [showStreamForm, setShowStreamForm] = useState(false);
  const [videoForm, setVideoForm] = useState({ title: '', description: '', video_url: '', is_premium: false });
  const [streamForm, setStreamForm] = useState({ title: '', description: '', stream_url: '' });
  const [profileForm, setProfileForm] = useState({ bio: '', phone: '', website: '', social_link: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/publisher/videos/').then(r => setVideos(r.data)).catch(() => {});
    api.get('/publisher/streams/').then(r => setStreams(r.data)).catch(() => {});
    if (user?.profile) {
      setProfileForm({
        bio: user.profile.bio || '',
        phone: user.profile.phone || '',
        website: user.profile.website || '',
        social_link: user.profile.social_link || '',
      });
    }
  }, [user]);

  const uploadVideo = async e => {
    e.preventDefault();
    try {
      const { data } = await api.post('/publisher/videos/', videoForm);
      setVideos([data, ...videos]);
      setShowVideoForm(false);
      setVideoForm({ title: '', description: '', video_url: '', is_premium: false });
      toast.success('Video uploaded!');
    } catch { toast.error('Failed to upload'); }
  };

  const deleteVideo = async id => {
    await api.delete(`/publisher/videos/${id}/`);
    setVideos(videos.filter(v => v.id !== id));
    toast.success('Video deleted');
  };

  const createStream = async e => {
    e.preventDefault();
    try {
      const { data } = await api.post('/live/', streamForm);
      setStreams([data, ...streams]);
      setShowStreamForm(false);
      setStreamForm({ title: '', description: '', stream_url: '' });
      toast.success('Stream created!');
    } catch { toast.error('Failed to create stream'); }
  };

  const controlStream = async (id, action) => {
    const { data } = await api.put(`/publisher/streams/control/${id}/`, { action });
    setStreams(streams.map(s => s.id === id ? data : s));
    toast.success(action === 'go_live' ? '🔴 You are now LIVE!' : 'Stream ended');
  };

  const saveProfile = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/profile/', profileForm);
      await refreshUser();
      toast.success('Profile saved!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const profile = user?.profile;

  return (
    <div className="publisher-page">
      <Navbar />
      <div className="publisher-body">
        <aside className="publisher-sidebar">
          <div className="pub-profile">
            <div className="avatar-circle">{user?.username?.[0]?.toUpperCase()}</div>
            <div>
              <strong>{user?.username}</strong>
              <span className="pub-badge">Publisher</span>
              {profile?.publisher_id && <code className="pub-id">{profile.publisher_id}</code>}
            </div>
          </div>
          {[
            { key: 'videos', icon: <Upload size={18} />, label: 'My Videos' },
            { key: 'live', icon: <Radio size={18} />, label: 'Live Streams' },
            { key: 'settings', icon: <Settings size={18} />, label: 'Settings' },
          ].map(item => (
            <button key={item.key} className={`sidebar-btn ${tab === item.key ? 'active' : ''}`} onClick={() => setTab(item.key)}>
              {item.icon} {item.label}
            </button>
          ))}
        </aside>

        <main className="publisher-main">
          {/* VIDEOS TAB */}
          {tab === 'videos' && (
            <div>
              <div className="pub-header">
                <h1>My Videos ({videos.length})</h1>
                <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setShowVideoForm(true)}>
                  <Plus size={16} /> Upload Video
                </button>
              </div>

              {showVideoForm && (
                <div className="modal-overlay" onClick={() => setShowVideoForm(false)}>
                  <div className="modal" onClick={e => e.stopPropagation()}>
                    <button className="modal-close" onClick={() => setShowVideoForm(false)}><X size={20} /></button>
                    <h2 style={{ marginBottom: '1.5rem' }}>Upload New Video</h2>
                    <form onSubmit={uploadVideo} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <input className="pub-input" placeholder="Video Title" required value={videoForm.title} onChange={e => setVideoForm({ ...videoForm, title: e.target.value })} />
                      <textarea className="pub-input" placeholder="Description" rows={3} value={videoForm.description} onChange={e => setVideoForm({ ...videoForm, description: e.target.value })} />
                      <input className="pub-input" placeholder="Video URL (YouTube embed or direct)" required value={videoForm.video_url} onChange={e => setVideoForm({ ...videoForm, video_url: e.target.value })} />
                      <label className="checkbox-label">
                        <input type="checkbox" checked={videoForm.is_premium} onChange={e => setVideoForm({ ...videoForm, is_premium: e.target.checked })} />
                        Premium content (requires subscription)
                      </label>
                      <button type="submit" className="btn-primary"><Upload size={16} /> Upload</button>
                    </form>
                  </div>
                </div>
              )}

              <div className="videos-grid">
                {videos.length === 0 ? (
                  <div className="empty-state"><Upload size={48} /><p>No videos yet. Upload your first video!</p></div>
                ) : videos.map(v => (
                  <div key={v.id} className="video-card">
                    <div className="video-thumb">
                      <Play size={32} color="white" />
                      {v.is_premium && <span className="card-lock"><Crown size={12} /> Premium</span>}
                    </div>
                    <div className="video-info">
                      <h3>{v.title}</h3>
                      <p>{v.description?.slice(0, 60)}...</p>
                      <div className="video-meta">
                        <span><Eye size={12} /> {v.views} views</span>
                        <span>{new Date(v.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button className="icon-btn danger" onClick={() => deleteVideo(v.id)}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LIVE TAB */}
          {tab === 'live' && (
            <div>
              <div className="pub-header">
                <h1>Live Streams</h1>
                <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setShowStreamForm(true)}>
                  <Plus size={16} /> New Stream
                </button>
              </div>

              {showStreamForm && (
                <div className="modal-overlay" onClick={() => setShowStreamForm(false)}>
                  <div className="modal" onClick={e => e.stopPropagation()}>
                    <button className="modal-close" onClick={() => setShowStreamForm(false)}><X size={20} /></button>
                    <h2 style={{ marginBottom: '1.5rem' }}>Create Live Stream</h2>
                    <form onSubmit={createStream} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <input className="pub-input" placeholder="Stream Title" required value={streamForm.title} onChange={e => setStreamForm({ ...streamForm, title: e.target.value })} />
                      <textarea className="pub-input" placeholder="Description" rows={3} value={streamForm.description} onChange={e => setStreamForm({ ...streamForm, description: e.target.value })} />
                      <input className="pub-input" placeholder="Stream URL (YouTube Live / Twitch embed)" value={streamForm.stream_url} onChange={e => setStreamForm({ ...streamForm, stream_url: e.target.value })} />
                      <button type="submit" className="btn-primary"><Radio size={16} /> Create Stream</button>
                    </form>
                  </div>
                </div>
              )}

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
                        <span>Key: <code>{s.stream_key?.slice(0, 12)}...</code></span>
                        <span><Eye size={12} /> {s.viewer_count} viewers</span>
                        <span>{new Date(s.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="stream-actions">
                      {s.status === 'scheduled' && (
                        <button className="btn-live" onClick={() => controlStream(s.id, 'go_live')}>
                          <Radio size={16} /> Go Live
                        </button>
                      )}
                      {s.status === 'live' && (
                        <button className="btn-end" onClick={() => controlStream(s.id, 'end')}>
                          <X size={16} /> End Stream
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {tab === 'settings' && (
            <div>
              <h1>Publisher Settings</h1>
              <div className="settings-grid">
                <div className="settings-card">
                  <h2>Publisher Identity</h2>
                  <div className="pub-id-box">
                    <label>Your Publisher ID</label>
                    <code className="pub-id-display">{profile?.publisher_id || 'Not assigned yet'}</code>
                    <p>Share this ID with your audience to let them find you.</p>
                  </div>
                  <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <input className="pub-input" placeholder="Phone" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
                    <input className="pub-input" placeholder="Website URL" value={profileForm.website} onChange={e => setProfileForm({ ...profileForm, website: e.target.value })} />
                    <input className="pub-input" placeholder="Social Media Link" value={profileForm.social_link} onChange={e => setProfileForm({ ...profileForm, social_link: e.target.value })} />
                    <textarea className="pub-input" placeholder="Bio / About" rows={4} value={profileForm.bio} onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })} />
                    <button type="submit" className="btn-primary" disabled={saving}><Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}</button>
                  </form>
                </div>
                <div className="settings-card">
                  <h2>Stats</h2>
                  <div className="pub-stats">
                    <div className="pub-stat"><Upload size={24} color="#e50914" /><h3>{videos.length}</h3><p>Videos</p></div>
                    <div className="pub-stat"><Radio size={24} color="#22c55e" /><h3>{streams.filter(s => s.status === 'live').length}</h3><p>Live Now</p></div>
                    <div className="pub-stat"><Eye size={24} color="#0070f3" /><h3>{videos.reduce((a, v) => a + v.views, 0)}</h3><p>Total Views</p></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
