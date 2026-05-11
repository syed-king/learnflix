import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import { Play, Info, ChevronLeft, ChevronRight, Radio, Crown, Eye, Clock } from 'lucide-react';

// ── Skeleton loader for cards ──────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="nf-row">
      <div className="nf-skeleton-title" />
      <div className="nf-row-wrap">
        <div className="nf-row-track" style={{ pointerEvents: 'none' }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="nf-card">
              <div className="nf-skeleton-card" />
              <div className="nf-skeleton-label" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Card tooltip on hover ──────────────────────────────────────────────────
function VideoCard({ video, onClick }) {
  return (
    <div className="nf-card" onClick={() => onClick(video)}>
      <div className="nf-card-thumb">
        {video.thumbnail
          ? <img src={video.thumbnail} alt={video.title} loading="lazy" />
          : <div className="nf-card-placeholder">🎬</div>
        }
        <div className="nf-card-hover">
          <div className="nf-card-hover-top">
            <button className="nf-play-btn" aria-label="Play">
              <Play size={16} fill="white" />
            </button>
            {video.is_premium && (
              <span className="nf-premium-tag"><Crown size={9} /> Premium</span>
            )}
          </div>
          <div className="nf-card-hover-info">
            <div className="nf-card-hover-title">{video.title}</div>
            <div className="nf-card-hover-meta">
              <span><Eye size={11} /> {video.views}</span>
              <span><Clock size={11} /> {new Date(video.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="nf-card-title">{video.title}</div>
    </div>
  );
}

// ── Horizontal scrollable row ──────────────────────────────────────────────
function ContentRow({ title, items, onCardClick, badge }) {
  const rowRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = rowRef.current;
    if (el) el.addEventListener('scroll', checkScroll);
    return () => el?.removeEventListener('scroll', checkScroll);
  }, [items]);

  const scroll = (dir) => {
    rowRef.current?.scrollBy({ left: dir * 900, behavior: 'smooth' });
  };

  if (!items.length) return null;

  return (
    <div className="nf-row">
      <h2 className="nf-row-title">
        {title}
        {badge && <span className="nf-row-badge">{badge}</span>}
      </h2>
      <div className="nf-row-wrap">
        {canScrollLeft && (
          <button className="nf-scroll-btn left" onClick={() => scroll(-1)} aria-label="Scroll left">
            <ChevronLeft size={26} />
          </button>
        )}
        <div className="nf-row-track" ref={rowRef}>
          {items.map(v => (
            <VideoCard key={v.id} video={v} onClick={onCardClick} />
          ))}
        </div>
        {canScrollRight && (
          <button className="nf-scroll-btn right" onClick={() => scroll(1)} aria-label="Scroll right">
            <ChevronRight size={26} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Live row ───────────────────────────────────────────────────────────────
function LiveRow({ streams, onCardClick }) {
  if (!streams.length) return null;
  return (
    <div className="nf-row">
      <h2 className="nf-row-title">
        <span className="nf-live-dot" />
        Live Now
        <span className="nf-row-badge nf-live-count">{streams.length}</span>
      </h2>
      <div className="nf-row-wrap">
        <div className="nf-row-track">
          {streams.map(s => (
            <div key={s.id} className="nf-card nf-live-card" onClick={() => onCardClick(s)}>
              <div className="nf-card-thumb nf-live-thumb">
                <div className="nf-live-placeholder"><Radio size={32} color="rgba(255,255,255,0.7)" /></div>
                <div className="nf-card-hover">
                  <div className="nf-card-hover-top">
                    <button className="nf-play-btn"><Play size={16} fill="white" /></button>
                  </div>
                  <div className="nf-card-hover-info">
                    <div className="nf-card-hover-title">{s.title}</div>
                    <div className="nf-card-hover-meta">
                      <span><Eye size={11} /> {s.viewer_count} watching</span>
                    </div>
                  </div>
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

// ── Hero skeleton ──────────────────────────────────────────────────────────
function HeroSkeleton() {
  return (
    <div className="nf-hero nf-hero-skeleton">
      <div className="nf-hero-gradient" />
      <div className="nf-hero-content">
        <div className="nf-sk nf-sk-title" />
        <div className="nf-sk nf-sk-desc" />
        <div className="nf-sk nf-sk-desc" style={{ width: '60%' }} />
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
          <div className="nf-sk nf-sk-btn" />
          <div className="nf-sk nf-sk-btn" style={{ width: 140 }} />
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function HomePage() {
  const [videos, setVideos] = useState([]);
  const [liveStreams, setLiveStreams] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/videos/'),
      api.get('/live/'),
    ]).then(([vRes, lRes]) => {
      const vids = vRes.data;
      setVideos(vids);
      setLiveStreams(lRes.data);
      // Pick a random featured video from top 5 most viewed
      if (vids.length > 0) {
        const top = [...vids].sort((a, b) => b.views - a.views).slice(0, 5);
        setFeatured(top[Math.floor(Math.random() * top.length)]);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const recent  = videos.slice(0, 15);
  const popular = [...videos].sort((a, b) => b.views - a.views).slice(0, 15);
  const premium = videos.filter(v => v.is_premium);
  const free    = videos.filter(v => !v.is_premium);

  const handleVideoClick = (v) => navigate(`/watch/${v.id}`);
  const handleLiveClick  = (s) => navigate(`/live/${s.id}`);

  return (
    <div className="nf-home">
      <Navbar />

      {/* ── HERO ── */}
      {loading ? <HeroSkeleton /> : featured ? (
        <div className="nf-hero">
          <div className="nf-hero-bg">
            {featured.thumbnail
              ? <img src={featured.thumbnail} alt={featured.title} />
              : <div className="nf-hero-fallback" />
            }
          </div>
          <div className="nf-hero-gradient" />

          {/* Top fade for navbar */}
          <div className="nf-hero-top-fade" />

          <div className="nf-hero-content">
            {featured.is_premium && (
              <div className="nf-hero-premium-badge"><Crown size={12} /> Premium</div>
            )}
            <h1 className="nf-hero-title">{featured.title}</h1>
            {featured.description && (
              <p className="nf-hero-desc">
                {featured.description.slice(0, 160)}{featured.description.length > 160 ? '...' : ''}
              </p>
            )}
            <div className="nf-hero-meta">
              <span className="nf-hero-views"><Eye size={14} /> {featured.views} views</span>
              {featured.is_premium && <span className="nf-hero-tag premium">Premium</span>}
              {!featured.is_premium && <span className="nf-hero-tag free">Free</span>}
            </div>
            <div className="nf-hero-actions">
              <button className="nf-btn-play" onClick={() => handleVideoClick(featured)}>
                <Play size={20} fill="black" color="black" /> Play
              </button>
              <button className="nf-btn-info" onClick={() => handleVideoClick(featured)}>
                <Info size={20} /> More Info
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── ROWS ── */}
      <div className="nf-rows">
        {loading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : (
          <>
            {liveStreams.length > 0 && (
              <LiveRow streams={liveStreams} onCardClick={handleLiveClick} />
            )}
            <ContentRow title="New Releases" items={recent} onCardClick={handleVideoClick} />
            {popular.length > 1 && (
              <ContentRow title="Popular on Almiftah" items={popular} onCardClick={handleVideoClick} badge="🔥" />
            )}
            {premium.length > 0 && (
              <ContentRow title="Premium Content" items={premium} onCardClick={handleVideoClick} badge="👑" />
            )}
            {free.length > 0 && (
              <ContentRow title="Free to Watch" items={free} onCardClick={handleVideoClick} badge="✓" />
            )}
            {videos.length === 0 && (
              <div className="nf-empty">
                <Play size={64} color="#e50914" />
                <h2>No Videos Yet</h2>
                <p>Videos will appear here once publishers upload content.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
