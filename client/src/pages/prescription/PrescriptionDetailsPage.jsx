import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { prescriptionApi } from '../../api/prescriptionApi.js';
import { PrescriptionStatusBadge } from '../../components/prescription/PrescriptionStatusBadge.jsx';
import { UpdateStatusModal } from '../../components/prescription/UpdateStatusModal.jsx';
import {
  Pill,
  User,
  Stethoscope,
  Calendar,
  ArrowLeft,
  Printer,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Activity,
  HeartPulse,
  Phone,
  Mail,
  Shield,
  Trash2
} from 'lucide-react';
import '../../styles/prescriptions.css';

export const PrescriptionDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentRole = user?.role || 'PATIENT';

  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [statusTarget, setStatusTarget] = useState(null); // { prescription, targetStatus }

  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await prescriptionApi.getPrescriptionById(id);
        setPrescription(res?.data);
      } catch (err) {
        console.error('Failed to load prescription details:', err);
        setError(
          err?.response?.data?.message ||
          err?.message ||
          'Prescription record not found or access restricted.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPrescription();
  }, [id]);

  const handleBack = () => {
    if (currentRole === 'ADMIN') navigate('/admin/prescriptions');
    else if (currentRole === 'DOCTOR') navigate('/doctor/prescriptions');
    else navigate('/patient/prescriptions');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleStatusUpdated = (updatedRx) => {
    setPrescription(updatedRx);
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete this prescription record?`
    );
    if (!confirmDelete) return;

    try {
      await prescriptionApi.deletePrescription(id);
      handleBack();
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to delete prescription.');
    }
  };

  if (loading) {
    return (
      <div className="prescriptions-container">
        <div className="skeleton-box" style={{ width: 180, height: 36, marginBottom: '1.25rem' }} />
        <div className="details-header-card" style={{ padding: '2rem' }}>
          <div className="skeleton-box" style={{ width: '45%', height: 32, marginBottom: '0.75rem' }} />
          <div className="skeleton-box" style={{ width: '25%', height: 20 }} />
        </div>
        <div className="details-grid" style={{ marginTop: '1.5rem' }}>
          <div className="skeleton-box" style={{ height: 240, borderRadius: 'var(--radius-xl)' }} />
          <div className="skeleton-box" style={{ height: 240, borderRadius: 'var(--radius-xl)' }} />
        </div>
        <div className="skeleton-box" style={{ height: 320, borderRadius: 'var(--radius-xl)', marginTop: '1.5rem' }} />
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="prescriptions-container">
        <button className="btn btn-secondary" onClick={handleBack} style={{ width: 'fit-content' }}>
          <ArrowLeft size={16} />
          <span>Back to Prescriptions</span>
        </button>

        <div className="empty-state-card" style={{ marginTop: '1.5rem' }}>
          <AlertCircle size={48} color="var(--color-danger-500)" style={{ marginBottom: '1rem' }} />
          <h3>Prescription Not Found</h3>
          <p>{error || 'The requested prescription record could not be retrieved.'}</p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button className="btn btn-secondary" onClick={() => window.location.reload()}>
              Retry
            </button>
            <button className="btn btn-primary" onClick={handleBack}>
              Return to Prescriptions
            </button>
          </div>
        </div>
      </div>
    );
  }

  const patient = prescription.patient || {};
  const doctor = prescription.doctor || {};
  const medicines = prescription.medicines || [];
  const isActive = prescription.status === 'ACTIVE';
  const canManage = currentRole === 'DOCTOR' || currentRole === 'ADMIN';

  return (
    <div className="prescriptions-container">
      {/* Top Navigation & Action Toolbar */}
      <div className="details-actions-bar no-print">
        <button id="btn-back-to-prescriptions" className="btn btn-secondary" onClick={handleBack}>
          <ArrowLeft size={16} />
          <span>Back to Prescriptions</span>
        </button>

        <div className="details-top-actions">
          <button
            id="btn-print-rx"
            className="btn btn-outline"
            onClick={handlePrint}
            title="Print Official Prescription"
          >
            <Printer size={16} />
            <span>Print Rx</span>
          </button>

          {canManage && isActive && (
            <>
              <button
                id="btn-complete-rx"
                className="btn btn-success"
                onClick={() => setStatusTarget({ prescription, targetStatus: 'COMPLETED' })}
              >
                <CheckCircle2 size={16} />
                <span>Mark Completed</span>
              </button>
              <button
                id="btn-cancel-rx"
                className="btn btn-danger-outline"
                onClick={() => setStatusTarget({ prescription, targetStatus: 'CANCELLED' })}
              >
                <XCircle size={16} />
                <span>Discontinue</span>
              </button>
            </>
          )}

          {currentRole === 'ADMIN' && (
            <button
              id="btn-delete-rx"
              className="btn btn-danger-outline"
              onClick={handleDelete}
              title="Permanently remove this prescription record"
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Prescription Dossier Card */}
      <div className="details-header-card print-card">
        {/* Printable Official Watermark/Header (Visible on print) */}
        <div className="rx-official-letterhead">
          <div className="hospital-brand">
            <Activity size={26} color="var(--color-primary-600)" />
            <div>
              <div className="hospital-name">MedPulse Central Hospital</div>
              <div className="hospital-tagline">Department of Clinical Pharmacotherapy & Patient Care</div>
            </div>
          </div>
          <div className="rx-number-badge">
            <span className="rx-symbol">℞</span>
            <span>RX-{prescription.id?.slice(-8).toUpperCase()}</span>
          </div>
        </div>

        {/* Normal Screen Header Info */}
        <div className="rx-header-main">
          <div className="rx-title-box">
            <div className="rx-badge-row">
              <span className="rx-symbol-display">℞</span>
              <span className="rx-code">RX-{prescription.id?.slice(-8).toUpperCase()}</span>
              <PrescriptionStatusBadge status={prescription.status} size="md" />
            </div>
            <h1 className="rx-diagnosis-title">{prescription.diagnosis}</h1>
            <div className="rx-meta-inline">
              <span className="meta-item">
                <Calendar size={14} />
                <span>Prescribed: {new Date(prescription.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
              </span>
              <span className="meta-dot">•</span>
              <span className="meta-item">
                <Clock size={14} />
                <span>Updated: {new Date(prescription.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </span>
            </div>
          </div>

          <div className="rx-header-status-indicator">
            <div className={`status-highlight-box ${prescription.status.toLowerCase()}`}>
              <div className="status-title">Status: {prescription.status}</div>
              <div className="status-desc">
                {prescription.status === 'ACTIVE' && 'Medication regimen currently active'}
                {prescription.status === 'COMPLETED' && 'Course completed as advised'}
                {prescription.status === 'CANCELLED' && 'Therapy discontinued / cancelled'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Patient & Doctor Cards */}
      <div className="details-grid">
        {/* Patient Profile Card */}
        <div className="profile-dossier-card">
          <div className="card-header-icon patient-icon-bg">
            <User size={20} color="var(--color-primary-600)" />
          </div>
          <div className="card-content-block">
            <div className="profile-label">PATIENT RECIPIENT</div>
            <h3 className="profile-name">{patient.name || 'Patient'}</h3>
            <div className="profile-details-list">
              <div className="detail-row">
                <span className="detail-label">Patient ID:</span>
                <span className="detail-val font-mono">{patient.id ? patient.id.slice(0, 12) : 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Gender / Blood:</span>
                <span className="detail-val">
                  {patient.gender || 'Not specified'} • <strong style={{ color: 'var(--color-danger-600)' }}>{patient.bloodGroup || 'Unknown'}</strong>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Contact Phone:</span>
                <span className="detail-val">{patient.phone || 'Not provided'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Emergency Phone:</span>
                <span className="detail-val">{patient.emergencyContact || 'Not recorded'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Prescribing Doctor Profile Card */}
        <div className="profile-dossier-card">
          <div className="card-header-icon doctor-icon-bg">
            <Stethoscope size={20} color="var(--color-teal-600, #0d9488)" />
          </div>
          <div className="card-content-block">
            <div className="profile-label">ATTENDING PHYSICIAN</div>
            <h3 className="profile-name">Dr. {doctor.name || 'Assigned Doctor'}</h3>
            <div className="profile-details-list">
              <div className="detail-row">
                <span className="detail-label">Specialization:</span>
                <span className="detail-val highlight-blue">{doctor.specialization || 'General Physician'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Department:</span>
                <span className="detail-val">{doctor.department || 'Clinical Medicine'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Official Email:</span>
                <span className="detail-val">{doctor.email || 'hospital.doctor@medpulse.test'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Doctor Phone:</span>
                <span className="detail-val">{doctor.phone || 'Direct line recorded'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prescribed Medications Table */}
      <div className="details-section-card">
        <div className="section-title-row">
          <div className="section-title-group">
            <Pill size={20} color="var(--color-primary-600)" />
            <h2>Medication Schedule & Dosage Plan</h2>
          </div>
          <div className="item-count-chip">
            {medicines.length} {medicines.length === 1 ? 'Medication' : 'Medications'} Prescribed
          </div>
        </div>

        <div className="table-responsive" style={{ marginTop: '1rem' }}>
          <table className="prescription-meds-table">
            <thead>
              <tr>
                <th style={{ width: '4%' }}>#</th>
                <th style={{ width: '28%' }}>Medication Name</th>
                <th style={{ width: '15%' }}>Dosage</th>
                <th style={{ width: '18%' }}>Frequency</th>
                <th style={{ width: '15%' }}>Duration</th>
                <th style={{ width: '20%' }}>Specific Administration</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((med, idx) => (
                <tr key={med.id || idx}>
                  <td className="med-idx">{idx + 1}</td>
                  <td>
                    <div className="med-name-cell">
                      <div className="med-pill-icon">
                        <Pill size={15} />
                      </div>
                      <div className="med-name-bold">{med.medicineName}</div>
                    </div>
                  </td>
                  <td>
                    <span className="med-chip chip-dosage">{med.dosage}</span>
                  </td>
                  <td>
                    <span className="med-chip chip-frequency">{med.frequency}</span>
                  </td>
                  <td>
                    <span className="med-chip chip-duration">{med.duration}</span>
                  </td>
                  <td className="med-instructions-cell">
                    {med.instructions ? (
                      <span>{med.instructions}</span>
                    ) : (
                      <span className="text-muted-italic">Take as prescribed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Physician General Advice & Clinical Instructions */}
      <div className="details-section-card">
        <div className="section-title-group" style={{ marginBottom: '1rem' }}>
          <FileText size={20} color="var(--color-primary-600)" />
          <h2>Physician Clinical Advice & Precautions</h2>
        </div>

        {prescription.instructions ? (
          <div className="clinical-instructions-box">
            <p style={{ margin: 0, whiteSpace: 'pre-line', lineHeight: '1.65' }}>
              {prescription.instructions}
            </p>
          </div>
        ) : (
          <div className="empty-instructions-note">
            No additional clinical precautions or lifestyle recommendations noted by attending physician.
          </div>
        )}

        {/* Doctor Signature Block for Print / Official verification */}
        <div className="rx-signature-block">
          <div className="signature-info">
            <div className="signature-line" />
            <div className="signature-doctor-name">Dr. {doctor.name || 'Attending Physician'}</div>
            <div className="signature-doctor-title">{doctor.specialization || 'Consultant Specialist'}</div>
            <div className="signature-verification">Digitally Signed & Validated (MedPulse HMS)</div>
          </div>
        </div>
      </div>

      {/* Update Status Confirmation Modal */}
      {statusTarget && (
        <UpdateStatusModal
          isOpen={true}
          prescription={statusTarget.prescription}
          targetStatus={statusTarget.targetStatus}
          onClose={() => setStatusTarget(null)}
          onSuccess={handleStatusUpdated}
        />
      )}
    </div>
  );
};

export default PrescriptionDetailsPage;
