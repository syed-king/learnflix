import { useAuth } from '../AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Play, Settings, LogOut, Shield } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <Link to="/home" className="logo"><Play size={24} fill="#e50914" color="#e50914" /><span>LearnFlix</span></Link>
      <div className="nav-links">
        <Link to="/home">Home</Link>
        {user?.is_staff && <Link to="/admin"><Shield size={16} /> Admin</Link>}
      </div>
      <div className="nav-actions">
        <div className="nav-avatar" onClick={() => navigate('/settings')}>
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <Link to="/settings" className="nav-icon-btn"><Settings size={18} /></Link>
        <button className="nav-icon-btn" onClick={() => { logout(); navigate('/'); }}><LogOut size={18} /></button>
      </div>
    </nav>
  );
}
