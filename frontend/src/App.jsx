import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './AuthContext';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import ContentPage from './pages/ContentPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';

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

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="spinner-lg" /></div>;
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={user.is_staff ? '/admin' : '/home'} /> : <AuthPage />} />
      <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
      <Route path="/content/:id" element={<PrivateRoute><ContentPage /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
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
