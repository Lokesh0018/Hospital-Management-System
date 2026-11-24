import React, { useState } from 'react';
import {
  FileText,
  ExternalLink,
  Download,
  Clock,
  CheckCircle2,
  FileCheck,
  Stethoscope,
  Filter,
  Eye,
  AlertCircle
} from 'lucide-react';

const REPORT_TYPE_COLORS = {
  BLOOD_TEST: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  X_RAY: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  MRI: { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' },
  CT_SCAN: { bg: '#f0fdfa', text: '#0f766e', border: '#99f6e4' },
  ECG: { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
  OTHER: { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' }
};

export const PatientReportsSection = ({ reports = [] }) => {
  const [filterType, setFilterType] = useState('ALL');
  const [selectedReportForPreview, setSelectedReportForPreview] = useState(null);

  const filteredReports =
    filterType === 'ALL'
      ? reports
      : reports.filter((r) => r.reportType === filterType);

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'REVIEWED':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <CheckCircle2 size={12} /> Reviewed & Signed
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock size={12} /> Under Clinical Review
          </span>
        );
      case 'UPLOADED':
      default:
        return (
          <span className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <FileText size={12} /> Uploaded (Pending)
          </span>
        );
    }
  };

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div className="patient-section-header">
        <div className="patient-section-title">
          <FileCheck size={22} color="#059669" />
          <div>
            <h3>Medical Diagnostic Reports</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)', margin: 0 }}>
              Access diagnostic lab results, radiologic imaging, and doctor clinical findings
            </p>
          </div>
        </div>

        {/* Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={15} color="var(--color-slate-500)" />
          <select
            id="filter-report-type-select"
            className="form-control"
            style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.825rem' }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">All Diagnostic Types ({reports.length})</option>
            <option value="BLOOD_TEST">Blood Tests</option>
            <option value="X_RAY">X-Rays</option>
            <option value="MRI">MRI Scans</option>
            <option value="CT_SCAN">CT Scans</option>
            <option value="ECG">ECG / Electrocardiogram</option>
            <option value="OTHER">Other Diagnostics</option>
          </select>
        </div>
      </div>

      {/* Reports Feed */}
      {filteredReports.length === 0 ? (
        <div className="empty-feed-card">
          <div className="empty-icon-circle" style={{ background: '#ecfdf5', color: '#059669' }}>
            <FileText size={28} />
          </div>
          <h4>No Medical Reports Found</h4>
          <p>
            {filterType !== 'ALL'
              ? `No ${filterType.replace('_', ' ')} reports found on record.`
              : 'There are no laboratory or imaging reports uploaded for your profile yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredReports.map((report) => {
            const typeStyle = REPORT_TYPE_COLORS[report.reportType] || REPORT_TYPE_COLORS.OTHER;
            const doctorName =
              report.doctor?.user?.name ||
              report.doctor?.name ||
              (report.doctorId ? `Attending Doctor #${report.doctorId.substring(0, 5)}` : 'Hospital Lab');
            const createdDate = report.createdAt ? new Date(report.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }) : 'Recent';

            return (
              <div
                key={report.id}
                style={{
                  border: '1px solid var(--color-slate-200)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  background: 'white',
                  transition: 'box-shadow var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 'var(--radius-md)',
                        background: typeStyle.bg,
                        color: typeStyle.text,
                        border: `1px solid ${typeStyle.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <FileText size={22} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-slate-900)', margin: 0 }}>
                          {report.title || `${report.reportType?.replace('_', ' ')} Report`}
                        </h4>
                        <span
                          style={{
                            background: typeStyle.bg,
                            color: typeStyle.text,
                            border: `1px solid ${typeStyle.border}`,
                            padding: '0.15rem 0.5rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.725rem',
                            fontWeight: 700
                          }}
                        >
                          {report.reportType?.replace('_', ' ')}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--color-slate-500)', flexWrap: 'wrap' }}>
                        <span>Uploaded on {createdDate}</span>
                        {report.fileName && (
                          <span>• File: {report.fileName}</span>
                        )}
                        <span>• Reviewing Doctor: <strong>{doctorName}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {renderStatusBadge(report.status)}

                    {report.fileUrl ? (
                      <a
                        href={report.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="report-download-btn"
                        id={`btn-view-report-${report.id}`}
                      >
                        <ExternalLink size={14} />
                        <span>View / Download</span>
                      </a>
                    ) : (
                      <button
                        className="report-download-btn"
                        onClick={() => alert(`Report ID: ${report.id}\nStatus: ${report.status}\nReviewer: ${doctorName}\nFindings: ${report.doctorNotes || 'Pending review'}`)}
                      >
                        <Eye size={14} />
                        <span>View Details</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Doctor's Clinical Review Findings Box */}
                {report.doctorNotes ? (
                  <div className="report-doctor-notes-box">
                    <div className="report-doctor-notes-header">
                      <Stethoscope size={15} />
                      <span>Doctor Clinical Impression & Findings</span>
                    </div>
                    <p style={{ margin: 0, lineHeight: 1.5 }}>{report.doctorNotes}</p>
                  </div>
                ) : (
                  report.status === 'UNDER_REVIEW' && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.6rem 0.85rem',
                        background: '#fffbeb',
                        border: '1px solid #fef3c7',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.8rem',
                        color: '#92400e',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <Clock size={14} />
                      <span>The interpreting doctor is currently reviewing these diagnostic results. Clinical notes will be posted upon sign-off.</span>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PatientReportsSection;
