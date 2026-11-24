import React, { useState, useEffect, useCallback } from 'react';
import { patientApi } from '../../api/patientApi.js';
import { PatientHeroCard } from '../../components/patient/PatientHeroCard.jsx';
import { PatientAppointmentsSection } from '../../components/patient/PatientAppointmentsSection.jsx';
import { PatientReportsSection } from '../../components/patient/PatientReportsSection.jsx';
import { PatientPrescriptionsSection } from '../../components/patient/PatientPrescriptionsSection.jsx';
import { QuickBookModal } from '../../components/patient/QuickBookModal.jsx';
import { PatientProfileModal } from '../../components/patient/PatientProfileModal.jsx';
import { KPICard } from '../../components/dashboard/KPICard.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import {
  Calendar,
  CalendarCheck,
  FileText,
  Pill,
  RefreshCw,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { Logo } from '../../components/common/Logo.jsx';
import '../../styles/patient.css';

export const PatientDashboardPage = () => {
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [reports, setReports] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Modals state
  const [quickBookModalOpen, setQuickBookModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const fetchPatientData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Concurrent fetch for profile, appointments, reports, and prescriptions
      const [profileRes, apptsRes, reportsRes, rxRes] = await Promise.all([
        patientApi.getProfile(),
        patientApi.getAppointments({ limit: 100 }),
        patientApi.getReports({ limit: 100 }),
        patientApi.getPrescriptions({ limit: 100 })
      ]);

      const profData = profileRes?.data;
      setProfile(profData);

      const aptList = apptsRes?.data?.appointments || apptsRes?.data || [];
      setAppointments(aptList);

      const repList = reportsRes?.data?.reports || reportsRes?.data || [];
      setReports(repList);

      const rxList = rxRes?.data?.prescriptions || rxRes?.data || [];
      setPrescriptions(rxList);
    } catch (err) {
      console.error('Failed to fetch patient portal data:', err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Unable to load your healthcare portal data. Please verify your connection.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPatientData();
  }, [fetchPatientData]);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleAutoRefresh = (payload) => {
      console.log('Socket event received, refreshing dashboard data:', payload);
      // We could selectively fetch, but for a dashboard, a full background refresh ensures consistency
      fetchPatientData(true);
    };

    // Listen to all relevant events that might affect patient data
    socket.on('appointment:created', handleAutoRefresh);
    socket.on('appointment:updated', handleAutoRefresh);
    socket.on('appointment:cancelled', handleAutoRefresh);
    socket.on('report:uploaded', handleAutoRefresh);
    socket.on('prescription:created', handleAutoRefresh);

    return () => {
      socket.off('appointment:created', handleAutoRefresh);
      socket.off('appointment:updated', handleAutoRefresh);
      socket.off('appointment:cancelled', handleAutoRefresh);
      socket.off('report:uploaded', handleAutoRefresh);
      socket.off('prescription:created', handleAutoRefresh);
    };
  }, [socket, fetchPatientData]);

  // Derived statistics
  const todayStr = new Date().toISOString().split('T')[0];

  const totalAppointments = appointments.length;
  const upcomingAppointmentsCount = appointments.filter(
    (a) =>
      (a.status === 'PENDING' || a.status === 'CONFIRMED') &&
      a.appointmentDate >= todayStr
  ).length;
  const completedAppointmentsCount = appointments.filter(
    (a) => a.status === 'COMPLETED'
  ).length;

  const totalReports = reports.length;
  const reviewedReportsCount = reports.filter((r) => r.status === 'REVIEWED').length;

  const totalPrescriptions = prescriptions.length;
  const activePrescriptionsCount = prescriptions.filter(
    (p) => p.status === 'ACTIVE'
  ).length;

  // Handlers
  const handleAppointmentBooked = (newApt) => {
    setAppointments((prev) => [newApt, ...prev]);
  };

  const handleAppointmentCancelled = (updatedApt) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === updatedApt.id ? { ...a, ...updatedApt } : a))
    );
  };

  const handleProfileSaved = (updatedProfile) => {
    setProfile(updatedProfile);
  };

  // Loading skeleton screen
  if (loading) {
    return (
      <div className="patient-dashboard-container">
        <div
          className="skeleton-box"
          style={{ width: '100%', height: 160, borderRadius: 'var(--radius-xl)' }}
        />

        <div className="kpi-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="kpi-card" style={{ height: 110 }}>
              <div className="skeleton-box" style={{ width: '100%', height: '100%' }} />
            </div>
          ))}
        </div>

        <div
          className="skeleton-box"
          style={{ width: '100%', height: 320, borderRadius: 'var(--radius-lg)' }}
        />
      </div>
    );
  }

  // Error state screen
  if (error) {
    return (
      <div className="patient-dashboard-container">
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <AlertCircle size={44} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-slate-900)' }}>
            Patient Portal Connection Issue
          </h2>
          <p style={{ color: 'var(--color-slate-600)', maxWidth: 480, margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
            {error}
          </p>
          <button
            onClick={() => fetchPatientData()}
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

  return (
    <div className="patient-dashboard-container">
      {/* 1. Patient Welcome & Profile Summary Hero Card */}
      <PatientHeroCard
        profile={profile}
        onEditProfile={() => setProfileModalOpen(true)}
      />

      {/* Top Controls Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-slate-900)', margin: 0 }}>
              Health Overview & Care Summary
            </h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--color-slate-500)', margin: '0.2rem 0 0 0' }}>
              Real-time synchronization with your hospital medical records
            </p>
          </div>
        </div>

        <button
          id="btn-patient-refresh"
          onClick={() => fetchPatientData(true)}
          disabled={refreshing}
          className="refresh-btn"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Syncing...' : 'Refresh Records'}</span>
        </button>
      </div>

      {/* 2. Clinical Statistics / KPI Cards */}
      <div className="kpi-grid">
        <KPICard
          title="Total Consultations"
          value={totalAppointments}
          icon={Calendar}
          iconClass="kpi-icon-blue"
          subtext={`${upcomingAppointmentsCount} upcoming scheduled`}
          pillText={upcomingAppointmentsCount > 0 ? `${upcomingAppointmentsCount} Scheduled` : 'Up to Date'}
          pillClass={upcomingAppointmentsCount > 0 ? 'kpi-pill-blue' : 'kpi-pill-gray'}
        />

        <KPICard
          title="Completed Visits"
          value={completedAppointmentsCount}
          icon={CalendarCheck}
          iconClass="kpi-icon-green"
          subtext="Lifetime attended consultations"
          pillText="Attended"
          pillClass="kpi-pill-green"
        />

        <KPICard
          title="Active Medications"
          value={activePrescriptionsCount}
          icon={Pill}
          iconClass="kpi-icon-purple"
          subtext={`${totalPrescriptions} lifetime prescribed courses`}
          pillText={activePrescriptionsCount > 0 ? 'In Progress' : 'None Active'}
          pillClass={activePrescriptionsCount > 0 ? 'kpi-pill-purple' : 'kpi-pill-gray'}
        />

        <KPICard
          title="Diagnostic Reports"
          value={totalReports}
          icon={FileText}
          iconClass="kpi-icon-amber"
          subtext={`${reviewedReportsCount} signed by physician`}
          pillText={`${reviewedReportsCount} Signed`}
          pillClass="kpi-pill-amber"
        />
      </div>

      {/* 3. Appointment Section (Upcoming & History) */}
      <PatientAppointmentsSection
        appointments={appointments}
        onOpenBookModal={() => setQuickBookModalOpen(true)}
        onAppointmentCancelled={handleAppointmentCancelled}
      />

      {/* 4. Medical Reports Section */}
      <PatientReportsSection reports={reports} />

      {/* 5. Prescription Section */}
      <PatientPrescriptionsSection prescriptions={prescriptions} />

      {/* Interactive Modals */}
      {quickBookModalOpen && (
        <QuickBookModal
          onClose={() => setQuickBookModalOpen(false)}
          onBooked={handleAppointmentBooked}
        />
      )}

      {profileModalOpen && (
        <PatientProfileModal
          profile={profile}
          onClose={() => setProfileModalOpen(false)}
          onSaved={handleProfileSaved}
        />
      )}
    </div>
  );
};

export default PatientDashboardPage;
