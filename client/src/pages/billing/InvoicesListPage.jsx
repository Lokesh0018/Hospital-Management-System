import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { billingApi } from '../../api/billingApi.js';
import { BillingKPICards } from '../../components/billing/BillingKPICards.jsx';
import { InvoiceFilters } from '../../components/billing/InvoiceFilters.jsx';
import { InvoiceTable } from '../../components/billing/InvoiceTable.jsx';
import { PaymentModal } from '../../components/billing/PaymentModal.jsx';
import {
  CreditCard,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import '../../styles/billing.css';

export const InvoicesListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentRole = user?.role || 'ADMIN';

  // Filters State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [patientId, setPatientId] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Data State
  const [stats, setStats] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Payment Modal State
  const [paymentTarget, setPaymentTarget] = useState(null);

  // Load directories and initial stats
  useEffect(() => {
    billingApi
      .getStats()
      .then((res) => setStats(res?.data))
      .catch((err) => console.warn('Failed to load billing stats:', err));

    fetch('http://localhost:5000/api/v1/patients?limit=100', {
      headers: { Authorization: `Bearer ${localStorage.getItem('hms_access_token')}` }
    })
      .then((r) => r.json())
      .then((d) => setPatients(d?.data?.patients || d?.data || []))
      .catch((err) => console.warn('Failed to load patients for billing filter:', err));
  }, []);

  // Fetch Invoices
  const fetchInvoices = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const params = {
        page,
        limit,
        status: status !== 'ALL' ? status : undefined,
        patientId: patientId || undefined,
        search: search.trim() || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      const res = await billingApi.getAllInvoices(params);
      const data = res?.data;

      if (data?.invoices) {
        setInvoices(data.invoices);
        setPagination(data.pagination || { total: data.invoices.length, page: 1, limit, totalPages: 1 });
      } else if (Array.isArray(data)) {
        setInvoices(data);
        setPagination({ total: data.length, page: 1, limit, totalPages: 1 });
      } else {
        setInvoices([]);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Unable to load invoice records.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit, status, patientId, search]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('ALL');
    setPatientId('');
    setPage(1);
  };

  const handleViewDetails = (invId) => {
    navigate(`/admin/billing/${invId}`);
  };

  const handleCreateClick = () => {
    navigate('/admin/billing/create');
  };

  const handlePaymentSuccess = (updatedInvoice) => {
    // Update invoice in table
    setInvoices((prev) =>
      prev.map((i) => (i.id === updatedInvoice.id ? updatedInvoice : i))
    );
    // Refresh stats
    billingApi
      .getStats()
      .then((res) => setStats(res?.data))
      .catch(() => {});
  };

  const handleCancelInvoice = async (invoice) => {
    const reason = window.prompt(
      `Cancel invoice #${invoice.invoiceNumber} for ${invoice.patient?.name}?\nPlease provide cancellation reason:`,
      'Patient cancelled procedure / administrative correction'
    );
    if (!reason) return;

    try {
      const res = await billingApi.cancelInvoice(invoice.id, reason);
      const updated = res?.data;
      setInvoices((prev) =>
        prev.map((i) => (i.id === updated.id ? updated : i))
      );
      billingApi.getStats().then((r) => setStats(r?.data));
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to cancel invoice.');
    }
  };

  return (
    <div className="billing-container">

      {/* Page Header */}
      <div className="billing-page-header">
        <div className="billing-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <CreditCard size={24} color="var(--color-primary-600, #0284c7)" />
            <h1>Billing & Revenue Management</h1>
          </div>
          <p>Hospital financial accounts, patient statements, invoices, and transaction logs.</p>
        </div>

        <div className="header-actions-group">
          <button
            id="btn-refresh-billing"
            className="refresh-btn"
            onClick={() => {
              fetchInvoices(true);
              billingApi.getStats().then((r) => setStats(r?.data));
            }}
            disabled={refreshing}
            title="Refresh Invoices"
          >
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
          </button>

          {currentRole === 'ADMIN' && (
            <button
              id="btn-generate-invoice"
              className="btn btn-primary"
              onClick={handleCreateClick}
            >
              <Plus size={16} />
              <span>Generate Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert-card alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Financial KPI Summary Cards */}
      <BillingKPICards stats={stats} />

      {/* Filters Toolbar */}
      <InvoiceFilters
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        status={status}
        onStatusChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
        patientId={patientId}
        onPatientChange={(v) => {
          setPatientId(v);
          setPage(1);
        }}
        patients={patients}
        onReset={handleResetFilters}
      />

      {/* Invoices Table */}
      <InvoiceTable
        invoices={invoices}
        loading={loading}
        onViewDetails={handleViewDetails}
        onOpenPayment={(inv) => setPaymentTarget(inv)}
        onCancelInvoice={handleCancelInvoice}
        currentRole={currentRole}
      />

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--color-surface, #fff)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-xl, 1rem)',
            border: '1px solid var(--color-border, #e2e8f0)'
          }}
        >
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total invoices)
          </span>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              id="btn-invoice-prev-page"
              className="btn btn-secondary btn-sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <button
              id="btn-invoice-next-page"
              className="btn btn-secondary btn-sm"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Interactive Payment Modal */}
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

export default InvoicesListPage;
