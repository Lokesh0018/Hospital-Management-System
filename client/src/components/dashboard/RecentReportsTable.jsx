import React from 'react';
import { FileText, Calendar } from 'lucide-react';

export const RecentReportsTable = ({ reports = [] }) => {
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'REVIEWED':
        return 'badge-active';
      case 'UNDER_REVIEW':
        return 'badge-pending';
      case 'UPLOADED':
      default:
        return 'badge-doctor';
    }
  };

  const getReportTypeBadge = (type) => {
    return {
      background: '#f8fafc',
      border: '1px solid #cbd5e1',
      color: '#334155',
      padding: '0.15rem 0.5rem',
      borderRadius: 'var(--radius-sm)',
      fontSize: '0.75rem',
      fontWeight: 600,
    };
  };

  if (!reports || reports.length === 0) {
    return <div className="empty-state">No recent medical reports recorded.</div>;
  }

  return (
    <div className="table-responsive">
      <table className="custom-table">
        <thead>
          <tr>
            <th>Report Title</th>
            <th>Type</th>
            <th>Patient</th>
            <th>Assigned Doctor</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((rep) => (
            <tr key={rep.id}>
              <td>
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
                    <FileText size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                      {rep.title}
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <span style={getReportTypeBadge(rep.reportType)}>
                  {rep.reportType}
                </span>
              </td>
              <td>
                <div style={{ fontWeight: 600, color: 'var(--color-slate-800)' }}>
                  {rep.patient?.name || 'Patient'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)' }}>
                  {rep.patient?.email || ''}
                </div>
              </td>
              <td>
                <div style={{ fontWeight: 600, color: 'var(--color-slate-800)' }}>
                  {rep.doctor?.name || 'Unassigned'}
                </div>
              </td>
              <td>
                <span className={`badge ${getStatusBadgeClass(rep.status)}`}>
                  {rep.status?.replace('_', ' ')}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem', color: 'var(--color-slate-600)' }}>
                  <Calendar size={14} color="var(--color-slate-400)" />
                  <span>{rep.reportDate || (rep.createdAt ? rep.createdAt.split('T')[0] : '--')}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentReportsTable;
