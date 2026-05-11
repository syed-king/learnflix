import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import { ArrowLeft, Eye, Radio, Users, Clock } from 'lucide-react';
import AgoraViewer from '../components/AgoraViewer';

export default function LiveWatchPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stream, setStream] = useState(null);
  const [otherStreams, setOtherStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    api.get('/live/').then(r => {
      const s = r.data.find(s => String(s.id) === String(id));
      setStream(s || null);
      setOtherStreams(r.data.filter(s => String(s.id) !== String(id)));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  // Live duration counter
  useEffect(() => {
    if (!stream?.started_at) return;
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(stream.started_at)) / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setElapsed(h > 0
        ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [stream]);

  if (loading) return (
    <div className="page-loading" style={{ flexDirection: 'column', gap: '1rem' }}>
      <div className="spinner-lg" />
      <p style={{ color: 'var(--text2)' }}>Connecting to stream...</p>
    </div>
  );

  if (!stream) return (
    <div className="page-loading" style={{ flexDirection: 'column', gap: '1.5rem' }}>
      <Radio size={56} color="#e50914" />
      <h2 style={{ color: 'white' }}>Stream Ended</h2>
      <p style={{ color: 'var(--text2)' }}>This stream has ended or is no longer available.</p>
      <button className="nf-btn-info" onClick={() => navigate('/home')}>
        <ArrowLeft size={16} /> Back to Home
      </button>
    </div>
  );

  return (
    <div className="live-watch-page">
      <Navbar />

      <div className="live-watch-layout">
        {/* ── LEFT: Player + Info ── */}
        <div className="live-watch-main">
          <button className="watch-back-btn" onClick={() => navigate('/home')}>
            <ArrowLeft size={18} /> Back
          </button>

          {/* Player */}
          <div className="live-player-wrap">
            <AgoraViewer stream={stream} />

            {/* Live overlay badge */}
            <div className="live-player-overlay">
              <span className="live-overlay-badge">🔴 LIVE</span>
              {elapsed && (
                <span className="live-overlay-time"><Clock size={12} /> {elapsed}</span>
              )}
            </div>
          </div>

          {/* Stream info */}
          <div className="live-info-panel">
            <div className="live-info-left">
              <h1 className="live-title">{stream.title}</h1>
              <div className="live-meta-row">
                <span className="live-meta-item live-meta-viewers">
                  <Users size={14} /> {stream.viewer_count} watching
                </span>
                {stream.publisher_name && (
                  <span className="live-meta-item">
                    <div className="live-host-avatar">{stream.publisher_name[0].toUpperCase()}</div>
                    {stream.publisher_name}
                  </span>
                )}
              </div>
              {stream.description && (
                <p className="live-description">{stream.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Other live streams ── */}
        <aside className="live-watch-sidebar">
          <h3 className="watch-sidebar-title">
            <span className="nf-live-dot" style={{ marginRight: '0.5rem' }} />
            Other Live Streams
          </h3>
          {otherStreams.length === 0 ? (
            <div className="live-sidebar-empty">
              <Radio size={32} color="#444" />
              <p>No other streams right now</p>
            </div>
          ) : (
            <div className="live-sidebar-list">
              {otherStreams.map(s => (
                <div key={s.id} className="live-sidebar-card" onClick={() => navigate(`/live/${s.id}`)}>
                  <div className="live-sidebar-thumb">
                    <Radio size={22} color="rgba(255,255,255,0.6)" />
                    <span className="live-sidebar-badge">LIVE</span>
                  </div>
                  <div className="live-sidebar-info">
                    <div className="live-sidebar-title">{s.title}</div>
                    <div className="live-sidebar-meta">
                      <Eye size={11} /> {s.viewer_count} watching
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
