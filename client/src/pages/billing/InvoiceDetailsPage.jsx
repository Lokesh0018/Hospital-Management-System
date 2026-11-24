import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { billingApi } from '../../api/billingApi.js';
import { InvoiceStatusBadge } from '../../components/billing/InvoiceStatusBadge.jsx';
import { PaymentMethodBadge } from '../../components/billing/PaymentMethodBadge.jsx';
import { PaymentModal } from '../../components/billing/PaymentModal.jsx';
import {
  CreditCard,
  ArrowLeft,
  Printer,
  Ban,
  User,
  Stethoscope,
  Calendar,
  AlertCircle,
  FileText,
  Activity,
  CheckCircle2,
  DollarSign,
  Clock,
  Download
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import '../../styles/billing.css';

export const InvoiceDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentRole = user?.role || 'PATIENT';

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await billingApi.getInvoiceById(id);
        setInvoice(res?.data);
      } catch (err) {
        console.error('Failed to load invoice details:', err);
        setError(
          err?.response?.data?.message ||
          err?.message ||
          'Invoice record not found or access restricted.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchInvoice();
  }, [id]);

  const handleBack = () => {
    if (currentRole === 'ADMIN') navigate('/admin/billing');
    else navigate('/patient/billing');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('invoice-print-area');
    if (!element) return;
    
    const opt = {
      margin:       [0.5, 0.5, 0.5, 0.5],
      filename:     `Invoice_${invoice.invoiceNumber}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  const handlePaymentSuccess = (updatedInvoice) => {
    setInvoice(updatedInvoice);
  };

  const handleCancel = async () => {
    const reason = window.prompt(
      `Cancel invoice #${invoice?.invoiceNumber}?\nPlease state reason for cancellation:`,
      'Administrative correction / patient cancellation'
    );
    if (!reason) return;

    try {
      const res = await billingApi.cancelInvoice(id, reason);
      setInvoice(res?.data);
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to cancel invoice.');
    }
  };

  if (loading) {
    return (
      <div className="billing-container">
        <div className="skeleton-box" style={{ width: 160, height: 36, marginBottom: '1.25rem' }} />
        <div className="details-header-card" style={{ padding: '2rem' }}>
          <div className="skeleton-box" style={{ width: '40%', height: 30, marginBottom: '0.75rem' }} />
          <div className="skeleton-box" style={{ width: '20%', height: 20 }} />
        </div>
        <div className="skeleton-box" style={{ height: 350, borderRadius: 'var(--radius-xl)', marginTop: '1.5rem' }} />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="billing-container">
        <button className="btn btn-secondary" onClick={handleBack} style={{ width: 'fit-content' }}>
          <ArrowLeft size={16} />
          <span>Back to Invoices</span>
        </button>

        <div className="billing-table-card" style={{ padding: '3.5rem 2rem', textAlign: 'center', marginTop: '1.5rem' }}>
          <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h3>Invoice Not Found</h3>
          <p style={{ color: '#64748b' }}>{error || 'Unable to retrieve invoice.'}</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => window.location.reload()}>
              Retry
            </button>
            <button className="btn btn-primary" onClick={handleBack}>
              Return to Invoices
            </button>
          </div>
        </div>
      </div>
    );
  }

  const patient = invoice.patient || {};
  const doctor = invoice.doctor || {};
  const items = invoice.items || [];
  const payments = invoice.payments || [];
  const hasDue = invoice.dueAmount > 0.001;
  const isCancelled = invoice.status === 'CANCELLED';
  const canPay = hasDue && !isCancelled;
  const canCancel = currentRole === 'ADMIN' && invoice.paidAmount === 0 && !isCancelled;

  // Compute item subtotal
  const itemsSubtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="billing-container">
      {/* Navigation and Top Actions (Hidden on print) */}
      <div className="details-actions-bar no-print">
        <button id="btn-back-to-invoices" className="btn btn-secondary" onClick={handleBack}>
          <ArrowLeft size={16} />
          <span>Back to Invoices</span>
        </button>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button id="btn-print-invoice" className="btn btn-outline" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print Statement</span>
          </button>

          <button id="btn-download-invoice" className="btn btn-outline" onClick={handleDownloadPDF}>
            <Download size={16} />
            <span>Download PDF</span>
          </button>

          {canPay && (
            <button
              id="btn-record-invoice-payment"
              className="btn btn-primary"
              onClick={() => setPaymentModalOpen(true)}
            >
              <CreditCard size={16} />
              <span>{currentRole === 'PATIENT' ? 'Pay Now' : 'Record Payment'}</span>
            </button>
          )}

          {canCancel && (
            <button id="btn-cancel-invoice-act" className="btn btn-danger-outline" onClick={handleCancel}>
              <Ban size={16} />
              <span>Cancel Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Official Invoice Dossier Card */}
      <div id="invoice-print-area" className="details-header-card">
        {/* Official Header */}
        <div className="inv-official-letterhead">
          <div className="hospital-brand">
            <Activity size={36} color="#0284c7" />
            <div>
              <div className="hospital-name" style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.4rem' }}>MedPulse Central Hospital</div>
              <div className="hospital-tagline" style={{ fontWeight: 600, color: 'var(--color-primary-600)' }}>Department of Financial Services & Patient Accounting</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                Tax ID / Reg: MEDP-90821-USA • Billing Desk: +1 (800) 555-MEDP • Email: billing@medpulse.test
              </div>
            </div>
          </div>

          <div className="inv-number-badge" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <div className="inv-number-title" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700 }}>{invoice.invoiceNumber}</div>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
        </div>

        {/* Requirement 10: Payment Status Timeline Stepper */}
        <div className="payment-timeline-stepper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 2rem', background: 'var(--surface-alt)', borderRadius: 'var(--radius-lg)', margin: '1.5rem 0', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-primary-600)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>✓</div>
            <div>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>1. Invoice Generated</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{new Date(invoice.issuedDate).toLocaleDateString()}</div>
            </div>
          </div>
          <div style={{ flex: 1, height: 2, background: invoice.paidAmount > 0 || invoice.status === 'PAID' ? 'var(--color-success-500)' : 'var(--border)', margin: '0 1rem' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: invoice.paidAmount > 0 || invoice.status === 'PAID' ? 'var(--color-success-500)' : 'var(--surface)', border: '2px solid var(--border)', color: invoice.paidAmount > 0 ? 'white' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
              {invoice.paidAmount > 0 ? '✓' : '2'}
            </div>
            <div>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>2. Payment Processed</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{invoice.paidAmount > 0 ? `$${invoice.paidAmount.toFixed(2)} received` : 'Awaiting payment'}</div>
            </div>
          </div>
          <div style={{ flex: 1, height: 2, background: invoice.status === 'PAID' ? 'var(--color-success-500)' : 'var(--border)', margin: '0 1rem' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: invoice.status === 'PAID' ? 'var(--color-success-500)' : 'var(--surface)', border: '2px solid var(--border)', color: invoice.status === 'PAID' ? 'white' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
              {invoice.status === 'PAID' ? '✓' : '3'}
            </div>
            <div>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>3. Receipt Settled</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{invoice.status === 'PAID' ? 'Fully Paid' : 'Pending'}</div>
            </div>
          </div>
        </div>

        {/* Patient & Attending Physician Profiles & QR Code */}
        <div className="profile-dossier-grid">
          {/* Patient */}
          <div className="dossier-block">
            <div className="dossier-title">BILL TO / PATIENT RECIPIENT</div>
            <div className="dossier-name">{patient.name || 'Patient'}</div>
            <div className="dossier-meta">
              <div><strong>Patient ID:</strong> <span className="font-mono">{patient.id?.slice(0, 12)}</span></div>
              <div><strong>Blood Group:</strong> {patient.bloodGroup || 'Not specified'} • <strong>Gender:</strong> {patient.gender || 'N/A'}</div>
              <div><strong>Contact Phone:</strong> {patient.phone || 'On file'}</div>
              {patient.emergencyContact && <div><strong>Emergency:</strong> {patient.emergencyContact}</div>}
              {patient.address && <div><strong>Billing Address:</strong> {patient.address}</div>}
            </div>
          </div>

          {/* Physician / Service Context */}
          <div className="dossier-block">
            <div className="dossier-title">BILLING & SERVICE DETAILS</div>
            <div className="dossier-name">
              {doctor.name ? `Dr. ${doctor.name}` : 'Hospital Inpatient & Diagnostic Services'}
            </div>
            <div className="dossier-meta">
              {doctor.specialization && <div><strong>Department:</strong> {doctor.specialization} ({doctor.department || 'Clinical'})</div>}
              <div><strong>Date Issued:</strong> {new Date(invoice.issuedDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
              <div>
                <strong>Due Date:</strong>{' '}
                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Payable on receipt'}
              </div>
              {invoice.appointment && (
                <div><strong>Linked Consultation:</strong> {invoice.appointment.timeSlot} on {new Date(invoice.appointment.appointmentDate).toLocaleDateString()}</div>
              )}
            </div>
          </div>

          {/* Requirement 10: QR Code Quick Pay Card */}
          <div className="dossier-block" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: 'var(--surface-alt)' }}>
            <div className="dossier-title" style={{ width: '100%' }}>SCAN TO PAY / VERIFY</div>
            <div style={{ background: '#ffffff', padding: '0.6rem', borderRadius: '12px', border: '1px solid var(--border)', margin: '0.5rem 0' }}>
              {/* SVG QR Code Illustration */}
              <svg width="84" height="84" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="30" height="30" rx="4" fill="#0f172a" />
                <rect x="5" y="5" width="20" height="20" fill="white" />
                <rect x="10" y="10" width="10" height="10" fill="#0ea5e9" />
                <rect x="70" y="0" width="30" height="30" rx="4" fill="#0f172a" />
                <rect x="75" y="5" width="20" height="20" fill="white" />
                <rect x="80" y="10" width="10" height="10" fill="#0ea5e9" />
                <rect x="0" y="70" width="30" height="30" rx="4" fill="#0f172a" />
                <rect x="5" y="75" width="20" height="20" fill="white" />
                <rect x="10" y="80" width="10" height="10" fill="#0ea5e9" />
                <rect x="40" y="40" width="20" height="20" rx="2" fill="#0f172a" />
                <rect x="65" y="65" width="15" height="15" fill="#0ea5e9" />
                <rect x="40" y="10" width="15" height="10" fill="#0f172a" />
                <rect x="10" y="40" width="15" height="10" fill="#0f172a" />
              </svg>
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Instant UPI & Card Verification</div>
          </div>
        </div>

        {/* Line Items Table */}
        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
            Itemized Clinical Services & Supplies
          </h3>
          <div className="table-responsive" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <table className="billing-table">
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>#</th>
                  <th style={{ width: '20%' }}>Category</th>
                  <th style={{ width: '45%' }}>Description</th>
                  <th style={{ width: '10%' }}>Qty</th>
                  <th style={{ width: '10%' }}>Unit Price</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td>{idx + 1}</td>
                    <td>
                      <span className="method-badge">{item.itemType}</span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>${item.unitPrice.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                      ${item.totalPrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Calculation Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
          {/* Notes Card */}
          <div className="dossier-block">
            <div className="dossier-title">BILLING NOTES & TERMS</div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
              {invoice.notes || 'All charges are in USD. Payment is due as specified. For billing questions or insurance claim disputes, please contact the hospital finance department.'}
            </p>
          </div>

          {/* Calculations Summary */}
          <div className="financial-summary-card">
            <div className="summary-calc-row">
              <span>Item Subtotal:</span>
              <span>${itemsSubtotal.toFixed(2)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="summary-calc-row" style={{ color: '#16a34a' }}>
                <span>Discount Applied:</span>
                <span>-${invoice.discount.toFixed(2)}</span>
              </div>
            )}
            {invoice.tax > 0 && (
              <div className="summary-calc-row">
                <span>Tax (Sales / VAT):</span>
                <span>+${invoice.tax.toFixed(2)}</span>
              </div>
            )}
            <div className="summary-calc-row total-row">
              <span>Grand Total:</span>
              <span>${invoice.totalAmount.toFixed(2)}</span>
            </div>
            <div className="summary-calc-row">
              <span>Amount Paid:</span>
              <span className="amount-settled">${invoice.paidAmount.toFixed(2)}</span>
            </div>
            <div className="summary-calc-row due-row">
              <span>Balance Due:</span>
              <span>${invoice.dueAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Transaction Ledger */}
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
            Payment History & Transaction Records
          </h3>
          {payments.length === 0 ? (
            <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.88rem' }}>
              No payments have been recorded for this invoice yet.
            </div>
          ) : (
            <div className="table-responsive" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <table className="billing-table">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Date & Time</th>
                    <th>Payment Method</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Reference / Notes</th>
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
                        <PaymentMethodBadge method={p.paymentMethod} />
                      </td>
                      <td style={{ fontWeight: 700, color: '#16a34a' }}>
                        ${p.amount.toFixed(2)}
                      </td>
                      <td>
                        <span className="invoice-badge paid">{p.status}</span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.82rem' }}>
                        {p.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Official Signature Footer for Print */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px dashed #cbd5e1' }}>
          <div style={{ width: '40%' }}>
            <div style={{ borderBottom: '1px solid #0f172a', width: '100%', height: '35px', marginBottom: '0.35rem' }} />
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Patient / Authorized Guarantor Signature</div>
          </div>
          <div style={{ width: '40%' }}>
            <div style={{ borderBottom: '1px solid #0f172a', width: '100%', height: '35px', marginBottom: '0.35rem' }} />
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Authorized Hospital Cashier / Finance Officer</div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModalOpen && (
        <PaymentModal
          isOpen={true}
          invoice={invoice}
          onClose={() => setPaymentModalOpen(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default InvoiceDetailsPage;
