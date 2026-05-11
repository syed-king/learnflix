import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { Upload, Radio, Settings, Plus, Trash2, Play, Eye, X, Save, Crown, Camera, Mic, MicOff, Monitor, StopCircle } from 'lucide-react';
import AgoraLiveStudio from '../components/AgoraLiveStudio';

// ── Upload Video Form ──────────────────────────────────────────────────────
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
      // Get Cloudinary signature
      const { data: sig } = await api.get('/publisher/cloudinary-signature/');
      
      // Upload directly to Cloudinary
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
      
      // Save video metadata to backend
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

// ── Create Stream Modal ────────────────────────────────────────────────────
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

// ── Main Publisher Page ────────────────────────────────────────────────────
export default function PublisherPage() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('videos');
  const [videos, setVideos] = useState([]);
  const [streams, setStreams] = useState([]);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [showStreamForm, setShowStreamForm] = useState(false);
  const [activeStudio, setActiveStudio] = useState(null);
  const [profileForm, setProfileForm] = useState({ bio: '', phone: '', website: '', social_link: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/publisher/videos/').then(r => setVideos(r.data)).catch(() => {});
    api.get('/publisher/streams/').then(r => setStreams(r.data)).catch(() => {});
    if (user?.profile) {
      setProfileForm({ bio: user.profile.bio || '', phone: user.profile.phone || '', website: user.profile.website || '', social_link: user.profile.social_link || '' });
    }
  }, [user]);

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
            { key: 'live', icon: <Radio size={18} />, label: 'Live Streams', dot: activeStudio },
            { key: 'settings', icon: <Settings size={18} />, label: 'Settings' },
          ].map(item => (
            <button key={item.key} className={`sidebar-btn ${tab === item.key ? 'active' : ''}`} onClick={() => setTab(item.key)}>
              {item.icon} {item.label}
              {item.dot && <span className="live-dot" />}
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

          {/* LIVE TAB */}
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
                          {s.status === 'scheduled' && (
                            <div style={{ marginTop: '0.75rem' }}>
                              <input 
                                className="pub-input" 
                                placeholder="Stream URL (YouTube Live embed, etc.)" 
                                defaultValue={s.stream_url}
                                onBlur={async (e) => {
                                  if (e.target.value !== s.stream_url) {
                                    try {
                                      await api.put(`/publisher/streams/${s.id}/`, { stream_url: e.target.value });
                                      toast.success('Stream URL updated');
                                      const { data } = await api.get('/publisher/streams/');
                                      setStreams(data);
                                    } catch { toast.error('Failed to update'); }
                                  }
                                }}
                              />
                            </div>
                          )}
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
