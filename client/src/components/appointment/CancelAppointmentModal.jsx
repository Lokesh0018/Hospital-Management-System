import React, { useState } from 'react';
import { appointmentApi } from '../../api/appointmentApi.js';
import { Ban, X, AlertCircle, CalendarX } from 'lucide-react';

export const CancelAppointmentModal = ({ appointment, onClose, onCancelled }) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      setSubmitting(true);
      const res = await appointmentApi.cancelAppointment(appointment.id, {
        cancellationReason: reason.trim() || undefined
      });

      const updated = res?.data;
      if (onCancelled) {
        onCancelled(updated || { ...appointment, status: 'CANCELLED' });
      }
      onClose();
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to cancel appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-box">
            <CalendarX size={22} color="#dc2626" />
            <div>
              <h3>Cancel Consultation</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)', margin: 0 }}>
                Cancel scheduled visit #{appointment?.id?.substring(0, 8)?.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            id="btn-close-cancel-modal"
            className="modal-close-btn"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 'var(--radius-md)',
                  color: '#991b1b',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <AlertCircle size={18} color="#dc2626" />
                <span>{error}</span>
              </div>
            )}

            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                fontSize: '0.825rem',
                color: '#991b1b'
              }}
            >
              Are you sure you want to cancel the consultation scheduled for{' '}
              <strong>{appointment?.appointmentDate}</strong> ({appointment?.timeSlot})?
              This will release the doctor's reserved slot.
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cancellation-reason-input">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                id="cancellation-reason-input"
                rows="3"
                className="form-control"
                placeholder="Please share the reason for cancellation (e.g. Schedule conflict, feeling better, duplicate booking)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Keep Appointment
            </button>
            <button
              id="btn-confirm-cancel-appointment"
              type="submit"
              className="btn btn-danger"
              disabled={submitting}
            >
              <Ban size={16} />
              <span>{submitting ? 'Cancelling...' : 'Confirm Cancellation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CancelAppointmentModal;
