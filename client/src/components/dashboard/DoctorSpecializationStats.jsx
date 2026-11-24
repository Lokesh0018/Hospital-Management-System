import React from 'react';
import { Stethoscope } from 'lucide-react';

const GRADIENTS = [
  'linear-gradient(90deg, #0284c7, #38bdf8)', // Sky
  'linear-gradient(90deg, #059669, #34d399)', // Emerald
  'linear-gradient(90deg, #7c3aed, #a78bfa)', // Purple
  'linear-gradient(90deg, #d97706, #fbbf24)', // Amber
  'linear-gradient(90deg, #e11d48, #fb7185)', // Rose
  'linear-gradient(90deg, #4f46e5, #818cf8)', // Indigo
];

export const DoctorSpecializationStats = ({ data }) => {
  const total = data?.totalDoctors || 0;
  const list = data?.list || [];

  return (
    <div className="analytics-card">
      <div className="analytics-card-header">
        <div className="analytics-card-title">
          <Stethoscope size={18} color="var(--color-primary-600)" />
          <span>Doctor Specialization Statistics</span>
        </div>
        <span className="analytics-card-badge">Total Doctors: {total}</span>
      </div>

      {list.length === 0 ? (
        <div className="empty-state">No doctors registered in the system yet.</div>
      ) : (
        <div className="spec-stats-list">
          {list.map((item, index) => {
            const gradient = GRADIENTS[index % GRADIENTS.length];
            const numericPercent = total > 0 ? (item.count / total) * 100 : 0;

            return (
              <div key={item.specialization} className="spec-stat-item">
                <div className="spec-stat-header">
                  <span>{item.specialization}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ color: 'var(--color-slate-900)', fontWeight: 700 }}>{item.count}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)' }}>
                      ({item.percentage || `${numericPercent.toFixed(1)}%`})
                    </span>
                  </div>
                </div>

                <div className="spec-progress-bg">
                  <div
                    className="spec-progress-bar"
                    style={{
                      width: `${numericPercent}%`,
                      background: gradient,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DoctorSpecializationStats;
