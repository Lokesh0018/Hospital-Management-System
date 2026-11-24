import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { reportApi } from '../../api/reportApi.js';
import { patientApi } from '../../api/patientApi.js';
import { receptionistApi } from '../../api/receptionistApi.js';
import { FileUploadZone } from '../../components/report/FileUploadZone.jsx';
import {
  UploadCloud,
  ArrowLeft,
  FileText,
  User,
  Stethoscope,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import '../../styles/reports.css';

const REPORT_TYPES = ['X-Ray', 'MRI', 'CT Scan', 'Blood Test', 'ECG', 'Other'];

export const UploadReportPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentRole = user?.role || 'PATIENT';

  // Form State
  const [title, setTitle] = useState('');
  const [reportType, setReportType] = useState('Blood Test');
  const [description, setDescription] = useState('');
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [fileInfo, setFileInfo] = useState(null);

  // Directory Data
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loadingDirectories, setLoadingDirectories] = useState(true);
  const [patientLoadError, setPatientLoadError] = useState(null);
  const [diagnosticData, setDiagnosticData] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDirectories = async () => {
      try {
        setLoadingDirectories(true);
        const [docsRes, patientsRes] = await Promise.all([
          patientApi.getDoctors({ limit: 100 }),
          currentRole === 'PATIENT' ? patientApi.getProfile() : Promise.resolve(null)
        ]);

        const docList = docsRes?.data?.doctors || docsRes?.data || [];
        setDoctors(docList);
        if (docList.length > 0) {
          setDoctorId(docList[0].id);
        }

        // If staff/admin, fetch patient list
        if (currentRole !== 'PATIENT') {
          try {
            const response = await receptionistApi.getPatients({ limit: 100 });
            console.log("Patients API Response:", response);

            let pList = [];
            if (Array.isArray(response)) pList = response;
            else if (response?.data && Array.isArray(response.data)) pList = response.data;
            else if (response?.patients && Array.isArray(response.patients)) pList = response.patients;
            else if (response?.data?.patients && Array.isArray(response.data.patients)) pList = response.data.patients;

            setPatients(pList);
            if (pList.length > 0) {
              setPatientId(pList[0].id);
            } else {
              setPatientLoadError('API returned empty patient list.');
              setDiagnosticData(JSON.stringify(response, null, 2));
            }
          } catch (err) {
            console.error("Patients API Error:", err);
            setPatientLoadError(err?.message || 'Failed to load patients API.');
            setDiagnosticData(JSON.stringify(err, null, 2));
          }
        }
      } catch (err) {
        console.warn('Failed to load doctor/patient directory for upload form:', err);
      } finally {
        setLoadingDirectories(false);
      }
    };

    fetchDirectories();
  }, [currentRole]);

  const handleBack = () => {
    if (currentRole === 'ADMIN') navigate('/admin/reports');
    else if (currentRole === 'DOCTOR') navigate('/doctor/reports');
    else if (currentRole === 'RECEPTIONIST') navigate('/reports');
    else navigate('/patient/reports');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Report title is required.');
      return;
    }

    if (currentRole !== 'PATIENT' && !patientId) {
      setError('Please select a patient for this diagnostic report.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        reportType,
        description: description.trim() || undefined,
        doctorId: doctorId || undefined,
        patientId: currentRole !== 'PATIENT' ? patientId : undefined,
        fileUrl: fileInfo?.dataUrl || undefined,
        fileType: fileInfo?.type || undefined,
        fileSize: fileInfo?.size || undefined,
        reportDate: new Date().toISOString().split('T')[0]
      };

      await reportApi.createReport(payload);
      handleBack();
    } catch (err) {
      console.error('Failed to upload report:', err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to upload medical report. Please review your input.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="reports-container" style={{ maxWidth: 880 }}>
      <button
        className="btn btn-secondary"
        onClick={handleBack}
        style={{ width: 'fit-content', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
      >
        <ArrowLeft size={16} />
        <span>Back to Reports</span>
      </button>

      {/* Header */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: 'white', border: 'none', padding: '1.75rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <UploadCloud size={26} color="#bae6fd" />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Upload Diagnostic Medical Report</h1>
        </div>
        <p style={{ opacity: 0.9, marginTop: '0.35rem', fontSize: '0.875rem' }}>
          Attach lab findings, imaging scans, and assign an interpreting physician for clinical review
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: '2rem' }}>
        {error && (
          <div
            style={{
              padding: '0.85rem 1rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              color: '#991b1b',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem'
            }}
          >
            <AlertCircle size={18} color="#dc2626" />
            <span>{error}</span>
          </div>
        )}

        {/* Title & Type */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="report-title-input">
              Report Title <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="report-title-input"
              type="text"
              required
              className="form-control"
              placeholder="e.g. Chest X-Ray Posteroanterior View"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="report-type-select">
              Diagnostic Modality / Type <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              id="report-type-select"
              className="form-control"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              {REPORT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Patient Selection (if Staff/Admin) */}
        {currentRole !== 'PATIENT' && (
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" htmlFor="select-report-patient">
              Select Patient <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              id="select-report-patient"
              className="form-control"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required={!patientLoadError}
            >
              {patients.length === 0 && <option value="" disabled>Select a patient</option>}
              {patients.map((p) => {
                const name = p.name || p.user?.name || `Patient`;
                const shortId = p.id ? `PAT-${p.id.substring(0, 3).toUpperCase()}` : 'UNKNOWN';
                return (
                  <option key={p.id} value={p.id}>
                    {name} ({shortId})
                  </option>
                );
              })}
            </select>
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
              <strong>Debug:</strong> Patients Loaded: {patients.length}
            </div>
            {patientLoadError && (
              <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontSize: '0.85rem' }}>
                <strong>Diagnostic Message:</strong> {patientLoadError}
                <pre style={{ marginTop: '0.5rem', background: '#f87171', color: '#fff', padding: '0.5rem', borderRadius: '4px', overflowX: 'auto', fontSize: '0.75rem' }}>
                  {diagnosticData}
                </pre>
              </div>
            )}
            {patients.length === 0 && !patientLoadError && (
              <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontSize: '0.85rem' }}>
                <strong>Backend Error:</strong> Patients list is empty. No patient records were loaded from the API.
              </div>
            )}
          </div>
        )}

        {/* Doctor Assignment */}
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label className="form-label" htmlFor="select-report-doctor">
            Assign Interpreting Specialist (Optional)
          </label>
          <select
            id="select-report-doctor"
            className="form-control"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
          >
            <option value="">Hospital Laboratory (Unassigned)</option>
            {doctors.map((doc) => {
              const name = doc?.name || doc?.user?.name || `Dr. #${doc.id.substring(0, 5)}`;
              const specialty = doc?.profile?.specialization || doc?.specialization || '';
              return (
                <option key={doc.id} value={doc.id}>
                  {name} {specialty ? `— ${specialty}` : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Description / Symptoms */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label className="form-label" htmlFor="report-description-input">
            Clinical Indications / Description (Optional)
          </label>
          <textarea
            id="report-description-input"
            rows="3"
            className="form-control"
            placeholder="Clinical indications, examination notes, preliminary test parameters..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
          />
        </div>

        {/* File Upload Dropzone */}
        <div className="form-group" style={{ marginBottom: '2rem' }}>
          <label className="form-label">
            Report File Attachment (PDF, Images, DICOM)
          </label>
          <FileUploadZone
            fileInfo={fileInfo}
            onFileSelected={(info) => setFileInfo(info)}
            onClearFile={() => setFileInfo(null)}
            disabled={submitting}
          />
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-slate-100)' }}>
          <button type="button" className="btn btn-secondary" onClick={handleBack} disabled={submitting}>
            Cancel
          </button>
          <button
            id="btn-submit-upload-report"
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ background: '#0284c7', borderColor: '#0284c7' }}
          >
            <CheckCircle2 size={16} />
            <span>{submitting ? 'Uploading Report...' : 'Upload Medical Report'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadReportPage;
