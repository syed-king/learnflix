import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import ContentCard from '../components/ContentCard';
import { Search, Filter, Radio, Play, Eye } from 'lucide-react';

export default function HomePage() {
  const [contents, setContents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [liveStreams, setLiveStreams] = useState([]);
  const [pubVideos, setPubVideos] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeType, setActiveType] = useState('');
  const [tab, setTab] = useState('courses');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/categories/').then(r => setCategories(r.data));
    api.get('/live/').then(r => setLiveStreams(r.data)).catch(() => {});
    api.get('/videos/').then(r => setPubVideos(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (activeCategory) params.category = activeCategory;
    if (activeType) params.type = activeType;
    api.get('/content/', { params }).then(r => setContents(r.data)).finally(() => setLoading(false));
  }, [search, activeCategory, activeType]);

  const featured = contents[0];

  return (
    <div className="home-page">
      <Navbar />
      {featured && tab === 'courses' && (
        <div className="hero" style={{ backgroundImage: `linear-gradient(to right, #000 30%, transparent), url(${featured.thumbnail || ''})` }}>
          <div className="hero-content">
            <span className="hero-badge">{featured.content_type}</span>
            <h1>{featured.title}</h1>
            <p>{featured.description.slice(0, 120)}...</p>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => navigate(`/content/${featured.id}`)}>▶ Watch Now</button>
              <button className="btn-ghost" onClick={() => navigate(`/content/${featured.id}`)}>ℹ More Info</button>
            </div>
          </div>
        </div>
      )}

      <div className="home-body">
        {/* Tab switcher */}
        <div className="home-tabs">
          <button className={`home-tab ${tab === 'courses' ? 'active' : ''}`} onClick={() => setTab('courses')}>📚 Courses</button>
          <button className={`home-tab ${tab === 'live' ? 'active' : ''}`} onClick={() => setTab('live')}>
            🔴 Live <span className="live-count">{liveStreams.length}</span>
          </button>
          <button className={`home-tab ${tab === 'videos' ? 'active' : ''}`} onClick={() => setTab('videos')}>🎬 Publisher Videos</button>
        </div>

        {/* COURSES TAB */}
        {tab === 'courses' && (
          <>
            <div className="filters">
              <div className="search-box">
                <Search size={16} />
                <input placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="filter-chips">
                <button className={`chip ${!activeType ? 'active' : ''}`} onClick={() => setActiveType('')}>All</button>
                {['course', 'movie', 'series'].map(t => (
                  <button key={t} className={`chip ${activeType === t ? 'active' : ''}`} onClick={() => setActiveType(t)}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <div className="filter-chips">
                <button className={`chip ${!activeCategory ? 'active' : ''}`} onClick={() => setActiveCategory('')}>
                  <Filter size={12} /> All Categories
                </button>
                {categories.map(c => (
                  <button key={c.id} className={`chip ${activeCategory === String(c.id) ? 'active' : ''}`} onClick={() => setActiveCategory(String(c.id))}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="loading-grid">{[...Array(8)].map((_, i) => <div key={i} className="skeleton-card" />)}</div>
            ) : (
              <div className="content-grid">
                {contents.map(c => <ContentCard key={c.id} content={c} onClick={() => navigate(`/content/${c.id}`)} />)}
              </div>
            )}
          </>
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
                      <p>by {s.publisher_name}</p>
                      <span><Eye size={12} /> {s.viewer_count} watching</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PUBLISHER VIDEOS TAB */}
        {tab === 'videos' && (
          <div className="content-grid">
            {pubVideos.length === 0 ? (
              <div className="empty-state" style={{ margin: '4rem auto', gridColumn: '1/-1' }}>
                <Play size={64} color="#e50914" />
                <h2>No Publisher Videos Yet</h2>
              </div>
            ) : pubVideos.map(v => (
              <div key={v.id} className="content-card" onClick={() => navigate(`/watch/${v.id}`)}>
                <div className="card-thumb" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
                  <span className="card-icon">🎬</span>
                  <div className="card-overlay"><Play size={32} fill="white" color="white" /></div>
                </div>
                <div className="card-info">
                  <span className="card-type">Publisher Video</span>
                  <h3>{v.title}</h3>
                  <p>{v.description?.slice(0, 70)}...</p>
                  <div className="card-footer">
                    <span>by {v.publisher_name}</span>
                    <span><Eye size={12} /> {v.views}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
