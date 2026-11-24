import React from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { LoadingSpinner } from '../common/LoadingSpinner.jsx';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../common/Button.jsx';

export const ProtectedRoute = ({ allowedRoles = null }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullScreen text="Authenticating session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization if restricted
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const getRoleHome = () => {
      if (user?.role === 'ADMIN') return '/admin';
      if (user?.role === 'RECEPTIONIST') return '/receptionist';
      if (user?.role === 'DOCTOR') return '/doctor';
      return '/patient';
    };

    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div className="card" style={{ maxWidth: 460, textAlign: 'center', padding: '2.5rem 2rem' }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#fef2f2',
            color: '#dc2626',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem'
          }}>
            <ShieldAlert size={32} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-slate-900)' }}>
            Access Restricted
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-600)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Your account role <strong>({user?.role})</strong> is not authorized to access this page. Allowed roles: <strong>{allowedRoles.join(', ')}</strong>.
          </p>
          <Link to={getRoleHome()}>
            <Button variant="primary" icon={ArrowLeft}>
              Return to Your Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
