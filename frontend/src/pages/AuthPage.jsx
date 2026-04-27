import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Play, BookOpen, Eye, Video } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', email: '', password: '', first_name: '', last_name: '', role: 'viewer' });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handle = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = isLogin ? await login(form.username, form.password) : await register(form);
      toast.success(`Welcome${user.first_name ? ', ' + user.first_name : ''}!`);
      if (user.is_staff) navigate('/admin');
      else if (user.role === 'publisher') navigate('/publisher');
      else navigate('/home');
    } catch (err) {
      toast.error(err.response?.data?.detail || Object.values(err.response?.data || {})[0] || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-overlay" />
      <nav className="auth-nav">
        <div className="logo"><Play size={28} fill="#e50914" color="#e50914" /><span>LearnFlix</span></div>
      </nav>
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-icon"><BookOpen size={32} color="#e50914" /></div>
          <h1>{isLogin ? 'Sign In' : 'Create Account'}</h1>
          <p className="auth-subtitle">{isLogin ? 'Welcome back! Continue your learning journey.' : 'Join thousands of learners worldwide.'}</p>
          <form onSubmit={handle}>
            {!isLogin && (
              <>
                <div className="form-row">
                  <input placeholder="First Name" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
                  <input placeholder="Last Name" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
                </div>
                <input type="email" placeholder="Email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                <div className="role-selector">
                  <p>I want to join as:</p>
                  <div className="role-cards">
                    <div className={`role-card ${form.role === 'viewer' ? 'active' : ''}`} onClick={() => setForm({ ...form, role: 'viewer' })}>
                      <Eye size={28} color={form.role === 'viewer' ? '#e50914' : '#666'} />
                      <strong>Viewer</strong>
                      <span>Watch & learn content</span>
                    </div>
                    <div className={`role-card ${form.role === 'publisher' ? 'active' : ''}`} onClick={() => setForm({ ...form, role: 'publisher' })}>
                      <Video size={28} color={form.role === 'publisher' ? '#e50914' : '#666'} />
                      <strong>Publisher</strong>
                      <span>Upload & go live</span>
                    </div>
                  </div>
                </div>
              </>
            )}
            <input placeholder="Username" required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
            <input type="password" placeholder="Password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          <p className="auth-toggle">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button onClick={() => setIsLogin(!isLogin)}>{isLogin ? ' Sign Up' : ' Sign In'}</button>
          </p>
        </div>
      </div>
    </div>
  );
}
