import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export const InvoiceStatusBadge = ({ status }) => {
  const normStatus = (status || 'PENDING').toUpperCase();

  switch (normStatus) {
    case 'PAID':
      return (
        <span className="invoice-badge paid">
          <CheckCircle2 size={12} />
          <span>Paid</span>
        </span>
      );
    case 'PARTIALLY_PAID':
      return (
        <span className="invoice-badge partially_paid">
          <Clock size={12} />
          <span>Partially Paid</span>
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="invoice-badge cancelled">
          <XCircle size={12} />
          <span>Cancelled</span>
        </span>
      );
    case 'PENDING':
    default:
      return (
        <span className="invoice-badge pending">
          <AlertTriangle size={12} />
          <span>Pending</span>
        </span>
      );
  }
};

export default InvoiceStatusBadge;
