import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import Navbar from '../components/Navbar';
import SubscriptionModal from '../components/SubscriptionModal';
import ReviewSection from '../components/ReviewSection';
import { Star, Lock, Play, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContentPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [showSub, setShowSub] = useState(false);
  const [watching, setWatching] = useState(false);

  useEffect(() => {
    api.get(`/content/${id}/`).then(r => setContent(r.data));
  }, [id]);

  const handleWatch = () => {
    if (!user.has_active_subscription && content.is_premium) {
      setShowSub(true);
    } else {
      setWatching(true);
    }
  };

  const onSubscribed = () => {
    setShowSub(false);
    toast.success('Subscription request submitted! Awaiting approval.');
  };

  if (!content) return <div className="page-loading"><div className="spinner-lg" /></div>;

  return (
    <div className="content-page">
      <Navbar />
      <div className="content-hero" style={{ backgroundImage: `linear-gradient(to bottom, transparent 40%, #0a0a0a), url(${content.thumbnail || '/placeholder.jpg'})` }}>
        <button className="back-btn" onClick={() => navigate('/home')}><ArrowLeft size={20} /> Back</button>
      </div>
      <div className="content-body">
        <div className="content-main">
          <div className="content-meta">
            <span className="badge">{content.content_type}</span>
            {content.is_premium && <span className="badge premium">Premium</span>}
            <span className="rating-badge"><Star size={14} fill="#f5c518" color="#f5c518" /> {content.avg_rating || 'N/A'}</span>
            <span className="review-count">{content.review_count} reviews</span>
          </div>
          <h1>{content.title}</h1>
          <p className="content-desc">{content.description}</p>

          {watching ? (
            <div className="video-player">
              <iframe src={content.video_url} title={content.title} allowFullScreen />
            </div>
          ) : (
            <div className="watch-gate">
              {content.is_premium && !user.has_active_subscription ? (
                <div className="locked-overlay">
                  <Lock size={48} color="#e50914" />
                  <h3>Premium Content</h3>
                  <p>Subscribe to unlock this content</p>
                  <button className="btn-primary" onClick={() => setShowSub(true)}>Subscribe Now</button>
                </div>
              ) : (
                <button className="btn-play" onClick={handleWatch}><Play size={24} fill="white" /> Play Now</button>
              )}
            </div>
          )}
        </div>

        <ReviewSection contentId={id} hasSubscription={user.has_active_subscription} reviews={content.reviews} onReviewAdded={() => api.get(`/content/${id}/`).then(r => setContent(r.data))} />
      </div>

      {showSub && <SubscriptionModal onClose={() => setShowSub(false)} onSubscribed={onSubscribed} />}
    </div>
  );
}
