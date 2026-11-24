import React, { useState } from 'react';
import { doctorApi } from '../../api/doctorApi.js';
import { Calendar, Clock, Check, CheckCheck, XCircle, Pill } from 'lucide-react';

export const DoctorAppointmentsSection = ({
  todayAppointments = [],
  upcomingAppointments = [],
  onAppointmentUpdated,
  onOpenPrescriptionModal,
}) => {
  const [activeTab, setActiveTab] = useState('today');
  const [actionLoading, setActionLoading] = useState(null);

  const handleStatusChange = async (appointmentId, newStatus, currentNotes = '') => {
    try {
      setActionLoading(appointmentId);
      const res = await doctorApi.updateAppointment(appointmentId, {
        status: newStatus,
        notes: currentNotes,
      });
      if (onAppointmentUpdated) {
        onAppointmentUpdated(res.data);
      }
    } catch (err) {
      alert(err.message || `Failed to update appointment to ${newStatus}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="badge badge-active">Completed</span>;
      case 'CONFIRMED':
        return <span className="badge badge-doctor">Confirmed</span>;
      case 'PENDING':
        return <span className="badge badge-pending">Pending</span>;
      case 'CANCELLED':
      default:
        return <span className="badge badge-admin">Cancelled</span>;
    }
  };

  const displayedList = activeTab === 'today' ? todayAppointments : upcomingAppointments;

  return (
    <div className="enterprise-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="activity-header" style={{ padding: '1.25rem 1.5rem', background: 'var(--surface-alt)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="activity-title" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Appointments & Patient Consultations</div>

        <div className="tab-buttons" style={{ display: 'flex', gap: '0.25rem', background: 'var(--color-slate-100)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
          <button
            className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`}
            onClick={() => setActiveTab('today')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, border: 'none', background: activeTab === 'today' ? 'white' : 'transparent', color: activeTab === 'today' ? 'var(--color-primary-600)' : 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', boxShadow: activeTab === 'today' ? 'var(--shadow-sm)' : 'none' }}
          >
            Today's Schedule ({todayAppointments.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, border: 'none', background: activeTab === 'upcoming' ? 'white' : 'transparent', color: activeTab === 'upcoming' ? 'var(--color-primary-600)' : 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', boxShadow: activeTab === 'upcoming' ? 'var(--shadow-sm)' : 'none' }}
          >
            Upcoming Schedule ({upcomingAppointments.length})
          </button>
        </div>
      </div>

      {displayedList.length === 0 ? (
        <div className="empty-state" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No appointments scheduled for {activeTab === 'today' ? 'today' : 'upcoming dates'}.
        </div>
      ) : (
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="rec-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border-subtle)' }}>
              <tr>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Patient Details</th>
                <th style={{ padding: '1.25rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Date & Slot</th>
                <th style={{ padding: '1.25rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '1.25rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Reason</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedList.map((apt) => (
                <tr key={apt.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background var(--transition-fast)' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        {apt.patient?.name ? apt.patient.name[0].toUpperCase() : 'P'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                          {apt.patient?.name || 'Patient'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          {apt.patient?.gender ? `${apt.patient.gender} • ` : ''}
                          {apt.patient?.bloodGroup || ''}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {apt.appointmentDate}
                    </div>
                    <div style={{ display: 'inline-block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-700)', background: 'var(--color-primary-50)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', marginTop: '0.3rem' }}>
                      {apt.timeSlot}
                    </div>
                  </td>

                  <td style={{ padding: '1.25rem' }}>{getStatusBadge(apt.status)}</td>

                  <td style={{ padding: '1.25rem', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {apt.reason || '--'}
                  </td>

                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      {apt.status === 'PENDING' && (
                        <button
                          disabled={actionLoading === apt.id}
                          className="rec-btn-action rec-btn-checkin"
                          onClick={() => handleStatusChange(apt.id, 'CONFIRMED')}
                          title="Confirm Appointment"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: 'var(--radius-full)' }}
                        >
                          Confirm
                        </button>
                      )}

                      {apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && (
                        <button
                          disabled={actionLoading === apt.id}
                          className="rec-btn-action rec-btn-checkin"
                          onClick={() => handleStatusChange(apt.id, 'COMPLETED')}
                          title="Complete Consultation"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: 'var(--radius-full)', background: 'var(--color-success-600)', color: 'white', borderColor: 'var(--color-success-600)' }}
                        >
                          Complete
                        </button>
                      )}

                      {apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && (
                        <button
                          disabled={actionLoading === apt.id}
                          className="rec-btn-action rec-btn-cancel"
                          onClick={() => handleStatusChange(apt.id, 'CANCELLED')}
                          title="Cancel Appointment"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: 'var(--radius-full)' }}
                        >
                          Cancel
                        </button>
                      )}

                      <button
                        className="rec-btn-action rec-btn-view"
                        onClick={() => onOpenPrescriptionModal(apt.patient, apt.id)}
                        title="Write Prescription"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: 'var(--radius-full)', background: 'var(--color-primary-50)', color: 'var(--color-primary-700)', borderColor: 'var(--color-primary-200)' }}
                      >
                        <Pill size={14} />
                        <span>Prescribe</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointmentsSection;
