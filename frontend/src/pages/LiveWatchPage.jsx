import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import { ArrowLeft, Eye, Radio } from 'lucide-react';

export default function LiveWatchPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/live/').then(r => {
      console.log('Live streams:', r.data);
      const s = r.data.find(s => String(s.id) === String(id));
      console.log('Found stream:', s);
      setStream(s || null);
    }).catch(err => {
      console.error('Live fetch error:', err);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-loading"><div className="spinner-lg" /></div>;
  
  if (!stream) return (
    <div className="page-loading" style={{ flexDirection: 'column', gap: '1rem' }}>
      <Radio size={48} color="#e50914" />
      <p>Stream not found or has ended.</p>
      <button className="btn-ghost" onClick={() => navigate('/home')}>Go Back</button>
    </div>
  );

  return (
    <div className="content-page">
      <Navbar />
      <div style={{ padding: '5rem 3rem 2rem' }}>
        <button className="back-btn" onClick={() => navigate('/home')}><ArrowLeft size={20} /> Back</button>
      </div>
      <div style={{ padding: '0 3rem 4rem', maxWidth: '1000px', margin: '0 auto' }}>
        <div className="stream-live-badge">🔴 LIVE NOW</div>
        <h1 style={{ fontSize: '2rem', margin: '0.75rem 0' }}>{stream.title}</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', color: 'var(--text2)' }}>
          <span>by <strong style={{ color: 'white' }}>{stream.publisher_name}</strong></span>
          <span><Eye size={14} /> {stream.viewer_count} watching</span>
          {stream.publisher_id && <span>Publisher ID: <code style={{ color: '#e50914' }}>{stream.publisher_id}</code></span>}
        </div>
        
        {stream.stream_url ? (
          <div className="video-player">
            <iframe 
              src={stream.stream_url} 
              title={stream.title} 
              allowFullScreen 
              allow="autoplay; camera; microphone; fullscreen"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        ) : (
          <div className="watch-gate">
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Radio size={64} color="#e50914" />
              <h3 style={{ margin: '1rem 0 0.5rem' }}>Stream is Live!</h3>
              <p style={{ color: 'var(--text2)' }}>The publisher is live but hasn't set a stream URL yet. They may be using OBS or other streaming software.</p>
              <p style={{ color: 'var(--text3)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Stream Key: <code>{stream.stream_key?.slice(0, 12)}...</code></p>
            </div>
          </div>
        )}
        
        {stream.description && <p style={{ marginTop: '1.5rem', color: 'var(--text2)', lineHeight: 1.7 }}>{stream.description}</p>}
      </div>
    </div>
  );
}
