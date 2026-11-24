import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { prescriptionApi } from '../../api/prescriptionApi.js';
import { patientApi } from '../../api/patientApi.js';
import { PrescriptionFilters } from '../../components/prescription/PrescriptionFilters.jsx';
import { PrescriptionTable } from '../../components/prescription/PrescriptionTable.jsx';
import { UpdateStatusModal } from '../../components/prescription/UpdateStatusModal.jsx';
import {
  Pill,
  Plus,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import '../../styles/prescriptions.css';

export const PrescriptionsListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentRole = user?.role || 'PATIENT';

  // Filters State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [doctorId, setDoctorId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Data State
  const [prescriptions, setPrescriptions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Status Modal State
  const [statusTarget, setStatusTarget] = useState(null); // { prescription, targetStatus }

  // Load directories
  useEffect(() => {
    patientApi
      .getDoctors({ limit: 100 })
      .then((res) => setDoctors(res?.data?.doctors || res?.data || []))
      .catch((err) => console.warn('Doctors directory load error:', err));

    if (currentRole !== 'PATIENT') {
      fetch('http://localhost:5000/api/v1/patients?limit=100', {
        headers: { Authorization: `Bearer ${localStorage.getItem('hms_access_token')}` }
      })
        .then((r) => r.json())
        .then((data) => setPatients(data?.data?.patients || data?.data || []))
        .catch((err) => console.warn('Patients directory load error:', err));
    }
  }, [currentRole]);

  // Main data fetch
  const fetchPrescriptions = useCallback(async (isRefresh = false) => {
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
        patientId: patientId || undefined,
        search: search.trim() || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      let res;
      if (currentRole === 'PATIENT') {
        res = await prescriptionApi.getMyPrescriptions(params);
      } else if (currentRole === 'DOCTOR' && !doctorId && !patientId) {
        res = await prescriptionApi.getDoctorPrescriptions(params);
      } else {
        res = await prescriptionApi.getAllPrescriptions(params);
      }

      const data = res?.data;
      if (data?.prescriptions) {
        setPrescriptions(data.prescriptions);
        setPagination(data.pagination || { total: data.prescriptions.length, page: 1, limit, totalPages: 1 });
      } else if (Array.isArray(data)) {
        setPrescriptions(data);
        setPagination({ total: data.length, page: 1, limit, totalPages: 1 });
      } else {
        setPrescriptions([]);
      }
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Unable to load prescription records.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit, status, doctorId, patientId, search, currentRole]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const handleClearFilters = () => {
    setSearch('');
    setStatus('ALL');
    setDoctorId('');
    setPatientId('');
    setPage(1);
  };

  const handleViewDetails = (rxId) => {
    if (currentRole === 'ADMIN') navigate(`/admin/prescriptions/${rxId}`);
    else if (currentRole === 'DOCTOR') navigate(`/doctor/prescriptions/${rxId}`);
    else navigate(`/patient/prescriptions/${rxId}`);
  };

  const handleCreateClick = () => {
    if (currentRole === 'ADMIN') navigate('/admin/prescriptions/create');
    else if (currentRole === 'DOCTOR') navigate('/doctor/prescriptions/create');
    else navigate('/prescriptions/create');
  };

  const handleStatusUpdated = (updatedRx) => {
    setPrescriptions((prev) =>
      prev.map((r) => (r.id === updatedRx.id ? { ...r, ...updatedRx } : r))
    );
  };

  const handleDelete = async (rx) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete prescription for: "${rx.diagnosis}"?`
    );
    if (!confirmDelete) return;

    try {
      await prescriptionApi.deletePrescription(rx.id);
      setPrescriptions((prev) => prev.filter((r) => r.id !== rx.id));
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to delete prescription.');
    }
  };

  return (
    <div className="prescriptions-container">
      {/* Page Header */}
      <div className="prescriptions-page-header">
        <div className="prescriptions-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Pill size={24} color="var(--color-primary-600)" />
            <h1>Prescription Management</h1>
          </div>
          <p>
            {currentRole === 'ADMIN' && 'Hospital-wide pharmacotherapy records, active medications, and treatment courses'}
            {currentRole === 'DOCTOR' && 'Patient prescriptions issued by you, medication schedules, and treatment status'}
            {currentRole === 'PATIENT' && 'Your prescribed medications, dosages, administration schedule, and physician instructions'}
          </p>
        </div>

        <div className="header-actions-group">
          <button
            id="btn-refresh-prescriptions"
            className="refresh-btn"
            onClick={() => fetchPrescriptions(true)}
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          {(currentRole === 'DOCTOR' || currentRole === 'ADMIN') && (
            <button
              id="btn-navigate-create-prescription"
              className="btn btn-primary"
              onClick={handleCreateClick}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <Plus size={16} />
              <span>Create Prescription</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <PrescriptionFilters
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
        patientId={patientId}
        onPatientChange={(val) => {
          setPatientId(val);
          setPage(1);
        }}
        doctors={doctors}
        patients={patients}
        showDoctorFilter={currentRole !== 'DOCTOR'}
        showPatientFilter={currentRole !== 'PATIENT'}
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
            Failed to Load Prescriptions
          </h3>
          <p style={{ color: 'var(--color-slate-600)', maxWidth: 460, margin: '0.5rem auto 1.5rem' }}>
            {error}
          </p>
          <button onClick={() => fetchPrescriptions()} className="btn btn-primary" style={{ margin: '0 auto' }}>
            <RefreshCw size={15} />
            <span>Try Again</span>
          </button>
        </div>
      ) : prescriptions.length === 0 ? (
        /* Empty State */
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: '#f0fdf4',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}
          >
            <Pill size={30} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>
            No Prescriptions Found
          </h3>
          <p style={{ color: 'var(--color-slate-500)', maxWidth: 440, margin: '0.4rem auto 1.5rem' }}>
            {search || status !== 'ALL' || doctorId || patientId
              ? 'No prescriptions matched your selected filter criteria. Try resetting filters.'
              : 'There are no prescription records registered in the system yet.'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            {(search || status !== 'ALL' || doctorId || patientId) && (
              <button className="btn btn-secondary" onClick={handleClearFilters}>
                Reset Filters
              </button>
            )}
            {(currentRole === 'DOCTOR' || currentRole === 'ADMIN') && (
              <button className="btn btn-primary" onClick={handleCreateClick}>
                <Plus size={15} />
                <span>Write First Prescription</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Data Table & Pagination */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <PrescriptionTable
            prescriptions={prescriptions}
            currentRole={currentRole}
            onViewDetails={handleViewDetails}
            onUpdateStatus={(rx, targetStatus) => setStatusTarget({ prescription: rx, targetStatus })}
            onDelete={handleDelete}
          />

          {/* Pagination Footer */}
          <div className="pagination-container">
            <div>
              Showing <strong>{(pagination.page - 1) * pagination.limit + 1}</strong> to{' '}
              <strong>
                {Math.min(pagination.page * pagination.limit, pagination.total || prescriptions.length)}
              </strong>{' '}
              of <strong>{pagination.total || prescriptions.length}</strong> prescriptions
            </div>

            <div className="pagination-btn-group">
              <button
                id="btn-prescriptions-prev-page"
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
                id="btn-prescriptions-next-page"
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

      {/* Status Transition Modal */}
      {statusTarget && (
        <UpdateStatusModal
          prescription={statusTarget.prescription}
          targetStatus={statusTarget.targetStatus}
          onClose={() => setStatusTarget(null)}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </div>
  );
};

export default PrescriptionsListPage;
