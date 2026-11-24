import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { reportApi } from '../../api/reportApi.js';
import { ReportFilters } from '../../components/report/ReportFilters.jsx';
import { ReportTable } from '../../components/report/ReportTable.jsx';
import { DoctorReviewModal } from '../../components/report/DoctorReviewModal.jsx';
import {
  FileText,
  UploadCloud,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';
import '../../styles/reports.css';

export const ReportsListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentRole = user?.role || 'PATIENT';

  // Filters State
  const [search, setSearch] = useState('');
  const [reportType, setReportType] = useState('All Diagnostic Types');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Data State
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Modal State
  const [selectedReportForReview, setSelectedReportForReview] = useState(null);

  const fetchReports = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const params = {
        page,
        limit,
        status: status !== 'ALL' ? status : undefined,
        reportType: reportType !== 'All Diagnostic Types' ? reportType : undefined,
        search: search.trim() || undefined,
        sortBy: 'reportDate',
        sortOrder: 'desc'
      };

      const res = await reportApi.getAllReports(params);
      const data = res?.data;

      if (data?.reports) {
        setReports(data.reports);
        setPagination(data.pagination || { total: data.reports.length, page: 1, limit, totalPages: 1 });
      } else if (Array.isArray(data)) {
        setReports(data);
        setPagination({ total: data.length, page: 1, limit, totalPages: 1 });
      } else {
        setReports([]);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Unable to load diagnostic reports from the server.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit, status, reportType, search]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleClearFilters = () => {
    setSearch('');
    setReportType('All Diagnostic Types');
    setStatus('ALL');
    setPage(1);
  };

  const handleViewDetails = (reportId) => {
    if (currentRole === 'ADMIN') navigate(`/admin/reports/${reportId}`);
    else if (currentRole === 'DOCTOR') navigate(`/doctor/reports/${reportId}`);
    else navigate(`/patient/reports/${reportId}`);
  };

  const handleUploadClick = () => {
    if (currentRole === 'ADMIN') navigate('/admin/reports/upload');
    else if (currentRole === 'PATIENT') navigate('/patient/reports/upload');
    else navigate('/reports/upload');
  };

  const handleReviewed = (updatedReport) => {
    setReports((prev) =>
      prev.map((r) => (r.id === updatedReport.id ? { ...r, ...updatedReport } : r))
    );
  };

  const handleDelete = async (report) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete medical report: "${report.title}"?`
    );
    if (!confirmDelete) return;

    try {
      await reportApi.deleteReport(report.id);
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to delete report.');
    }
  };

  return (
    <div className="reports-container">
      {/* Page Header */}
      <div className="reports-page-header">
        <div className="reports-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FileText size={24} color="var(--color-primary-600)" />
            <h1>Medical Diagnostic Reports</h1>
          </div>
          <p>
            {currentRole === 'ADMIN' && 'Diagnostic test archives, laboratory results, radiologic scans, and physician sign-offs'}
            {currentRole === 'DOCTOR' && 'Assigned patient laboratory results, diagnostic scans, and clinical review status'}
            {currentRole === 'PATIENT' && 'Your laboratory test results, imaging reports, and physician impressions'}
          </p>
        </div>

        <div className="header-actions-group">
          <button
            id="btn-refresh-reports"
            className="refresh-btn"
            onClick={() => fetchReports(true)}
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          {(currentRole === 'ADMIN' || currentRole === 'PATIENT') && (
            <button
              id="btn-navigate-upload-report"
              className="btn btn-primary"
              onClick={handleUploadClick}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <UploadCloud size={16} />
              <span>Upload Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <ReportFilters
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        reportType={reportType}
        onReportTypeChange={(val) => {
          setReportType(val);
          setPage(1);
        }}
        status={status}
        onStatusChange={(val) => {
          setStatus(val);
          setPage(1);
        }}
        onClear={handleClearFilters}
      />

      {/* Loading Skeletons */}
      {loading ? (
        <div className="card" style={{ padding: '2rem' }}>
          <div className="skeleton-box" style={{ width: '100%', height: 40, marginBottom: '1rem' }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-box" style={{ width: '100%', height: 52, marginBottom: '0.5rem' }} />
          ))}
        </div>
      ) : error ? (
        /* Error State */
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <AlertCircle size={44} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-slate-900)' }}>
            Failed to Load Reports
          </h3>
          <p style={{ color: 'var(--color-slate-600)', maxWidth: 460, margin: '0.5rem auto 1.5rem' }}>
            {error}
          </p>
          <button onClick={() => fetchReports()} className="btn btn-primary" style={{ margin: '0 auto' }}>
            <RefreshCw size={15} />
            <span>Try Again</span>
          </button>
        </div>
      ) : reports.length === 0 ? (
        /* Empty State */
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: '#f0f9ff',
              color: 'var(--color-primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}
          >
            <FileText size={30} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>
            No Medical Reports Found
          </h3>
          <p style={{ color: 'var(--color-slate-500)', maxWidth: 440, margin: '0.4rem auto 1.5rem' }}>
            {search || reportType !== 'All Diagnostic Types' || status !== 'ALL'
              ? 'No reports matched your selected filter criteria. Try resetting filters.'
              : 'There are no diagnostic reports recorded in the system yet.'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            {(search || reportType !== 'All Diagnostic Types' || status !== 'ALL') && (
              <button className="btn btn-secondary" onClick={handleClearFilters}>
                Reset Filters
              </button>
            )}
            {(currentRole === 'ADMIN' || currentRole === 'PATIENT') && (
              <button className="btn btn-primary" onClick={handleUploadClick}>
                <UploadCloud size={15} />
                <span>Upload First Report</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Data Table & Pagination */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <ReportTable
            reports={reports}
            currentRole={currentRole}
            onViewDetails={handleViewDetails}
            onReview={(rep) => setSelectedReportForReview(rep)}
            onDelete={handleDelete}
          />

          {/* Pagination Footer */}
          <div className="pagination-container">
            <div>
              Showing <strong>{(pagination.page - 1) * pagination.limit + 1}</strong> to{' '}
              <strong>
                {Math.min(pagination.page * pagination.limit, pagination.total || reports.length)}
              </strong>{' '}
              of <strong>{pagination.total || reports.length}</strong> reports
            </div>

            <div className="pagination-btn-group">
              <button
                id="btn-reports-prev-page"
                className="pagination-btn"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              <span style={{ fontWeight: 600, padding: '0 0.5rem', color: 'var(--color-slate-700)' }}>
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>

              <button
                id="btn-reports-next-page"
                className="pagination-btn"
                disabled={pagination.page >= (pagination.totalPages || 1)}
                onClick={() => setPage((p) => p + 1)}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Review Modal */}
      {selectedReportForReview && (
        <DoctorReviewModal
          report={selectedReportForReview}
          onClose={() => setSelectedReportForReview(null)}
          onReviewed={handleReviewed}
        />
      )}
    </div>
  );
};

export default ReportsListPage;
