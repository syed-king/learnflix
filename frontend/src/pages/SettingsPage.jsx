import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { User, Mail, Phone, FileText, Save, Crown } from 'lucide-react';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', bio: '', phone: '' });
  const [subscription, setSubscription] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        bio: user.profile?.bio || '',
        phone: user.profile?.phone || '',
      });
    }
    api.get('/my-subscription/').then(r => setSubscription(r.data));
  }, [user]);

  const save = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/profile/', form);
      await refreshUser();
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <Navbar />
      <div className="settings-body">
        <div className="settings-header">
          <div className="avatar-circle">{user?.username?.[0]?.toUpperCase()}</div>
          <div>
            <h1>{user?.first_name} {user?.last_name || user?.username}</h1>
            <p>@{user?.username}</p>
          </div>
        </div>

        <div className="settings-grid">
          <div className="settings-card">
            <h2>Profile Information</h2>
            <form onSubmit={save}>
              <div className="form-row">
                <div className="input-group">
                  <User size={16} />
                  <input placeholder="First Name" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
                </div>
                <div className="input-group">
                  <User size={16} />
                  <input placeholder="Last Name" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
                </div>
              </div>
              <div className="input-group">
                <Mail size={16} />
                <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="input-group">
                <Phone size={16} />
                <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="input-group">
                <FileText size={16} />
                <textarea placeholder="Bio" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={3} />
              </div>
              <button type="submit" className="btn-primary" disabled={saving}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          <div className="settings-card">
            <h2><Crown size={18} color="#f5c518" /> Subscription</h2>
            {subscription?.status === 'active' ? (
              <div className="sub-active">
                <div className="sub-badge">Active</div>
                <p><strong>Plan:</strong> {subscription.plan_name}</p>
                <p><strong>Price:</strong> ${subscription.plan_price}/period</p>
                <p><strong>Expires:</strong> {new Date(subscription.end_date).toLocaleDateString()}</p>
              </div>
            ) : subscription?.status === 'pending' ? (
              <div className="sub-pending">
                <div className="sub-badge pending">Pending Approval</div>
                <p>Your subscription is being reviewed by admin.</p>
              </div>
            ) : (
              <div className="sub-none">
                <p>No active subscription</p>
                <a href="/home" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>Browse Plans</a>
              </div>
            )}

            <div className="account-info" style={{ marginTop: '2rem' }}>
              <h3>Account Details</h3>
              <p><strong>Username:</strong> {user?.username}</p>
              <p><strong>Member since:</strong> {user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Role:</strong> {user?.is_staff ? 'Administrator' : 'Member'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
