import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';
import { Button } from '../components/common/Button.jsx';

export const NotFoundPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-app)',
      padding: '2rem'
    }}>
      <div className="card" style={{ maxWidth: 440, textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: '#fef2f2',
          color: '#dc2626',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem'
        }}>
          <AlertCircle size={36} />
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-slate-900)', lineHeight: 1 }}>404</h1>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.75rem 0', color: 'var(--color-slate-800)' }}>
          Page Not Found
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-500)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
          The clinical route or resource you are looking for does not exist or has been moved.
        </p>
        <Link to="/">
          <Button variant="primary" icon={Home}>
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
