import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/adminApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import {
  Stethoscope,
  Plus,
  RefreshCw,
  AlertCircle,
  Search,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import '../../styles/dashboard.css';
import AddDoctorModal from '../../components/admin/AddDoctorModal.jsx';
import EditDoctorModal from '../../components/admin/EditDoctorModal.jsx';

export const DoctorManagementPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [doctorToEdit, setDoctorToEdit] = useState(null);

  const fetchDoctors = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await adminApi.getDoctors({ search: search.trim() || undefined, limit: 100 });
      const docsData = res.data;
      let doctorList = [];
      
      if (docsData && Array.isArray(docsData.data)) {
        doctorList = docsData.data;
      } else if (docsData && Array.isArray(docsData.doctors)) {
        doctorList = docsData.doctors;
      } else if (Array.isArray(docsData)) {
        doctorList = docsData;
      }

      // Filter locally if search exists (in case API doesn't support search param)
      if (search.trim()) {
        const term = search.toLowerCase();
        doctorList = doctorList.filter(d => 
          (d.user?.name || d.name || '').toLowerCase().includes(term) ||
          (d.user?.email || d.email || '').toLowerCase().includes(term) ||
          (d.specialization || '').toLowerCase().includes(term)
        );
      }

      setDoctors(doctorList);
    } catch (err) {
      console.error('Failed to load doctors:', err);
      setError(err?.response?.data?.message || err?.message || 'Unable to load doctors.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleClearFilters = () => {
    setSearch('');
  };

  const handleDeleteDoctor = async (id) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        await adminApi.deleteDoctor(id);
        fetchDoctors(true);
      } catch (err) {
        console.error('Failed to delete doctor', err);
        alert('Failed to delete doctor');
      }
    }
  };

  const handleEditClick = (doc) => {
    setDoctorToEdit(doc);
    setIsEditModalOpen(true);
  };

  const breadcrumbs = [
    { label: 'Admin', path: '/admin' },
    { label: 'Doctor Management' }
  ];

  return (
    <div className="dashboard-container" style={{ maxWidth: 1400, margin: '0 auto', gap: '1.5rem', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <PageHeader
        title="Doctor Management"
        subtitle={`Total Doctors: ${doctors.length}`}
        icon="👨‍⚕️"
        breadcrumbs={breadcrumbs}
        action={
          <div className="header-actions-group" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="search-input-box" style={{ position: 'relative', width: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Search doctors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '2.4rem', borderRadius: 'var(--radius-full)' }}
              />
            </div>
            <button
              className="rec-btn-action rec-btn-view"
              onClick={() => fetchDoctors(true)}
              disabled={refreshing}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', borderRadius: 'var(--radius-full)' }}
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
              <span>Sync</span>
            </button>
            <button
              className="rec-btn-action"
              onClick={() => setIsAddModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.65rem 1.25rem', background: 'var(--color-primary-600)', color: 'white', border: 'none', borderRadius: 'var(--radius-full)', cursor: 'pointer', fontWeight: 600 }}
            >
              <Plus size={16} />
              <span>Add Doctor</span>
            </button>
          </div>
        }
      />

      {/* Main Content */}
      {loading ? (
        <div className="enterprise-card" style={{ padding: '3rem' }}>
          <div className="skeleton-box" style={{ width: '100%', height: 40, marginBottom: '1.5rem' }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-box" style={{ width: '100%', height: 60, marginBottom: '0.75rem' }} />
          ))}
        </div>
      ) : error ? (
        <div className="enterprise-card alert alert-danger" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <AlertCircle size={48} style={{ margin: '0 auto 1.5rem', color: 'var(--color-danger-600)' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Failed to Load Doctors</h3>
          <p style={{ margin: '0 auto 1.5rem', maxWidth: 460 }}>{error}</p>
          <button onClick={() => fetchDoctors()} className="rec-btn-action rec-btn-view" style={{ margin: '0 auto' }}>
            <RefreshCw size={15} />
            <span>Try Again</span>
          </button>
        </div>
      ) : doctors.length === 0 ? (
        <div className="enterprise-card" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Stethoscope size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>No Doctors Found</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto 1.5rem' }}>
            {search ? 'No doctors matched your search. Try a different term.' : 'There are no doctors registered in the system.'}
          </p>
          {search && (
            <button onClick={handleClearFilters} className="rec-btn-action rec-btn-view" style={{ margin: '0 auto' }}>
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="enterprise-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="rec-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border-subtle)' }}>
                <tr>
                  <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Name</th>
                  <th style={{ padding: '1.25rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Email</th>
                  <th style={{ padding: '1.25rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Specialization</th>
                  <th style={{ padding: '1.25rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Availability</th>
                  <th style={{ padding: '1.25rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doc) => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background var(--transition-fast)' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Stethoscope size={18} />
                        </div>
                        <span>Dr. {doc.user?.name || doc.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{doc.user?.email || doc.email || 'N/A'}</td>
                    <td style={{ padding: '1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      <span style={{ background: 'var(--surface-alt)', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', fontWeight: 500, border: '1px solid var(--border-subtle)' }}>
                        {doc.specialization || 'General'}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                       {doc.isAvailable ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-success-600)', fontWeight: 500 }}><CheckCircle size={16}/> Available</span>
                       ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-danger-600)', fontWeight: 500 }}><XCircle size={16}/> Unavailable</span>
                       )}
                    </td>
                    <td style={{ padding: '1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {doc.user?.isActive !== false ? (
                        <span style={{ background: 'var(--color-success-50)', color: 'var(--color-success-700)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>ACTIVE</span>
                      ) : (
                        <span style={{ background: 'var(--color-danger-50)', color: 'var(--color-danger-700)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>INACTIVE</span>
                      )}
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button className="rec-btn-action rec-btn-reschedule" title="Edit" onClick={() => handleEditClick(doc)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-full)' }}><Edit size={16} /></button>
                        <button className="rec-btn-action rec-btn-cancel" title="Delete" onClick={() => handleDeleteDoctor(doc.id)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-full)' }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddDoctorModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onDoctorAdded={() => fetchDoctors(true)} 
      />

      <EditDoctorModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setDoctorToEdit(null);
        }}
        doctor={doctorToEdit}
        onDoctorUpdated={() => fetchDoctors(true)}
      />
    </div>
  );
};

export default DoctorManagementPage;
