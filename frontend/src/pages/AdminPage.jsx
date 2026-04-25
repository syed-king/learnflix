import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import { Users, CreditCard, Star, TrendingUp, Check, X, Trash2, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [subs, setSubs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [subFilter, setSubFilter] = useState('');

  useEffect(() => {
    if (!user?.is_staff) { navigate('/home'); return; }
    api.get('/admin/users/').then(r => setUsers(r.data));
    api.get('/admin/reviews/').then(r => setReviews(r.data));
  }, [user]);

  useEffect(() => {
    const params = subFilter ? { status: subFilter } : {};
    api.get('/admin/subscriptions/', { params }).then(r => setSubs(r.data));
  }, [subFilter]);

  const updateSub = async (id, status) => {
    await api.put(`/admin/subscriptions/${id}/`, { status });
    const params = subFilter ? { status: subFilter } : {};
    api.get('/admin/subscriptions/', { params }).then(r => setSubs(r.data));
    toast.success(`Subscription ${status}`);
  };

  const deleteReview = async id => {
    await api.delete(`/admin/reviews/${id}/`);
    setReviews(reviews.filter(r => r.id !== id));
    toast.success('Review deleted');
  };

  const stats = {
    totalUsers: users.length,
    activeSubscriptions: subs.filter(s => s.status === 'active').length,
    pendingSubscriptions: subs.filter(s => s.status === 'pending').length,
    totalReviews: reviews.length,
  };

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="logo" style={{ padding: '1.5rem', borderBottom: '1px solid #222' }}>
          <span style={{ color: '#e50914', fontSize: '1.4rem', fontWeight: 800 }}>LearnFlix</span>
          <span style={{ color: '#888', fontSize: '0.75rem', display: 'block' }}>Admin Panel</span>
        </div>
        {[
          { key: 'dashboard', icon: <TrendingUp size={18} />, label: 'Dashboard' },
          { key: 'users', icon: <Users size={18} />, label: 'Users' },
          { key: 'subscriptions', icon: <CreditCard size={18} />, label: 'Subscriptions' },
          { key: 'reviews', icon: <Star size={18} />, label: 'Reviews' },
        ].map(item => (
          <button key={item.key} className={`sidebar-btn ${tab === item.key ? 'active' : ''}`} onClick={() => setTab(item.key)}>
            {item.icon} {item.label}
          </button>
        ))}
        <button className="sidebar-btn" style={{ marginTop: 'auto', color: '#e50914' }} onClick={() => { logout(); navigate('/'); }}>
          <LogOut size={18} /> Logout
        </button>
      </aside>

      <main className="admin-main">
        {tab === 'dashboard' && (
          <div>
            <h1>Dashboard</h1>
            <div className="stats-grid">
              <div className="stat-card"><Users size={32} color="#e50914" /><div><h3>{stats.totalUsers}</h3><p>Total Users</p></div></div>
              <div className="stat-card"><CreditCard size={32} color="#22c55e" /><div><h3>{stats.activeSubscriptions}</h3><p>Active Subscriptions</p></div></div>
              <div className="stat-card"><CreditCard size={32} color="#f59e0b" /><div><h3>{stats.pendingSubscriptions}</h3><p>Pending Approvals</p></div></div>
              <div className="stat-card"><Star size={32} color="#a855f7" /><div><h3>{stats.totalReviews}</h3><p>Total Reviews</p></div></div>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div>
            <h1>Users ({users.length})</h1>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Username</th><th>Email</th><th>Name</th><th>Role</th><th>Joined</th><th>Subscription</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td><strong>{u.username}</strong></td>
                      <td>{u.email}</td>
                      <td>{u.first_name} {u.last_name}</td>
                      <td><span className={`badge ${u.is_staff ? 'admin' : ''}`}>{u.is_staff ? 'Admin' : 'User'}</span></td>
                      <td>{new Date(u.date_joined).toLocaleDateString()}</td>
                      <td><span className={`badge ${u.has_active_subscription ? 'active' : ''}`}>{u.has_active_subscription ? 'Active' : 'None'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'subscriptions' && (
          <div>
            <div className="admin-header">
              <h1>Subscriptions</h1>
              <div className="filter-chips">
                {['', 'pending', 'active', 'expired', 'cancelled'].map(s => (
                  <button key={s} className={`chip ${subFilter === s ? 'active' : ''}`} onClick={() => setSubFilter(s)}>
                    {s || 'All'}
                  </button>
                ))}
              </div>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>User</th><th>Email</th><th>Plan</th><th>Price</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {subs.map(s => (
                    <tr key={s.id}>
                      <td><strong>{s.username}</strong></td>
                      <td>{s.email}</td>
                      <td>{s.plan_name}</td>
                      <td>${s.plan_price}</td>
                      <td><span className={`badge ${s.status}`}>{s.status}</span></td>
                      <td>{new Date(s.created_at).toLocaleDateString()}</td>
                      <td>
                        {s.status === 'pending' && (
                          <div className="action-btns">
                            <button className="icon-btn success" onClick={() => updateSub(s.id, 'active')}><Check size={16} /></button>
                            <button className="icon-btn danger" onClick={() => updateSub(s.id, 'cancelled')}><X size={16} /></button>
                          </div>
                        )}
                        {s.status === 'active' && (
                          <button className="icon-btn danger" onClick={() => updateSub(s.id, 'cancelled')}><X size={16} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'reviews' && (
          <div>
            <h1>Reviews ({reviews.length})</h1>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>User</th><th>Content</th><th>Rating</th><th>Comment</th><th>Date</th><th>Action</th></tr></thead>
                <tbody>
                  {reviews.map(r => (
                    <tr key={r.id}>
                      <td><strong>{r.user}</strong></td>
                      <td>{r.content}</td>
                      <td>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</td>
                      <td>{r.comment || '—'}</td>
                      <td>{new Date(r.created_at).toLocaleDateString()}</td>
                      <td><button className="icon-btn danger" onClick={() => deleteReview(r.id)}><Trash2 size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
