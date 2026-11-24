import React, { useState, useEffect, useCallback } from 'react';
import { doctorApi } from '../../api/doctorApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { DoctorProfileCard } from '../../components/doctor/DoctorProfileCard.jsx';
import { DoctorAppointmentsSection } from '../../components/doctor/DoctorAppointmentsSection.jsx';
import { AssignedReportsSection } from '../../components/doctor/AssignedReportsSection.jsx';
import { DoctorPrescriptionsSection } from '../../components/doctor/DoctorPrescriptionsSection.jsx';
import { ReviewReportModal } from '../../components/doctor/ReviewReportModal.jsx';
import { CreatePrescriptionModal } from '../../components/doctor/CreatePrescriptionModal.jsx';
import { KPICard } from '../../components/dashboard/KPICard.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import {
  Calendar,
  CalendarCheck,
  FileClock,
  Pill,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Logo } from '../../components/common/Logo.jsx';
import '../../styles/doctor.css';

export const DoctorDashboardPage = () => {
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [reports, setReports] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Modals state
  const [selectedReportToReview, setSelectedReportToReview] = useState(null);
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [selectedPatientForRx, setSelectedPatientForRx] = useState(null);
  const [selectedAppointmentIdForRx, setSelectedAppointmentIdForRx] = useState(null);

  const fetchDoctorData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Concurrent fetch for doctor profile, appointments, reports, and prescriptions
      const [profileRes, apptsRes, reportsRes, rxRes] = await Promise.all([
        doctorApi.getProfile(),
        doctorApi.getAppointments({ limit: 50 }),
        doctorApi.getAssignedReports({ limit: 50 }),
        doctorApi.getCreatedPrescriptions({ limit: 50 }),
      ]);

      const userObj = profileRes?.data;
      setProfile(userObj?.doctorProfile ? { ...userObj.doctorProfile, user: userObj } : null);

      const aptList = apptsRes?.data?.appointments || apptsRes?.data || [];
      setAppointments(aptList);

      const repList = reportsRes?.data?.reports || reportsRes?.data || [];
      setReports(repList);

      const rxList = rxRes?.data?.prescriptions || rxRes?.data || [];
      setPrescriptions(rxList);
    } catch (err) {
      console.error('Failed to load doctor dashboard data:', err);
      setError(err.message || 'Unable to load clinical records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctorData();
  }, [fetchDoctorData]);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleAutoRefresh = (payload) => {
      console.log('Socket event received, refreshing doctor dashboard:', payload);
      fetchDoctorData(true);
    };

    socket.on('appointment:created', handleAutoRefresh);
    socket.on('appointment:updated', handleAutoRefresh);
    socket.on('appointment:cancelled', handleAutoRefresh);
    socket.on('report:uploaded', handleAutoRefresh);
    socket.on('report:updated', handleAutoRefresh);

    return () => {
      socket.off('appointment:created', handleAutoRefresh);
      socket.off('appointment:updated', handleAutoRefresh);
      socket.off('appointment:cancelled', handleAutoRefresh);
      socket.off('report:uploaded', handleAutoRefresh);
      socket.off('report:updated', handleAutoRefresh);
    };
  }, [socket, fetchDoctorData]);

  // Derived today vs upcoming appointments
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter((a) => a.appointmentDate === todayStr);
  const upcomingAppointments = appointments.filter((a) => a.appointmentDate !== todayStr);

  const pendingReportsCount = reports.filter(
    (r) => r.status === 'UNDER_REVIEW' || r.status === 'UPLOADED'
  ).length;

  const handleAppointmentUpdated = (updatedApt) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === updatedApt.id ? { ...a, ...updatedApt } : a))
    );
  };

  const handleReportReviewed = (reviewedReport) => {
    setReports((prev) =>
      prev.map((r) => (r.id === reviewedReport.id ? { ...r, ...reviewedReport } : r))
    );
  };

  const handlePrescriptionCreated = (newRx) => {
    setPrescriptions((prev) => [newRx, ...prev]);
  };

  const handleOpenRxModal = (patient = null, appointmentId = null) => {
    setSelectedPatientForRx(patient);
    setSelectedAppointmentIdForRx(appointmentId);
    setPrescriptionModalOpen(true);
  };

  if (loading) {
    return (
      <div className="doctor-dashboard-container">
        <div className="skeleton-box" style={{ width: '100%', height: 140, borderRadius: 'var(--radius-xl)' }} />
        <div className="kpi-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="kpi-card" style={{ height: 110 }}>
              <div className="skeleton-box" style={{ width: '100%', height: '100%' }} />
            </div>
          ))}
        </div>
        <div className="skeleton-box" style={{ width: '100%', height: 280, borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="doctor-dashboard-container">
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <AlertCircle size={40} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Clinical Portal Connection Error
          </h2>
          <p style={{ color: 'var(--color-slate-600)', maxWidth: 460, margin: '0 auto 1.5rem' }}>
            {error}
          </p>
          <button onClick={() => fetchDoctorData()} className="refresh-btn" style={{ margin: '0 auto' }}>
            <RefreshCw size={16} />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-dashboard-container">
      {/* 1. Doctor Profile Summary with Availability Toggle */}
      <DoctorProfileCard
        profile={profile}
        onAvailabilityChange={(newStatus) => {
          if (profile) setProfile({ ...profile, availabilityStatus: newStatus });
        }}
      />

      {/* Header Controls */}
      <PageHeader
        title="Clinical Operations Overview"
        subtitle="Daily consultations, patient test reviews, and medication schedules"
        icon="📋"
        action={
          <button
            onClick={() => fetchDoctorData(true)}
            disabled={refreshing}
            className="rec-btn-action rec-btn-view"
            title="Refresh clinical data"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', borderRadius: 'var(--radius-full)' }}
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Sync Records'}</span>
          </button>
        }
      />

      {/* 2. Dashboard Statistics */}
      <div className="kpi-grid">
        <KPICard
          title="Today's Consultations"
          value={todayAppointments.length}
          icon={Calendar}
          iconClass="kpi-icon-blue"
          subtext="Patient appointments scheduled for today"
        />

        <KPICard
          title="Upcoming Appointments"
          value={upcomingAppointments.length}
          icon={CalendarCheck}
          iconClass="kpi-icon-indigo"
          subtext="Future bookings in your schedule"
        />

        <KPICard
          title="Reports Under Review"
          value={pendingReportsCount}
          icon={FileClock}
          iconClass="kpi-icon-amber"
          pillText={pendingReportsCount > 0 ? 'Requires Action' : 'All Clear'}
          pillClass={pendingReportsCount > 0 ? 'kpi-pill-amber' : 'kpi-pill-emerald'}
          subtext="Assigned diagnostic medical tests"
        />

        <KPICard
          title="Prescriptions Issued"
          value={prescriptions.length}
          icon={Pill}
          iconClass="kpi-icon-purple"
          subtext="Clinical prescriptions created by you"
        />
      </div>

      {/* 3. Today's & Upcoming Appointments Section */}
      <DoctorAppointmentsSection
        todayAppointments={todayAppointments}
        upcomingAppointments={upcomingAppointments}
        onAppointmentUpdated={handleAppointmentUpdated}
        onOpenPrescriptionModal={handleOpenRxModal}
      />

      {/* 4. Assigned Medical Reports & Review Section */}
      <AssignedReportsSection
        reports={reports}
        onOpenReviewModal={(report) => setSelectedReportToReview(report)}
      />

      {/* 5. Recent Prescriptions Section */}
      <DoctorPrescriptionsSection
        prescriptions={prescriptions}
        onOpenCreateModal={() => handleOpenRxModal()}
      />

      {/* Interactive Review Modal */}
      <ReviewReportModal
        report={selectedReportToReview}
        isOpen={!!selectedReportToReview}
        onClose={() => setSelectedReportToReview(null)}
        onSuccess={handleReportReviewed}
      />

      {/* Interactive Prescription Creator Modal */}
      <CreatePrescriptionModal
        isOpen={prescriptionModalOpen}
        onClose={() => {
          setPrescriptionModalOpen(false);
          setSelectedPatientForRx(null);
          setSelectedAppointmentIdForRx(null);
        }}
        onSuccess={handlePrescriptionCreated}
        initialPatient={selectedPatientForRx}
        initialAppointmentId={selectedAppointmentIdForRx}
      />
    </div>
  );
};

export default DoctorDashboardPage;
