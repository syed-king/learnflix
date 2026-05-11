import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import { ArrowLeft, Eye, Radio } from 'lucide-react';
import AgoraViewer from '../components/AgoraViewer';

export default function LiveWatchPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/live/').then(r => {
      const s = r.data.find(s => String(s.id) === String(id));
      setStream(s || null);
    }).catch(() => {}).finally(() => setLoading(false));
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
        
        <AgoraViewer stream={stream} />
        
        {stream.description && <p style={{ marginTop: '1.5rem', color: 'var(--text2)', lineHeight: 1.7 }}>{stream.description}</p>}
      </div>
    </div>
  );
}
