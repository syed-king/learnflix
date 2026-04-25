import { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { X, Check, Crown } from 'lucide-react';

export default function SubscriptionModal({ onClose, onSubscribed }) {
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/plans/').then(r => setPlans(r.data));
  }, []);

  const subscribe = async () => {
    if (!selected) return toast.error('Select a plan');
    setLoading(true);
    try {
      await api.post('/subscribe/', { plan_id: selected });
      onSubscribed();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to subscribe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={20} /></button>
        <div className="modal-header">
          <Crown size={32} color="#f5c518" />
          <h2>Choose Your Plan</h2>
          <p>Unlock all premium content with a subscription</p>
        </div>
        <div className="plans-grid">
          {plans.map(plan => (
            <div key={plan.id} className={`plan-card ${selected === plan.id ? 'selected' : ''}`} onClick={() => setSelected(plan.id)}>
              {selected === plan.id && <div className="plan-check"><Check size={16} /></div>}
              <h3>{plan.name}</h3>
              <div className="plan-price">${plan.price}<span>/{plan.duration_days === 365 ? 'year' : 'month'}</span></div>
              <p>{plan.description}</p>
            </div>
          ))}
        </div>
        <button className="btn-primary" onClick={subscribe} disabled={loading || !selected}>
          {loading ? <span className="spinner" /> : 'Subscribe Now'}
        </button>
      </div>
    </div>
  );
}
