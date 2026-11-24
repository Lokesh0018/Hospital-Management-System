import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { appointmentApi } from '../../api/appointmentApi.js';
import { AppointmentStatusBadge } from '../../components/appointment/AppointmentStatusBadge.jsx';
import { RescheduleModal } from '../../components/appointment/RescheduleModal.jsx';
import { CompleteAppointmentModal } from '../../components/appointment/CompleteAppointmentModal.jsx';
import { CancelAppointmentModal } from '../../components/appointment/CancelAppointmentModal.jsx';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Phone,
  Mail,
  Heart,
  FileText,
  ArrowLeft,
  CalendarCheck,
  CalendarClock,
  Ban,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building,
  DollarSign
} from 'lucide-react';
import '../../styles/appointments.css';

export const AppointmentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentRole = user?.role || 'PATIENT';

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await appointmentApi.getAppointmentById(id);
        setAppointment(res?.data);
      } catch (err) {
        console.error('Failed to load appointment details:', err);
        setError(
          err?.response?.data?.message ||
          err?.message ||
          'Appointment record was not found or access is restricted.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAppointment();
  }, [id]);

  const handleBack = () => {
    if (currentRole === 'ADMIN') navigate('/admin/appointments');
    else if (currentRole === 'DOCTOR') navigate('/doctor/appointments');
    else navigate('/patient/appointments');
  };

  const handleConfirmDirect = async () => {
    try {
      await appointmentApi.updateStatus(id, { status: 'CONFIRMED' });
      setAppointment((prev) => ({ ...prev, status: 'CONFIRMED' }));
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to confirm appointment.');
    }
  };

  if (loading) {
    return (
      <div className="appointments-container">
        <div className="skeleton-box" style={{ width: 220, height: 36, marginBottom: '1rem' }} />
        <div className="dossier-grid">
          <div className="skeleton-box" style={{ height: 260, borderRadius: 'var(--radius-xl)' }} />
          <div className="skeleton-box" style={{ height: 260, borderRadius: 'var(--radius-xl)' }} />
        </div>
        <div className="skeleton-box" style={{ height: 200, borderRadius: 'var(--radius-xl)' }} />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="appointments-container">
        <button className="btn btn-secondary" onClick={handleBack} style={{ width: 'fit-content' }}>
          <ArrowLeft size={16} />
          <span>Back to Appointments</span>
        </button>

        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem', marginTop: '1rem' }}>
          <AlertCircle size={44} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Appointment Record Error</h3>
          <p style={{ color: 'var(--color-slate-600)', maxWidth: 440, margin: '0.5rem auto 1.5rem' }}>
            {error || 'The requested appointment could not be located.'}
          </p>
          <button className="btn btn-primary" onClick={handleBack} style={{ margin: '0 auto' }}>
            Return to List
          </button>
        </div>
      </div>
    );
  }

  // Doctor details
  const doctor = appointment.doctor;
  const doctorName = doctor?.name || doctor?.user?.name || `Dr. #${appointment.doctorId?.substring(0, 5)}`;
  const specialty = doctor?.specialization || 'General Practice';
  const department = doctor?.department || 'Clinical Medicine';
  const doctorEmail = doctor?.email || doctor?.user?.email || 'N/A';
  const doctorPhone = doctor?.phone || doctor?.user?.phone || 'N/A';
  const fee = doctor?.consultationFee ? `$${doctor.consultationFee}` : 'Standard hospital rates';

  // Patient details
  const patient = appointment.patient;
  const patientName = patient?.name || patient?.user?.name || 'Registered Patient';
  const patientEmail = patient?.email || patient?.user?.email || 'N/A';
  const patientPhone = patient?.phone || patient?.user?.phone || patient?.emergencyContact || 'N/A';
  const bloodGroup = patient?.bloodGroup || 'Not specified';
  const gender = patient?.gender ? patient.gender.charAt(0) + patient.gender.slice(1).toLowerCase() : 'Not specified';

  const todayStr = new Date().toISOString().split('T')[0];
  const isFutureOrToday = appointment.appointmentDate >= todayStr;
  const canReschedule =
    (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') &&
    isFutureOrToday &&
    (currentRole === 'PATIENT' || currentRole === 'ADMIN');
  const canCancel =
    appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED';
  const canDoctorConfirm =
    (currentRole === 'DOCTOR' || currentRole === 'ADMIN') &&
    appointment.status === 'PENDING';
  const canDoctorComplete =
    (currentRole === 'DOCTOR' || currentRole === 'ADMIN') &&
    appointment.status === 'CONFIRMED';

  return (
    <div className="appointments-container">
      {/* Top Navigation & Status Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          id="btn-back-to-appointments"
          className="btn btn-secondary"
          onClick={handleBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft size={16} />
          <span>Back to List</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <AppointmentStatusBadge status={appointment.status} />

          {/* Action Buttons */}
          {canDoctorConfirm && (
            <button
              id="btn-details-confirm"
              className="btn btn-primary"
              onClick={handleConfirmDirect}
              style={{ background: '#10b981', borderColor: '#10b981' }}
            >
              <CheckCircle2 size={16} />
              <span>Confirm Booking</span>
            </button>
          )}

          {canDoctorComplete && (
            <button
              id="btn-details-complete"
              className="btn btn-primary"
              onClick={() => setCompleteOpen(true)}
              style={{ background: '#2563eb', borderColor: '#2563eb' }}
            >
              <CalendarCheck size={16} />
              <span>Complete Consultation</span>
            </button>
          )}

          {canReschedule && (
            <button
              id="btn-details-reschedule"
              className="btn btn-secondary"
              onClick={() => setRescheduleOpen(true)}
            >
              <CalendarClock size={16} />
              <span>Reschedule Visit</span>
            </button>
          )}

          {canCancel && (
            <button
              id="btn-details-cancel"
              className="btn btn-danger"
              onClick={() => setCancelOpen(true)}
            >
              <Ban size={16} />
              <span>Cancel Appointment</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Dossier Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          color: 'white',
          padding: '1.75rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.25)'
        }}
      >
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-primary-300)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Consultation Dossier #{appointment.id?.substring(0, 8)?.toUpperCase()}
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'white', margin: '0.35rem 0' }}>
            {patientName} with {doctorName}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.875rem', color: 'var(--color-slate-300)', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Calendar size={15} color="#38bdf8" /> {appointment.appointmentDate}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={15} color="#38bdf8" /> {appointment.timeSlotDetails?.hours || appointment.timeSlot}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Stethoscope size={15} color="#38bdf8" /> {specialty}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>
            Scheduled Slot
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginTop: 2 }}>
            {appointment.timeSlot}
          </div>
        </div>
      </div>

      {/* Grid: Patient & Doctor Cards */}
      <div className="dossier-grid">
        {/* Patient Profile Card */}
        <div className="dossier-card">
          <div className="dossier-card-header">
            <div className="appointment-avatar avatar-patient">
              <User size={18} />
            </div>
            <div>
              <h3>Patient Information</h3>
              <span style={{ fontSize: '0.785rem', color: 'var(--color-slate-500)' }}>
                Medical Record #{patient?.id?.substring(0, 8)?.toUpperCase() || 'MRN-REGISTERED'}
              </span>
            </div>
          </div>

          <div className="dossier-info-list">
            <div className="dossier-info-row">
              <span className="dossier-label">Full Name</span>
              <span className="dossier-val">{patientName}</span>
            </div>
            <div className="dossier-info-row">
              <span className="dossier-label">Email Address</span>
              <span className="dossier-val">{patientEmail}</span>
            </div>
            <div className="dossier-info-row">
              <span className="dossier-label">Phone Contact</span>
              <span className="dossier-val">{patientPhone}</span>
            </div>
            <div className="dossier-info-row">
              <span className="dossier-label">Blood Group</span>
              <span className="dossier-val" style={{ color: '#dc2626', fontWeight: 700 }}>
                {bloodGroup}
              </span>
            </div>
            <div className="dossier-info-row">
              <span className="dossier-label">Gender Identity</span>
              <span className="dossier-val">{gender}</span>
            </div>
          </div>
        </div>

        {/* Doctor Profile Card */}
        <div className="dossier-card">
          <div className="dossier-card-header">
            <div className="appointment-avatar avatar-doctor">
              <Stethoscope size={18} />
            </div>
            <div>
              <h3>Attending Physician</h3>
              <span style={{ fontSize: '0.785rem', color: 'var(--color-slate-500)' }}>
                Specialist Profile
              </span>
            </div>
          </div>

          <div className="dossier-info-list">
            <div className="dossier-info-row">
              <span className="dossier-label">Physician Name</span>
              <span className="dossier-val">{doctorName}</span>
            </div>
            <div className="dossier-info-row">
              <span className="dossier-label">Medical Specialty</span>
              <span className="dossier-val">{specialty}</span>
            </div>
            <div className="dossier-info-row">
              <span className="dossier-label">Hospital Department</span>
              <span className="dossier-val">{department}</span>
            </div>
            <div className="dossier-info-row">
              <span className="dossier-label">Contact Email</span>
              <span className="dossier-val">{doctorEmail}</span>
            </div>
            <div className="dossier-info-row">
              <span className="dossier-label">Consultation Fee</span>
              <span className="dossier-val" style={{ color: '#059669', fontWeight: 700 }}>
                {fee}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reason for Consultation */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-slate-900)' }}>
          Chief Complaint & Consultation Reason
        </h3>
        <div className="dossier-reason-callout">
          {appointment.reason || 'No specific symptoms entered at time of booking.'}
        </div>
      </div>

      {/* Clinical Notes & Doctor Impressions */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--color-slate-900)' }}>
            Doctor Clinical Notes & Consultation Findings
          </h3>
          {canDoctorComplete && (
            <button
              className="btn btn-secondary"
              onClick={() => setCompleteOpen(true)}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              Edit Clinical Notes
            </button>
          )}
        </div>

        {appointment.notes ? (
          <div className="dossier-notes-callout">
            <div style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem', color: '#047857' }}>
              Documented Findings:
            </div>
            <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{appointment.notes}</p>
          </div>
        ) : (
          <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--color-slate-500)', fontSize: '0.875rem' }}>
            No physician clinical notes recorded for this visit yet.
            {currentRole === 'DOCTOR' && ' You can document findings by clicking Complete Consultation.'}
          </div>
        )}
      </div>

      {/* Modals */}
      {rescheduleOpen && (
        <RescheduleModal
          appointment={appointment}
          onClose={() => setRescheduleOpen(false)}
          onRescheduled={(updated) => setAppointment(updated)}
        />
      )}

      {completeOpen && (
        <CompleteAppointmentModal
          appointment={appointment}
          onClose={() => setCompleteOpen(false)}
          onCompleted={(updated) => setAppointment(updated)}
        />
      )}

      {cancelOpen && (
        <CancelAppointmentModal
          appointment={appointment}
          onClose={() => setCancelOpen(false)}
          onCancelled={(updated) => setAppointment(updated)}
        />
      )}
    </div>
  );
};

export default AppointmentDetailsPage;
