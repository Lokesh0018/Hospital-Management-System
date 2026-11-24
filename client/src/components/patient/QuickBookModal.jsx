import React, { useState, useEffect } from 'react';
import { patientApi } from '../../api/patientApi.js';
import {
  Calendar,
  Clock,
  UserCheck,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Sun,
  Sunset,
  Moon
} from 'lucide-react';

const TIME_SLOTS = [
  { id: 'MORNING', label: 'Morning', hours: '09:00 AM - 12:00 PM', icon: Sun },
  { id: 'AFTERNOON', label: 'Afternoon', hours: '02:00 PM - 05:00 PM', icon: Sunset },
  { id: 'EVENING', label: 'Evening', hours: '06:00 PM - 09:00 PM', icon: Moon }
];

export const QuickBookModal = ({ onClose, onBooked }) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(todayStr);
  const [selectedSlot, setSelectedSlot] = useState('MORNING');
  const [reason, setReason] = useState('');

  const [availableSlots, setAvailableSlots] = useState({
    MORNING: true,
    AFTERNOON: true,
    EVENING: true
  });
  const [checkingSlots, setCheckingSlots] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Load active doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const res = await patientApi.getDoctors({ limit: 50 });
        const docList = res?.data?.doctors || res?.data || [];
        setDoctors(docList);
        if (docList.length > 0) {
          setSelectedDoctorId(docList[0].id);
        }
      } catch (err) {
        console.error('Failed to load doctors list:', err);
        setError('Failed to fetch available doctors list.');
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, []);

  // Check slot availability when doctor or date changes
  useEffect(() => {
    if (!selectedDoctorId || !appointmentDate) return;

    let isMounted = true;
    const checkAvailability = async () => {
      try {
        setCheckingSlots(true);
        const res = await patientApi.getDoctorSlotAvailability(selectedDoctorId, appointmentDate);
        if (!isMounted) return;

        const data = res?.data;
        // Backend returns: { availableSlots: [...], bookedSlots: [...] } or slot map
        if (data?.availableSlots) {
          const slotMap = {
            MORNING: data.availableSlots.includes('MORNING'),
            AFTERNOON: data.availableSlots.includes('AFTERNOON'),
            EVENING: data.availableSlots.includes('EVENING')
          };
          setAvailableSlots(slotMap);

          // If current selected slot is booked, default to first available
          if (!slotMap[selectedSlot] && data.availableSlots.length > 0) {
            setSelectedSlot(data.availableSlots[0]);
          }
        }
      } catch (err) {
        console.warn('Doctor availability check skipped or not supported:', err);
        // Default to all slots open
        if (isMounted) {
          setAvailableSlots({ MORNING: true, AFTERNOON: true, EVENING: true });
        }
      } finally {
        if (isMounted) setCheckingSlots(false);
      }
    };

    checkAvailability();

    return () => {
      isMounted = false;
    };
  }, [selectedDoctorId, appointmentDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedDoctorId) {
      setError('Please select a doctor for your appointment.');
      return;
    }
    if (!appointmentDate) {
      setError('Please pick an appointment date.');
      return;
    }
    if (!selectedSlot) {
      setError('Please select a time slot.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        doctorId: selectedDoctorId,
        appointmentDate,
        timeSlot: selectedSlot,
        reason: reason.trim() || undefined
      };

      const res = await patientApi.bookAppointment(payload);
      const bookedApt = res?.data;
      if (onBooked) {
        onBooked(bookedApt);
      }
      onClose();
    } catch (err) {
      console.error('Failed to book appointment:', err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to book appointment. Doctor may already be booked for this slot.';
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
            <Calendar size={22} color="#059669" />
            <div>
              <h3>Quick Book Consultation</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)', margin: 0 }}>
                Schedule an appointment with a hospital specialist
              </p>
            </div>
          </div>
          <button
            id="btn-close-book-modal"
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

            {/* Doctor Selection */}
            <div className="form-group">
              <label className="form-label" htmlFor="doctor-select">
                Select Specialist / Physician <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                id="doctor-select"
                className="form-control"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                disabled={loadingDoctors}
                required
              >
                {loadingDoctors ? (
                  <option value="">Loading available doctors...</option>
                ) : (
                  doctors.map((doc) => {
                    const docName = doc?.name || doc?.user?.name || `Doctor #${doc.id.substring(0, 5)}`;
                    const specialty = doc?.profile?.specialization || doc?.specialization || 'Cardiologist / Physician';
                    const availStatus = doc?.profile?.availabilityStatus || doc?.availabilityStatus;
                    const statusText = availStatus === 'AVAILABLE' ? '🟢 Available' : '🟡 Busy';
                    return (
                      <option key={doc.id} value={doc.id}>
                        {docName} — {specialty} ({statusText})
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            {/* Date Picker */}
            <div className="form-group">
              <label className="form-label" htmlFor="appointment-date-input">
                Appointment Date <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                id="appointment-date-input"
                type="date"
                required
                min={todayStr}
                className="form-control"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
              />
            </div>

            {/* Slot Selector */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Select Time Slot <span style={{ color: '#dc2626' }}>*</span></span>
                {checkingSlots && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', fontWeight: 500 }}>
                    Checking availability...
                  </span>
                )}
              </label>

              <div className="slot-selector-grid">
                {TIME_SLOTS.map((slot) => {
                  const Icon = slot.icon;
                  const isAvailable = availableSlots[slot.id] !== false;
                  const isSelected = selectedSlot === slot.id;

                  return (
                    <div
                      key={slot.id}
                      className={`slot-option-card ${isSelected ? 'selected' : ''} ${
                        !isAvailable ? 'unavailable' : ''
                      }`}
                      onClick={() => {
                        if (isAvailable) setSelectedSlot(slot.id);
                      }}
                    >
                      <Icon size={20} color={isSelected ? '#059669' : '#64748b'} />
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? '#065f46' : 'inherit' }}>
                        {slot.label}
                      </div>
                      <span className="slot-time-text">{slot.hours}</span>
                      {!isAvailable && (
                        <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600, marginTop: 2 }}>
                          Booked
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reason / Symptoms */}
            <div className="form-group">
              <label className="form-label" htmlFor="appointment-reason-input">
                Consultation Reason / Symptoms (Optional)
              </label>
              <textarea
                id="appointment-reason-input"
                rows="3"
                className="form-control"
                placeholder="Describe your symptoms or reason for visit (e.g. Annual cardiovascular checkup, routine follow-up)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
              />
            </div>
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
              id="btn-confirm-book-appointment"
              type="submit"
              className="btn btn-primary"
              disabled={submitting || loadingDoctors}
              style={{ background: '#059669', borderColor: '#059669' }}
            >
              <CheckCircle2 size={16} />
              <span>{submitting ? 'Booking Consultation...' : 'Confirm Appointment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickBookModal;
