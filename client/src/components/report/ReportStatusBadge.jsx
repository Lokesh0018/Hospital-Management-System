import React from 'react';
import { Clock, CheckCircle2, FileText, AlertCircle } from 'lucide-react';

export const ReportStatusBadge = ({ status }) => {
  const normStatus = status?.toUpperCase()?.replace(/\s+/g, '_');

  switch (normStatus) {
    case 'REVIEWED':
      return (
        <span
          className="badge badge-success"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
        >
          <CheckCircle2 size={13} />
          <span>Reviewed & Signed</span>
        </span>
      );
    case 'UNDER_REVIEW':
      return (
        <span
          className="badge badge-warning"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
        >
          <Clock size={13} />
          <span>Under Review</span>
        </span>
      );
    case 'UPLOADED':
    default:
      return (
        <span
          className="badge badge-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
        >
          <FileText size={13} />
          <span>Uploaded (Pending)</span>
        </span>
      );
  }
};

export default ReportStatusBadge;
