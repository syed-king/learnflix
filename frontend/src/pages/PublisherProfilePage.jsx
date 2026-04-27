import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import { ArrowLeft, Play, Eye, Crown, Globe, Link, Phone } from 'lucide-react';

export default function PublisherProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [publisher, setPublisher] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/publishers/'),
      api.get(`/videos/?publisher=${id}`),
    ]).then(([pubRes, vidRes]) => {
      const pub = pubRes.data.find(p => String(p.id) === String(id));
      setPublisher(pub || null);
      setVideos(vidRes.data);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-loading"><div className="spinner-lg" /></div>;
  if (!publisher) return (
    <div className="page-loading" style={{ flexDirection: 'column', gap: '1rem' }}>
      <p>Publisher not found.</p>
      <button className="btn-ghost" onClick={() => navigate('/home')}>Go Back</button>
    </div>
  );

  return (
    <div className="content-page">
      <Navbar />
      <div className="pub-profile-page">
        {/* Header */}
        <div className="pub-profile-header">
          <button className="back-btn" onClick={() => navigate('/home')}><ArrowLeft size={20} /> Back</button>
          <div className="pub-profile-info">
            <div className="pub-profile-avatar">{publisher.username[0].toUpperCase()}</div>
            <div>
              <h1>{publisher.first_name || publisher.username} {publisher.last_name}</h1>
              <p>@{publisher.username}</p>
              {publisher.publisher_id && <span className="pub-id-tag">{publisher.publisher_id}</span>}
              {publisher.bio && <p className="pub-profile-bio">{publisher.bio}</p>}
              <div className="pub-profile-links">
                {publisher.website && <a href={publisher.website} target="_blank" rel="noreferrer"><Globe size={14} /> Website</a>}
                {publisher.social_link && <a href={publisher.social_link} target="_blank" rel="noreferrer"><Link size={14} /> Social</a>}
              </div>
            </div>
            <div className="pub-profile-stat">
              <h2>{videos.length}</h2>
              <p>Videos</p>
            </div>
          </div>
        </div>

        {/* Videos */}
        <div className="pub-profile-body">
          <h2>Videos</h2>
          {videos.length === 0 ? (
            <div className="empty-state">
              <Play size={48} color="#555" />
              <p>No videos uploaded yet.</p>
            </div>
          ) : (
            <div className="content-grid">
              {videos.map(v => (
                <div key={v.id} className="content-card" onClick={() => navigate(`/watch/${v.id}`)}>
                  <div className="card-thumb" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
                    <span className="card-icon">🎬</span>
                    <div className="card-overlay"><Play size={32} fill="white" color="white" /></div>
                    {v.is_premium && <div className="card-lock"><Crown size={12} /> Premium</div>}
                  </div>
                  <div className="card-info">
                    <span className="card-type">Video</span>
                    <h3>{v.title}</h3>
                    <p>{v.description?.slice(0, 70) || 'No description'}...</p>
                    <div className="card-footer">
                      <span><Eye size={12} /> {v.views} views</span>
                      <span>{new Date(v.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
