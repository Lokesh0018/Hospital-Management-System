import React, { useState } from 'react';
import { prescriptionApi } from '../../api/prescriptionApi.js';
import { FileCheck, AlertCircle, X, CheckCircle2 } from 'lucide-react';

export const UpdateStatusModal = ({
  prescription,
  targetStatus, // 'COMPLETED' | 'CANCELLED'
  onClose,
  onStatusUpdated
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isComplete = targetStatus === 'COMPLETED';

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const res = await prescriptionApi.updateStatus(prescription.id, {
        status: targetStatus
      });

      const updated = res?.data;
      if (onStatusUpdated) {
        onStatusUpdated(updated || { ...prescription, status: targetStatus });
      }
      onClose();
    } catch (err) {
      console.error('Failed to update prescription status:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to update status.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-box">
            {isComplete ? (
              <FileCheck size={22} color="#2563eb" />
            ) : (
              <AlertCircle size={22} color="#dc2626" />
            )}
            <div>
              <h3>{isComplete ? 'Complete Treatment' : 'Discontinue Prescription'}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)', margin: 0 }}>
                Rx #{prescription?.id?.substring(0, 8)?.toUpperCase()}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div
              style={{
                padding: '0.75rem 1rem',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-md)',
                color: '#991b1b',
                fontSize: '0.85rem'
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: isComplete ? '#eff6ff' : '#fef2f2',
              border: `1px solid ${isComplete ? '#bfdbfe' : '#fecaca'}`,
              color: isComplete ? '#1e40af' : '#991b1b',
              fontSize: '0.875rem',
              lineHeight: 1.5
            }}
          >
            {isComplete ? (
              <span>
                Are you sure you want to mark treatment for <strong>{prescription?.diagnosis}</strong> as <strong>COMPLETED</strong>?
                This signals that the patient has completed the prescribed medication course.
              </span>
            ) : (
              <span>
                Are you sure you want to <strong>DISCONTINUE / CANCEL</strong> the prescription for <strong>{prescription?.diagnosis}</strong>?
                The patient will be advised that this regimen has been discontinued.
              </span>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Go Back
          </button>
          <button
            id="btn-confirm-status-update"
            type="button"
            className={`btn ${isComplete ? 'btn-primary' : 'btn-danger'}`}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? 'Updating...' : isComplete ? 'Mark Completed' : 'Discontinue Regimen'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateStatusModal;
