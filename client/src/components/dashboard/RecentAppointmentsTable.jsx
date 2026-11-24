import React from 'react';
import { Calendar } from 'lucide-react';

export const RecentAppointmentsTable = ({ appointments = [] }) => {
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'badge-active';
      case 'CONFIRMED':
        return 'badge-doctor';
      case 'PENDING':
        return 'badge-pending';
      case 'CANCELLED':
      default:
        return 'badge-admin';
    }
  };

  const getSlotBadgeStyle = (slot) => {
    switch (slot) {
      case 'MORNING':
        return { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
      case 'AFTERNOON':
        return { background: '#e0f2fe', color: '#075985', border: '1px solid #bae6fd' };
      case 'EVENING':
      default:
        return { background: '#ede9fe', color: '#5b21b6', border: '1px solid #ddd6fe' };
    }
  };

  if (!appointments || appointments.length === 0) {
    return <div className="empty-state">No recent appointments found.</div>;
  }

  return (
    <div className="table-responsive">
      <table className="custom-table">
        <thead>
          <tr>
            <th>Patient</th>
            <th>Assigned Doctor</th>
            <th>Date</th>
            <th>Slot</th>
            <th>Status</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((apt) => (
            <tr key={apt.id}>
              <td>
                <div className="table-user-cell">
                  <div className="user-mini-avatar">
                    {apt.patient?.name ? apt.patient.name[0].toUpperCase() : 'P'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                      {apt.patient?.name || 'Unknown Patient'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)' }}>
                      {apt.patient?.phone || apt.patient?.email || '--'}
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <div style={{ fontWeight: 600, color: 'var(--color-slate-800)' }}>
                  {apt.doctor?.name || 'Unassigned'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-primary-600)' }}>
                  {apt.doctor?.specialization || ''}
                </div>
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                  <Calendar size={14} color="var(--color-slate-400)" />
                  <span>{apt.appointmentDate}</span>
                </div>
              </td>
              <td>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    ...getSlotBadgeStyle(apt.timeSlot),
                  }}
                >
                  {apt.timeSlot}
                </span>
              </td>
              <td>
                <span className={`badge ${getStatusBadgeClass(apt.status)}`}>
                  {apt.status}
                </span>
              </td>
              <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {apt.reason || '--'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentAppointmentsTable;
