import { useState, useEffect, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { Radio, Eye, Loader } from 'lucide-react';

const APP_ID = import.meta.env.VITE_AGORA_APP_ID || 'YOUR_AGORA_APP_ID';

export default function AgoraViewer({ stream }) {
  const [client] = useState(AgoraRTC.createClient({ mode: 'live', codec: 'vp8' }));
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const videoContainerRef = useRef(null);

  useEffect(() => {
    joinChannel();
    
    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      
      if (mediaType === 'video') {
        setRemoteUsers(prev => [...prev.filter(u => u.uid !== user.uid), user]);
        const playerContainer = document.createElement('div');
        playerContainer.id = `player-${user.uid}`;
        playerContainer.style.width = '100%';
        playerContainer.style.height = '100%';
        videoContainerRef.current?.appendChild(playerContainer);
        user.videoTrack?.play(playerContainer);
      }
      
      if (mediaType === 'audio') {
        user.audioTrack?.play();
      }
    });

    client.on('user-unpublished', (user) => {
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      const playerContainer = document.getElementById(`player-${user.uid}`);
      playerContainer?.remove();
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
      console.error('Failed to join:', err);
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

  if (remoteUsers.length === 0) {
    return (
      <div className="video-player" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
        <div style={{ textAlign: 'center' }}>
          <Radio size={64} color="#e50914" />
          <h3 style={{ color: 'white', marginTop: '1rem' }}>Waiting for publisher...</h3>
          <p style={{ color: '#999', fontSize: '0.9rem' }}>The stream will appear here once the publisher goes live</p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-player" style={{ background: '#000' }}>
      <div ref={videoContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
