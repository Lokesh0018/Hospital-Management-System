import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { receptionistApi } from '../../api/receptionistApi.js';
import { RescheduleAppointmentModal } from '../../components/receptionist/RescheduleAppointmentModal.jsx';
import { CancelAppointmentModal } from '../../components/receptionist/CancelAppointmentModal.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import '../../styles/receptionist.css';

/**
 * ReceptionistSchedulePage
 * Daily hospital schedule timeline grouped into Morning, Afternoon, and Evening slots
 */
export const ReceptionistSchedulePage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Modals
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  useEffect(() => {
    loadDoctors();
  }, []);

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
    } catch (err) {
      console.error('Failed to load doctors API error:', err.status, err.message, err.errors || err);
    }
  };

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { date: selectedDate };
      if (selectedDoctorId) params.doctorId = selectedDoctorId;

      const res = await receptionistApi.getSchedule(params);
      setScheduleData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load schedule timeline.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedDoctorId]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const handleUpdateStatus = async (appointmentId, nextStatus) => {
    try {
      await receptionistApi.updateAppointmentStatus(appointmentId, nextStatus);
      fetchSchedule();
    } catch (err) {
      alert(err.message || `Failed to update status to ${nextStatus}`);
    }
  };

  const scheduleBySlot = scheduleData?.scheduleBySlot || {
    MORNING: [],
    AFTERNOON: [],
    EVENING: []
  };

  const slotColumns = [
    {
      key: 'MORNING',
      title: 'Morning Consultations',
      hours: '09:00 AM - 12:00 PM',
      headerClass: 'morning',
      items: scheduleBySlot.MORNING || []
    },
    {
      key: 'AFTERNOON',
      title: 'Afternoon Clinics',
      hours: '02:00 PM - 05:00 PM',
      headerClass: 'afternoon',
      items: scheduleBySlot.AFTERNOON || []
    },
    {
      key: 'EVENING',
      title: 'Evening / Walk-ins',
      hours: '06:00 PM - 09:00 PM',
      headerClass: 'evening',
      items: scheduleBySlot.EVENING || []
    }
  ];

  const breadcrumbs = [
    { label: 'Receptionist', path: '/receptionist' },
    { label: 'Daily Schedule' }
  ];

  return (
    <div className="receptionist-container">
      <PageHeader 
        title="Hospital Daily Schedule & Timeline"
        subtitle="Chronological triage grid across Morning, Afternoon, and Evening slots"
        icon="⏱️"
        breadcrumbs={breadcrumbs}
        action={
          <button
            type="button"
            className="rec-btn-action rec-btn-checkin"
            style={{ padding: '0.75rem 1.5rem', background: 'var(--color-primary-600)', color: '#ffffff', borderRadius: 'var(--radius-full)', fontWeight: 600, border: 'none' }}
            onClick={() => {
              navigate('/receptionist/appointments/book');
            }}
          >
            + Book for Today
          </button>
        }
      />

      {/* Schedule Controls Bar */}
      <div className="enterprise-card" style={{ padding: '1.25rem 2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">
                Schedule Date
              </label>
              <input
                type="date"
                className="form-control"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ width: 'auto' }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">
                Filter by Doctor
              </label>
              <select
                className="form-control"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                style={{ minWidth: '250px' }}
              >
                <option value="">All Doctors (Hospital Wide)</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    Dr. {doc.user?.name || doc.name} ({doc.specialization})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              className="rec-btn-action rec-btn-view"
              style={{ borderRadius: 'var(--radius-full)' }}
              onClick={() => {
                const d = new Date();
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
            >
              Today
            </button>
            <button
              type="button"
              className="rec-btn-action rec-btn-view"
              style={{ borderRadius: 'var(--radius-full)' }}
              onClick={fetchSchedule}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* 3-Column Slot Schedule */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <LoadingSpinner text="Compiling daily slot schedule..." />
        </div>
      ) : (
        <div className="schedule-slots-grid">
          {slotColumns.map((col) => (
            <div key={col.key} className="enterprise-card" style={{ padding: 0, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div className={`slot-column-header ${col.headerClass}`}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {col.title}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{col.hours}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      background: 'var(--surface)',
                      color: 'var(--text-primary)',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    {col.items.length}
                  </span>
                  <button
                    type="button"
                    title={`Book appointment into ${col.key} slot`}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      color: 'var(--color-primary-600)',
                      transition: 'all var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'var(--color-primary-300)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                    onClick={() => {
                      navigate('/receptionist/appointments/book', {
                        state: {
                          appointmentDate: selectedDate,
                          doctorId: selectedDoctorId,
                          timeSlot: col.key
                        }
                      });
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="slot-card-body" style={{ flex: 1, padding: '1.25rem', background: 'var(--surface-alt)', overflowY: 'auto' }}>
                {col.items.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    No bookings scheduled for this slot.
                  </div>
                ) : (
                  col.items.map((appt) => {
                    const patName = appt.patient?.user?.name || appt.patient?.name || 'Patient';
                    const patContact = appt.patient?.user?.phone || appt.patient?.phone || '';
                    const docName = appt.doctor?.user?.name || appt.doctor?.name || 'Doctor';
                    const statusClass = (appt.status || 'pending').toLowerCase();

                    return (
                      <div key={appt.id} className="enterprise-card" style={{ marginBottom: '1rem', padding: '1.25rem', transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{patName}</strong>
                            {patContact && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>📞 {patContact}</div>
                            )}
                          </div>
                          <span className={`badge-slot status-badge-${statusClass}`}>
                            {appt.status}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          🩺 Dr. {docName} <span style={{ color: 'var(--text-secondary)' }}>({appt.doctor?.specialization || 'GP'})</span>
                        </div>

                        {appt.reason && (
                          <div
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--text-secondary)',
                              marginTop: '0.5rem',
                              fontStyle: 'italic',
                              background: 'var(--surface-alt)',
                              padding: '0.5rem 0.75rem',
                              borderRadius: 'var(--radius-md)',
                              borderLeft: '2px solid var(--border-subtle)'
                            }}
                          >
                            "{appt.reason}"
                          </div>
                        )}

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '0.5rem',
                            marginTop: '1rem',
                            paddingTop: '0.75rem',
                            borderTop: '1px solid var(--border-subtle)'
                          }}
                        >
                          {appt.status === 'PENDING' && (
                            <button
                              type="button"
                              className="rec-btn-action rec-btn-checkin"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: 'var(--radius-full)' }}
                              onClick={() => handleUpdateStatus(appt.id, 'CONFIRMED')}
                            >
                              ✓ Check In
                            </button>
                          )}
                          {appt.status === 'CONFIRMED' && (
                            <button
                              type="button"
                              className="rec-btn-action rec-btn-checkin"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: 'var(--radius-full)' }}
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
                                title="Reschedule"
                                style={{ borderRadius: 'var(--radius-full)', width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                onClick={() => setRescheduleTarget(appt)}
                              >
                                🔄
                              </button>
                              <button
                                type="button"
                                className="rec-btn-action rec-btn-cancel"
                                title="Cancel"
                                style={{ borderRadius: 'var(--radius-full)', width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                onClick={() => setCancelTarget(appt)}
                              >
                                ✕
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <RescheduleAppointmentModal
        isOpen={Boolean(rescheduleTarget)}
        appointment={rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        onSuccess={fetchSchedule}
      />

      <CancelAppointmentModal
        isOpen={Boolean(cancelTarget)}
        appointment={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onSuccess={fetchSchedule}
      />
    </div>
  );
};

export default ReceptionistSchedulePage;
