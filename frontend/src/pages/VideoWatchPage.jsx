import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import Navbar from '../components/Navbar';
import SubscriptionModal from '../components/SubscriptionModal';
import { ArrowLeft, Eye, Crown, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VideoWatchPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [showSub, setShowSub] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/videos/${id}/`).then(r => {
      console.log('Video data:', r.data);
      console.log('video_file:', r.data.video_file);
      console.log('video_url:', r.data.video_url);
      setVideo(r.data);
    }).catch(err => {
      console.error('Video fetch error:', err);
      setVideo(null);
    }).finally(() => setLoading(false));
  }, [id]);

  const canWatch = video && (!video.is_premium || user?.has_active_subscription);

  // Build full video URL
  const getVideoUrl = () => {
    if (!video) return null;
    
    // Cloudinary URLs come directly from video_file field
    if (video.video_file) {
      console.log('Using Cloudinary URL:', video.video_file);
      return video.video_file;
    }
    
    if (video.video_url) {
      console.log('Using video_url:', video.video_url);
      return video.video_url;
    }
    
    return null;
  };

  const videoUrl = getVideoUrl();
  console.log('Final videoUrl:', videoUrl);

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
            videoUrl ? (
              video.video_file ? (
                <div className="video-player">
                  <video 
                    controls 
                    autoPlay 
                    style={{ width: '100%', height: '100%', borderRadius: '12px', background: '#000' }}
                    onError={(e) => {
                      console.error('Video playback error:', e);
                      console.error('Video src:', e.target.src);
                      console.error('Video error code:', e.target.error?.code);
                      console.error('Video error message:', e.target.error?.message);
                    }}
                    onLoadStart={() => console.log('Video loading started')}
                    onCanPlay={() => console.log('Video can play')}
                  >
                    <source src={videoUrl} type="video/mp4" />
                    <source src={videoUrl} type="video/webm" />
                    <source src={videoUrl} type="video/ogg" />
                    Your browser does not support video playback.
                  </video>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text3)' }}>
                    Debug: Video URL = {videoUrl}
                  </div>
                </div>
              ) : (
                <div className="video-player">
                  <iframe 
                    src={videoUrl} 
                    title={video.title} 
                    allowFullScreen 
                    allow="autoplay"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
              )
            ) : (
              <div className="watch-gate">
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <p style={{ color: 'var(--text2)' }}>No video source available.</p>
                  <p style={{ color: 'var(--text3)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    video_file: {video.video_file || 'null'}<br/>
                    video_url: {video.video_url || 'null'}
                  </p>
                </div>
              </div>
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
