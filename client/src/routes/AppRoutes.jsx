import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ProtectedRoute } from '../components/auth/ProtectedRoute.jsx';
import { AppLayout } from '../components/layout/AppLayout.jsx';
import { LoginPage } from '../pages/auth/LoginPage.jsx';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage.jsx';
import { DoctorDashboardPage } from '../pages/doctor/DoctorDashboardPage.jsx';
import { PatientDashboardPage } from '../pages/patient/PatientDashboardPage.jsx';
import { DoctorManagementPage } from '../pages/admin/DoctorManagementPage.jsx';
import { PatientManagementPage } from '../pages/admin/PatientManagementPage.jsx';
import { AppointmentsListPage } from '../pages/appointment/AppointmentsListPage.jsx';
import { AppointmentDetailsPage } from '../pages/appointment/AppointmentDetailsPage.jsx';
import { AppointmentBookingPage } from '../pages/appointment/AppointmentBookingPage.jsx';
import { ReportsListPage } from '../pages/report/ReportsListPage.jsx';
import { ReportDetailsPage } from '../pages/report/ReportDetailsPage.jsx';
import { UploadReportPage } from '../pages/report/UploadReportPage.jsx';
import { DoctorReviewReportsPage } from '../pages/report/DoctorReviewReportsPage.jsx';
import { PrescriptionsListPage } from '../pages/prescription/PrescriptionsListPage.jsx';
import { PrescriptionDetailsPage } from '../pages/prescription/PrescriptionDetailsPage.jsx';
import { CreatePrescriptionPage } from '../pages/prescription/CreatePrescriptionPage.jsx';
import { InvoicesListPage } from '../pages/billing/InvoicesListPage.jsx';
import { InvoiceDetailsPage } from '../pages/billing/InvoiceDetailsPage.jsx';
import { CreateInvoicePage } from '../pages/billing/CreateInvoicePage.jsx';
import { PatientBillingPage } from '../pages/billing/PatientBillingPage.jsx';
import { ReceptionistDashboard } from '../pages/receptionist/ReceptionistDashboard.jsx';
import { PatientRegistration } from '../pages/receptionist/PatientRegistration.jsx';
import { AppointmentBooking } from '../pages/receptionist/AppointmentBooking.jsx';
import { DoctorAvailability } from '../pages/receptionist/DoctorAvailability.jsx';
import { BillingDesk } from '../pages/receptionist/BillingDesk.jsx';
import { ReceptionistPatientsPage } from '../pages/receptionist/ReceptionistPatientsPage.jsx';
import { ReceptionistSchedulePage } from '../pages/receptionist/ReceptionistSchedulePage.jsx';
import { NotFoundPage } from '../pages/NotFoundPage.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';

/**
 * Root Redirector: Resolves landing page based on authentication status and user role
 */
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen text="Resolving portal..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user?.role === 'RECEPTIONIST') return <Navigate to="/receptionist" replace />;
  if (user?.role === 'DOCTOR') return <Navigate to="/doctor" replace />;
  return <Navigate to="/patient" replace />;
};

/**
 * Public Only Route: Redirects authenticated users away from Login page
 */
const PublicOnlyRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading session..." />;
  }

  if (isAuthenticated) {
    if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user?.role === 'RECEPTIONIST') return <Navigate to="/receptionist" replace />;
    if (user?.role === 'DOCTOR') return <Navigate to="/doctor" replace />;
    return <Navigate to="/patient" replace />;
  }

  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Root Dynamic Redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Login Route */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />

      {/* Authenticated Application Layout with Protected Role Routing */}
      <Route element={<AppLayout />}>
        {/* Admin Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/doctors" element={<DoctorManagementPage />} />
          <Route path="/admin/patients" element={<PatientManagementPage />} />
          <Route path="/admin/appointments" element={<AppointmentsListPage />} />
          <Route path="/admin/appointments/book" element={<AppointmentBookingPage />} />
          <Route path="/admin/appointments/:id" element={<AppointmentDetailsPage />} />
          <Route path="/admin/reports" element={<ReportsListPage />} />
          <Route path="/admin/reports/upload" element={<UploadReportPage />} />
          <Route path="/admin/reports/:id" element={<ReportDetailsPage />} />
          <Route path="/admin/prescriptions" element={<PrescriptionsListPage />} />
          <Route path="/admin/prescriptions/create" element={<CreatePrescriptionPage />} />
          <Route path="/admin/prescriptions/:id" element={<PrescriptionDetailsPage />} />
          <Route path="/admin/billing" element={<InvoicesListPage />} />
          <Route path="/admin/billing/create" element={<CreateInvoicePage />} />
          <Route path="/admin/billing/:id" element={<InvoiceDetailsPage />} />
          <Route path="/admin/*" element={<AdminDashboardPage />} />
        </Route>

        {/* Doctor Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['DOCTOR']} />}>
          <Route path="/doctor" element={<DoctorDashboardPage />} />
          <Route path="/doctor/dashboard" element={<DoctorDashboardPage />} />
          <Route path="/doctor/appointments" element={<AppointmentsListPage />} />
          <Route path="/doctor/appointments/:id" element={<AppointmentDetailsPage />} />
          <Route path="/doctor/reports" element={<DoctorReviewReportsPage />} />
          <Route path="/doctor/reports/:id" element={<ReportDetailsPage />} />
          <Route path="/doctor/prescriptions" element={<PrescriptionsListPage />} />
          <Route path="/doctor/prescriptions/create" element={<CreatePrescriptionPage />} />
          <Route path="/doctor/prescriptions/:id" element={<PrescriptionDetailsPage />} />
          <Route path="/doctor/*" element={<DoctorDashboardPage />} />
        </Route>

        {/* Patient Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}>
          <Route path="/patient" element={<PatientDashboardPage />} />
          <Route path="/patient/dashboard" element={<PatientDashboardPage />} />
          <Route path="/patient/appointments" element={<AppointmentsListPage />} />
          <Route path="/patient/appointments/:id" element={<AppointmentDetailsPage />} />
          <Route path="/patient/book" element={<AppointmentBookingPage />} />
          <Route path="/patient/reports" element={<ReportsListPage />} />
          <Route path="/patient/reports/upload" element={<UploadReportPage />} />
          <Route path="/patient/reports/:id" element={<ReportDetailsPage />} />
          <Route path="/patient/prescriptions" element={<PrescriptionsListPage />} />
          <Route path="/patient/prescriptions/:id" element={<PrescriptionDetailsPage />} />
          <Route path="/patient/billing" element={<PatientBillingPage />} />
          <Route path="/patient/billing/:id" element={<InvoiceDetailsPage />} />
          <Route path="/patient/*" element={<PatientDashboardPage />} />
        </Route>

        {/* Receptionist Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN']} />}>
          <Route path="/receptionist" element={<ReceptionistDashboard />} />
          <Route path="/receptionist/dashboard" element={<ReceptionistDashboard />} />
          <Route path="/receptionist/patients" element={<ReceptionistPatientsPage />} />
          <Route path="/receptionist/patients/register" element={<PatientRegistration />} />
          <Route path="/receptionist/doctors/schedule" element={<ReceptionistSchedulePage />} />
          <Route path="/receptionist/doctors/availability" element={<DoctorAvailability />} />
          <Route path="/receptionist/appointments" element={<AppointmentsListPage />} />
          <Route path="/receptionist/appointments/book" element={<AppointmentBooking />} />
          <Route path="/receptionist/appointments/:id" element={<AppointmentDetailsPage />} />
          <Route path="/receptionist/billing" element={<BillingDesk />} />
          <Route path="/receptionist/billing/create" element={<CreateInvoicePage />} />
          <Route path="/receptionist/billing/:id" element={<InvoiceDetailsPage />} />
          <Route path="/receptionist/*" element={<ReceptionistDashboard />} />
        </Route>

        {/* Shared Appointment, Report, Prescription & Billing Routes */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'PATIENT', 'RECEPTIONIST']} />}>
          <Route path="/appointments" element={<AppointmentsListPage />} />
          <Route path="/appointments/book" element={<AppointmentBookingPage />} />
          <Route path="/appointments/:id" element={<AppointmentDetailsPage />} />
          <Route path="/reports" element={<ReportsListPage />} />
          <Route path="/reports/upload" element={<UploadReportPage />} />
          <Route path="/reports/:id" element={<ReportDetailsPage />} />
          <Route path="/prescriptions" element={<PrescriptionsListPage />} />
          <Route path="/prescriptions/create" element={<CreatePrescriptionPage />} />
          <Route path="/prescriptions/:id" element={<PrescriptionDetailsPage />} />
          <Route path="/billing" element={<InvoicesListPage />} />
          <Route path="/billing/:id" element={<InvoiceDetailsPage />} />
        </Route>
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
