import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { billingApi } from '../../api/billingApi.js';
import { InvoiceStatusBadge } from '../../components/billing/InvoiceStatusBadge.jsx';
import { PaymentMethodBadge } from '../../components/billing/PaymentMethodBadge.jsx';
import { PaymentModal } from '../../components/billing/PaymentModal.jsx';
import {
  CreditCard,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  RefreshCw,
  Receipt,
  ArrowRight
} from 'lucide-react';
import '../../styles/billing.css';

export const PatientBillingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Active Payment Modal
  const [paymentTarget, setPaymentTarget] = useState(null);

  const fetchPatientBilling = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [invRes, payRes] = await Promise.all([
        billingApi.getMyInvoices({
          status: filterStatus !== 'ALL' ? filterStatus : undefined
        }),
        billingApi.getMyPayments()
      ]);

      setInvoices(invRes?.data?.invoices || invRes?.data || []);
      setPayments(payRes?.data?.payments || payRes?.data || []);
    } catch (err) {
      console.error('Failed to load patient billing details:', err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Unable to load your medical billing records.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchPatientBilling();
  }, [fetchPatientBilling]);

  // Aggregate stats
  const totalBilled = invoices.reduce((sum, i) => sum + (i.status !== 'CANCELLED' ? i.totalAmount : 0), 0);
  const totalPaid = invoices.reduce((sum, i) => sum + (i.status !== 'CANCELLED' ? i.paidAmount : 0), 0);
  const totalDue = invoices.reduce((sum, i) => sum + (i.status !== 'CANCELLED' ? i.dueAmount : 0), 0);

  // First pending invoice to pay
  const pendingInvoice = invoices.find((i) => i.dueAmount > 0.001 && i.status !== 'CANCELLED');

  const handlePaymentSuccess = () => {
    fetchPatientBilling(true);
  };

  const handleViewInvoice = (invId) => {
    navigate(`/patient/billing/${invId}`);
  };

  return (
    <div className="billing-container">
      {/* Header */}
      <div className="billing-page-header">
        <div className="billing-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Receipt size={24} color="#0284c7" />
            <h1>My Medical Invoices & Payments</h1>
          </div>
          <p>Review healthcare expenses, itemized medical receipts, and make secure payments.</p>
        </div>

        <div className="header-actions-group">
          <button
            id="btn-refresh-patient-billing"
            className="refresh-btn"
            onClick={() => fetchPatientBilling(true)}
            disabled={refreshing}
            title="Refresh Records"
          >
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert-card alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Outstanding Balance Banner (if applicable) */}
      {totalDue > 0.01 && (
        <div className="outstanding-alert-banner">
          <div className="banner-content-group">
            <div className="banner-icon">
              <DollarSign size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e11d48', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                OUTSTANDING BALANCE DUE
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#9f1239' }}>
                ${totalDue.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#881337', marginTop: '0.15rem' }}>
                Please settle your outstanding hospital charges to maintain your account in good standing.
              </div>
            </div>
          </div>

          {pendingInvoice && (
            <button
              id="btn-patient-pay-now-banner"
              className="btn btn-primary"
              style={{ background: '#e11d48', borderColor: '#e11d48' }}
              onClick={() => setPaymentTarget(pendingInvoice)}
            >
              <CreditCard size={16} />
              <span>Pay Balance Now</span>
            </button>
          )}
        </div>
      )}

      {/* Overview Metric Tiles */}
      <div className="billing-kpi-grid">
        <div className="billing-kpi-card">
          <div className="kpi-icon-box billed">
            <DollarSign size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Incurred</span>
            <span className="kpi-value">${totalBilled.toFixed(2)}</span>
            <span className="kpi-subtext">All hospital services</span>
          </div>
        </div>

        <div className="billing-kpi-card">
          <div className="kpi-icon-box collected">
            <CheckCircle size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Paid</span>
            <span className="kpi-value" style={{ color: '#16a34a' }}>${totalPaid.toFixed(2)}</span>
            <span className="kpi-subtext">Settled payments</span>
          </div>
        </div>

        <div className="billing-kpi-card">
          <div className="kpi-icon-box outstanding">
            <Clock size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Remaining Balance</span>
            <span className="kpi-value" style={{ color: totalDue > 0 ? '#dc2626' : '#16a34a' }}>
              ${totalDue.toFixed(2)}
            </span>
            <span className="kpi-subtext">{totalDue > 0 ? 'Payment required' : 'All clear'}</span>
          </div>
        </div>
      </div>

      {/* Invoices Section with Filter Tabs */}
      <div className="billing-table-card">
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
            Invoices & Statements
          </h2>

          <div className="status-pills-group">
            {[
              { label: 'All Invoices', value: 'ALL' },
              { label: 'Pending Payment', value: 'PENDING' },
              { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
              { label: 'Paid in Full', value: 'PAID' }
            ].map((tab) => (
              <button
                key={tab.value}
                id={`btn-patient-tab-${tab.value.toLowerCase()}`}
                type="button"
                className={`status-pill-btn ${filterStatus === tab.value ? 'active' : ''}`}
                onClick={() => setFilterStatus(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Invoices Table */}
        {loading ? (
          <div style={{ padding: '1.5rem' }}>
            <div className="skeleton-box" style={{ height: 45, marginBottom: '0.5rem' }} />
            <div className="skeleton-box" style={{ height: 45, marginBottom: '0.5rem' }} />
            <div className="skeleton-box" style={{ height: 45 }} />
          </div>
        ) : invoices.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
            No invoice records found in this category.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="billing-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date Issued</th>
                  <th>Total Amount</th>
                  <th>Paid</th>
                  <th>Balance Due</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const hasDue = inv.dueAmount > 0.001;
                  const isCancelled = inv.status === 'CANCELLED';

                  return (
                    <tr key={inv.id}>
                      <td>
                        <span className="inv-code">{inv.invoiceNumber}</span>
                      </td>
                      <td>{new Date(inv.issuedDate).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600 }}>${inv.totalAmount.toFixed(2)}</td>
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
                            id={`btn-patient-view-${inv.id}`}
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleViewInvoice(inv.id)}
                            title="View Statement"
                          >
                            <Eye size={14} />
                            <span>View</span>
                          </button>

                          {hasDue && !isCancelled && (
                            <button
                              id={`btn-patient-pay-${inv.id}`}
                              className="btn btn-primary btn-sm"
                              onClick={() => setPaymentTarget(inv)}
                            >
                              <CreditCard size={14} />
                              <span>Pay Now</span>
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
        )}
      </div>

      {/* Payment History & Receipts */}
      {payments.length > 0 && (
        <div className="billing-table-card">
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              My Payment Transactions
            </h2>
          </div>

          <div className="table-responsive">
            <table className="billing-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Date & Time</th>
                  <th>Invoice #</th>
                  <th>Payment Method</th>
                  <th>Amount Paid</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="font-mono" style={{ fontWeight: 600, color: '#0284c7' }}>
                      {p.transactionId}
                    </td>
                    <td>{new Date(p.paidAt).toLocaleString()}</td>
                    <td>
                      <span className="inv-code">{p.bill?.invoiceNumber || '—'}</span>
                    </td>
                    <td>
                      <PaymentMethodBadge method={p.paymentMethod} />
                    </td>
                    <td style={{ fontWeight: 700, color: '#16a34a' }}>
                      ${p.amount.toFixed(2)}
                    </td>
                    <td>
                      <span className="invoice-badge paid">{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentTarget && (
        <PaymentModal
          isOpen={true}
          invoice={paymentTarget}
          onClose={() => setPaymentTarget(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default PatientBillingPage;
