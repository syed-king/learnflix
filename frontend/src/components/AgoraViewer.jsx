import { useState, useEffect, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { Radio, Loader } from 'lucide-react';

const APP_ID = import.meta.env.VITE_AGORA_APP_ID || 'YOUR_AGORA_APP_ID';

export default function AgoraViewer({ stream }) {
  const [client] = useState(AgoraRTC.createClient({ mode: 'live', codec: 'vp8' }));
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const videoContainerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    joinChannel();
    
    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      
      if (mediaType === 'video') {
        setRemoteUsers(prev => {
          const filtered = prev.filter(u => u.uid !== user.uid);
          return [...filtered, user];
        });
        setIsPlaying(true);
        
        setTimeout(() => {
          if (videoContainerRef.current) {
            user.videoTrack?.play(videoContainerRef.current);
          }
        }, 100);
      }
      
      if (mediaType === 'audio') {
        user.audioTrack?.play();
      }
    });

    client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'video') {
        setRemoteUsers(prev => {
          const updated = prev.filter(u => u.uid !== user.uid);
          if (updated.length === 0) setIsPlaying(false);
          return updated;
        });
      }
    });

    return () => {
      client.leave();
    };
  }, []);

  const joinChannel = async () => {
    try {
      await client.setClientRole('audience');
      await client.join(APP_ID, stream.stream_key, null, null);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to connect');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="video-player" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader size={48} color="#e50914" className="spinner-lg" />
          <p style={{ color: 'white', marginTop: '1rem' }}>Connecting to live stream...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="video-player" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
        <div style={{ textAlign: 'center' }}>
          <Radio size={64} color="#e50914" />
          <h3 style={{ color: 'white', marginTop: '1rem' }}>Connection Error</h3>
          <p style={{ color: '#999', fontSize: '0.9rem' }}>{error}</p>
          <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.5rem' }}>Check console for details</p>
        </div>
      </div>
    );
  }

  if (remoteUsers.length === 0 && !isPlaying) {
    return (
      <div className="video-player" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
        <div style={{ textAlign: 'center' }}>
          <Radio size={64} color="#e50914" />
          <h3 style={{ color: 'white', marginTop: '1rem' }}>Waiting for publisher...</h3>
          <p style={{ color: '#999', fontSize: '0.9rem' }}>The stream will appear here once the publisher goes live</p>
          <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.5rem' }}>Connected to channel: {stream.stream_key?.slice(0, 16)}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-player" style={{ background: '#000', position: 'relative' }}>
      <div 
        ref={videoContainerRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} 
      />
    </div>
  );
}
