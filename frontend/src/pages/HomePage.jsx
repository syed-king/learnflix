import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import { Play, Info, ChevronLeft, ChevronRight, Radio, Crown, Volume2, VolumeX } from 'lucide-react';

// Horizontal scrollable row of cards
function ContentRow({ title, items, onCardClick }) {
  const rowRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  const scroll = (dir) => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 800, behavior: 'smooth' });
    setTimeout(checkScroll, 400);
  };

  if (!items.length) return null;

  return (
    <div className="nf-row">
      <h2 className="nf-row-title">{title}</h2>
      <div className="nf-row-wrap">
        {canScrollLeft && (
          <button className="nf-scroll-btn left" onClick={() => scroll(-1)}>
            <ChevronLeft size={28} />
          </button>
        )}
        <div className="nf-row-track" ref={rowRef} onScroll={checkScroll}>
          {items.map(v => (
            <div key={v.id} className="nf-card" onClick={() => onCardClick(v)}>
              <div className="nf-card-thumb">
                {v.thumbnail
                  ? <img src={v.thumbnail} alt={v.title} />
                  : <div className="nf-card-placeholder">🎬</div>
                }
                <div className="nf-card-hover">
                  <button className="nf-play-btn"><Play size={18} fill="white" /></button>
                  {v.is_premium && <span className="nf-premium-tag"><Crown size={10} /> Premium</span>}
                </div>
              </div>
              <div className="nf-card-title">{v.title}</div>
            </div>
          ))}
        </div>
        {canScrollRight && (
          <button className="nf-scroll-btn right" onClick={() => scroll(1)}>
            <ChevronRight size={28} />
          </button>
        )}
      </div>
    </div>
  );
}

// Live stream row card
function LiveRow({ streams, onCardClick }) {
  if (!streams.length) return null;
  return (
    <div className="nf-row">
      <h2 className="nf-row-title">
        <span className="nf-live-dot" />
        Live Now
      </h2>
      <div className="nf-row-wrap">
        <div className="nf-row-track">
          {streams.map(s => (
            <div key={s.id} className="nf-card nf-live-card" onClick={() => onCardClick(s)}>
              <div className="nf-card-thumb nf-live-thumb">
                <div className="nf-live-placeholder"><Radio size={36} color="white" /></div>
                <div className="nf-card-hover">
                  <button className="nf-play-btn"><Play size={18} fill="white" /></button>
                </div>
                <span className="nf-live-badge">🔴 LIVE</span>
              </div>
              <div className="nf-card-title">{s.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [videos, setVideos] = useState([]);
  const [liveStreams, setLiveStreams] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [muted, setMuted] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/videos/').then(r => {
      setVideos(r.data);
      if (r.data.length > 0) setFeatured(r.data[0]);
    }).catch(() => {});
    api.get('/live/').then(r => setLiveStreams(r.data)).catch(() => {});
  }, []);

  // Group videos into rows
  const recent    = videos.slice(0, 12);
  const premium   = videos.filter(v => v.is_premium);
  const free      = videos.filter(v => !v.is_premium);
  const popular   = [...videos].sort((a, b) => b.views - a.views).slice(0, 12);

  const handleVideoClick = (v) => navigate(`/watch/${v.id}`);
  const handleLiveClick  = (s) => navigate(`/live/${s.id}`);

  return (
    <div className="nf-home">
      <Navbar />

      {/* ── HERO BANNER ── */}
      {featured && (
        <div className="nf-hero">
          <div className="nf-hero-bg">
            {featured.thumbnail
              ? <img src={featured.thumbnail} alt={featured.title} />
              : <div className="nf-hero-fallback" />
            }
          </div>
          <div className="nf-hero-gradient" />
          <div className="nf-hero-content">
            <h1 className="nf-hero-title">{featured.title}</h1>
            {featured.description && (
              <p className="nf-hero-desc">
                {featured.description.slice(0, 150)}{featured.description.length > 150 ? '...' : ''}
              </p>
            )}
            <div className="nf-hero-actions">
              <button className="nf-btn-play" onClick={() => handleVideoClick(featured)}>
                <Play size={20} fill="black" color="black" /> Play
              </button>
              <button className="nf-btn-info" onClick={() => handleVideoClick(featured)}>
                <Info size={20} /> More Info
              </button>
            </div>
          </div>
          <button className="nf-mute-btn" onClick={() => setMuted(m => !m)}>
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      )}

      {/* ── CONTENT ROWS ── */}
      <div className="nf-rows">
        {liveStreams.length > 0 && (
          <LiveRow streams={liveStreams} onCardClick={handleLiveClick} />
        )}
        <ContentRow title="Continue Watching"  items={recent}  onCardClick={handleVideoClick} />
        {popular.length > 0 && (
          <ContentRow title="Popular on Almiftah" items={popular} onCardClick={handleVideoClick} />
        )}
        {premium.length > 0 && (
          <ContentRow title="Premium Content" items={premium} onCardClick={handleVideoClick} />
        )}
        {free.length > 0 && (
          <ContentRow title="Free to Watch" items={free} onCardClick={handleVideoClick} />
        )}
        {videos.length === 0 && (
          <div className="nf-empty">
            <Play size={64} color="#e50914" />
            <h2>No Videos Yet</h2>
            <p>Videos will appear here once publishers upload content.</p>
          </div>
        )}
      </div>
    </div>
  );
}
