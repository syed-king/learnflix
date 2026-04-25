import { Star, Lock, Play } from 'lucide-react';

const COLORS = ['#e50914', '#0070f3', '#7c3aed', '#059669', '#d97706'];
const ICONS = ['🎓', '💻', '🎨', '📊', '📱', '🔬', '🎯', '🚀'];

export default function ContentCard({ content, onClick }) {
  const colorIndex = content.id % COLORS.length;
  const iconIndex = content.id % ICONS.length;

  return (
    <div className="content-card" onClick={onClick}>
      <div className="card-thumb" style={{ background: `linear-gradient(135deg, ${COLORS[colorIndex]}22, ${COLORS[colorIndex]}44)`, borderTop: `3px solid ${COLORS[colorIndex]}` }}>
        {content.thumbnail
          ? <img src={content.thumbnail} alt={content.title} />
          : <span className="card-icon">{ICONS[iconIndex]}</span>
        }
        <div className="card-overlay">
          <Play size={32} fill="white" color="white" />
        </div>
        {content.is_premium && <div className="card-lock"><Lock size={12} /> Premium</div>}
      </div>
      <div className="card-info">
        <span className="card-type">{content.content_type}</span>
        <h3>{content.title}</h3>
        <p>{content.description.slice(0, 70)}...</p>
        <div className="card-footer">
          <span className="card-rating"><Star size={12} fill="#f5c518" color="#f5c518" /> {content.avg_rating || 'New'}</span>
          <span className="card-reviews">{content.review_count} reviews</span>
        </div>
      </div>
    </div>
  );
}
