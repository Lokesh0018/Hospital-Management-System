import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { reportApi } from '../../api/reportApi.js';
import { ReportStatusBadge } from '../../components/report/ReportStatusBadge.jsx';
import { ReportTypeBadge } from '../../components/report/ReportTypeBadge.jsx';
import { DoctorReviewModal } from '../../components/report/DoctorReviewModal.jsx';
import {
  FileText,
  User,
  Stethoscope,
  Calendar,
  ExternalLink,
  Download,
  ArrowLeft,
  Edit3,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle2,
  FileCheck,
  ShieldCheck
} from 'lucide-react';
import '../../styles/reports.css';

export const ReportDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentRole = user?.role || 'PATIENT';

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await reportApi.getReportById(id);
        setReport(res?.data);
      } catch (err) {
        console.error('Failed to load report details:', err);
        setError(
          err?.response?.data?.message ||
          err?.message ||
          'Medical report was not found or access is restricted.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchReport();
  }, [id]);

  const handleBack = () => {
    if (currentRole === 'ADMIN') navigate('/admin/reports');
    else if (currentRole === 'DOCTOR') navigate('/doctor/reports');
    else if (currentRole === 'RECEPTIONIST') navigate('/reports');
    else navigate('/patient/reports');
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete this report: "${report?.title}"?`
    );
    if (!confirmDelete) return;

    try {
      await reportApi.deleteReport(id);
      handleBack();
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to delete report.');
    }
  };

  if (loading) {
    return (
      <div className="reports-container">
        <div className="skeleton-box" style={{ width: 200, height: 36, marginBottom: '1rem' }} />
        <div className="dossier-grid">
          <div className="skeleton-box" style={{ height: 260, borderRadius: 'var(--radius-xl)' }} />
          <div className="skeleton-box" style={{ height: 260, borderRadius: 'var(--radius-xl)' }} />
        </div>
        <div className="skeleton-box" style={{ height: 200, borderRadius: 'var(--radius-xl)' }} />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="reports-container">
        <button className="btn btn-secondary" onClick={handleBack} style={{ width: 'fit-content' }}>
          <ArrowLeft size={16} />
          <span>Back to Reports</span>
        </button>

        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem', marginTop: '1rem' }}>
          <AlertCircle size={44} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Medical Report Error</h3>
          <p style={{ color: 'var(--color-slate-600)', maxWidth: 440, margin: '0.5rem auto 1.5rem' }}>
            {error || 'The requested diagnostic report could not be found.'}
          </p>
          <button className="btn btn-primary" onClick={handleBack} style={{ margin: '0 auto' }}>
            Return to Reports
          </button>
        </div>
      </div>
    );
  }

  // Patient & Doctor Details
  const patient = report.patient;
  const patientName = patient?.name || patient?.user?.name || 'Registered Patient';
  const patientPhone = patient?.phone || patient?.user?.phone || patient?.emergencyContact || 'N/A';
  const patientEmail = patient?.email || patient?.user?.email || 'N/A';

  const doctor = report.doctor;
  const doctorName = doctor?.name || doctor?.user?.name || (report.doctorId ? `Doctor #${report.doctorId.substring(0, 5)}` : 'Hospital Laboratory');
  const specialty = doctor?.specialization || doctor?.department || 'Diagnostic Medicine';
  const doctorEmail = doctor?.email || doctor?.user?.email || 'N/A';

  const uploadDate = report.reportDate || report.createdAt?.split('T')[0] || 'Recent';

  const canDoctorReview = currentRole === 'DOCTOR' || currentRole === 'ADMIN';
  const canAdminDelete = currentRole === 'ADMIN';

  return (
    <div className="reports-container">
      {/* Top Navigation & Action Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          id="btn-back-to-reports"
          className="btn btn-secondary"
          onClick={handleBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Reports</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <ReportStatusBadge status={report.status} />

          {canDoctorReview && (
            <>
              <button
                id="btn-details-review-report"
                className="btn btn-primary"
                onClick={() => setReviewModalOpen(true)}
                style={{ background: '#059669', borderColor: '#059669' }}
              >
                <Edit3 size={15} />
                <span>{report.status === 'REVIEWED' ? 'Update Clinical Review' : 'Perform Clinical Review'}</span>
              </button>
              
              <button
                id="btn-details-create-prescription"
                className="btn btn-primary"
                onClick={() => navigate(`/prescriptions/create?patientId=${patient?.id}&doctorId=${report?.doctorId}`)}
              >
                <Stethoscope size={15} />
                <span>Create Prescription</span>
              </button>
            </>
          )}

          {canAdminDelete && (
            <button
              id="btn-details-delete-report"
              className="btn btn-danger"
              onClick={handleDelete}
            >
              <Trash2 size={15} />
              <span>Delete Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          color: 'white',
          padding: '1.75rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.25)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ReportTypeBadge type={report.reportType} />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-primary-300)', fontWeight: 700, letterSpacing: '0.04em' }}>
              RECORD #{report.id?.substring(0, 8)?.toUpperCase()}
            </span>
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'white', margin: '0.4rem 0' }}>
            {report.title}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.875rem', color: 'var(--color-slate-300)', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <span>Patient: <strong>{patientName}</strong></span>
            <span>Interpreting Doctor: <strong>{doctorName}</strong></span>
            <span>Recorded on: <strong>{uploadDate}</strong></span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>
            Diagnostic Type
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', marginTop: 2 }}>
            {report.reportType}
          </div>
        </div>
      </div>

      {/* Grid: Patient & Doctor Cards */}
      <div className="dossier-grid">
        {/* Patient Card */}
        <div className="dossier-card">
          <div className="dossier-card-header">
            <div className="appointment-avatar avatar-patient">
              <User size={18} />
            </div>
            <div>
              <h3>Patient Information</h3>
              <span style={{ fontSize: '0.785rem', color: 'var(--color-slate-500)' }}>
                Medical Record #{patient?.id?.substring(0, 8)?.toUpperCase() || 'MRN-REGISTERED'}
              </span>
            </div>
          </div>

          <div className="dossier-info-list">
            <div className="dossier-info-row">
              <span className="dossier-label">Full Name</span>
              <span className="dossier-val">{patientName}</span>
            </div>
            <div className="dossier-info-row">
              <span className="dossier-label">Email Address</span>
              <span className="dossier-val">{patientEmail}</span>
            </div>
            <div className="dossier-info-row">
              <span className="dossier-label">Phone Contact</span>
              <span className="dossier-val">{patientPhone}</span>
            </div>
            <div className="dossier-info-row">
              <span className="dossier-label">Blood Group</span>
              <span className="dossier-val" style={{ color: '#dc2626', fontWeight: 700 }}>
                {patient?.bloodGroup || 'Not recorded'}
              </span>
            </div>
          </div>
        </div>

        {/* Doctor Card */}
        <div className="dossier-card">
          <div className="dossier-card-header">
            <div className="appointment-avatar avatar-doctor">
              <Stethoscope size={18} />
            </div>
            <div>
              <h3>Interpreting Physician</h3>
              <span style={{ fontSize: '0.785rem', color: 'var(--color-slate-500)' }}>
                Specialist Sign-off
              </span>
            </div>
          </div>

          <div className="dossier-info-list">
            <div className="dossier-info-row">
              <span className="dossier-label">Physician Name</span>
              <span className="dossier-val">{doctorName}</span>
            </div>
            <div className="dossier-info-row">
              <span className="dossier-label">Specialization</span>
              <span className="dossier-val">{specialty}</span>
            </div>
            <div className="dossier-info-row">
              <span className="dossier-label">Contact Email</span>
              <span className="dossier-val">{doctorEmail}</span>
            </div>
            <div className="dossier-info-row">
              <span className="dossier-label">Review Status</span>
              <span className="dossier-val">{report.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description / Clinical Indications */}
      {report.description && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-slate-900)' }}>
            Clinical Indications & Description
          </h3>
          <div className="dossier-reason-callout">
            {report.description}
          </div>
        </div>
      )}

      {/* File Attachment & Download Card */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-slate-900)' }}>
          Diagnostic Document / Scan File
        </h3>

        <div className="file-viewer-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <FileCheck size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-slate-900)', fontSize: '0.95rem' }}>
                {report.title} — {report.reportType} File
              </div>
              <div style={{ fontSize: '0.785rem', color: 'var(--color-slate-500)', marginTop: 2 }}>
                Format: {report.fileType || 'Medical Image / PDF Document'} • Attached
              </div>
            </div>
          </div>

          {report.fileUrl ? (
            <a
              href={report.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              id="btn-download-report-file"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <ExternalLink size={15} />
              <span>View / Download Document</span>
            </a>
          ) : (
            <span style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)', fontStyle: 'italic' }}>
              Digital record metadata recorded (no physical file attachment)
            </span>
          )}
        </div>
      </div>

      {/* Doctor Clinical Review & Impression */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="clinical-impression-header">
          <div className="clinical-impression-title">
            <Stethoscope size={16} />
            <span>Doctor Clinical Impressions & Diagnostic Findings</span>
          </div>

          {report.reviewedAt && (
            <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>
              Reviewed on {new Date(report.reviewedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        {report.doctorNotes ? (
          <div className="clinical-impression-box">
            <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{report.doctorNotes}</p>
          </div>
        ) : (
          <div style={{ padding: '1.75rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--color-slate-500)', fontSize: '0.875rem' }}>
            No physician clinical review findings have been signed off for this report yet.
            {canDoctorReview && (
              <div style={{ marginTop: '0.75rem' }}>
                <button className="btn btn-primary" onClick={() => setReviewModalOpen(true)} style={{ background: '#059669', borderColor: '#059669' }}>
                  <Edit3 size={15} />
                  <span>Document Findings Now</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModalOpen && (
        <DoctorReviewModal
          report={report}
          onClose={() => setReviewModalOpen(false)}
          onReviewed={(updated) => setReport(updated)}
        />
      )}
    </div>
  );
};

export default ReportDetailsPage;
