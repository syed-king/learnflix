import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './AuthContext';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import ContentPage from './pages/ContentPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import PublisherPage from './pages/PublisherPage';
import PublisherProfilePage from './pages/PublisherProfilePage';
import LiveWatchPage from './pages/LiveWatchPage';
import VideoWatchPage from './pages/VideoWatchPage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="spinner-lg" /></div>;
  return user ? children : <Navigate to="/" />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="spinner-lg" /></div>;
  return user?.is_staff ? children : <Navigate to="/home" />;
}

function PublisherRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="spinner-lg" /></div>;
  return user?.role === 'publisher' ? children : <Navigate to="/home" />;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="spinner-lg" /></div>;
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={user.is_staff ? '/admin' : user.role === 'publisher' ? '/publisher' : '/home'} /> : <AuthPage />} />
      <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
      <Route path="/content/:id" element={<PrivateRoute><ContentPage /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
      <Route path="/live/:id" element={<PrivateRoute><LiveWatchPage /></PrivateRoute>} />
      <Route path="/publisher/:id" element={<PrivateRoute><PublisherProfilePage /></PrivateRoute>} />
      <Route path="/watch/:id" element={<PrivateRoute><VideoWatchPage /></PrivateRoute>} />
      <Route path="/publisher" element={<PublisherRoute><PublisherPage /></PublisherRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ style: { background: '#1a1a1a', color: '#fff', border: '1px solid #333' } }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
