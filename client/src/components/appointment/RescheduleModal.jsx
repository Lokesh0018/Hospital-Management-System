import React, { useState } from 'react';
import { appointmentApi } from '../../api/appointmentApi.js';
import { LiveSlotSelector } from './LiveSlotSelector.jsx';
import { Calendar, Clock, X, CheckCircle2, AlertCircle } from 'lucide-react';

export const RescheduleModal = ({ appointment, onClose, onRescheduled }) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const doctorId = appointment?.doctor?.id || appointment?.doctorId;
  const doctorName =
    appointment?.doctor?.name ||
    appointment?.doctor?.user?.name ||
    `Doctor #${doctorId?.substring(0, 5)}`;

  const [appointmentDate, setAppointmentDate] = useState(
    appointment?.appointmentDate || todayStr
  );
  const [timeSlot, setTimeSlot] = useState(appointment?.timeSlot || 'MORNING');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!appointmentDate) {
      setError('Please pick a new appointment date.');
      return;
    }
    if (!timeSlot) {
      setError('Please choose a time slot.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await appointmentApi.updateAppointment(appointment.id, {
        appointmentDate,
        timeSlot
      });

      const updated = res?.data;
      if (onRescheduled) {
        onRescheduled(updated);
      }
      onClose();
    } catch (err) {
      console.error('Failed to reschedule appointment:', err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to reschedule. The doctor may already have a booking for this time slot.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-box">
            <Calendar size={22} color="#0284c7" />
            <div>
              <h3>Reschedule Appointment</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)', margin: 0 }}>
                Select a new consultation date and time slot for {doctorName}
              </p>
            </div>
          </div>
          <button
            id="btn-close-reschedule-modal"
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

            {/* Current details notice */}
            <div
              style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                fontSize: '0.825rem',
                color: '#0369a1'
              }}
            >
              Current Schedule: <strong>{appointment?.appointmentDate}</strong> during{' '}
              <strong>{appointment?.timeSlot}</strong> slot with <strong>{doctorName}</strong>.
            </div>

            {/* Date Picker */}
            <div className="form-group">
              <label className="form-label" htmlFor="reschedule-date-input">
                New Appointment Date <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                id="reschedule-date-input"
                type="date"
                required
                min={todayStr}
                className="form-control"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
              />
            </div>

            {/* Live Slot Selector */}
            <LiveSlotSelector
              doctorId={doctorId}
              date={appointmentDate}
              selectedSlot={timeSlot}
              onSelectSlot={setTimeSlot}
              disabled={submitting}
            />
          </div>

          {/* Footer */}
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
              id="btn-confirm-reschedule-submit"
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              <CheckCircle2 size={16} />
              <span>{submitting ? 'Rescheduling...' : 'Confirm Reschedule'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RescheduleModal;
