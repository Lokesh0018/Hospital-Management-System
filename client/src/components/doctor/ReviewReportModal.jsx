import React, { useState } from 'react';
import { doctorApi } from '../../api/doctorApi.js';
import { X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button.jsx';

export const ReviewReportModal = ({ report, isOpen, onClose, onSuccess }) => {
  const [notes, setNotes] = useState(report?.doctorNotes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !report) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError('Please provide clinical findings or notes before completing the review.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await doctorApi.reviewReport(report.id, { doctorNotes: notes.trim() });
      if (onSuccess) {
        onSuccess(response?.data || { ...report, status: 'REVIEWED', doctorNotes: notes });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit report review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <FileText size={20} color="var(--color-primary-600)" />
            <span>Review Medical Diagnostic Report</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="error-banner">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ background: 'var(--color-slate-50)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>Report Title</span>
                <div style={{ fontWeight: 600, color: 'var(--color-slate-800)' }}>{report.title}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>Report Type</span>
                <div>
                  <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>{report.reportType}</span>
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>Patient</span>
                <div style={{ fontWeight: 600, color: 'var(--color-slate-800)' }}>{report.patient?.name || 'Unknown Patient'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>Date Recorded</span>
                <div style={{ color: 'var(--color-slate-700)', fontSize: '0.85rem' }}>{report.reportDate || report.createdAt?.split('T')[0]}</div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="doctorNotes">
                Clinical Notes & Diagnostic Findings <span style={{ color: 'var(--color-accent-rose)' }}>*</span>
              </label>
              <textarea
                id="doctorNotes"
                rows={5}
                required
                className="form-input"
                style={{ padding: '0.75rem', height: 'auto', resize: 'vertical' }}
                placeholder="Enter clinical interpretation, observations, and recommendations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)' }}>
                Submitting will update the report status to <strong>REVIEWED</strong> and timestamp your clinical review.
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} disabled={loading} icon={CheckCircle}>
              Sign Off & Complete Review
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewReportModal;
