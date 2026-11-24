import React from 'react';
import { Pill, Calendar } from 'lucide-react';

export const RecentPrescriptionsTable = ({ prescriptions = [] }) => {
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'badge-active';
      case 'COMPLETED':
        return 'badge-doctor';
      case 'CANCELLED':
      default:
        return 'badge-admin';
    }
  };

  if (!prescriptions || prescriptions.length === 0) {
    return <div className="empty-state">No recent prescriptions issued.</div>;
  }

  return (
    <div className="table-responsive">
      <table className="custom-table">
        <thead>
          <tr>
            <th>Diagnosis</th>
            <th>Patient</th>
            <th>Prescribing Doctor</th>
            <th>Medicines</th>
            <th>Status</th>
            <th>Date Issued</th>
          </tr>
        </thead>
        <tbody>
          {prescriptions.map((rx) => {
            const dateStr = rx.createdAt ? rx.createdAt.split('T')[0] : '--';
            const medSummary = Array.isArray(rx.medicines) && rx.medicines.length > 0
              ? rx.medicines.map((m) => m.medicineName).join(', ')
              : `${rx.medicinesCount || 0} item(s)`;

            return (
              <tr key={rx.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-sm)',
                        background: '#faf5ff',
                        color: '#9333ea',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Pill size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                        {rx.diagnosis}
                      </div>
                      {rx.instructions && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {rx.instructions}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--color-slate-800)' }}>
                    {rx.patient?.name || 'Patient'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)' }}>
                    {rx.patient?.email || ''}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--color-slate-800)' }}>
                    {rx.doctor?.name || 'Doctor'}
                  </div>
                </td>
                <td style={{ maxWidth: 220 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        background: '#f1f5f9',
                        color: '#475569',
                        padding: '0.15rem 0.45rem',
                        borderRadius: 'var(--radius-full)',
                      }}
                    >
                      {rx.medicinesCount || (rx.medicines?.length ?? 0)} meds
                    </span>
                    <span style={{ fontSize: '0.775rem', color: 'var(--color-slate-600)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {medSummary}
                    </span>
                  </div>
                </td>
                <td>
                  <span className={`badge ${getStatusBadgeClass(rx.status)}`}>
                    {rx.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem', color: 'var(--color-slate-600)' }}>
                    <Calendar size={14} color="var(--color-slate-400)" />
                    <span>{dateStr}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RecentPrescriptionsTable;
