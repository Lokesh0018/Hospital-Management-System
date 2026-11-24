import React from 'react';
import { Pill, Plus, Calendar } from 'lucide-react';
import { Button } from '../common/Button.jsx';

export const DoctorPrescriptionsSection = ({ prescriptions = [], onOpenCreateModal }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="badge badge-active">Active</span>;
      case 'COMPLETED':
        return <span className="badge badge-doctor">Completed</span>;
      case 'CANCELLED':
      default:
        return <span className="badge badge-admin">Cancelled</span>;
    }
  };

  return (
    <div className="enterprise-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="activity-header" style={{ padding: '1.25rem 1.5rem', background: 'var(--surface-alt)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="activity-title" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Clinical Prescriptions Issued by You</div>

        <button
          className="rec-btn-action rec-btn-view"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.65rem 1.25rem', background: 'var(--color-primary-600)', color: 'white', border: 'none', borderRadius: 'var(--radius-full)', cursor: 'pointer', fontWeight: 600 }}
          onClick={() => onOpenCreateModal()}
        >
          <Plus size={16} />
          Write Prescription
        </button>
      </div>

      {prescriptions.length === 0 ? (
        <div className="empty-state" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No prescriptions created yet. Click "Write Prescription" to issue one.</div>
      ) : (
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="rec-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border-subtle)' }}>
              <tr>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Diagnosis & Advice</th>
                <th style={{ padding: '1.25rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Patient</th>
                <th style={{ padding: '1.25rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Prescribed Medications</th>
                <th style={{ padding: '1.25rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Date Issued</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((rx) => {
                const dateStr = rx.createdAt ? rx.createdAt.split('T')[0] : '--';
                const medsList = Array.isArray(rx.medicines) ? rx.medicines : [];

                return (
                  <tr key={rx.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background var(--transition-fast)' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--color-primary-50)',
                            color: 'var(--color-primary-600)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Pill size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                            {rx.diagnosis}
                          </div>
                          {rx.instructions && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {rx.instructions}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        {rx.patient?.name || 'Patient'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {rx.patient?.email || ''}
                      </div>
                    </td>

                    <td style={{ padding: '1.25rem', maxWidth: 260 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {medsList.map((m, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'var(--surface-alt)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-secondary)',
                              padding: '0.2rem 0.6rem',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            {m.medicineName} ({m.dosage})
                          </span>
                        ))}
                      </div>
                    </td>

                    <td style={{ padding: '1.25rem' }}>{getStatusBadge(rx.status)}</td>

                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <Calendar size={14} />
                        <span>{dateStr}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DoctorPrescriptionsSection;
