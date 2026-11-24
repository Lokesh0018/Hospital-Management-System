import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { appointmentApi } from '../../api/appointmentApi.js';
import { patientApi } from '../../api/patientApi.js';
import { LiveSlotSelector } from '../../components/appointment/LiveSlotSelector.jsx';
import {
  CalendarPlus,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building,
  DollarSign
} from 'lucide-react';
import '../../styles/appointments.css';

export const AppointmentBookingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentRole = user?.role || 'PATIENT';

  const todayStr = new Date().toISOString().split('T')[0];

  // Form State
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(todayStr);
  const [timeSlot, setTimeSlot] = useState('MORNING');
  const [reason, setReason] = useState('');

  // UI State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successApt, setSuccessApt] = useState(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const res = await patientApi.getDoctors({ limit: 100 });
        const list = res?.data?.doctors || res?.data || [];
        setDoctors(list);
        if (list.length > 0) {
          setSelectedDoctorId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load doctors directory:', err);
        setError('Unable to load available doctors.');
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, []);

  const handleBack = () => {
    if (currentRole === 'ADMIN') navigate('/admin/appointments');
    else navigate('/patient/appointments');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedDoctorId) {
      setError('Please select an attending doctor.');
      return;
    }
    if (!appointmentDate) {
      setError('Please choose an appointment date.');
      return;
    }
    if (!timeSlot) {
      setError('Please select a time slot.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        doctorId: selectedDoctorId,
        appointmentDate,
        timeSlot,
        reason: reason.trim() || undefined
      };

      const res = await appointmentApi.bookAppointment(payload);
      const booked = res?.data;
      setSuccessApt(booked);
    } catch (err) {
      console.error('Failed to book appointment:', err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to book consultation. The selected doctor may already be booked for this slot.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  // Success Confirmation Screen
  if (successApt) {
    return (
      <div className="appointments-container" style={{ maxWidth: 700 }}>
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
            Consultation Confirmed!
          </h2>
          <p style={{ color: 'var(--color-slate-600)', maxWidth: 440, margin: '0.5rem auto 1.75rem', lineHeight: 1.5 }}>
            Your appointment has been recorded with Reference #
            <strong>{successApt.id?.substring(0, 8)?.toUpperCase()}</strong>.
          </p>

          <div
            style={{
              background: '#f8fafc',
              border: '1px solid var(--color-slate-200)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              maxWidth: 480,
              margin: '0 auto 2rem',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              fontSize: '0.875rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-slate-500)' }}>Attending Physician</span>
              <span style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                {selectedDoctor?.name || selectedDoctor?.user?.name || 'Assigned Physician'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-slate-500)' }}>Scheduled Date</span>
              <span style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                {successApt.appointmentDate}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-slate-500)' }}>Time Slot</span>
              <span style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                {successApt.timeSlot}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-slate-500)' }}>Status</span>
              <span className="badge badge-warning" style={{ fontWeight: 700 }}>
                {successApt.status}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => setSuccessApt(null)}>
              Book Another Visit
            </button>
            <button className="btn btn-primary" onClick={handleBack}>
              View All Appointments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="appointments-container" style={{ maxWidth: 900 }}>
      {/* Back button */}
      <button
        className="btn btn-secondary"
        onClick={handleBack}
        style={{ width: 'fit-content', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
      >
        <ArrowLeft size={16} />
        <span>Back to Appointments</span>
      </button>

      {/* Header */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #047857, #065f46)', color: 'white', border: 'none', padding: '1.75rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <CalendarPlus size={24} color="#a7f3d0" />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Book Medical Consultation</h1>
        </div>
        <p style={{ opacity: 0.9, marginTop: '0.35rem', fontSize: '0.875rem' }}>
          Schedule a specialist clinic visit with verified availability and instant slot reservation
        </p>
      </div>

      {/* Booking Form Card */}
      <form onSubmit={handleSubmit} className="card" style={{ padding: '2rem' }}>
        {error && (
          <div
            style={{
              padding: '0.85rem 1rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              color: '#991b1b',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem'
            }}
          >
            <AlertCircle size={18} color="#dc2626" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Doctor Selection */}
        <div className="form-group" style={{ marginBottom: '1.75rem' }}>
          <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 700 }}>
            1. Select Attending Specialist <span style={{ color: '#dc2626' }}>*</span>
          </label>

          {loadingDoctors ? (
            <div className="skeleton-box" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />
          ) : (
            <div className="doctor-select-grid">
              {doctors.map((doc) => {
                const name = doc?.name || doc?.user?.name || `Dr. #${doc.id.substring(0, 5)}`;
                const specialty = doc?.profile?.specialization || doc?.specialization || 'General Practice';
                const department = doc?.profile?.department || 'Outpatient Clinic';
                const isSelected = selectedDoctorId === doc.id;
                const fee = doc?.profile?.consultationFee ? `$${doc.profile.consultationFee}` : '$100';

                return (
                  <div
                    key={doc.id}
                    className={`doctor-select-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedDoctorId(doc.id)}
                  >
                    <div className="doctor-select-avatar">
                      {name.charAt(0) || 'D'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--color-slate-900)' }}>
                        {name}
                      </div>
                      <div style={{ fontSize: '0.785rem', color: 'var(--color-primary-700)', fontWeight: 600, marginTop: 2 }}>
                        {specialty}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--color-slate-500)', marginTop: 2 }}>
                        {department} • {fee}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 2: Date Picker */}
        <div className="form-group" style={{ marginBottom: '1.75rem' }}>
          <label className="form-label" htmlFor="booking-date-input" style={{ fontSize: '0.95rem', fontWeight: 700 }}>
            2. Choose Appointment Date <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            id="booking-date-input"
            type="date"
            required
            min={todayStr}
            className="form-control"
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
          />
        </div>

        {/* Step 3: Live Time Slot Selector */}
        <div className="form-group" style={{ marginBottom: '1.75rem' }}>
          <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 700 }}>
            3. Available Time Slots
          </label>
          <LiveSlotSelector
            doctorId={selectedDoctorId}
            date={appointmentDate}
            selectedSlot={timeSlot}
            onSelectSlot={setTimeSlot}
            disabled={submitting}
          />
        </div>

        {/* Step 4: Reason for Visit */}
        <div className="form-group" style={{ marginBottom: '2rem' }}>
          <label className="form-label" htmlFor="booking-reason-input" style={{ fontSize: '0.95rem', fontWeight: 700 }}>
            4. Reason for Visit / Symptoms (Optional)
          </label>
          <textarea
            id="booking-reason-input"
            rows="3"
            className="form-control"
            placeholder="Describe your primary reason for visiting or current symptoms..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)', marginTop: 4, display: 'block' }}>
            {reason.length}/500 characters
          </span>
        </div>

        {/* Form Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-slate-100)' }}>
          <button type="button" className="btn btn-secondary" onClick={handleBack} disabled={submitting}>
            Cancel
          </button>
          <button
            id="btn-submit-book-appointment"
            type="submit"
            className="btn btn-primary"
            disabled={submitting || loadingDoctors}
            style={{ background: '#047857', borderColor: '#047857' }}
          >
            <CheckCircle2 size={16} />
            <span>{submitting ? 'Confirming Reservation...' : 'Confirm Consultation Booking'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentBookingPage;
