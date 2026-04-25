import { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { Star, Send } from 'lucide-react';

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} size={24} fill={(hover || value) >= n ? '#f5c518' : 'transparent'}
          color={(hover || value) >= n ? '#f5c518' : '#555'}
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)} />
      ))}
    </div>
  );
}

export default function ReviewSection({ contentId, hasSubscription, reviews, onReviewAdded }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (!rating) return toast.error('Please select a rating');
    setSubmitting(true);
    try {
      await api.post(`/content/${contentId}/review/`, { rating, comment });
      toast.success('Review submitted!');
      setRating(0); setComment('');
      onReviewAdded();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="review-section">
      <h2>Reviews ({reviews.length})</h2>

      {hasSubscription && (
        <form className="review-form" onSubmit={submit}>
          <h3>Write a Review</h3>
          <StarRating value={rating} onChange={setRating} />
          <textarea placeholder="Share your thoughts..." value={comment} onChange={e => setComment(e.target.value)} rows={3} />
          <button type="submit" className="btn-primary" disabled={submitting}>
            <Send size={16} /> {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      <div className="reviews-list">
        {reviews.length === 0 ? <p className="no-reviews">No reviews yet. Be the first!</p> : reviews.map(r => (
          <div key={r.id} className="review-card">
            <div className="review-header">
              <div className="review-avatar">{r.username[0].toUpperCase()}</div>
              <div>
                <strong>{r.username}</strong>
                <div className="review-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
              </div>
              <span className="review-date">{new Date(r.created_at).toLocaleDateString()}</span>
            </div>
            {r.comment && <p>{r.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
