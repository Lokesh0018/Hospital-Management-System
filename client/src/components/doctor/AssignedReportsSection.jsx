import React, { useState } from 'react';
import { FileText, Calendar, CheckCircle2, Clock } from 'lucide-react';

export const AssignedReportsSection = ({ reports = [], onOpenReviewModal }) => {
  const [filter, setFilter] = useState('ALL');

  const filteredReports = reports.filter((r) => {
    if (filter === 'ALL') return true;
    return r.status === filter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'REVIEWED':
        return <span className="badge badge-active">Reviewed</span>;
      case 'UNDER_REVIEW':
        return <span className="badge badge-pending">Under Review</span>;
      case 'UPLOADED':
      default:
        return <span className="badge badge-doctor">Uploaded</span>;
    }
  };

  return (
    <div className="enterprise-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="activity-header" style={{ padding: '1.25rem 1.5rem', background: 'var(--surface-alt)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="activity-title" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Assigned Medical Diagnostic Reports</div>

        <div className="tab-buttons" style={{ display: 'flex', gap: '0.25rem', background: 'var(--color-slate-100)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
          <button
            className={`tab-btn ${filter === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilter('ALL')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, border: 'none', background: filter === 'ALL' ? 'white' : 'transparent', color: filter === 'ALL' ? 'var(--color-primary-600)' : 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', boxShadow: filter === 'ALL' ? 'var(--shadow-sm)' : 'none' }}
          >
            All Reports ({reports.length})
          </button>
          <button
            className={`tab-btn ${filter === 'UNDER_REVIEW' ? 'active' : ''}`}
            onClick={() => setFilter('UNDER_REVIEW')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, border: 'none', background: filter === 'UNDER_REVIEW' ? 'white' : 'transparent', color: filter === 'UNDER_REVIEW' ? 'var(--color-primary-600)' : 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', boxShadow: filter === 'UNDER_REVIEW' ? 'var(--shadow-sm)' : 'none' }}
          >
            Pending Review ({reports.filter((r) => r.status === 'UNDER_REVIEW' || r.status === 'UPLOADED').length})
          </button>
          <button
            className={`tab-btn ${filter === 'REVIEWED' ? 'active' : ''}`}
            onClick={() => setFilter('REVIEWED')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, border: 'none', background: filter === 'REVIEWED' ? 'white' : 'transparent', color: filter === 'REVIEWED' ? 'var(--color-primary-600)' : 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', boxShadow: filter === 'REVIEWED' ? 'var(--shadow-sm)' : 'none' }}
          >
            Reviewed ({reports.filter((r) => r.status === 'REVIEWED').length})
          </button>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="empty-state" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No assigned medical reports in this category.</div>
      ) : (
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="rec-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border-subtle)' }}>
              <tr>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Report Details</th>
                <th style={{ padding: '1.25rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Type</th>
                <th style={{ padding: '1.25rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Patient</th>
                <th style={{ padding: '1.25rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '1.25rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Clinical Notes</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((rep) => (
                <tr key={rep.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background var(--transition-fast)' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
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
                        <FileText size={16} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{rep.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {rep.reportDate || rep.createdAt?.split('T')[0]}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '1.25rem' }}>
                    <span
                      style={{
                        background: 'var(--surface-alt)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {rep.reportType}
                    </span>
                  </td>

                  <td style={{ padding: '1.25rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      {rep.patient?.name || 'Patient'}
                    </div>
                  </td>

                  <td style={{ padding: '1.25rem' }}>{getStatusBadge(rep.status)}</td>

                  <td style={{ padding: '1.25rem', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {rep.doctorNotes ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {rep.doctorNotes}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        Pending clinical findings
                      </span>
                    )}
                  </td>

                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                    <button
                      className="rec-btn-action rec-btn-checkin"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: 'var(--radius-full)' }}
                      onClick={() => onOpenReviewModal(rep)}
                    >
                      {rep.status === 'REVIEWED' ? 'Edit Review' : 'Review Report'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AssignedReportsSection;
