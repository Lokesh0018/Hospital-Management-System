import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { billingApi } from '../../api/billingApi.js';
import { patientApi } from '../../api/patientApi.js';
import { InvoiceItemsBuilder } from '../../components/billing/InvoiceItemsBuilder.jsx';
import {
  CreditCard,
  ArrowLeft,
  User,
  Stethoscope,
  Calendar,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  FileText
} from 'lucide-react';
import '../../styles/billing.css';

export const CreateInvoicePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form State
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    {
      id: 'init-item-1',
      itemType: 'CONSULTATION',
      description: 'Specialist Physician Consultation',
      quantity: 1,
      unitPrice: 150
    }
  ]);

  // Directories
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loadingDirectories, setLoadingDirectories] = useState(true);

  // Submitting
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDirectories = async () => {
      try {
        setLoadingDirectories(true);
        const [pRes, dRes] = await Promise.all([
          fetch('http://localhost:5000/api/v1/patients?limit=100', {
            headers: { Authorization: `Bearer ${localStorage.getItem('hms_access_token')}` }
          }).then((r) => r.json()),
          patientApi.getDoctors({ limit: 100 })
        ]);

        const pList = pRes?.data?.patients || pRes?.data || [];
        setPatients(pList);
        if (pList.length > 0) setPatientId(pList[0].id);

        const dList = dRes?.data?.doctors || dRes?.data || [];
        setDoctors(dList);
        if (dList.length > 0) setDoctorId(dList[0].id);
      } catch (err) {
        console.warn('Failed to load directories for invoice creator:', err);
      } finally {
        setLoadingDirectories(false);
      }
    };

    loadDirectories();
  }, []);

  const handleBack = () => {
    navigate('/admin/billing');
  };

  // Calculations
  const subtotal = items.reduce((sum, it) => {
    const qty = parseInt(it.quantity, 10) || 0;
    const unit = parseFloat(it.unitPrice) || 0;
    return sum + qty * unit;
  }, 0);

  const discNum = parseFloat(discount) || 0;
  const taxNum = parseFloat(tax) || 0;
  const grandTotal = Math.max(0, subtotal - discNum + taxNum);

  const selectedPatient = patients.find((p) => p.id === patientId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!patientId) {
      setError('Please select a recipient patient.');
      return;
    }

    if (!items || items.length === 0) {
      setError('Please include at least one billable line item.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.description?.trim()) {
        setError(`Item #${i + 1}: Description is required.`);
        return;
      }
      if (parseInt(it.quantity, 10) < 1) {
        setError(`Item #${i + 1}: Quantity must be at least 1.`);
        return;
      }
      if (parseFloat(it.unitPrice) < 0) {
        setError(`Item #${i + 1}: Unit price cannot be negative.`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        patientId,
        doctorId: doctorId || undefined,
        dueDate: dueDate || undefined,
        discount: discNum,
        tax: taxNum,
        notes: notes.trim() || undefined,
        items: items.map((it) => ({
          itemType: it.itemType,
          description: it.description.trim(),
          quantity: parseInt(it.quantity, 10),
          unitPrice: parseFloat(it.unitPrice)
        }))
      };

      const res = await billingApi.createInvoice(payload);
      const createdInvoice = res?.data;

      if (createdInvoice?.id) {
        navigate(`/admin/billing/${createdInvoice.id}`);
      } else {
        handleBack();
      }
    } catch (err) {
      console.error('Failed to generate invoice:', err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to generate invoice. Please review all fields and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="billing-container">
      {/* Navigation Bar */}
      <div className="details-actions-bar">
        <button id="btn-back-to-invoices-list" className="btn btn-secondary" onClick={handleBack}>
          <ArrowLeft size={16} />
          <span>Back to Invoices</span>
        </button>
      </div>

      {/* Header */}
      <div className="billing-page-header" style={{ marginBottom: '1.25rem' }}>
        <div className="billing-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <CreditCard size={24} color="#0284c7" />
            <h1>Generate Hospital Invoice</h1>
          </div>
          <p>Create itemized patient statement, consultation fees, lab procedures, and medication charges.</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert-card alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Invoice Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Patient & Doctor Card */}
        <div className="billing-table-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={18} color="#0284c7" />
            <span>1. Patient & Physician Context</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {/* Patient Select */}
            <div className="form-group">
              <label htmlFor="select-invoice-patient">
                Target Patient <span className="text-danger">*</span>
              </label>
              <select
                id="select-invoice-patient"
                className="form-control"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                disabled={loadingDirectories}
                required
              >
                {patients.length === 0 ? (
                  <option value="">No patients available</option>
                ) : (
                  patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.user?.name} {p.bloodGroup ? `(Blood: ${p.bloodGroup})` : ''} - ID: {p.id.slice(0, 8)}
                    </option>
                  ))
                )}
              </select>

              {selectedPatient && (
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.4rem' }}>
                  Patient: <strong>{selectedPatient.name || selectedPatient.user?.name}</strong> • Blood Group:{' '}
                  <strong style={{ color: '#dc2626' }}>{selectedPatient.bloodGroup || 'O+'}</strong>
                </div>
              )}
            </div>

            {/* Doctor Select */}
            <div className="form-group">
              <label htmlFor="select-invoice-doctor">Attending Physician (Optional)</label>
              <select
                id="select-invoice-doctor"
                className="form-control"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                disabled={loadingDirectories}
              >
                <option value="">None / Hospital General Services</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.name} ({d.specialization || 'Physician'})
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div className="form-group">
              <label htmlFor="input-due-date">Payment Due Date</label>
              <input
                id="input-due-date"
                type="date"
                className="form-control"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Line Items Card */}
        <div className="billing-table-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={18} color="#0284c7" />
            <span>2. Itemized Clinical Charges & Supplies <span className="text-danger">*</span></span>
          </h3>

          <InvoiceItemsBuilder items={items} onChange={setItems} />
        </div>

        {/* Financial Adjustments & Totals Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* Notes Card */}
          <div className="billing-table-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} color="#0284c7" />
              <span>3. Billing Notes & Instructions</span>
            </h3>
            <textarea
              id="input-invoice-notes"
              className="form-control"
              rows={4}
              placeholder="e.g. Inpatient treatment coverage, pre-authorization details, or payment agreement terms."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
            />
          </div>

          {/* Adjustments & Grand Total Summary */}
          <div className="financial-summary-card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              Financial Summary
            </h3>

            <div className="summary-calc-row">
              <span>Subtotal:</span>
              <span style={{ fontWeight: 600 }}>${subtotal.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Discount ($):</span>
              <input
                id="input-discount"
                type="number"
                step="0.01"
                min="0"
                className="form-control form-control-sm"
                style={{ width: '110px', textAlign: 'right' }}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Tax / VAT ($):</span>
              <input
                id="input-tax"
                type="number"
                step="0.01"
                min="0"
                className="form-control form-control-sm"
                style={{ width: '110px', textAlign: 'right' }}
                value={tax}
                onChange={(e) => setTax(e.target.value)}
              />
            </div>

            <div className="summary-calc-row total-row">
              <span>Grand Total:</span>
              <span style={{ color: '#0284c7' }}>${grandTotal.toFixed(2)}</span>
            </div>
            <div className="summary-calc-row due-row">
              <span>Initial Due Balance:</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleBack}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            id="btn-submit-invoice"
            type="submit"
            className="btn btn-primary"
            disabled={submitting || loadingDirectories}
          >
            {submitting ? (
              <>
                <div className="spinner-sm" />
                <span>Generating Invoice...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Issue Hospital Invoice</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoicePage;
