import React, { useState, useEffect, useCallback } from 'react';
import { receptionistApi } from '../../api/receptionistApi.js';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { PatientProfileModal } from '../../components/receptionist/PatientProfileModal.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import '../../styles/receptionist.css';

/**
 * ReceptionistPatientsPage
 * Front-desk patient directory for searching, registering, updating, and booking patients
 */
export const ReceptionistPatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Modals
  const [profileTarget, setProfileTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    phone: '',
    bloodGroup: '',
    emergencyContact: '',
    address: '',
    medicalHistory: ''
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { limit: 100 };
      if (searchTerm) params.search = searchTerm;
      if (bloodGroupFilter) params.bloodGroup = bloodGroupFilter;
      if (genderFilter) params.gender = genderFilter;

      const res = await receptionistApi.getPatients(params);
      setPatients(res.data?.patients || res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load patient directory.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, bloodGroupFilter, genderFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchPatients]);

  const handleOpenEdit = (patient) => {
    const prof = patient.profile || patient.patientProfile || {};
    setEditFormData({
      phone: patient.phone || '',
      bloodGroup: prof.bloodGroup || '',
      emergencyContact: prof.emergencyContact || '',
      address: prof.address || '',
      medicalHistory: prof.medicalHistory || ''
    });
    setEditError(null);
    setEditTarget(patient);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;

    setEditSubmitting(true);
    setEditError(null);

    try {
      await receptionistApi.updatePatient(editTarget.id, editFormData);
      setEditTarget(null);
      fetchPatients();
    } catch (err) {
      setEditError(err.message || 'Failed to update patient details.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: 'Receptionist', path: '/receptionist' },
    { label: 'Patient Directory' }
  ];

  return (
    <div className="receptionist-container">
      <PageHeader 
        title="Patient Intake & Registry"
        subtitle="Search, register, update medical files, and book clinic consultations"
        icon="👥"
        breadcrumbs={breadcrumbs}
        action={
          <button
            type="button"
            className="rec-btn-action"
            style={{ padding: '0.75rem 1.5rem', background: 'var(--color-primary-600)', color: '#ffffff', borderRadius: 'var(--radius-full)', fontWeight: 600, border: 'none' }}
            onClick={() => navigate('/receptionist/patients/register')}
          >
            + Register New Patient
          </button>
        }
      />

      {/* Filters Bar */}
      <div className="enterprise-card" style={{ padding: '1.25rem 2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="rec-search-bar" style={{ flex: '1 1 300px', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--surface-alt)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>🔍</span>
            <input
              type="text"
              placeholder="Search by patient name, email, or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem', color: 'var(--text-primary)' }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                ✕
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <select
              value={bloodGroupFilter}
              onChange={(e) => setBloodGroupFilter(e.target.value)}
              className="form-control"
              style={{ width: 'auto', borderRadius: 'var(--radius-full)' }}
            >
              <option value="">All Blood Groups</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>

            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="form-control"
              style={{ width: 'auto', borderRadius: 'var(--radius-full)' }}
            >
              <option value="">All Genders</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Patients Table */}
      <div className="enterprise-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-alt)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <span>📋</span> Directory Results ({patients.length})
          </h2>
        </div>

        <div className="rec-table-wrapper" style={{ padding: '0' }}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <LoadingSpinner text="Searching patients..." />
            </div>
          ) : (
            <table className="rec-table" id="patients-directory-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border-subtle)' }}>
                <tr>
                  <th style={{ padding: '1rem 2rem', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Patient Name</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Contact Info</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Gender / Blood</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Age / DOB</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Emergency Contact</th>
                  <th style={{ padding: '1rem 2rem', textAlign: 'right', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Front Desk Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                      No patients found matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  patients.map((pat) => {
                    const prof = pat.profile || pat.patientProfile || {};
                    return (
                      <tr key={pat.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background var(--transition-fast)' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '1rem 2rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{pat.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>ID: <span className="mono">{pat.id.slice(0, 8)}...</span></div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{pat.email}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{pat.phone || 'No phone'}</div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{prof.gender || 'MALE'}</span>
                            {prof.bloodGroup && (
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  background: 'var(--color-danger-50)',
                                  color: 'var(--color-danger-700)',
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: '9999px'
                                }}
                              >
                                {prof.bloodGroup}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            {prof.age ? `${prof.age} yrs` : prof.dateOfBirth ? new Date(prof.dateOfBirth).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {prof.emergencyContact || '—'}
                          </div>
                        </td>
                        <td style={{ padding: '1rem 2rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button
                              type="button"
                              className="rec-btn-action rec-btn-checkin"
                              title="Book Appointment for this patient"
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
                              title="View Patient Dossier"
                              onClick={() => setProfileTarget(pat)}
                            >
                              Profile
                            </button>
                            <button
                              type="button"
                              className="rec-btn-action rec-btn-reschedule"
                              title="Edit Patient Details"
                              onClick={() => handleOpenEdit(pat)}
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Patient Dossier Modal */}
      <PatientProfileModal
        isOpen={Boolean(profileTarget)}
        patient={profileTarget}
        onClose={() => setProfileTarget(null)}
        onBookAppointment={(pat) => {
          setProfileTarget(null);
          navigate('/receptionist/appointments/book', {
            state: {
              patientId: pat.id,
              patientName: pat.name
            }
          });
        }}
      />

      {/* Edit Patient Modal */}
      {editTarget && (
        <div className="rec-modal-backdrop" onClick={() => setEditTarget(null)}>
          <div className="rec-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ borderRadius: 'var(--radius-xl)', padding: '2rem' }}>
            <div className="rec-modal-header" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>✏️ Update Patient: {editTarget.name}</h2>
              <button
                type="button"
                className="rec-modal-close"
                onClick={() => setEditTarget(null)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="rec-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                {editError && (
                  <div className="alert alert-danger">
                    ⚠️ {editError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select
                    className="form-control"
                    value={editFormData.bloodGroup}
                    onChange={(e) => setEditFormData({ ...editFormData, bloodGroup: e.target.value })}
                  >
                    <option value="">-- Unset --</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Emergency Contact</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editFormData.emergencyContact}
                    onChange={(e) => setEditFormData({ ...editFormData, emergencyContact: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Residential Address</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Clinical History & Notes</label>
                  <textarea
                    rows={3}
                    className="form-control"
                    value={editFormData.medicalHistory}
                    onChange={(e) => setEditFormData({ ...editFormData, medicalHistory: e.target.value })}
                  />
                </div>
              </div>

              <div className="rec-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  className="rec-btn-action rec-btn-view"
                  onClick={() => setEditTarget(null)}
                  disabled={editSubmitting}
                  style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rec-btn-action rec-btn-checkin"
                  disabled={editSubmitting}
                  style={{ padding: '0.75rem 2rem', background: 'var(--color-primary-600)', color: '#ffffff', borderColor: 'var(--color-primary-600)', fontSize: '0.9rem' }}
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistPatientsPage;
