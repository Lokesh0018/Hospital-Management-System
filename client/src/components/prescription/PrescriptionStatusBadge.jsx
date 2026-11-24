import React from 'react';
import { Pill, CheckCircle2, FileCheck, AlertCircle } from 'lucide-react';

export const PrescriptionStatusBadge = ({ status }) => {
  const norm = status?.toUpperCase();

  switch (norm) {
    case 'ACTIVE':
      return (
        <span
          className="badge badge-success"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
        >
          <Pill size={12} />
          <span>Active Regimen</span>
        </span>
      );
    case 'COMPLETED':
      return (
        <span
          className="badge badge-info"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
        >
          <FileCheck size={12} />
          <span>Completed</span>
        </span>
      );
    case 'CANCELLED':
      return (
        <span
          className="badge badge-danger"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
        >
          <AlertCircle size={12} />
          <span>Discontinued</span>
        </span>
      );
    default:
      return <span className="badge badge-secondary">{status || 'Unknown'}</span>;
  }
};

export default PrescriptionStatusBadge;
