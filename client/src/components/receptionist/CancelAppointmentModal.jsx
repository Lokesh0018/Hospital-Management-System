import React, { useState } from 'react';
import { receptionistApi } from '../../api/receptionistApi.js';

/**
 * CancelAppointmentModal
 * Allows receptionist to cancel an appointment and record the front-desk cancellation reason
 */
export const CancelAppointmentModal = ({ isOpen, appointment, onClose, onSuccess }) => {
  const [reason, setReason] = useState('Patient requested cancellation at front desk');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !appointment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await receptionistApi.cancelAppointment(appointment.id, {
        cancellationReason: reason.trim() || 'Front desk cancellation'
      });

      if (onSuccess) onSuccess(res.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to cancel appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const patientName = appointment.patient?.user?.name || appointment.patient?.name || 'Patient';
  const doctorName = appointment.doctor?.user?.name || appointment.doctor?.name || 'Doctor';

  return (
    <div className="rec-modal-backdrop" onClick={onClose}>
      <div className="rec-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="rec-modal-header">
          <h2>
            <span style={{ color: '#e11d48' }}>❌</span> Cancel Appointment
          </h2>
          <button
            type="button"
            className="rec-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rec-modal-body">
            {error && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.85rem'
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0 }}>
              Are you sure you want to cancel the following appointment? This will release the doctor's time slot for other patients.
            </p>

            <div
              style={{
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                borderRadius: '0.5rem',
                padding: '0.85rem 1rem'
              }}
            >
              <div style={{ fontWeight: 600, color: '#9f1239' }}>Patient: {patientName}</div>
              <div style={{ fontSize: '0.85rem', color: '#be123c', marginTop: '0.2rem' }}>
                Doctor: Dr. {doctorName}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#be123c' }}>
                Date: {new Date(appointment.appointmentDate).toLocaleDateString()} · Slot: {appointment.timeSlot}
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                Cancellation Reason *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Reason for cancellation (patient emergency, schedule conflict, etc.)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div className="rec-modal-footer">
            <button
              type="button"
              className="rec-btn-action rec-btn-view"
              onClick={onClose}
              disabled={submitting}
            >
              Back
            </button>
            <button
              type="submit"
              className="rec-btn-action rec-btn-cancel"
              disabled={submitting}
              style={{ padding: '0.6rem 1.25rem' }}
            >
              {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CancelAppointmentModal;
