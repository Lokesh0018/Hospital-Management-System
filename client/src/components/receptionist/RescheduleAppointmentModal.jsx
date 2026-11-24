import React, { useState } from 'react';
import { receptionistApi } from '../../api/receptionistApi.js';

/**
 * RescheduleAppointmentModal
 * Allows receptionist to update appointment date and time slot
 */
export const RescheduleAppointmentModal = ({ isOpen, appointment, onClose, onSuccess }) => {
  const [newDate, setNewDate] = useState(
    appointment?.appointmentDate
      ? new Date(appointment.appointmentDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [newSlot, setNewSlot] = useState(appointment?.timeSlot || 'MORNING');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !appointment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await receptionistApi.rescheduleAppointment(appointment.id, {
        appointmentDate: newDate,
        timeSlot: newSlot
      });

      if (onSuccess) onSuccess(res.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to reschedule appointment. Slot may be unavailable.');
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
            <span>🔄</span> Reschedule Appointment
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

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                padding: '0.85rem 1rem'
              }}
            >
              <div style={{ fontWeight: 600, color: '#0f172a' }}>Patient: {patientName}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                Assigned Doctor: Dr. {doctorName}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Current: {new Date(appointment.appointmentDate).toLocaleDateString()} ({appointment.timeSlot})
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                New Appointment Date *
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                New Time Slot *
              </label>
              <select
                value={newSlot}
                onChange={(e) => setNewSlot(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
              >
                <option value="MORNING">MORNING (09:00 AM - 12:00 PM)</option>
                <option value="AFTERNOON">AFTERNOON (02:00 PM - 05:00 PM)</option>
                <option value="EVENING">EVENING (06:00 PM - 09:00 PM)</option>
              </select>
            </div>
          </div>

          <div className="rec-modal-footer">
            <button
              type="button"
              className="rec-btn-action rec-btn-view"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rec-btn-action rec-btn-reschedule"
              disabled={submitting}
              style={{ padding: '0.6rem 1.25rem' }}
            >
              {submitting ? 'Updating...' : 'Confirm Reschedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RescheduleAppointmentModal;
