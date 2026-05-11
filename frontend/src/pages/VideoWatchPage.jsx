import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import Navbar from '../components/Navbar';
import SubscriptionModal from '../components/SubscriptionModal';
import { ArrowLeft, Eye, Crown, Lock, Play, ThumbsUp, Share2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

// Related video card
function RelatedCard({ video, onClick }) {
  return (
    <div className="watch-related-card" onClick={() => onClick(video.id)}>
      <div className="watch-related-thumb">
        {video.thumbnail
          ? <img src={video.thumbnail} alt={video.title} />
          : <div className="watch-related-placeholder">🎬</div>
        }
        {video.is_premium && (
          <span className="watch-related-premium"><Crown size={9} /></span>
        )}
      </div>
      <div className="watch-related-info">
        <div className="watch-related-title">{video.title}</div>
        <div className="watch-related-meta">
          <span><Eye size={11} /> {video.views} views</span>
          <span><Clock size={11} /> {new Date(video.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

export default function VideoWatchPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [related, setRelated] = useState([]);
  const [showSub, setShowSub] = useState(false);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/videos/${id}/`).then(r => {
      setVideo(r.data);
    }).catch(() => setVideo(null)).finally(() => setLoading(false));

    // Fetch related videos
    api.get('/videos/').then(r => {
      setRelated(r.data.filter(v => String(v.id) !== String(id)).slice(0, 12));
    }).catch(() => {});
  }, [id]);

  const canWatch = video && (!video.is_premium || user?.has_active_subscription);

  const getVideoUrl = () => {
    if (!video) return null;
    if (video.video_file) return video.video_file;
    if (video.video_url) return video.video_url;
    return null;
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success('Link copied!');
  };

  if (loading) return (
    <div className="watch-loading">
      <Navbar />
      <div className="watch-skeleton-wrap">
        <div className="watch-sk-player" />
        <div className="watch-sk-info">
          <div className="watch-sk-title" />
          <div className="watch-sk-meta" />
          <div className="watch-sk-desc" />
        </div>
      </div>
    </div>
  );

  if (!video) return (
    <div className="page-loading" style={{ flexDirection: 'column', gap: '1rem' }}>
      <Play size={48} color="#e50914" />
      <p style={{ color: 'var(--text2)' }}>Video not found.</p>
      <button className="nf-btn-info" onClick={() => navigate('/home')}>
        <ArrowLeft size={16} /> Go Home
      </button>
    </div>
  );

  const videoUrl = getVideoUrl();

  return (
    <div className="watch-page">
      <Navbar />

      <div className="watch-layout">
        {/* ── LEFT: Player + Info ── */}
        <div className="watch-main">
          {/* Back button */}
          <button className="watch-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> Back
          </button>

          {/* Player */}
          <div className="watch-player-wrap">
            {canWatch ? (
              videoUrl ? (
                video.video_file ? (
                  <video
                    className="watch-video"
                    controls
                    autoPlay
                    playsInline
                  >
                    <source src={videoUrl} type="video/mp4" />
                    <source src={videoUrl} type="video/webm" />
                    Your browser does not support video playback.
                  </video>
                ) : (
                  <iframe
                    className="watch-video"
                    src={videoUrl}
                    title={video.title}
                    allowFullScreen
                    allow="autoplay; encrypted-media"
                  />
                )
              ) : (
                <div className="watch-no-source">
                  <Play size={48} color="#555" />
                  <p>No video source available.</p>
                </div>
              )
            ) : (
              <div className="watch-locked">
                <div className="watch-locked-inner">
                  <div className="watch-locked-icon">
                    <Lock size={40} color="#e50914" />
                  </div>
                  <h3>Premium Content</h3>
                  <p>Subscribe to unlock this video and all premium content</p>
                  <button className="nf-btn-play" onClick={() => setShowSub(true)}>
                    <Crown size={18} /> Subscribe Now
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Video info */}
          <div className="watch-info">
            <div className="watch-info-top">
              <div className="watch-tags">
                {video.is_premium
                  ? <span className="watch-tag premium"><Crown size={11} /> Premium</span>
                  : <span className="watch-tag free">Free</span>
                }
                {video.category_name && (
                  <span className="watch-tag category">{video.category_name}</span>
                )}
              </div>
              <h1 className="watch-title">{video.title}</h1>
              <div className="watch-meta-row">
                <span className="watch-views"><Eye size={14} /> {video.views} views</span>
                <span className="watch-date">
                  <Clock size={14} /> {new Date(video.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="watch-actions">
              <button
                className={`watch-action-btn ${liked ? 'active' : ''}`}
                onClick={() => setLiked(l => !l)}
              >
                <ThumbsUp size={18} fill={liked ? 'white' : 'none'} />
                <span>{liked ? 'Liked' : 'Like'}</span>
              </button>
              <button className="watch-action-btn" onClick={handleShare}>
                <Share2 size={18} />
                <span>Share</span>
              </button>
              {!canWatch && (
                <button className="watch-action-btn watch-subscribe-btn" onClick={() => setShowSub(true)}>
                  <Crown size={18} />
                  <span>Subscribe</span>
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="watch-divider" />

            {/* Description */}
            {video.description && (
              <div className="watch-description">
                <p>{video.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Related videos ── */}
        <aside className="watch-sidebar">
          <h3 className="watch-sidebar-title">More to Watch</h3>
          <div className="watch-related-list">
            {related.length === 0 ? (
              <p style={{ color: 'var(--text3)', fontSize: '0.85rem', padding: '1rem 0' }}>No other videos yet.</p>
            ) : related.map(v => (
              <RelatedCard key={v.id} video={v} onClick={(vid_id) => navigate(`/watch/${vid_id}`)} />
            ))}
          </div>
        </aside>
      </div>

      {showSub && (
        <SubscriptionModal
          onClose={() => setShowSub(false)}
          onSubscribed={() => {
            setShowSub(false);
            toast.success('Subscription pending approval!');
          }}
        />
      )}
    </div>
  );
}
