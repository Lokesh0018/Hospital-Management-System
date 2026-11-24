import React, { useState } from 'react';
import { reportApi } from '../../api/reportApi.js';
import { Stethoscope, X, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

export const DoctorReviewModal = ({ report, onClose, onReviewed }) => {
  const [notes, setNotes] = useState(report?.doctorNotes || '');
  const [status, setStatus] = useState('REVIEWED');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const patientName =
    report?.patient?.name ||
    report?.patient?.user?.name ||
    'Registered Patient';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!notes.trim()) {
      setError('Please provide clinical findings and review notes before signing off.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await reportApi.reviewReport(report.id, {
        doctorNotes: notes.trim(),
        status
      });

      const updated = res?.data;
      if (onReviewed) {
        onReviewed(updated || { ...report, doctorNotes: notes.trim(), status });
      }
      onClose();
    } catch (err) {
      console.error('Failed to submit report clinical review:', err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Unable to record clinical review notes. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-box">
            <Stethoscope size={22} color="#059669" />
            <div>
              <h3>Clinical Report Review</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)', margin: 0 }}>
                Record physician impressions, diagnostic findings, and sign off
              </p>
            </div>
          </div>
          <button
            id="btn-close-review-modal"
            className="modal-close-btn"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 'var(--radius-md)',
                  color: '#991b1b',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <AlertCircle size={18} color="#dc2626" />
                <span>{error}</span>
              </div>
            )}

            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                fontSize: '0.85rem',
                color: '#15803d',
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}
            >
              <div>
                Report Title: <strong>{report?.title}</strong> ({report?.reportType})
              </div>
              <div>
                Patient: <strong>{patientName}</strong> | Uploaded on{' '}
                <strong>{report?.reportDate || report?.createdAt?.split('T')[0]}</strong>
              </div>
            </div>

            {/* Status Selection */}
            <div className="form-group">
              <label className="form-label" htmlFor="review-status-select">
                Review Status Update
              </label>
              <select
                id="review-status-select"
                className="form-control"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="REVIEWED">REVIEWED — Signed Off & Complete</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW — Preliminary Impressions Recorded</option>
              </select>
            </div>

            {/* Clinical Findings Textarea */}
            <div className="form-group">
              <label className="form-label" htmlFor="doctor-notes-textarea">
                Physician Findings, Impression & Recommendations <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <textarea
                id="doctor-notes-textarea"
                rows="5"
                required
                className="review-textarea"
                placeholder="Enter diagnostic conclusions, radiologic observations, laboratory abnormalities, clinical impressions, and recommended follow-up therapy..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={5000}
              />
              <span style={{ fontSize: '0.725rem', color: 'var(--color-slate-400)', marginTop: 4, display: 'block' }}>
                {notes.length}/5000 characters
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              id="btn-submit-review-report"
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ background: '#059669', borderColor: '#059669' }}
            >
              <CheckCircle2 size={16} />
              <span>{submitting ? 'Signing Off...' : 'Sign Off & Save Review'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorReviewModal;
