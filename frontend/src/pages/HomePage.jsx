import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import { Radio, Play, Eye, Crown, Users, ChevronRight } from 'lucide-react';

export default function HomePage() {
  const [publishers, setPublishers] = useState([]);
  const [liveStreams, setLiveStreams] = useState([]);
  const [videos, setVideos] = useState([]);
  const [tab, setTab] = useState('videos');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/publishers/').then(r => setPublishers(r.data)).catch(() => {});
    api.get('/live/').then(r => setLiveStreams(r.data)).catch(() => {});
    api.get('/videos/').then(r => setVideos(r.data)).catch(() => {});
  }, []);

  return (
    <div className="home-page">
      <Navbar />

      {/* Hero */}
      <div className="viewer-hero">
        <div className="viewer-hero-content">
          <h1>Watch & Learn</h1>
          <p>Discover videos from top publishers and join live streams</p>
        </div>
      </div>

      <div className="home-body">
        {/* Tabs */}
        <div className="home-tabs">
          <button className={`home-tab ${tab === 'videos' ? 'active' : ''}`} onClick={() => setTab('videos')}>
            <Play size={16} /> Videos
          </button>
          <button className={`home-tab ${tab === 'live' ? 'active' : ''}`} onClick={() => setTab('live')}>
            🔴 Live <span className="live-count">{liveStreams.length}</span>
          </button>
        </div>

        {/* VIDEOS TAB — All videos */}
        {tab === 'videos' && (
          <div>
            {videos.length === 0 ? (
              <div className="empty-state" style={{ margin: '4rem auto' }}>
                <Play size={64} color="#e50914" />
                <h2>No Videos Yet</h2>
                <p>Videos will appear here once publishers upload content.</p>
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
                      <div className="publisher-name-row" style={{ margin: '0.25rem 0' }}>
                        <div className="pub-avatar-sm">{v.publisher_name?.[0]?.toUpperCase()}</div>
                        <span>{v.publisher_name}</span>
                      </div>
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
        )}

        {/* LIVE TAB */}
        {tab === 'live' && (
          <div>
            {liveStreams.length === 0 ? (
              <div className="empty-state" style={{ margin: '4rem auto' }}>
                <Radio size={64} color="#e50914" />
                <h2>No Live Streams Right Now</h2>
                <p>Check back later or follow your favourite publishers!</p>
              </div>
            ) : (
              <div className="live-grid">
                {liveStreams.map(s => (
                  <div key={s.id} className="live-card" onClick={() => navigate(`/live/${s.id}`)}>
                    <div className="live-thumb">
                      <span className="live-badge">🔴 LIVE</span>
                      <Radio size={40} color="white" />
                    </div>
                    <div className="live-info">
                      <h3>{s.title}</h3>
                      <div className="publisher-name-row" style={{ margin: '0.25rem 0' }}>
                        <div className="pub-avatar-sm">{s.publisher_name?.[0]?.toUpperCase()}</div>
                        <span>{s.publisher_name}</span>
                      </div>
                      <span><Eye size={12} /> {s.viewer_count} watching</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
