import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { receptionistApi } from '../../api/receptionistApi.js';
import { PaymentModal } from '../../components/billing/PaymentModal.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import '../../styles/receptionist.css';

/**
 * BillingDesk
 * Dedicated front-desk billing, invoicing, and patient payment collection desk
 */
export const BillingDesk = () => {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [error, setError] = useState(null);

  // Payment modal state
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { limit: 100 };
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      const res = await receptionistApi.getInvoices(params);
      setInvoices(res.data?.invoices || res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load billing ledger.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filteredInvoices = invoices.filter((inv) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const patName = inv.patient?.user?.name || inv.patient?.name || '';
    const invNum = inv.invoiceNumber?.toLowerCase() || '';
    return patName.toLowerCase().includes(term) || invNum.includes(term);
  });

  const totalPendingDue = invoices
    .filter((inv) => inv.status === 'PENDING' || inv.status === 'PARTIALLY_PAID')
    .reduce((acc, curr) => acc + (curr.dueAmount || curr.totalAmount || 0), 0);

  const pendingCount = invoices.filter(
    (inv) => inv.status === 'PENDING' || inv.status === 'PARTIALLY_PAID'
  ).length;

  return (
    <div className="receptionist-container">
      {/* Header */}
      <div className="receptionist-header">
        <div className="receptionist-title-group">
          <h1>
            <span>💵</span> Front Desk Billing & Cashier Desk
          </h1>
          <p>Collect walk-in consultation fees, diagnostic payments, and settle patient invoices</p>
        </div>

        <div className="receptionist-header-actions">
          <button
            type="button"
            className="rec-btn-action rec-btn-checkin"
            style={{ padding: '0.65rem 1.25rem', background: '#2563eb', color: '#ffffff', borderColor: '#2563eb', fontSize: '0.9rem' }}
            onClick={() => navigate('/billing')}
          >
            + Create New Invoice
          </button>
          <button
            type="button"
            className="rec-btn-action rec-btn-view"
            onClick={() => navigate('/receptionist')}
          >
            ← Back to Hub
          </button>
        </div>
      </div>

      {/* Summary KPI Tiles */}
      <div className="receptionist-kpi-grid">
        <div className="rec-kpi-card">
          <div className="rec-kpi-icon danger">💳</div>
          <div className="rec-kpi-info">
            <span className="rec-kpi-value">${totalPendingDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="rec-kpi-label">Outstanding Unpaid Dues</span>
            <span className="rec-kpi-sub">Across all registered patients</span>
          </div>
        </div>

        <div className="rec-kpi-card">
          <div className="rec-kpi-icon warning">⏳</div>
          <div className="rec-kpi-info">
            <span className="rec-kpi-value">{pendingCount}</span>
            <span className="rec-kpi-label">Pending Invoices</span>
            <span className="rec-kpi-sub">Awaiting settlement</span>
          </div>
        </div>

        <div className="rec-kpi-card">
          <div className="rec-kpi-icon success">🧾</div>
          <div className="rec-kpi-info">
            <span className="rec-kpi-value">{invoices.length}</span>
            <span className="rec-kpi-label">Total Billed Invoices</span>
            <span className="rec-kpi-sub">Current records in ledger</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rec-section-card" style={{ padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="rec-search-bar" style={{ flex: '1 1 300px' }}>
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search by invoice number (#INV...) or patient name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            >
              <option value="ALL">All Invoices</option>
              <option value="PENDING">Pending Payment</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Paid in Full</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <button
              type="button"
              className="rec-btn-action rec-btn-view"
              onClick={fetchInvoices}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '1rem', borderRadius: '0.5rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Invoices Ledger Table */}
      <div className="rec-section-card">
        <div className="rec-section-header">
          <h2 className="rec-section-title">
            <span>📋</span> Front Desk Invoicing Queue ({filteredInvoices.length})
          </h2>
        </div>

        <div className="rec-table-wrapper">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <LoadingSpinner text="Retrieving cashier ledger..." />
            </div>
          ) : (
            <table className="rec-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Patient Name</th>
                  <th>Total Amount</th>
                  <th>Paid Amount</th>
                  <th>Balance Due</th>
                  <th>Payment Status</th>
                  <th style={{ textAlign: 'right' }}>Cashier Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                      No invoices found for the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const patName = inv.patient?.user?.name || inv.patient?.name || 'Walk-in Patient';
                    const isSettled = inv.status === 'PAID';
                    const isCancelled = inv.status === 'CANCELLED';

                    return (
                      <tr key={inv.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>
                            #{inv.invoiceNumber}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {new Date(inv.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500, color: '#1e293b' }}>{patName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {inv.patient?.user?.phone || inv.patient?.phone || ''}
                          </div>
                        </td>
                        <td>
                          <strong>${(inv.totalAmount || 0).toFixed(2)}</strong>
                        </td>
                        <td>
                          <span style={{ color: '#059669', fontWeight: 500 }}>
                            ${(inv.paidAmount || 0).toFixed(2)}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: (inv.dueAmount || 0) > 0 ? '#b91c1c' : '#059669' }}>
                            ${(inv.dueAmount || 0).toFixed(2)}
                          </strong>
                        </td>
                        <td>
                          <span className={`badge-slot status-badge-${inv.status?.toLowerCase()}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            {!isSettled && !isCancelled && (
                              <button
                                type="button"
                                className="rec-btn-action rec-btn-checkin"
                                style={{ padding: '0.4rem 0.85rem', background: '#059669', color: '#ffffff', borderColor: '#059669' }}
                                onClick={() => setSelectedInvoice(inv)}
                              >
                                💵 Collect Payment
                              </button>
                            )}

                            <button
                              type="button"
                              className="rec-btn-action rec-btn-view"
                              onClick={() => navigate(`/billing/${inv.id}`)}
                            >
                              View Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Collect Payment Modal */}
      <PaymentModal
        isOpen={Boolean(selectedInvoice)}
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onSuccess={() => {
          setSelectedInvoice(null);
          fetchInvoices();
        }}
      />
    </div>
  );
};

export default BillingDesk;
