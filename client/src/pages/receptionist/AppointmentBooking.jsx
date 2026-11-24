import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { receptionistApi } from '../../api/receptionistApi.js';
import '../../styles/receptionist.css';

/**
 * AppointmentBooking
 * Dedicated front-desk appointment booking page with live doctor slot checking
 */
export const AppointmentBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');

  const [formData, setFormData] = useState({
    patientId: location.state?.patientId || '',
    doctorId: location.state?.doctorId || '',
    appointmentDate: location.state?.appointmentDate || new Date().toISOString().split('T')[0],
    timeSlot: location.state?.timeSlot || 'MORNING',
    reason: ''
  });

  const [availableSlots, setAvailableSlots] = useState([]);
  const [checkingSlots, setCheckingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [bookedAppointment, setBookedAppointment] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      setInitialLoading(true);
      await Promise.all([loadPatients(), loadDoctors()]);
      setInitialLoading(false);
    };
    initializeData();
  }, []);

  const loadPatients = async () => {
    try {
      const res = await receptionistApi.getPatients({ limit: 100 });
      console.log("Patients response:", res);
      let extracted = [];
      if (Array.isArray(res)) extracted = res;
      else if (res && Array.isArray(res.data)) extracted = res.data;
      else if (res && res.patients && Array.isArray(res.patients)) extracted = res.patients;
      else if (res && res.data && res.data.patients && Array.isArray(res.data.patients)) extracted = res.data.patients;
      else if (res && res.data && Array.isArray(res.data.data)) extracted = res.data.data;
      
      setPatients(extracted);
    } catch (err) {
      console.error('Failed to load patients API error:', err.status, err.message, err.errors || err);
    }
  };

  const loadDoctors = async () => {
    try {
      const res = await receptionistApi.getDoctors({ limit: 100 });
      console.log("Doctors response:", res);
      let extracted = [];
      if (Array.isArray(res)) extracted = res;
      else if (res && Array.isArray(res.data)) extracted = res.data;
      else if (res && res.doctors && Array.isArray(res.doctors)) extracted = res.doctors;
      else if (res && res.data && res.data.doctors && Array.isArray(res.data.doctors)) extracted = res.data.doctors;
      else if (res && res.data && Array.isArray(res.data.data)) extracted = res.data.data;
      
      setDoctors(extracted);
      if (extracted.length > 0 && !formData.doctorId) {
        setFormData((prev) => ({ ...prev, doctorId: extracted[0].id }));
      }
    } catch (err) {
      console.error('Failed to load doctors API error:', err.status, err.message, err.errors || err);
    }
  };

  // Check slots whenever doctor or date changes
  useEffect(() => {
    if (formData.doctorId && formData.appointmentDate) {
      checkDoctorSlots();
    }
  }, [formData.doctorId, formData.appointmentDate]);

  const checkDoctorSlots = async () => {
    setCheckingSlots(true);
    try {
      const res = await receptionistApi.getDoctorAvailability(
        formData.doctorId,
        formData.appointmentDate
      );
      setAvailableSlots(res.data?.slots || []);
    } catch (err) {
      console.error('Failed slot check', err);
      setAvailableSlots([]);
    } finally {
      setCheckingSlots(false);
    }
  };

  const filteredPatients = patients.filter((p) => {
    if (!patientSearch) return true;
    const term = patientSearch.toLowerCase();
    return (
      p.name?.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term) ||
      p.phone?.toLowerCase().includes(term)
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId) {
      setError('Please select a patient from the directory.');
      return;
    }
    if (!formData.doctorId) {
      setError('Please select an attending doctor.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await receptionistApi.bookAppointment({
        patientId: formData.patientId,
        doctorId: formData.doctorId,
        appointmentDate: formData.appointmentDate,
        timeSlot: formData.timeSlot,
        reason: formData.reason.trim() || 'Front-desk scheduled consultation'
      });

      setBookedAppointment(res.data);
    } catch (err) {
      setError(err.message || 'Booking failed. The doctor slot may already be fully booked.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      patientId: '',
      doctorId: doctors.length > 0 ? doctors[0].id : '',
      appointmentDate: new Date().toISOString().split('T')[0],
      timeSlot: 'MORNING',
      reason: ''
    });
    setBookedAppointment(null);
    setError(null);
  };

  const selectedDoctor = doctors.find((d) => d.id === formData.doctorId);
  const selectedPatient = patients.find((p) => p.id === formData.patientId);

  if (initialLoading) {
    return (
      <div className="receptionist-container" style={{ padding: '4rem', textAlign: 'center' }}>
        <h3>Loading Booking Details...</h3>
      </div>
    );
  }

  if (doctors.length === 0 || patients.length === 0) {
    return (
      <div className="receptionist-container" style={{ padding: '4rem', textAlign: 'center' }}>
        <h3>Missing Requirements</h3>
        <p>To book an appointment, the system requires at least one registered Doctor and one registered Patient.</p>
        <div style={{ margin: '1rem 0', fontWeight: 'bold' }}>
          Doctors Loaded: {doctors.length} <br />
          Patients Loaded: {patients.length}
        </div>
        <button onClick={() => navigate('/receptionist')} className="rec-btn-action rec-btn-view">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const breadcrumbs = [
    { label: 'Receptionist', path: '/receptionist' },
    { label: 'Appointments', path: '/receptionist/appointments' },
    { label: 'Book Appointment' }
  ];

  return (
    <div className="receptionist-container">
      <PageHeader 
        title="Front Desk Appointment Scheduling"
        subtitle={`Book patient consultations with live doctor availability slot checking (Doctors Loaded: ${doctors.length} | Patients Loaded: ${patients.length})`}
        icon="📅"
        breadcrumbs={breadcrumbs}
        action={
          <button
            type="button"
            className="rec-btn-action rec-btn-view"
            onClick={() => navigate('/receptionist')}
          >
            ← Back to Hub
          </button>
        }
      />

      {bookedAppointment ? (
        <div className="enterprise-card" style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ color: 'var(--color-success-600)', margin: '0 0 0.5rem 0' }}>
            Appointment Successfully Booked!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Booking Reference: <code className="mono">{bookedAppointment.id}</code>
          </p>

          <div
            style={{
              background: 'var(--surface-alt)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              maxWidth: '480px',
              margin: '2rem auto',
              textAlign: 'left'
            }}
          >
            <div style={{ marginBottom: '0.75rem' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Patient:</strong> <span style={{ fontWeight: 600 }}>{selectedPatient?.name || 'Patient'}</span>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Attending Doctor:</strong> <span style={{ fontWeight: 600 }}>Dr. {selectedDoctor?.user?.name || selectedDoctor?.name} ({selectedDoctor?.specialization})</span>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Date & Time Slot:</strong> <span style={{ fontWeight: 600 }}>{bookedAppointment.appointmentDate} · {bookedAppointment.timeSlot}</span>
            </div>
            <div>
              <strong style={{ color: 'var(--text-secondary)' }}>Status:</strong>{' '}
              <span className={`badge-slot status-badge-${bookedAppointment.status?.toLowerCase()}`}>
                {bookedAppointment.status}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="rec-btn-action rec-btn-checkin"
              style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}
              onClick={() => navigate('/receptionist')}
            >
              View in Today's Queue
            </button>
            <button
              type="button"
              className="rec-btn-action rec-btn-view"
              style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}
              onClick={handleReset}
            >
              Book Another Appointment
            </button>
          </div>
        </div>
      ) : (
        <div className="enterprise-card" style={{ maxWidth: '840px', margin: '0 auto' }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
                ⚠️ {error}
              </div>
            )}

            {/* Patient Search & Selection */}
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  Patient Selection *
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/receptionist/patients/register')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary-600)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  + New Patient Intake
                </button>
              </div>

              <input
                type="text"
                className="form-control"
                placeholder="Search patient by name, email, or phone..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                style={{ marginBottom: '0.75rem' }}
              />

              <select
                required
                className="form-control"
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              >
                <option value="">-- Choose Patient ({filteredPatients.length} matches) --</option>
                {filteredPatients.map((pat) => (
                  <option key={pat.id} value={pat.id}>
                    {pat.name} ({pat.email} · {pat.phone || 'No phone'})
                  </option>
                ))}
              </select>
            </div>

            <hr style={{ borderTop: '1px solid var(--border-subtle)', borderBottom: 'none', margin: '2rem 0' }} />

            {/* Doctor & Date */}
            <div className="form-grid-2" style={{ marginBottom: '2rem' }}>
              <div className="form-group">
                <label className="form-label">
                  Attending Doctor *
                </label>
                <select
                  required
                  className="form-control"
                  value={formData.doctorId}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                >
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.user?.name || doc.name} ({doc.specialization} · {doc.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Consultation Date *
                </label>
                <input
                  type="date"
                  className="form-control"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.appointmentDate}
                  onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                />
              </div>
            </div>

            {/* Interactive Slot Capacity Chips */}
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  Time Slot Availability *
                </label>
                {checkingSlots && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-primary-500)', fontWeight: 600 }}>Checking doctor availability...</span>
                )}
              </div>

              <div className="form-grid-3">
                {['MORNING', 'AFTERNOON', 'EVENING'].map((slotKey) => {
                  const slotInfo = availableSlots.find((s) => s.timeSlot === slotKey);
                  const isAvailable = slotInfo ? slotInfo.isAvailable : true;
                  const isSelected = formData.timeSlot === slotKey;

                  return (
                    <div
                      key={slotKey}
                      className={`doctor-slot-chip ${isSelected ? 'selected' : isAvailable ? 'open' : 'booked'}`}
                      style={{
                        padding: '1rem',
                        cursor: isAvailable ? 'pointer' : 'not-allowed',
                        borderWidth: isSelected ? '2px' : '1px',
                        borderRadius: 'var(--radius-lg)'
                      }}
                      onClick={() => {
                        if (isAvailable) {
                          setFormData((prev) => ({ ...prev, timeSlot: slotKey }));
                        }
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.9rem' }}>{slotKey}</strong>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: isAvailable ? 'var(--color-success-600)' : 'var(--color-danger-600)'
                          }}
                        >
                          {isAvailable ? 'AVAILABLE' : 'BOOKED'}
                        </span>
                      </div>
                      <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.4rem', display: 'block' }}>
                        {slotKey === 'MORNING'
                          ? '09:00 AM - 12:00 PM'
                          : slotKey === 'AFTERNOON'
                          ? '02:00 PM - 05:00 PM'
                          : '06:00 PM - 09:00 PM'}
                      </small>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reason */}
            <div className="form-group" style={{ marginBottom: '2.5rem' }}>
              <label className="form-label">
                Reason for Visit / Triage Notes
              </label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Chief complaints, primary symptoms, referral notes..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                type="button"
                className="rec-btn-action rec-btn-view"
                onClick={() => navigate('/receptionist')}
                disabled={submitting}
                style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rec-btn-action rec-btn-checkin"
                disabled={submitting}
                style={{ padding: '0.75rem 2rem', background: 'var(--color-primary-600)', color: '#ffffff', borderColor: 'var(--color-primary-600)', fontSize: '0.9rem' }}
              >
                {submitting ? 'Confirming Booking...' : 'Confirm Appointment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AppointmentBooking;
