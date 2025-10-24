import { useState, useEffect, lazy, Suspense, useCallback, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';

import Login from './pages/login';

const Signup = lazy(() => import('./pages/signup'));
const Home = lazy(() => import('./pages/home'));
const AdminPanel = lazy(() => import('./pages/admin_panel'));
const OrganizerPanel = lazy(() => import('./pages/organizer_panel'));

const LoadingFallback = () => <div className="loading-container">Loading...</div>;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  
  const isAdminPanel = useMemo(() => location.pathname === '/admin', [location.pathname]);
  const isOrganizerPanel = useMemo(() => location.pathname === '/organiser', [location.pathname]);

  const API_BASE_URL = useMemo(() => process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080', []);

  const handleLogin = useCallback((userData) => {
    if (userData.token) {
      localStorage.setItem('token', userData.token);
    }
    setUser(userData);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const handleSignupSuccess = useCallback(() => {
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setLoading(false);
          return;
        }
        
        const res = await fetch(`${API_BASE_URL}/validate_token`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          cache: 'default'
        });

        if (res.ok) {
          const data = await res.json();
          setUser({
            email: data.email,
            name: data.name,
            role: data.role,
            token: token
          });
        } else {
          localStorage.removeItem('token');
        }
      } catch (err) {
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [API_BASE_URL]);

  const routeElements = useMemo(() => {
    if (loading) {
      return <div className="loading-container">Loading...</div>;
    }

    if (isAdminPanel && user?.role === 'admin') {
      return (
        <Suspense fallback={<LoadingFallback />}>
          <AdminPanel user={user} onLogout={handleLogout} />
        </Suspense>
      );
    }

    if (isOrganizerPanel && user?.role === 'organiser') {
      return (
        <Suspense fallback={<LoadingFallback />}>
          <OrganizerPanel user={user} onLogout={handleLogout} />
        </Suspense>
      );
    }

    return (
      <div className="app-container">
        <h1>Event Management</h1>

        <Routes>
          <Route 
            path="/login" 
            element={user ? (
              <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'organiser' ? '/organiser' : '/'} replace />
            ) : (
              <div className="form-container">
                <Login onLoginSuccess={handleLogin} />
              </div>
            )} 
          />
          <Route 
            path="/signup" 
            element={user ? (
              <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'organiser' ? '/organiser' : '/'} replace />
            ) : (
              <div className="form-container">
                <Suspense fallback={<LoadingFallback />}>
                  <Signup onSignupSuccess={handleSignupSuccess} />
                </Suspense>
              </div>
            )} 
          />
          <Route 
            path="/admin" 
            element={
              user?.role === 'admin' ? (
                <Suspense fallback={<LoadingFallback />}>
                  <AdminPanel user={user} onLogout={handleLogout} />
                </Suspense>
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route 
            path="/organiser" 
            element={
              user?.role === 'organiser' ? (
                <Suspense fallback={<LoadingFallback />}>
                  <OrganizerPanel user={user} onLogout={handleLogout} />
                </Suspense>
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route 
            path="/" 
            element={user ? (
              user.role === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : user.role === 'organiser' ? (
                <Navigate to="/organiser" replace />
              ) : (
                <Suspense fallback={<LoadingFallback />}>
                  <Home user={user} onLogout={handleLogout} />
                </Suspense>
              )
            ) : (
              <Navigate to="/login" replace />
            )} 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    );
  }, [loading, isAdminPanel, isOrganizerPanel, user, handleLogin, handleLogout, handleSignupSuccess]);

  return routeElements;
}

export default App;