import React, { useState } from 'react';
import { billingApi } from '../../api/billingApi.js';
import { X, CreditCard, CheckCircle2, AlertCircle, DollarSign } from 'lucide-react';

const PAYMENT_METHODS = [
  { label: 'Online Payment (Instant)', value: 'ONLINE' },
  { label: 'Credit Card (Visa / Mastercard)', value: 'CREDIT_CARD' },
  { label: 'Debit Card', value: 'DEBIT_CARD' },
  { label: 'Cash Payment', value: 'CASH' },
  { label: 'UPI / Digital Wallet', value: 'UPI' },
  { label: 'Health Insurance Claim', value: 'INSURANCE' }
];

export const PaymentModal = ({
  isOpen,
  invoice,
  onClose,
  onSuccess
}) => {
  if (!isOpen || !invoice) return null;

  const dueAmount = invoice.dueAmount || 0;
  const [amount, setAmount] = useState(dueAmount.toFixed(2));
  const [paymentMethod, setPaymentMethod] = useState('ONLINE');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleFillFull = () => {
    setAmount(dueAmount.toFixed(2));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const payNum = parseFloat(amount);
    if (isNaN(payNum) || payNum <= 0) {
      setError('Payment amount must be greater than zero.');
      return;
    }

    if (payNum > dueAmount + 0.01) {
      setError(`Payment amount cannot exceed remaining balance of $${dueAmount.toFixed(2)}.`);
      return;
    }

    try {
      setSubmitting(true);
      const res = await billingApi.recordPayment(invoice.id, {
        amount: payNum,
        paymentMethod,
        notes: notes.trim() || undefined
      });

      if (onSuccess) {
        onSuccess(res.data);
      }
      onClose();
    } catch (err) {
      console.error('Failed to process payment:', err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Payment processing failed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal-card">
        {/* Header */}
        <div className="modal-header-row">
          <div>
            <h3>Process Payment</h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Invoice #{invoice.invoiceNumber} • Patient: {invoice.patient?.name}
            </span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="alert-card alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Balance Fill Banner */}
        <div className="quick-pay-bar">
          <div className="quick-pay-text">
            Outstanding Due: <strong>${dueAmount.toFixed(2)}</strong>
          </div>
          <button
            id="btn-fill-full-balance"
            type="button"
            className="btn-quick-fill"
            onClick={handleFillFull}
          >
            Pay Full Balance
          </button>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Amount */}
          <div className="form-group">
            <label htmlFor="input-pay-amount">
              Payment Amount ($) <span className="text-danger">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <DollarSign
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b'
                }}
              />
              <input
                id="input-pay-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={dueAmount}
                className="form-control"
                style={{ paddingLeft: '2.25rem', fontSize: '1.1rem', fontWeight: 600 }}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="form-group">
            <label htmlFor="select-pay-method">
              Payment Method <span className="text-danger">*</span>
            </label>
            <select
              id="select-pay-method"
              className="form-control"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              required
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label htmlFor="input-pay-notes">Transaction Reference / Notes (Optional)</label>
            <input
              id="input-pay-notes"
              type="text"
              className="form-control"
              placeholder="e.g. Card Auth #94821, Cash counter receipt"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              id="btn-confirm-payment"
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="spinner-sm" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard size={16} />
                  <span>Confirm Payment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
