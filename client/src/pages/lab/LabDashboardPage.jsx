import React, { useState, useEffect, useCallback } from 'react';
import { labApi } from '../../api/labApi.js';
import { KPICard } from '../../components/dashboard/KPICard.jsx';
import { RecentReportsTable } from '../../components/dashboard/RecentReportsTable.jsx';
import {
  FileText,
  Clock,
  CheckCircle2,
  Activity,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Logo } from '../../components/common/Logo.jsx';
import '../../styles/dashboard.css';

export const LabDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await labApi.getDashboardOverview();
      if (response && response.data) {
        setData(response.data);
      } else {
        throw new Error('Invalid dashboard data structure received from server');
      }
    } catch (err) {
      console.error('Failed to load lab dashboard:', err);
      setError(err.message || 'Unable to connect to hospital analytics API.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <div className="skeleton-box" style={{ width: 280, height: 32, marginBottom: '0.5rem' }} />
            <div className="skeleton-box" style={{ width: 420, height: 16 }} />
          </div>
          <div className="skeleton-box" style={{ width: 120, height: 38 }} />
        </div>

        <div className="kpi-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="kpi-card">
              <div className="skeleton-box" style={{ width: '60%', height: 14 }} />
              <div className="skeleton-box" style={{ width: '40%', height: 36 }} />
              <div className="skeleton-box" style={{ width: '80%', height: 12 }} />
            </div>
          ))}
        </div>

        <div className="activity-card" style={{ height: 280 }}>
          <div className="skeleton-box" style={{ width: '100%', height: '100%' }} />
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="dashboard-container">
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: '#fef2f2',
              color: '#dc2626',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <AlertCircle size={32} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-slate-900)' }}>
            Unable to Load Lab Dashboard
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-600)', maxWidth: 460, margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
            {error}
          </p>
          <button
            onClick={() => fetchDashboardData()}
            className="refresh-btn"
            style={{ margin: '0 auto' }}
          >
            <RefreshCw size={16} />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  const stats = data?.statistics || {};
  const recentUploads = data?.recentUploads || [];

  return (
    <div className="dashboard-container">
      {/* Dashboard Top Header */}
      <div className="dashboard-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div className="dashboard-title-group">
          <h1>Lab Technician Dashboard</h1>
          <p className="dashboard-subtitle">
            Manage diagnostic reports, pending reviews, and recent uploads.
          </p>
        </div>

        <div className="dashboard-controls">
          <div className="live-badge">
            <span className="pulse-dot" />
            <span>Live Sync</span>
          </div>

          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="refresh-btn"
            title="Refresh dashboard metrics"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* 1. Total Reports */}
        <KPICard
          title="Total Reports"
          value={stats.totalReports}
          icon={FileText}
          iconClass="kpi-icon-indigo"
          subtext="Total reports in the system"
        />

        {/* 2. Pending Reports */}
        <KPICard
          title="Pending Reports"
          value={stats.pendingReports}
          icon={Clock}
          iconClass="kpi-icon-amber"
          subtext="Awaiting doctor review"
        />

        {/* 3. Completed Reports */}
        <KPICard
          title="Completed Reports"
          value={stats.completedReports}
          icon={CheckCircle2}
          iconClass="kpi-icon-emerald"
          subtext="Reviewed and signed off"
        />
      </div>

      {/* Recent Uploads Table */}
      <div className="activity-card">
        <div className="activity-header">
          <div className="activity-title">
            <Activity size={18} style={{ display: 'inline', marginRight: '0.5rem', color: '#64748b' }} />
            Recent Uploads
          </div>
        </div>

        <RecentReportsTable reports={recentUploads} />
      </div>
    </div>
  );
};

export default LabDashboardPage;
