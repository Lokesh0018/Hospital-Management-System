import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportApi } from '../../api/reportApi.js';
import { ReportStatusBadge } from '../../components/report/ReportStatusBadge.jsx';
import { ReportTypeBadge } from '../../components/report/ReportTypeBadge.jsx';
import { DoctorReviewModal } from '../../components/report/DoctorReviewModal.jsx';
import {
  Stethoscope,
  Clock,
  CheckCircle2,
  FileText,
  RefreshCw,
  AlertCircle,
  Eye,
  Edit3,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar
} from 'lucide-react';
import '../../styles/reports.css';

export const DoctorReviewReportsPage = () => {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [statusTab, setStatusTab] = useState('ALL'); // 'ALL' | 'PENDING' (UNDER_REVIEW or UPLOADED) | 'REVIEWED'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Review Modal
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchAssignedReports = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const params = {
        limit: 50,
        status: statusTab !== 'ALL' && statusTab !== 'PENDING' ? statusTab : undefined
      };

      const res = await reportApi.getAssignedReports(params);
      const list = res?.data?.reports || res?.data || [];
      setReports(list);
    } catch (err) {
      console.error('Failed to load assigned reports for doctor review:', err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Unable to load assigned reports from server.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusTab]);

  useEffect(() => {
    fetchAssignedReports();
  }, [fetchAssignedReports]);

  // Filter list by tab
  const filteredReports = reports.filter((r) => {
    if (statusTab === 'PENDING') {
      return r.status === 'UNDER_REVIEW' || r.status === 'UPLOADED';
    }
    if (statusTab === 'REVIEWED') {
      return r.status === 'REVIEWED';
    }
    return true;
  });

  const pendingCount = reports.filter(
    (r) => r.status === 'UNDER_REVIEW' || r.status === 'UPLOADED'
  ).length;
  const reviewedCount = reports.filter((r) => r.status === 'REVIEWED').length;

  const handleReviewed = (updatedReport) => {
    setReports((prev) =>
      prev.map((r) => (r.id === updatedReport.id ? { ...r, ...updatedReport } : r))
    );
  };

  return (
    <div className="reports-container">
      {/* Header */}
      <div className="reports-page-header">
        <div className="reports-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Stethoscope size={24} color="#059669" />
            <h1>Clinical Reports Review Workspace</h1>
          </div>
          <p>
            Diagnostic tests and radiologic scans assigned to you for clinical review and sign-off
          </p>
        </div>

        <div className="header-actions-group">
          <button
            id="btn-refresh-review-reports"
            className="refresh-btn"
            onClick={() => fetchAssignedReports(true)}
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="patient-tabs" style={{ marginBottom: '0.5rem' }}>
        <button
          className={`patient-tab-btn ${statusTab === 'ALL' ? 'active' : ''}`}
          onClick={() => setStatusTab('ALL')}
        >
          <span>All Assigned Tests</span>
          <span className="tab-counter">{reports.length}</span>
        </button>

        <button
          className={`patient-tab-btn ${statusTab === 'PENDING' ? 'active' : ''}`}
          onClick={() => setStatusTab('PENDING')}
        >
          <Clock size={13} />
          <span>Needs Review</span>
          <span className="tab-counter" style={{ background: '#f59e0b', color: 'white' }}>
            {pendingCount}
          </span>
        </button>

        <button
          className={`patient-tab-btn ${statusTab === 'REVIEWED' ? 'active' : ''}`}
          onClick={() => setStatusTab('REVIEWED')}
        >
          <CheckCircle2 size={13} />
          <span>Signed Off</span>
          <span className="tab-counter">{reviewedCount}</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="card" style={{ padding: '2rem' }}>
          <div className="skeleton-box" style={{ width: '100%', height: 40, marginBottom: '1rem' }} />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-box" style={{ width: '100%', height: 56, marginBottom: '0.5rem' }} />
          ))}
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <AlertCircle size={44} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Review Workspace Error</h3>
          <p style={{ color: 'var(--color-slate-600)', maxWidth: 440, margin: '0.5rem auto 1.5rem' }}>
            {error}
          </p>
          <button className="btn btn-primary" onClick={() => fetchAssignedReports()} style={{ margin: '0 auto' }}>
            Try Again
          </button>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}
          >
            <CheckCircle2 size={32} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>
            All Caught Up!
          </h3>
          <p style={{ color: 'var(--color-slate-500)', maxWidth: 440, margin: '0.4rem auto' }}>
            {statusTab === 'PENDING'
              ? 'You have reviewed and signed off on all assigned diagnostic tests.'
              : 'No diagnostic reports match your current tab selection.'}
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Diagnostic Test</th>
                  <th>Patient Info</th>
                  <th>Assigned Date</th>
                  <th>Review Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => {
                  const patientName =
                    report.patient?.name ||
                    report.patient?.user?.name ||
                    `Patient #${report.patientId?.substring(0, 5)}`;
                  const uploadDate = report.reportDate || report.createdAt?.split('T')[0] || 'Recent';

                  return (
                    <tr key={report.id}>
                      {/* Diagnostic Report */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 'var(--radius-md)',
                              background: '#f0fdf4',
                              color: '#15803d',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <FileText size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                              {report.title}
                            </div>
                            <div style={{ marginTop: 3 }}>
                              <ReportTypeBadge type={report.reportType} />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Patient */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                          {patientName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                          MRN #{report.patient?.id?.substring(0, 8)?.toUpperCase() || 'REGISTERED'}
                        </div>
                      </td>

                      {/* Date */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-slate-700)', fontSize: '0.85rem' }}>
                          <Calendar size={14} color="var(--color-slate-400)" />
                          <span>{uploadDate}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <ReportStatusBadge status={report.status} />
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="appointment-actions-group">
                          <button
                            id={`btn-doctor-review-${report.id}`}
                            className="btn-table-action btn-action-confirm"
                            onClick={() => setSelectedReport(report)}
                            title="Perform Clinical Review"
                          >
                            <Edit3 size={13} />
                            <span>{report.status === 'REVIEWED' ? 'Edit Findings' : 'Sign Off'}</span>
                          </button>

                          <button
                            className="btn-table-action btn-action-view"
                            onClick={() => navigate(`/doctor/reports/${report.id}`)}
                            title="View Diagnostic Dossier"
                          >
                            <Eye size={13} />
                            <span>Dossier</span>
                          </button>

                          {report.fileUrl && (
                            <a
                              href={report.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-table-action btn-action-view"
                              title="Download Attachment"
                            >
                              <ExternalLink size={13} />
                              <span>File</span>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedReport && (
        <DoctorReviewModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onReviewed={handleReviewed}
        />
      )}
    </div>
  );
};

export default DoctorReviewReportsPage;
