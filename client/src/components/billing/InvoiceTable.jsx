import React from 'react';
import { InvoiceStatusBadge } from './InvoiceStatusBadge.jsx';
import { Eye, CreditCard, Ban, Calendar, User } from 'lucide-react';

export const InvoiceTable = ({
  invoices = [],
  loading = false,
  onViewDetails,
  onOpenPayment,
  onCancelInvoice,
  currentRole = 'ADMIN'
}) => {
  if (loading) {
    return (
      <div className="billing-table-card" style={{ padding: '1.5rem' }}>
        {[1, 2, 3, 4, 5].map((idx) => (
          <div
            key={idx}
            className="skeleton-box"
            style={{ height: 50, marginBottom: '0.75rem', borderRadius: '8px' }}
          />
        ))}
      </div>
    );
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="billing-table-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '1rem' }}>
          No invoice records found matching your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="billing-table-card">
      <div className="table-responsive">
        <table className="billing-table">
          <thead>
            <tr>
              <th style={{ width: '15%' }}>Invoice #</th>
              <th style={{ width: '22%' }}>Patient Recipient</th>
              <th style={{ width: '15%' }}>Issued / Due Date</th>
              <th style={{ width: '12%' }}>Total</th>
              <th style={{ width: '12%' }}>Paid</th>
              <th style={{ width: '12%' }}>Due Balance</th>
              <th style={{ width: '12%' }}>Status</th>
              <th style={{ width: '15%', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const hasDue = inv.dueAmount > 0.001;
              const isCancelled = inv.status === 'CANCELLED';
              const canPay = hasDue && !isCancelled;
              const canCancel = currentRole === 'ADMIN' && inv.paidAmount === 0 && !isCancelled;

              return (
                <tr key={inv.id}>
                  <td>
                    <span className="inv-code">{inv.invoiceNumber}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>
                        {inv.patient?.name || 'Patient'}
                      </span>
                      {inv.patient?.bloodGroup && (
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Blood: {inv.patient.bloodGroup}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span style={{ fontSize: '0.82rem', color: '#0f172a' }}>
                        {new Date(inv.issuedDate).toLocaleDateString()}
                      </span>
                      {inv.dueDate && (
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Due: {new Date(inv.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>
                      ${inv.totalAmount.toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <span className={inv.paidAmount > 0 ? 'amount-settled' : 'text-muted'}>
                      ${inv.paidAmount.toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <span className={hasDue ? 'amount-due-highlight' : 'amount-settled'}>
                      ${inv.dueAmount.toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <InvoiceStatusBadge status={inv.status} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                      <button
                        id={`btn-view-invoice-${inv.id}`}
                        className="btn btn-secondary btn-sm"
                        onClick={() => onViewDetails(inv.id)}
                        title="View Statement / Dossier"
                      >
                        <Eye size={14} />
                      </button>

                      {canPay && (
                        <button
                          id={`btn-pay-invoice-${inv.id}`}
                          className="btn btn-primary btn-sm"
                          onClick={() => onOpenPayment(inv)}
                          title="Record / Make Payment"
                        >
                          <CreditCard size={14} />
                          <span>Pay</span>
                        </button>
                      )}

                      {canCancel && onCancelInvoice && (
                        <button
                          id={`btn-cancel-invoice-${inv.id}`}
                          className="btn btn-danger-outline btn-sm"
                          onClick={() => onCancelInvoice(inv)}
                          title="Void / Cancel Invoice"
                        >
                          <Ban size={14} />
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
    </div>
  );
};

export default InvoiceTable;
