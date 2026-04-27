import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import Navbar from '../components/Navbar';
import SubscriptionModal from '../components/SubscriptionModal';
import { ArrowLeft, Eye, Crown, Lock, Globe, Link } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VideoWatchPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [showSub, setShowSub] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/videos/${id}/`).then(r => setVideo(r.data)).catch(() => setVideo(null)).finally(() => setLoading(false));
  }, [id]);

  const canWatch = video && (!video.is_premium || user?.has_active_subscription);

  if (loading) return <div className="page-loading"><div className="spinner-lg" /></div>;
  if (!video) return (
    <div className="page-loading" style={{ flexDirection: 'column', gap: '1rem' }}>
      <p>Video not found.</p>
      <button className="btn-ghost" onClick={() => navigate('/home')}>Go Back</button>
    </div>
  );

  return (
    <div className="content-page">
      <Navbar />
      <div style={{ padding: '5rem 3rem 0' }}>
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /> Back</button>
      </div>

      <div className="video-watch-body">
        {/* Video Player */}
        <div className="video-watch-main">
          {canWatch ? (
            video.video_file ? (
              <div className="video-player">
                <video controls autoPlay style={{ width: '100%', height: '100%', borderRadius: '12px' }}>
                  <source src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${video.video_file}`} />
                  Your browser does not support video playback.
                </video>
              </div>
            ) : video.video_url ? (
              <div className="video-player">
                <iframe src={video.video_url} title={video.title} allowFullScreen />
              </div>
            ) : (
              <div className="watch-gate"><p style={{ color: 'var(--text2)' }}>No video source available.</p></div>
            )
          ) : (
            <div className="watch-gate">
              <div className="locked-overlay">
                <Lock size={48} color="#e50914" />
                <h3>Premium Content</h3>
                <p>Subscribe to unlock this video</p>
                <button className="btn-primary" style={{ width: 'auto', margin: '0 auto' }} onClick={() => setShowSub(true)}>
                  <Crown size={16} /> Subscribe Now
                </button>
              </div>
            </div>
          )}

          {/* Video Info */}
          <div className="video-watch-info">
            <div className="content-meta">
              <span className="badge">Video</span>
              {video.is_premium && <span className="badge premium"><Crown size={12} /> Premium</span>}
              <span style={{ color: 'var(--text3)', fontSize: '0.85rem' }}><Eye size={14} /> {video.views} views</span>
            </div>
            <h1>{video.title}</h1>
            {video.description && <p style={{ color: 'var(--text2)', lineHeight: 1.7, marginTop: '0.75rem' }}>{video.description}</p>}
          </div>
        </div>

        {/* Publisher Info Sidebar */}
        <div className="video-watch-sidebar">
          <div className="settings-card">
            <h2>Publisher</h2>
            <div
              className="pub-sidebar-profile"
              onClick={() => {
                api.get('/publishers/').then(r => {
                  const pub = r.data.find(p => p.username === video.publisher_name);
                  if (pub) navigate(`/publisher/${pub.id}`);
                });
              }}
            >
              <div className="avatar-circle" style={{ width: 48, height: 48, fontSize: '1.2rem' }}>
                {video.publisher_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <strong>{video.publisher_name}</strong>
                <p style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>View all videos →</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSub && (
        <SubscriptionModal
          onClose={() => setShowSub(false)}
          onSubscribed={() => { setShowSub(false); toast.success('Subscription pending approval!'); }}
        />
      )}
    </div>
  );
}
