import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import { Radio, Play, Eye, Crown, Users, ChevronRight } from 'lucide-react';

export default function HomePage() {
  const [publishers, setPublishers] = useState([]);
  const [liveStreams, setLiveStreams] = useState([]);
  const [tab, setTab] = useState('videos');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/publishers/').then(r => setPublishers(r.data)).catch(() => {});
    api.get('/live/').then(r => setLiveStreams(r.data)).catch(() => {});
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

        {/* VIDEOS TAB — Publishers list */}
        {tab === 'videos' && (
          <div>
            {publishers.length === 0 ? (
              <div className="empty-state" style={{ margin: '4rem auto' }}>
                <Users size={64} color="#e50914" />
                <h2>No Publishers Yet</h2>
                <p>Publishers will appear here once they sign up and upload videos.</p>
              </div>
            ) : (
              <div className="publishers-list">
                {publishers.map(p => (
                  <div key={p.id} className="publisher-row" onClick={() => navigate(`/publisher/${p.id}`)}>
                    <div className="publisher-row-avatar">{p.username[0].toUpperCase()}</div>
                    <div className="publisher-row-info">
                      <h3>{p.first_name || p.username} {p.last_name}</h3>
                      <p>@{p.username} {p.publisher_id && <span className="pub-id-tag">{p.publisher_id}</span>}</p>
                      {p.bio && <p className="pub-bio">{p.bio.slice(0, 80)}{p.bio.length > 80 ? '...' : ''}</p>}
                    </div>
                    <div className="publisher-row-meta">
                      <span><Play size={14} /> {p.video_count} videos</span>
                    </div>
                    <ChevronRight size={20} color="#555" />
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
