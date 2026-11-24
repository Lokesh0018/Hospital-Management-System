import React, { useState } from 'react';
import { patientApi } from '../../api/patientApi.js';
import {
  Calendar,
  Clock,
  User,
  Plus,
  Ban,
  CheckCircle,
  Clock3,
  CalendarX,
  Stethoscope,
  ChevronRight,
  Info
} from 'lucide-react';

const TIME_SLOT_LABELS = {
  MORNING: 'Morning (09:00 AM - 12:00 PM)',
  AFTERNOON: 'Afternoon (02:00 PM - 05:00 PM)',
  EVENING: 'Evening (06:00 PM - 09:00 PM)'
};

export const PatientAppointmentsSection = ({
  appointments = [],
  onOpenBookModal,
  onAppointmentCancelled
}) => {
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'history'
  const [cancellingId, setCancellingId] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Upcoming appointments: status is PENDING or CONFIRMED and date is >= today
  const upcomingAppointments = appointments.filter(
    (apt) =>
      (apt.status === 'PENDING' || apt.status === 'CONFIRMED') &&
      apt.appointmentDate >= todayStr
  );

  // History: past dates OR status is COMPLETED or CANCELLED
  const historyAppointments = appointments.filter(
    (apt) =>
      apt.status === 'COMPLETED' ||
      apt.status === 'CANCELLED' ||
      apt.appointmentDate < todayStr
  );

  const currentList = activeTab === 'upcoming' ? upcomingAppointments : historyAppointments;

  const handleCancelAppointment = async (appointmentId) => {
    const confirmCancel = window.confirm(
      'Are you sure you want to cancel this scheduled consultation?'
    );
    if (!confirmCancel) return;

    try {
      setCancellingId(appointmentId);
      const res = await patientApi.cancelAppointment(appointmentId, {
        reason: 'Cancelled by patient from portal'
      });
      const updated = res?.data;
      if (onAppointmentCancelled) {
        onAppointmentCancelled(updated || { id: appointmentId, status: 'CANCELLED' });
      }
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      alert(err?.response?.data?.message || err?.message || 'Failed to cancel appointment.');
    } finally {
      setCancellingId(null);
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <CheckCircle size={12} /> Confirmed
          </span>
        );
      case 'PENDING':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock3 size={12} /> Pending Review
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <CheckCircle size={12} /> Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <CalendarX size={12} /> Cancelled
          </span>
        );
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      {/* Section Header */}
      <div className="patient-section-header">
        <div className="patient-section-title">
          <Calendar size={22} color="#059669" />
          <div>
            <h3>Consultation Appointments</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)', margin: 0 }}>
              Track scheduled visits, past consultation notes, and book new checkups
            </p>
          </div>
        </div>

        <button
          id="btn-quick-book-trigger"
          className="btn-quick-book"
          onClick={onOpenBookModal}
        >
          <Plus size={16} />
          <span>Book Consultation</span>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div className="patient-tabs">
          <button
            id="tab-upcoming-appointments"
            className={`patient-tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            <span>Upcoming Consultations</span>
            <span className="tab-counter">{upcomingAppointments.length}</span>
          </button>

          <button
            id="tab-history-appointments"
            className={`patient-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <span>Appointment History</span>
            <span className="tab-counter">{historyAppointments.length}</span>
          </button>
        </div>
      </div>

      {/* List / Table */}
      {currentList.length === 0 ? (
        <div className="empty-feed-card">
          <div className="empty-icon-circle" style={{ background: '#ecfdf5', color: '#059669' }}>
            <Calendar size={28} />
          </div>
          <h4>{activeTab === 'upcoming' ? 'No Upcoming Appointments' : 'No Past Appointments Found'}</h4>
          <p>
            {activeTab === 'upcoming'
              ? 'You do not have any scheduled consultations at the moment. Need to see a doctor? Book an appointment now.'
              : 'You have not attended any consultations yet. Your completed visits will appear here.'}
          </p>
          {activeTab === 'upcoming' && (
            <button
              onClick={onOpenBookModal}
              className="btn btn-primary"
              style={{ background: '#059669', borderColor: '#059669', marginTop: '0.5rem' }}
            >
              <Plus size={16} />
              <span>Schedule First Visit</span>
            </button>
          )}
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Attending Doctor</th>
                <th>Specialization</th>
                <th>Date & Time Slot</th>
                <th>Reason / Chief Complaint</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentList.map((apt) => {
                const doctorName =
                  apt.doctor?.name ||
                  apt.doctor?.user?.name ||
                  `Dr. #${apt.doctorId?.substring(0, 5) || 'Physician'}`;
                const specialty =
                  apt.doctor?.profile?.specialization ||
                  apt.doctor?.specialization ||
                  'Cardiologist / Physician';
                const canCancel =
                  (apt.status === 'PENDING' || apt.status === 'CONFIRMED') &&
                  apt.appointmentDate >= todayStr;

                return (
                  <tr key={apt.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: '#eff6ff',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.8rem'
                          }}
                        >
                          <User size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                            {doctorName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                            ID: #{apt.id.substring(0, 8).toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="badge badge-secondary" style={{ background: '#f8fafc', color: 'var(--color-slate-700)', border: '1px solid #e2e8f0' }}>
                        <Stethoscope size={12} style={{ marginRight: 4 }} />
                        {specialty}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-slate-800)' }}>
                          {apt.appointmentDate}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} />
                          {TIME_SLOT_LABELS[apt.timeSlot] || apt.timeSlot}
                        </span>
                      </div>
                    </td>

                    <td style={{ maxWidth: 220 }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-slate-700)' }}>
                        {apt.reason || 'Routine consultation'}
                      </span>
                      {apt.notes && (
                        <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Info size={12} />
                          <span>Notes: {apt.notes}</span>
                        </div>
                      )}
                    </td>

                    <td>{renderStatusBadge(apt.status)}</td>

                    <td style={{ textAlign: 'right' }}>
                      {canCancel ? (
                        <button
                          className="btn-action-cancel"
                          onClick={() => handleCancelAppointment(apt.id)}
                          disabled={cancellingId === apt.id}
                          title="Cancel scheduled appointment"
                        >
                          <Ban size={12} style={{ marginRight: 4 }} />
                          {cancellingId === apt.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)' }}>
                          {apt.status === 'COMPLETED' ? 'Archived' : 'Closed'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PatientAppointmentsSection;
