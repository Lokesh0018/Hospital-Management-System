import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { receptionistApi } from '../../api/receptionistApi.js';
import { ReceptionistKPICards } from '../../components/receptionist/ReceptionistKPICards.jsx';
import { QuickActionsPanel } from '../../components/receptionist/QuickActionsPanel.jsx';

import { RescheduleAppointmentModal } from '../../components/receptionist/RescheduleAppointmentModal.jsx';
import { CancelAppointmentModal } from '../../components/receptionist/CancelAppointmentModal.jsx';
import { PatientProfileModal } from '../../components/receptionist/PatientProfileModal.jsx';
import { PaymentModal } from '../../components/billing/PaymentModal.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import '../../styles/receptionist.css';

/**
 * ReceptionistDashboard
 * Main front-desk operational dashboard for patient triage, queue status, intake, and payments
 */
export const ReceptionistDashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  // Booking flow
  const [bookingPreselection, setBookingPreselection] = useState({});

  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [viewPatientTarget, setViewPatientTarget] = useState(null);
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState(null);

  // Queue filter
  const [queueFilter, setQueueFilter] = useState('ALL');
  const [queueSearch, setQueueSearch] = useState('');

  const fetchDashboard = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await receptionistApi.getDashboard();
      setDashboardData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load front-desk dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleAutoRefresh = (payload) => {
      console.log('Socket event received, refreshing receptionist dashboard:', payload);
      fetchDashboard(true);
    };

    socket.on('appointment:created', handleAutoRefresh);
    socket.on('appointment:updated', handleAutoRefresh);
    socket.on('appointment:cancelled', handleAutoRefresh);

    return () => {
      socket.off('appointment:created', handleAutoRefresh);
      socket.off('appointment:updated', handleAutoRefresh);
      socket.off('appointment:cancelled', handleAutoRefresh);
    };
  }, [socket, fetchDashboard]);

  const handleUpdateStatus = async (appointmentId, nextStatus) => {
    try {
      await receptionistApi.updateAppointmentStatus(appointmentId, nextStatus);
      fetchDashboard(true);
    } catch (err) {
      alert(err.message || `Failed to update status to ${nextStatus}`);
    }
  };

  const handlePatientRegistered = (newPatient, bookImmediately) => {
    fetchDashboard(true);
    if (bookImmediately && newPatient) {
      navigate('/receptionist/appointments/book', {
        state: {
          patientId: newPatient.id,
          patientName: newPatient.name
        }
      });
    }
  };

  const handleSlotSelected = ({ doctorId, doctorName, date, timeSlot }) => {
    navigate('/receptionist/appointments/book', {
      state: {
        doctorId,
        doctorName,
        date,
        timeSlot
      }
    });
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading Front-Desk Operations..." />;
  }

  const todayAppts = dashboardData?.todayAppointments || [];
  const recentPatients = dashboardData?.recentPatients || [];
  const pendingBills = dashboardData?.pendingBills || [];

  const filteredAppts = todayAppts.filter((appt) => {
    if (queueFilter !== 'ALL' && appt.status !== queueFilter) return false;
    if (queueSearch) {
      const term = queueSearch.toLowerCase();
      const patientName = appt.patient?.user?.name || appt.patient?.name || '';
      const doctorName = appt.doctor?.user?.name || appt.doctor?.name || '';
      return (
        patientName.toLowerCase().includes(term) ||
        doctorName.toLowerCase().includes(term) ||
        appt.timeSlot?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="receptionist-container">
      {/* Top Header */}
      <div className="receptionist-header">
        <div className="receptionist-title-group">
          <h1>
            <span>🏨</span> Front Desk Reception Hub
          </h1>
          <p>
            Queue management, walk-in intake, doctor availability, and real-time billing collection
          </p>
        </div>

        <div className="receptionist-header-actions">
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
            Today: {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <button
            type="button"
            className="rec-btn-action rec-btn-view"
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            style={{ padding: '0.55rem 1rem' }}
          >
            {refreshing ? 'Syncing...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '1rem',
            borderRadius: '0.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>⚠️ {error}</span>
          <button
            type="button"
            onClick={() => fetchDashboard()}
            style={{ textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <ReceptionistKPICards statistics={dashboardData?.statistics} />

      {/* Quick Actions Panel */}
      <QuickActionsPanel />

      {/* Two-Column Front-Desk Working Grid */}
      <div className="receptionist-grid-layout">
        {/* Left Column: Today's Appointments & Queue */}
        <div className="rec-section-card">
          <div className="rec-section-header">
            <h2 className="rec-section-title">
              <span>📅</span> Today's Appointment Queue ({filteredAppts.length})
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div className="rec-search-bar" style={{ padding: '0.35rem 0.65rem' }}>
                <span>🔍</span>
                <input
                  type="text"
                  placeholder="Filter patient or doctor..."
                  value={queueSearch}
                  onChange={(e) => setQueueSearch(e.target.value)}
                  style={{ width: '160px' }}
                />
              </div>

              <select
                value={queueFilter}
                onChange={(e) => setQueueFilter(e.target.value)}
                style={{
                  padding: '0.4rem 0.65rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8rem',
                  background: '#ffffff'
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Arrival</option>
                <option value="CONFIRMED">Checked In / Waiting</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="rec-table-wrapper">
            <table className="rec-table" id="today-appointments-queue-table">
              <thead>
                <tr>
                  <th>Slot / Time</th>
                  <th>Patient Details</th>
                  <th>Assigned Doctor</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Front Desk Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppts.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                      No appointments matching the current filter for today.
                    </td>
                  </tr>
                ) : (
                  filteredAppts.map((appt) => {
                    const patientObj = appt.patient?.user || appt.patient;
                    const doctorObj = appt.doctor?.user || appt.doctor;
                    const slotClass = (appt.timeSlot || 'morning').toLowerCase();

                    return (
                      <tr key={appt.id}>
                        <td>
                          <span className={`badge-slot ${slotClass}`}>
                            {appt.timeSlot || 'MORNING'}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>
                            {patientObj?.name || 'Unknown Patient'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            {patientObj?.phone || patientObj?.email || 'No contact'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500, color: '#1e293b' }}>
                            Dr. {doctorObj?.name || 'Physician'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {appt.doctor?.specialization || 'General Practice'}
                          </div>
                        </td>
                        <td>
                          <div
                            style={{
                              maxWidth: '180px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.8rem',
                              color: '#475569'
                            }}
                            title={appt.reason || 'Consultation'}
                          >
                            {appt.reason || 'Routine Consultation'}
                          </div>
                        </td>
                        <td>
                          <span className={`badge-slot status-badge-${(appt.status || 'pending').toLowerCase()}`}>
                            {appt.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                            {appt.status === 'PENDING' && (
                              <button
                                type="button"
                                className="rec-btn-action rec-btn-checkin"
                                title="Patient arrived: Check in to clinic waiting room"
                                onClick={() => handleUpdateStatus(appt.id, 'CONFIRMED')}
                              >
                                ✓ Check In
                              </button>
                            )}

                            {appt.status === 'CONFIRMED' && (
                              <button
                                type="button"
                                className="rec-btn-action rec-btn-checkin"
                                title="Mark consultation finished"
                                onClick={() => handleUpdateStatus(appt.id, 'COMPLETED')}
                              >
                                ✓ Done
                              </button>
                            )}

                            {appt.status !== 'CANCELLED' && appt.status !== 'COMPLETED' && (
                              <>
                                <button
                                  type="button"
                                  className="rec-btn-action rec-btn-reschedule"
                                  title="Reschedule to another slot"
                                  onClick={() => setRescheduleTarget(appt)}
                                >
                                  🔄
                                </button>
                                <button
                                  type="button"
                                  className="rec-btn-action rec-btn-cancel"
                                  title="Cancel appointment"
                                  onClick={() => setCancelTarget(appt)}
                                >
                                  ✕
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              className="rec-btn-action rec-btn-view"
                              title="View Patient Record"
                              onClick={() => setViewPatientTarget(appt.patient)}
                            >
                              👤
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Recent Registrations & Pending Bills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Recent Patient Intake */}
          <div className="rec-section-card">
            <div className="rec-section-header">
              <h2 className="rec-section-title">
                <span>👤</span> Recent Registrations
              </h2>
              <button
                type="button"
                className="rec-btn-action rec-btn-view"
                onClick={() => navigate('/receptionist/patients')}
                style={{ fontSize: '0.78rem' }}
              >
                All Patients →
              </button>
            </div>

            <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {recentPatients.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                  No recent registrations recorded.
                </div>
              ) : (
                recentPatients.slice(0, 5).map((pat) => (
                  <div
                    key={pat.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      background: '#f8fafc',
                      borderRadius: '0.5rem',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>
                        {pat.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {pat.email} {pat.profile?.bloodGroup ? `· ${pat.profile.bloodGroup}` : ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        className="rec-btn-action rec-btn-checkin"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        title="Book appointment for this patient"
                        onClick={() => {
                          navigate('/receptionist/appointments/book', {
                            state: {
                              patientId: pat.id,
                              patientName: pat.name
                            }
                          });
                        }}
                      >
                        + Book
                      </button>
                      <button
                        type="button"
                        className="rec-btn-action rec-btn-view"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.45rem' }}
                        onClick={() => setViewPatientTarget(pat)}
                      >
                        👤
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Invoices / Payments Collection */}
          <div className="rec-section-card">
            <div className="rec-section-header">
              <h2 className="rec-section-title">
                <span>💳</span> Front Desk Unpaid Bills
              </h2>
              <button
                type="button"
                className="rec-btn-action rec-btn-view"
                onClick={() => navigate('/receptionist/billing')}
                style={{ fontSize: '0.78rem' }}
              >
                Billing Desk →
              </button>
            </div>

            <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {pendingBills.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#059669', fontSize: '0.85rem' }}>
                  ✓ All patient accounts currently settled!
                </div>
              ) : (
                pendingBills.slice(0, 5).map((inv) => (
                  <div
                    key={inv.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      background: '#fffbeb',
                      borderRadius: '0.5rem',
                      border: '1px solid #fde68a'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#92400e' }}>
                        #{inv.invoiceNumber} · {inv.patient?.user?.name || inv.patient?.name || 'Walk-in'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#b45309' }}>
                        Due: <strong>${(inv.dueAmount ?? inv.totalAmount ?? 0).toFixed(2)}</strong> (Total: ${inv.totalAmount?.toFixed(2)})
                      </div>
                    </div>

                    <button
                      type="button"
                      className="rec-btn-action rec-btn-checkin"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', background: '#059669', color: '#ffffff', borderColor: '#059669' }}
                      onClick={() => setPaymentTargetInvoice(inv)}
                    >
                      Collect $
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>



      <RescheduleAppointmentModal
        isOpen={Boolean(rescheduleTarget)}
        appointment={rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        onSuccess={() => fetchDashboard(true)}
      />

      <CancelAppointmentModal
        isOpen={Boolean(cancelTarget)}
        appointment={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onSuccess={() => fetchDashboard(true)}
      />

      <PatientProfileModal
        isOpen={Boolean(viewPatientTarget)}
        patient={viewPatientTarget}
        onClose={() => setViewPatientTarget(null)}
        onBookAppointment={(pat) => {
          setViewPatientTarget(null);
          navigate('/receptionist/appointments/book', {
            state: {
              patientId: pat.id,
              patientName: pat.name
            }
          });
        }}
      />

      <PaymentModal
        isOpen={Boolean(paymentTargetInvoice)}
        invoice={paymentTargetInvoice}
        onClose={() => setPaymentTargetInvoice(null)}
        onSuccess={() => {
          setPaymentTargetInvoice(null);
          fetchDashboard(true);
        }}
      />
    </div>
  );
};

export default ReceptionistDashboard;
