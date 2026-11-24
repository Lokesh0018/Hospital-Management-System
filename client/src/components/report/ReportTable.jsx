import React from 'react';
import { ReportStatusBadge } from './ReportStatusBadge.jsx';
import { ReportTypeBadge } from './ReportTypeBadge.jsx';
import {
  FileText,
  User,
  Stethoscope,
  Eye,
  ExternalLink,
  Download,
  Trash2,
  Edit3,
  Calendar
} from 'lucide-react';

export const ReportTable = ({
  reports = [],
  currentRole = 'PATIENT',
  onViewDetails,
  onReview,
  onDelete
}) => {
  return (
    <div className="table-responsive">
      <table className="table" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Diagnostic Report</th>
            <th>Patient Details</th>
            <th>Interpreting Doctor</th>
            <th>Upload Date</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => {
            const patientName =
              report.patient?.name ||
              report.patient?.user?.name ||
              `Patient #${report.patientId?.substring(0, 5) || 'Record'}`;
            const patientPhone =
              report.patient?.phone ||
              report.patient?.user?.phone ||
              report.patient?.emergencyContact ||
              '';

            const doctorName =
              report.doctor?.name ||
              report.doctor?.user?.name ||
              (report.doctorId ? `Doctor #${report.doctorId.substring(0, 5)}` : 'Hospital Lab');
            const specialty =
              report.doctor?.specialization ||
              report.doctor?.department ||
              'Clinical Specialist';

            const uploadDate = report.reportDate || report.createdAt?.split('T')[0] || 'Recent';

            const canDoctorReview =
              (currentRole === 'DOCTOR' || currentRole === 'ADMIN') &&
              report.status !== 'REVIEWED';
            const canAdminDelete = currentRole === 'ADMIN';

            return (
              <tr key={report.id}>
                {/* Diagnostic Report Title & Type */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-slate-100)',
                        color: 'var(--color-slate-700)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <FileText size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-slate-900)', fontSize: '0.875rem' }}>
                        {report.title}
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <ReportTypeBadge type={report.reportType} />
                      </div>
                    </div>
                  </div>
                </td>

                {/* Patient Details */}
                <td>
                  <div className="appointment-user-cell">
                    <div className="appointment-avatar avatar-patient">
                      <User size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                        {patientName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                        {report.patient?.bloodGroup ? `${report.patient.bloodGroup} • ` : ''}
                        {patientPhone || `ID: #${report.id.substring(0, 6)}`}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Interpreting Doctor */}
                <td>
                  <div className="appointment-user-cell">
                    <div className="appointment-avatar avatar-doctor">
                      <Stethoscope size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                        {doctorName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                        {specialty}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Upload Date */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-slate-700)', fontSize: '0.85rem' }}>
                    <Calendar size={14} color="var(--color-slate-400)" />
                    <span>{uploadDate}</span>
                  </div>
                </td>

                {/* Status */}
                <td>
                  <ReportStatusBadge status={report.status} />
                </td>

                {/* Actions */}
                <td style={{ textAlign: 'right' }}>
                  <div className="appointment-actions-group">
                    {/* View Details */}
                    <button
                      id={`btn-view-report-${report.id}`}
                      className="btn-table-action btn-action-view"
                      onClick={() => onViewDetails(report.id)}
                      title="View Report Details & File"
                    >
                      <Eye size={13} />
                      <span>Details</span>
                    </button>

                    {/* Doctor Review */}
                    {canDoctorReview && (
                      <button
                        id={`btn-review-report-${report.id}`}
                        className="btn-table-action btn-action-confirm"
                        onClick={() => onReview(report)}
                        title="Add Doctor Clinical Findings"
                      >
                        <Edit3 size={13} />
                        <span>Review</span>
                      </button>
                    )}

                    {/* Download / Open File */}
                    {report.fileUrl && (
                      <a
                        href={report.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-table-action btn-action-view"
                        title="Download or View File"
                      >
                        <ExternalLink size={13} />
                        <span>File</span>
                      </a>
                    )}

                    {/* Admin Delete */}
                    {canAdminDelete && (
                      <button
                        id={`btn-delete-report-${report.id}`}
                        className="btn-table-action btn-action-cancel"
                        onClick={() => onDelete(report)}
                        title="Delete Report Record"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    )}
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

export default ReportTable;
