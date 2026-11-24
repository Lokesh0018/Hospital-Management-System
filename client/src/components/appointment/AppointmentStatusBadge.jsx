import React from 'react';
import {
  Clock,
  CheckCircle2,
  CalendarCheck,
  CalendarX,
  AlertCircle
} from 'lucide-react';

export const AppointmentStatusBadge = ({ status }) => {
  switch (status?.toUpperCase()) {
    case 'CONFIRMED':
      return (
        <span
          className="badge badge-success"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
        >
          <CheckCircle2 size={13} />
          <span>Confirmed</span>
        </span>
      );
    case 'PENDING':
      return (
        <span
          className="badge badge-warning"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
        >
          <Clock size={13} />
          <span>Pending</span>
        </span>
      );
    case 'COMPLETED':
      return (
        <span
          className="badge badge-info"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
        >
          <CalendarCheck size={13} />
          <span>Completed</span>
        </span>
      );
    case 'CANCELLED':
      return (
        <span
          className="badge badge-danger"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
        >
          <CalendarX size={13} />
          <span>Cancelled</span>
        </span>
      );
    default:
      return <span className="badge badge-secondary">{status || 'Unknown'}</span>;
  }
};

export default AppointmentStatusBadge;
