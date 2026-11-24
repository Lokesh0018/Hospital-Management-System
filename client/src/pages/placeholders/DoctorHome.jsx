import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Stethoscope, Calendar, FileText, Pill } from 'lucide-react';

export const DoctorHome = () => {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card" style={{ background: 'linear-gradient(135deg, #1e40af, #2563eb)', color: 'white', border: 'none' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          Doctor Portal - {user?.name}
        </h1>
        <p style={{ opacity: 0.9 }}>
          Access your clinical schedules, assigned medical diagnostics, and active prescriptions.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)', fontWeight: 600 }}>APPOINTMENTS</div>
            <div style={{ fontWeight: 600, color: 'var(--color-slate-800)' }}>View Schedule</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)', fontWeight: 600 }}>REPORTS</div>
            <div style={{ fontWeight: 600, color: 'var(--color-slate-800)' }}>Review Assigned Tests</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: '#faf5ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Pill size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)', fontWeight: 600 }}>PRESCRIPTIONS</div>
            <div style={{ fontWeight: 600, color: 'var(--color-slate-800)' }}>Write & Manage</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorHome;
