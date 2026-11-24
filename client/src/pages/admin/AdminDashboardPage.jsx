import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/adminApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { KPICard } from '../../components/dashboard/KPICard.jsx';
import { AppointmentStatusChart } from '../../components/dashboard/AppointmentStatusChart.jsx';
import { DoctorSpecializationStats } from '../../components/dashboard/DoctorSpecializationStats.jsx';
import { RecentAppointmentsTable } from '../../components/dashboard/RecentAppointmentsTable.jsx';
import { RecentReportsTable } from '../../components/dashboard/RecentReportsTable.jsx';
import { RecentPrescriptionsTable } from '../../components/dashboard/RecentPrescriptionsTable.jsx';
import {
  Users,
  Stethoscope,
  Calendar,
  FileText,
  Pill,
  RefreshCw,
  AlertCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { Logo } from '../../components/common/Logo.jsx';
import '../../styles/dashboard.css';

export const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('appointments'); // appointments, reports, prescriptions

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await adminApi.getDashboardOverview({ limit: 6 });
      if (response && response.data) {
        setData(response.data);
      } else {
        throw new Error('Invalid dashboard data structure received from server');
      }
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
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

        {/* 5 KPI Skeletons */}
        <div className="kpi-grid">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="kpi-card">
              <div className="skeleton-box" style={{ width: '60%', height: 14 }} />
              <div className="skeleton-box" style={{ width: '40%', height: 36 }} />
              <div className="skeleton-box" style={{ width: '80%', height: 12 }} />
            </div>
          ))}
        </div>

        {/* Analytics Skeletons */}
        <div className="analytics-grid">
          <div className="analytics-card" style={{ height: 260 }}>
            <div className="skeleton-box" style={{ width: '100%', height: '100%' }} />
          </div>
          <div className="analytics-card" style={{ height: 260 }}>
            <div className="skeleton-box" style={{ width: '100%', height: '100%' }} />
          </div>
        </div>

        {/* Table Skeleton */}
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
            Unable to Load Hospital Dashboard
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
  const recentActivity = data?.recentActivity || {};
  return (
    <div className="dashboard-container">
      {/* Dashboard Top Header */}
      <PageHeader 
        title="Admin Operations Dashboard"
        subtitle="Hospital KPI metrics, clinical utilization statistics, and operational audit feeds"
        icon="📊"
        action={
          <div className="dashboard-controls" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="live-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-success-50)', color: 'var(--color-success-700)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 600 }}>
              <span className="pulse-dot" style={{ width: '8px', height: '8px', background: 'var(--color-success-500)', borderRadius: '50%' }} />
              <span>Live Sync</span>
            </div>

            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="refresh-btn"
              title="Refresh dashboard metrics"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        }
      />

      {/* ==========================================================================
          Requirement 1: 5 Core KPI Cards Grid
          ========================================================================== */}
      <div className="kpi-grid">
        {/* 1. Total Doctors */}
        <KPICard
          title="Total Doctors"
          value={stats.totalDoctors}
          icon={Stethoscope}
          iconClass="kpi-icon-blue"
          subtext="Active medical practitioners"
        />

        {/* 2. Total Patients */}
        <KPICard
          title="Total Patients"
          value={stats.totalPatients}
          icon={Users}
          iconClass="kpi-icon-emerald"
          subtext="Registered patient profiles"
        />

        {/* 3. Total Appointments */}
        <KPICard
          title="Total Appointments"
          value={stats.totalAppointments}
          icon={Calendar}
          iconClass="kpi-icon-indigo"
          pillText={`Today: ${stats.todayAppointments || 0}`}
          pillClass="kpi-pill-blue"
          subtext={`Completed: ${stats.completedAppointments || 0}`}
        />

        {/* 4. Total Reports */}
        <KPICard
          title="Total Reports"
          value={stats.totalMedicalReports}
          icon={FileText}
          iconClass="kpi-icon-amber"
          pillText={`Under Review: ${stats.reportsUnderReview || 0}`}
          pillClass={stats.reportsUnderReview > 0 ? 'kpi-pill-amber' : 'kpi-pill-emerald'}
          subtext="Diagnostic tests recorded"
        />

        {/* 5. Total Prescriptions */}
        <KPICard
          title="Total Prescriptions"
          value={stats.totalPrescriptions}
          icon={Pill}
          iconClass="kpi-icon-purple"
          pillText={`Active: ${stats.activePrescriptions || 0}`}
          pillClass="kpi-pill-emerald"
          subtext="Clinical treatments issued"
        />
      </div>

      {/* ==========================================================================
          Requirement 2: Analytics Section (2-Column Grid)
          - Appointment Status Chart
          - Doctor Specialization Statistics
          ========================================================================== */}
      <div className="analytics-grid">
        <AppointmentStatusChart data={data?.appointmentStatusAnalytics} />
        <DoctorSpecializationStats data={data?.doctorCountBySpecialization} />
      </div>

      {/* ==========================================================================
          Requirement 3: Recent Activity Tables
          - Recent Appointments
          - Recent Reports
          - Recent Prescriptions
          ========================================================================== */}
      <div className="activity-card">
        <div className="activity-header">
          <div className="activity-title">Hospital Activity Feeds</div>

          {/* Tab Selection Switcher */}
          <div className="tab-buttons">
            <button
              className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
              onClick={() => setActiveTab('appointments')}
            >
              Recent Appointments ({recentActivity.appointments?.length || 0})
            </button>
            <button
              className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              Recent Reports ({recentActivity.reports?.length || 0})
            </button>
            <button
              className={`tab-btn ${activeTab === 'prescriptions' ? 'active' : ''}`}
              onClick={() => setActiveTab('prescriptions')}
            >
              Recent Prescriptions ({recentActivity.prescriptions?.length || 0})
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        {activeTab === 'appointments' && (
          <RecentAppointmentsTable appointments={recentActivity.appointments} />
        )}
        {activeTab === 'reports' && (
          <RecentReportsTable reports={recentActivity.reports} />
        )}
        {activeTab === 'prescriptions' && (
          <RecentPrescriptionsTable prescriptions={recentActivity.prescriptions} />
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
