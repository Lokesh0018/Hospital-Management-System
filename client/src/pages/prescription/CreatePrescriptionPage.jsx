import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { prescriptionApi } from '../../api/prescriptionApi.js';
import { patientApi } from '../../api/patientApi.js';
import { MedicineRowsBuilder } from '../../components/prescription/MedicineRowsBuilder.jsx';
import {
  Pill,
  ArrowLeft,
  User,
  Stethoscope,
  FileText,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  HeartPulse
} from 'lucide-react';
import '../../styles/prescriptions.css';

const COMMON_DIAGNOSES = [
  'Acute Upper Respiratory Infection',
  'Hypertension - Essential',
  'Type 2 Diabetes Mellitus',
  'Acute Bronchitis',
  'Gastroenteritis',
  'Seasonal Allergic Rhinitis',
  'Musculoskeletal Lumbar Strain',
  'Bacterial Pharyngitis'
];

export const CreatePrescriptionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentRole = user?.role || 'PATIENT';

  const [searchParams] = useSearchParams();
  
  // Form State
  const [patientId, setPatientId] = useState(searchParams.get('patientId') || '');
  const [doctorId, setDoctorId] = useState(searchParams.get('doctorId') || '');
  const [diagnosis, setDiagnosis] = useState('');
  const [instructions, setInstructions] = useState('');
  const [medicines, setMedicines] = useState([
    {
      id: 'med-init-1',
      medicineName: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    }
  ]);

  // Directory Data
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loadingDirectories, setLoadingDirectories] = useState(true);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Load directories
  useEffect(() => {
    const fetchDirectories = async () => {
      try {
        setLoadingDirectories(true);
        const docsRes = await patientApi.getDoctors({ limit: 100 });
        const docList = docsRes?.data?.doctors || docsRes?.data || [];
        setDoctors(docList);

        const pRes = await fetch('http://localhost:5000/api/v1/patients?limit=100', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('hms_access_token')}`
          }
        });
        const pData = await pRes.json();
        const pList = pData?.data?.patients || pData?.data || [];
        setPatients(pList);
      } catch (err) {
        console.warn('Failed to load doctor/patient directory for prescription form:', err);
      } finally {
        setLoadingDirectories(false);
      }
    };

    fetchDirectories();
  }, [currentRole]);

  const handleBack = () => {
    if (currentRole === 'ADMIN') navigate('/admin/prescriptions');
    else if (currentRole === 'DOCTOR') navigate('/doctor/prescriptions');
    else navigate('/patient/prescriptions');
  };

  const selectedPatient = patients.find((p) => p.id === patientId);
  const selectedDoctor = doctors.find((d) => d.id === doctorId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Client-side Validations
    if (!patientId) {
      setError('Please select a recipient patient.');
      return;
    }

    if (currentRole === 'ADMIN' && !doctorId) {
      setError('Please select the prescribing doctor.');
      return;
    }

    if (!diagnosis.trim() || diagnosis.trim().length < 2) {
      setError('Clinical diagnosis is required (minimum 2 characters).');
      return;
    }

    if (!medicines || medicines.length === 0) {
      setError('Please add at least one medication to this prescription.');
      return;
    }

    for (let i = 0; i < medicines.length; i++) {
      const med = medicines[i];
      if (!med.medicineName?.trim()) {
        setError(`Medication #${i + 1}: Name is required.`);
        return;
      }
      if (!med.dosage?.trim()) {
        setError(`Medication #${i + 1} (${med.medicineName}): Dosage is required (e.g. 500mg).`);
        return;
      }
      if (!med.frequency?.trim()) {
        setError(`Medication #${i + 1} (${med.medicineName}): Frequency is required (e.g. Twice daily).`);
        return;
      }
      if (!med.duration?.trim()) {
        setError(`Medication #${i + 1} (${med.medicineName}): Duration is required (e.g. 7 days).`);
        return;
      }
    }

    try {
      setSubmitting(true);

      const payload = {
        patientId,
        diagnosis: diagnosis.trim(),
        instructions: instructions.trim() || undefined,
        medicines: medicines.map((m) => ({
          medicineName: m.medicineName.trim(),
          dosage: m.dosage.trim(),
          frequency: m.frequency.trim(),
          duration: m.duration.trim(),
          instructions: m.instructions?.trim() || undefined
        }))
      };

      if (currentRole === 'ADMIN' && doctorId) {
        payload.doctorId = doctorId;
      }

      const res = await prescriptionApi.createPrescription(payload);
      const createdRx = res?.data;

      // Navigate to the newly created prescription details page
      if (createdRx?.id) {
        if (currentRole === 'ADMIN') navigate(`/admin/prescriptions/${createdRx.id}`);
        else if (currentRole === 'DOCTOR') navigate(`/doctor/prescriptions/${createdRx.id}`);
        else navigate(`/prescriptions/${createdRx.id}`);
      } else {
        handleBack();
      }
    } catch (err) {
      console.error('Failed to create prescription:', err);
      // axiosClient intercepts the error and returns { status, message, errors }
      if (err?.errors && Array.isArray(err.errors)) {
        // Detailed Zod validation errors
        const errorMsgs = err.errors.map(e => `${e.field || 'Field'}: ${e.message}`).join(' | ');
        setError(`Validation failed: ${errorMsgs}`);
      } else {
        setError(
          err?.message ||
          'Failed to issue prescription. Please check fields and try again.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="prescriptions-container">
      {/* Back Navigation Bar */}
      <div className="details-actions-bar">
        <button id="btn-back-to-list" className="btn btn-secondary" onClick={handleBack}>
          <ArrowLeft size={16} />
          <span>Back to Prescriptions</span>
        </button>
      </div>

      {/* Page Header */}
      <div className="prescriptions-page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="prescriptions-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Pill size={24} color="var(--color-primary-600)" />
            <h1>Issue e-Prescription</h1>
          </div>
          <p>Generate verified clinical medication regimen, dosage protocols, and patient advice.</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert-card alert-error" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={20} />
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', marginBottom: '0.2rem' }}>Prescription Error</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Main Creation Form */}
      <form onSubmit={handleSubmit} className="create-rx-form">
        {/* Section 1: Patient & Physician Selection */}
        <div className="create-rx-card">
          <div className="card-section-title">
            <User size={18} color="var(--color-primary-600)" />
            <span>1. Patient & Prescribing Physician</span>
          </div>

          <div className="form-grid-2">
            {/* Patient Selector */}
            <div className="form-group">
              <label htmlFor="select-patient">
                Target Patient <span className="text-danger">*</span>
              </label>
              <select
                id="select-patient"
                className="form-control"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                disabled={loadingDirectories}
                required
              >
                <option value="" disabled>Select a patient...</option>
                {patients.length === 0 ? (
                  <option value="" disabled>No patients found in directory</option>
                ) : (
                  patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.user?.name} {p.bloodGroup ? `(Blood: ${p.bloodGroup})` : ''} - ID: {p.id.slice(0, 8)}
                    </option>
                  ))
                )}
              </select>

              {/* Selected Patient Mini Summary */}
              {selectedPatient && (
                <div className="selected-entity-summary">
                  <HeartPulse size={16} color="var(--color-danger-500)" />
                  <div className="summary-text">
                    <strong>{selectedPatient.name || selectedPatient.user?.name}</strong> • Blood Group:{' '}
                    <span className="summary-highlight">{selectedPatient.bloodGroup || 'O+'}</span> • Phone:{' '}
                    {selectedPatient.phone || selectedPatient.user?.phone || 'On file'}
                  </div>
                </div>
              )}
            </div>

            {/* Doctor Selector (For Admin) or Current Doctor Display */}
            {currentRole === 'ADMIN' ? (
              <div className="form-group">
                <label htmlFor="select-doctor">
                  Attending Doctor <span className="text-danger">*</span>
                </label>
                <select
                  id="select-doctor"
                  className="form-control"
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  disabled={loadingDirectories}
                  required
                >
                  <option value="" disabled>Select a doctor...</option>
                  {doctors.length === 0 ? (
                    <option value="" disabled>No doctors found</option>
                  ) : (
                    doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.name} ({d.specialization || 'General'})
                      </option>
                    ))
                  )}
                </select>

                {selectedDoctor && (
                  <div className="selected-entity-summary">
                    <Stethoscope size={16} color="var(--color-teal-600, #0d9488)" />
                    <div className="summary-text">
                      <strong>Dr. {selectedDoctor.name}</strong> • {selectedDoctor.specialization || 'Physician'} •{' '}
                      {selectedDoctor.department || 'Hospital'}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="form-group">
                <label>Attending Doctor</label>
                <div className="current-doctor-box">
                  <Stethoscope size={18} color="var(--color-primary-600)" />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      Dr. {user?.name || 'Practicing Physician'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      Signed as authorized healthcare provider
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Clinical Diagnosis */}
        <div className="create-rx-card">
          <div className="card-section-title">
            <Sparkles size={18} color="var(--color-primary-600)" />
            <span>2. Clinical Diagnosis <span className="text-danger">*</span></span>
          </div>

          <div className="form-group">
            <input
              id="input-diagnosis"
              type="text"
              className="form-control"
              placeholder="e.g. Essential Hypertension Stage 1 / Acute Bronchitis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              required
              maxLength={500}
            />

            {/* Quick Suggestion Chips */}
            <div className="quick-suggestions-row">
              <span className="suggestions-label">Common Diagnoses:</span>
              <div className="suggestions-chips-group">
                {COMMON_DIAGNOSES.map((diag) => (
                  <button
                    key={diag}
                    type="button"
                    className="suggestion-chip"
                    onClick={() => setDiagnosis(diag)}
                  >
                    {diag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Medication Rows Builder */}
        <div className="create-rx-card">
          <div className="card-section-title">
            <Pill size={18} color="var(--color-primary-600)" />
            <span>3. Medication Regimen & Administration <span className="text-danger">*</span></span>
          </div>

          <MedicineRowsBuilder medicines={medicines} onChange={setMedicines} />
        </div>

        {/* Section 4: General Physician Advice & Precautions */}
        <div className="create-rx-card">
          <div className="card-section-title">
            <FileText size={18} color="var(--color-primary-600)" />
            <span>4. Clinical Advice & Patient Instructions (Optional)</span>
          </div>

          <div className="form-group">
            <textarea
              id="input-instructions"
              className="form-control"
              rows={4}
              placeholder="e.g. Maintain hydration (2.5L water daily). Avoid high sodium foods. Discontinue immediately if rash or dizziness occurs. Follow-up consultation scheduled in 10 days."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              maxLength={1000}
            />
            <div className="char-count-note">{instructions.length}/1000 characters</div>
          </div>
        </div>

        {/* Submit & Cancel Actions */}
        <div className="form-actions-bottom">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleBack}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            id="btn-submit-prescription"
            type="submit"
            className="btn btn-primary"
            disabled={submitting || loadingDirectories}
          >
            {submitting ? (
              <>
                <div className="spinner-sm" />
                <span>Issuing Prescription...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                <span>Issue e-Prescription</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePrescriptionPage;
