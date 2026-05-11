import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Play, Settings, LogOut, Shield, Search, X, Bell } from 'lucide-react';
import api from '../api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const searchRef = useRef(null);
  const profileRef = useRef(null);

  // Solid background on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Live search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get(`/videos/?search=${encodeURIComponent(searchQuery)}`);
        setSearchResults(data.slice(0, 6));
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const goToVideo = (id) => {
    closeSearch();
    navigate(`/watch/${id}`);
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar-solid' : ''}`}>
      {/* Left */}
      <Link to="/home" className="logo">
        <Play size={22} fill="#e50914" color="#e50914" />
        <span>Almiftah</span>
      </Link>

      <div className="nav-links">
        <Link to="/home" className={location.pathname === '/home' ? 'nav-link-active' : ''}>Home</Link>
        {user?.is_staff && (
          <Link to="/admin" className={location.pathname === '/admin' ? 'nav-link-active' : ''}>
            <Shield size={14} /> Admin
          </Link>
        )}
        {user?.role === 'publisher' && (
          <Link to="/publisher" className={location.pathname === '/publisher' ? 'nav-link-active' : ''}>
            Studio
          </Link>
        )}
      </div>

      {/* Right */}
      <div className="nav-actions">
        {/* Search */}
        <div className={`nav-search-wrap ${searchOpen ? 'open' : ''}`}>
          {searchOpen ? (
            <div className="nav-search-box">
              <Search size={16} color="#999" />
              <input
                ref={searchRef}
                placeholder="Search titles..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Escape' && closeSearch()}
              />
              <button onClick={closeSearch}><X size={16} /></button>

              {/* Dropdown results */}
              {(searchResults.length > 0 || searching) && (
                <div className="nav-search-results">
                  {searching && <div className="nav-search-loading">Searching...</div>}
                  {searchResults.map(v => (
                    <div key={v.id} className="nav-search-item" onClick={() => goToVideo(v.id)}>
                      <div className="nav-search-thumb">🎬</div>
                      <div>
                        <div className="nav-search-title">{v.title}</div>
                        <div className="nav-search-meta">{v.views} views</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button className="nav-icon-btn" onClick={() => setSearchOpen(true)}>
              <Search size={18} />
            </button>
          )}
        </div>

        {/* Notifications placeholder */}
        <button className="nav-icon-btn nav-bell">
          <Bell size={18} />
        </button>

        {/* Profile dropdown */}
        <div className="nav-profile-wrap" ref={profileRef}>
          <div className="nav-avatar" onClick={() => setShowProfile(p => !p)}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          {showProfile && (
            <div className="nav-dropdown">
              <div className="nav-dropdown-header">
                <div className="nav-dropdown-avatar">{user?.username?.[0]?.toUpperCase()}</div>
                <div>
                  <div className="nav-dropdown-name">{user?.first_name || user?.username}</div>
                  <div className="nav-dropdown-role">
                    {user?.is_staff ? 'Administrator' : user?.role === 'publisher' ? 'Publisher' : 'Viewer'}
                  </div>
                </div>
              </div>
              <div className="nav-dropdown-divider" />
              <button className="nav-dropdown-item" onClick={() => { setShowProfile(false); navigate('/settings'); }}>
                <Settings size={15} /> Account Settings
              </button>
              {user?.has_active_subscription && (
                <div className="nav-dropdown-sub">
                  <span className="nav-sub-badge">✓ Premium</span>
                </div>
              )}
              <div className="nav-dropdown-divider" />
              <button className="nav-dropdown-item danger" onClick={() => { logout(); navigate('/'); }}>
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
