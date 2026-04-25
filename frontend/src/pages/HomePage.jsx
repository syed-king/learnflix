import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import ContentCard from '../components/ContentCard';
import { Search, Filter } from 'lucide-react';

export default function HomePage() {
  const [contents, setContents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeType, setActiveType] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/categories/').then(r => setCategories(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (activeCategory) params.category = activeCategory;
    if (activeType) params.type = activeType;
    api.get('/content/', { params }).then(r => setContents(r.data)).finally(() => setLoading(false));
  }, [search, activeCategory, activeType]);

  const featured = contents[0];
  const rest = contents.slice(1);

  return (
    <div className="home-page">
      <Navbar />
      {featured && (
        <div className="hero" style={{ backgroundImage: `linear-gradient(to right, #000 30%, transparent), url(${featured.thumbnail || '/placeholder.jpg'})` }}>
          <div className="hero-content">
            <span className="hero-badge">{featured.content_type}</span>
            <h1>{featured.title}</h1>
            <p>{featured.description.slice(0, 120)}...</p>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => navigate(`/content/${featured.id}`)}>
                ▶ Watch Now
              </button>
              <button className="btn-ghost" onClick={() => navigate(`/content/${featured.id}`)}>
                ℹ More Info
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="home-body">
        <div className="filters">
          <div className="search-box">
            <Search size={16} />
            <input placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="filter-chips">
            <button className={`chip ${!activeType ? 'active' : ''}`} onClick={() => setActiveType('')}>All</button>
            {['course', 'movie', 'series'].map(t => (
              <button key={t} className={`chip ${activeType === t ? 'active' : ''}`} onClick={() => setActiveType(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div className="filter-chips">
            <button className={`chip ${!activeCategory ? 'active' : ''}`} onClick={() => setActiveCategory('')}>
              <Filter size={12} /> All Categories
            </button>
            {categories.map(c => (
              <button key={c.id} className={`chip ${activeCategory === String(c.id) ? 'active' : ''}`} onClick={() => setActiveCategory(String(c.id))}>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-grid">{[...Array(8)].map((_, i) => <div key={i} className="skeleton-card" />)}</div>
        ) : (
          <div className="content-grid">
            {rest.map(c => <ContentCard key={c.id} content={c} onClick={() => navigate(`/content/${c.id}`)} />)}
          </div>
        )}
      </div>
    </div>
  );
}
