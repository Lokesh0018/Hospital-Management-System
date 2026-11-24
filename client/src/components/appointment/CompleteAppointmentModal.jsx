import React, { useState } from 'react';
import { appointmentApi } from '../../api/appointmentApi.js';
import { CheckCircle, X, AlertCircle, FileText } from 'lucide-react';

export const CompleteAppointmentModal = ({ appointment, onClose, onCompleted }) => {
  const patientName =
    appointment?.patient?.name ||
    appointment?.patient?.user?.name ||
    'Patient';

  const [notes, setNotes] = useState(appointment?.notes || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      setSubmitting(true);
      const res = await appointmentApi.updateStatus(appointment.id, {
        status: 'COMPLETED',
        notes: notes.trim() || undefined
      });

      const updated = res?.data;
      if (onCompleted) {
        onCompleted(updated || { ...appointment, status: 'COMPLETED', notes: notes.trim() });
      }
      onClose();
    } catch (err) {
      console.error('Failed to complete appointment:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to complete appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-box">
            <CheckCircle size={22} color="#16a34a" />
            <div>
              <h3>Complete Consultation</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)', margin: 0 }}>
                Record clinical consultation findings and mark visit as completed
              </p>
            </div>
          </div>
          <button
            id="btn-close-complete-modal"
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
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                fontSize: '0.825rem',
                color: '#15803d'
              }}
            >
              Patient: <strong>{patientName}</strong> | Scheduled on{' '}
              <strong>{appointment?.appointmentDate}</strong> ({appointment?.timeSlot})
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="consultation-notes-input">
                Clinical Notes / Findings & Recommendations
              </label>
              <textarea
                id="consultation-notes-input"
                rows="4"
                className="form-control"
                placeholder="Enter diagnostic impressions, patient advice, vitals checked, and follow-up plan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={1000}
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
              Cancel
            </button>
            <button
              id="btn-submit-complete-appointment"
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ background: '#16a34a', borderColor: '#16a34a' }}
            >
              <CheckCircle size={16} />
              <span>{submitting ? 'Completing Visit...' : 'Mark as Completed'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteAppointmentModal;
