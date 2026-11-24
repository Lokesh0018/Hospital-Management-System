import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { appointmentApi } from '../../api/appointmentApi.js';
import { patientApi } from '../../api/patientApi.js';
import { AppointmentFilters } from '../../components/appointment/AppointmentFilters.jsx';
import { AppointmentTable } from '../../components/appointment/AppointmentTable.jsx';
import { RescheduleModal } from '../../components/appointment/RescheduleModal.jsx';
import { CompleteAppointmentModal } from '../../components/appointment/CompleteAppointmentModal.jsx';
import { CancelAppointmentModal } from '../../components/appointment/CancelAppointmentModal.jsx';
import {
  Calendar,
  CalendarPlus,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import '../../styles/appointments.css';

export const AppointmentsListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentRole = user?.role || 'PATIENT';

  // State: Filter params
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // State: Data
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // State: Modals
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  // Fetch doctors list for filters (if Admin or Patient)
  useEffect(() => {
    if (currentRole === 'ADMIN' || currentRole === 'PATIENT') {
      patientApi
        .getDoctors({ limit: 100 })
        .then((res) => {
          const list = res?.data?.doctors || res?.data || [];
          setDoctors(list);
        })
        .catch((err) => console.warn('Doctors filter list load error:', err));
    }
  }, [currentRole]);

  // Main data fetch
  const fetchAppointments = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const params = {
        page,
        limit,
        status: status !== 'ALL' ? status : undefined,
        doctorId: doctorId || undefined,
        date: date || undefined,
        search: search.trim() || undefined,
        sortBy: 'appointmentDate',
        sortOrder: 'desc'
      };

      const res = await appointmentApi.getAllAppointments(params);
      const data = res?.data;

      if (data?.appointments) {
        setAppointments(data.appointments);
        setPagination(data.pagination || { total: data.appointments.length, page: 1, limit, totalPages: 1 });
      } else if (Array.isArray(data)) {
        setAppointments(data);
        setPagination({ total: data.length, page: 1, limit, totalPages: 1 });
      } else {
        setAppointments([]);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Unable to load appointments from server.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit, status, doctorId, date, search]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Reset filters
  const handleClearFilters = () => {
    setSearch('');
    setStatus('ALL');
    setDoctorId('');
    setDate('');
    setPage(1);
  };

  // Quick Action Handlers
  const handleViewDetails = (appointmentId) => {
    // Navigate based on current role route structure
    if (currentRole === 'ADMIN') {
      navigate(`/admin/appointments/${appointmentId}`);
    } else if (currentRole === 'DOCTOR') {
      navigate(`/doctor/appointments/${appointmentId}`);
    } else {
      navigate(`/patient/appointments/${appointmentId}`);
    }
  };

  const handleConfirm = async (appointmentId) => {
    try {
      await appointmentApi.updateStatus(appointmentId, { status: 'CONFIRMED' });
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: 'CONFIRMED' } : a))
      );
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to confirm appointment.');
    }
  };

  const handleRescheduled = (updated) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
    );
  };

  const handleCompleted = (updated) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
    );
  };

  const handleCancelled = (updated) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
    );
  };

  const handleBookClick = () => {
    if (currentRole === 'PATIENT') {
      navigate('/patient/book');
    } else if (currentRole === 'ADMIN') {
      navigate('/admin/appointments/book');
    } else {
      navigate('/appointments/book');
    }
  };

  return (
    <div className="appointments-container">
      {/* Header */}
      <div className="appointments-page-header">
        <div className="appointments-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Calendar size={24} color="var(--color-primary-600)" />
            <h1>Appointment Management</h1>
          </div>
          <p>
            {currentRole === 'ADMIN' && 'Hospital-wide consultation schedules, bookings, and patient coordination'}
            {currentRole === 'DOCTOR' && 'Assigned patient consultations, schedule verification, and clinical sign-offs'}
            {currentRole === 'PATIENT' && 'Your personal medical visits, doctor consultations, and schedule history'}
          </p>
        </div>

        <div className="header-actions-group">
          <button
            id="btn-refresh-appointments"
            className="refresh-btn"
            onClick={() => fetchAppointments(true)}
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          {(currentRole === 'PATIENT' || currentRole === 'ADMIN') && (
            <button
              id="btn-navigate-book-appointment"
              className="btn btn-primary"
              onClick={handleBookClick}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <CalendarPlus size={16} />
              <span>Book Appointment</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <AppointmentFilters
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        status={status}
        onStatusChange={(val) => {
          setStatus(val);
          setPage(1);
        }}
        doctorId={doctorId}
        onDoctorChange={(val) => {
          setDoctorId(val);
          setPage(1);
        }}
        date={date}
        onDateChange={(val) => {
          setDate(val);
          setPage(1);
        }}
        doctors={doctors}
        showDoctorFilter={currentRole !== 'DOCTOR'}
        onClear={handleClearFilters}
      />

      {/* Loading Skeletons */}
      {loading ? (
        <div className="card" style={{ padding: '2rem' }}>
          <div className="skeleton-box" style={{ width: '100%', height: 40, marginBottom: '1rem' }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-box" style={{ width: '100%', height: 52, marginBottom: '0.5rem' }} />
          ))}
        </div>
      ) : error ? (
        /* Error State */
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <AlertCircle size={44} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-slate-900)' }}>
            Failed to Load Appointments
          </h3>
          <p style={{ color: 'var(--color-slate-600)', maxWidth: 460, margin: '0.5rem auto 1.5rem' }}>
            {error}
          </p>
          <button onClick={() => fetchAppointments()} className="btn btn-primary" style={{ margin: '0 auto' }}>
            <RefreshCw size={15} />
            <span>Try Again</span>
          </button>
        </div>
      ) : appointments.length === 0 ? (
        /* Empty State */
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: '#f0f9ff',
              color: 'var(--color-primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}
          >
            <Calendar size={30} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>
            No Consultations Found
          </h3>
          <p style={{ color: 'var(--color-slate-500)', maxWidth: 440, margin: '0.4rem auto 1.5rem' }}>
            {search || status !== 'ALL' || doctorId || date
              ? 'No appointments matched your selected filter criteria. Try resetting filters.'
              : 'There are no consultation records available in the system yet.'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            {(search || status !== 'ALL' || doctorId || date) && (
              <button className="btn btn-secondary" onClick={handleClearFilters}>
                Reset All Filters
              </button>
            )}
            {(currentRole === 'PATIENT' || currentRole === 'ADMIN') && (
              <button className="btn btn-primary" onClick={handleBookClick}>
                <CalendarPlus size={15} />
                <span>Book Consultation</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Table & Pagination */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <AppointmentTable
            appointments={appointments}
            currentRole={currentRole}
            onViewDetails={handleViewDetails}
            onConfirm={handleConfirm}
            onComplete={(apt) => setCompleteTarget(apt)}
            onReschedule={(apt) => setRescheduleTarget(apt)}
            onCancel={(apt) => setCancelTarget(apt)}
          />

          {/* Pagination Footer */}
          <div className="pagination-container">
            <div>
              Showing <strong>{(pagination.page - 1) * pagination.limit + 1}</strong> to{' '}
              <strong>
                {Math.min(pagination.page * pagination.limit, pagination.total || appointments.length)}
              </strong>{' '}
              of <strong>{pagination.total || appointments.length}</strong> appointments
            </div>

            <div className="pagination-btn-group">
              <button
                id="btn-prev-page"
                className="pagination-btn"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              <span style={{ fontWeight: 600, padding: '0 0.5rem', color: 'var(--color-slate-700)' }}>
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>

              <button
                id="btn-next-page"
                className="pagination-btn"
                disabled={pagination.page >= (pagination.totalPages || 1)}
                onClick={() => setPage((p) => p + 1)}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modals */}
      {rescheduleTarget && (
        <RescheduleModal
          appointment={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onRescheduled={handleRescheduled}
        />
      )}

      {completeTarget && (
        <CompleteAppointmentModal
          appointment={completeTarget}
          onClose={() => setCompleteTarget(null)}
          onCompleted={handleCompleted}
        />
      )}

      {cancelTarget && (
        <CancelAppointmentModal
          appointment={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onCancelled={handleCancelled}
        />
      )}
    </div>
  );
};

export default AppointmentsListPage;
