import { useState, useEffect, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import api from '../api';
import { Camera, Mic, MicOff, VideoOff, StopCircle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const APP_ID = import.meta.env.VITE_AGORA_APP_ID || 'YOUR_AGORA_APP_ID';

export default function AgoraLiveStudio({ stream, onEnd }) {
  const [client] = useState(AgoraRTC.createClient({ mode: 'live', codec: 'vp8' }));
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [joined, setJoined] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    joinChannel();
    const timer = setInterval(() => setDuration(d => d + 1), 1000);
    const viewerInterval = setInterval(() => {
      api.get(`/publisher/streams/${stream.id}/`).then(r => setViewerCount(r.data.viewer_count)).catch(() => {});
    }, 5000);
    
    return () => {
      leaveChannel();
      clearInterval(timer);
      clearInterval(viewerInterval);
    };
  }, []);

  const joinChannel = async () => {
    try {
      console.log('Agora App ID:', APP_ID);
      console.log('Stream Key:', stream.stream_key);
      console.log('Setting client role to host...');
      await client.setClientRole('host');
      
      console.log('Creating camera and microphone tracks...');
      // Create local tracks
      const videoTrack = await AgoraRTC.createCameraVideoTrack();
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      
      setLocalVideoTrack(videoTrack);
      setLocalAudioTrack(audioTrack);
      
      // Play video locally
      if (videoRef.current) {
        videoTrack.play(videoRef.current);
      }
      
      console.log('Joining channel...');
      // Join channel (use stream_key as channel name)
      await client.join(APP_ID, stream.stream_key, null, null);
      console.log('Successfully joined channel!');
      
      console.log('Publishing tracks...');
      // Publish tracks
      await client.publish([videoTrack, audioTrack]);
      console.log('Successfully published tracks!');
      
      setJoined(true);
      toast.success('Live stream started!');
    } catch (err) {
      console.error('Failed to join:', err);
      toast.error('Failed to start stream: ' + err.message);
    }
  };

  const leaveChannel = async () => {
    localVideoTrack?.close();
    localAudioTrack?.close();
    await client.leave();
  };

  const toggleCam = () => {
    if (localVideoTrack) {
      localVideoTrack.setEnabled(!camOn);
      setCamOn(!camOn);
    }
  };

  const toggleMic = () => {
    if (localAudioTrack) {
      localAudioTrack.setEnabled(!micOn);
      setMicOn(!micOn);
    }
  };

  const fmt = s => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="live-studio">
      <div className="studio-header">
        <div className="studio-live-badge">🔴 LIVE — {fmt(duration)}</div>
        <h2>{stream.title}</h2>
        <div style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>
          <Eye size={16} style={{ verticalAlign: 'middle' }} /> {viewerCount} watching
        </div>
      </div>
      <div className="studio-main">
        <div className="studio-preview">
          {camOn ? (
            <div ref={videoRef} className="studio-video" style={{ width: '100%', height: '100%' }} />
          ) : (
            <div className="studio-cam-off"><VideoOff size={64} color="#555" /><p>Camera Off</p></div>
          )}
          <div className="studio-overlay-info">
            <span className="studio-mic-indicator">{micOn ? <Mic size={14} /> : <MicOff size={14} color="#e50914" />}</span>
          </div>
        </div>
        <div className="studio-controls">
          <h3>Stream Controls</h3>
          <div className="studio-btns">
            <button className={`studio-ctrl-btn ${!camOn ? 'off' : ''}`} onClick={toggleCam}>
              {camOn ? <Camera size={20} /> : <VideoOff size={20} />}
              <span>{camOn ? 'Camera On' : 'Camera Off'}</span>
            </button>
            <button className={`studio-ctrl-btn ${!micOn ? 'off' : ''}`} onClick={toggleMic}>
              {micOn ? <Mic size={20} /> : <MicOff size={20} />}
              <span>{micOn ? 'Mic On' : 'Mic Off'}</span>
            </button>
          </div>
          <div className="studio-info-box">
            <p style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>
              {joined ? '✓ Broadcasting live to viewers' : 'Connecting...'}
            </p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text3)' }}>
              Channel: <code>{stream.stream_key?.slice(0, 16)}</code>
            </p>
          </div>
          <button className="btn-end" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} onClick={onEnd}>
            <StopCircle size={18} /> End Stream
          </button>
        </div>
      </div>
    </div>
  );
}
