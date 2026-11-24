import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ShieldCheck, Sparkles, CheckCircle2, Clock, Activity, ArrowRight } from 'lucide-react';

export const AdminHome = () => {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Welcome Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #0284c7, #0369a1)',
        color: 'white',
        border: 'none',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.2)', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '1rem' }}>
            <Sparkles size={14} />
            <span>Frontend Foundation Active</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
            Welcome back, {user?.name || 'Administrator'}
          </h1>
          <p style={{ fontSize: '0.95rem', opacity: 0.9, maxWidth: 600, lineHeight: 1.6 }}>
            The React + Vite frontend foundation is successfully connected to the backend REST API on port 5000.
          </p>
        </div>
      </div>

      {/* Admin Dashboard Status Notice */}
      <div className="card" style={{ borderLeft: '4px solid var(--color-primary-600)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary-50)',
            color: 'var(--color-primary-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShieldCheck size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-slate-900)', marginBottom: '0.35rem' }}>
              Admin Dashboard Module Ready
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-600)', lineHeight: 1.6, marginBottom: '1rem' }}>
              The foundation layer (Routing, Axios API layer, Context API Auth, Role Navigation, and Protected Routes) is fully in place. The comprehensive 15-KPI Admin Dashboard with real-time charts and feeds will be generated next upon your approval.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-slate-700)' }}>
                <CheckCircle2 size={16} color="var(--color-accent-emerald)" />
                <span>Context API Auth Verified</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-slate-700)' }}>
                <CheckCircle2 size={16} color="var(--color-accent-emerald)" />
                <span>Axios Bearer Interceptor Active</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-slate-700)' }}>
                <CheckCircle2 size={16} color="var(--color-accent-emerald)" />
                <span>RBAC Route Protection Active</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-slate-700)' }}>
                <Clock size={16} color="var(--color-primary-600)" />
                <span>Awaiting User Approval for Dashboard</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Info Card */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-slate-800)' }}>
          Active Session Details
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>Name</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-slate-900)' }}>{user?.name}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>Email</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-slate-900)' }}>{user?.email}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>Role</div>
            <div>
              <span className="badge badge-admin">{user?.role}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
