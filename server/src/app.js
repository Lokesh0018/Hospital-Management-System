import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { ENV } from './config/env.js';
import authRoutes from './modules/auth/auth.routes.js';
import doctorRoutes from './modules/doctor/doctor.routes.js';
import appointmentRoutes from './modules/appointment/appointment.routes.js';
import patientRoutes from './modules/patient/patient.routes.js';
import reportRoutes from './modules/report/report.routes.js';
import prescriptionRoutes from './modules/prescription/prescription.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import billingRoutes from './modules/billing/billing.routes.js';
import receptionistRoutes from './modules/receptionist/receptionist.routes.js';
import notificationRoutes from './modules/notification/notification.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ApiError } from './utils/apiError.js';
import { ApiResponse } from './utils/apiResponse.js';

/**
 * Initialize Express Application
 */
const app = express();

// ============================================
// Core Security & Request Parsing Middlewares
// ============================================

// Set secure HTTP headers
app.use(helmet());

// Enable CORS with support for credentials & cookies
app.use(
  cors({
    origin: ENV.CORS_ORIGIN === '*' ? true : [ENV.CORS_ORIGIN, 'http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Parse Cookie header and populate req.cookies
app.use(cookieParser());

// ============================================
// Base & Health Check Routes
// ============================================

// API Root Status & Discovery
app.get('/', (req, res) => {
  return ApiResponse.ok(
    res,
    {
      name: 'Hospital Management System (HMS) REST API',
      version: '1.0.0',
      status: 'operational',
      environment: ENV.NODE_ENV,
      endpoints: {
        health: '/health',
        auth: '/api/v1/auth',
        doctors: '/api/v1/doctors',
        appointments: '/api/v1/appointments',
        patients: '/api/v1/patients',
        reports: '/api/v1/reports',
        prescriptions: '/api/v1/prescriptions',
        admin: '/api/v1/admin/dashboard',
        billing: '/api/v1/billing/invoices',
        receptionist: '/api/v1/receptionist/dashboard'
      }
    },
    'Welcome to the Hospital Management System API'
  );
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  return ApiResponse.ok(
    res,
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: ENV.NODE_ENV,
      port: ENV.PORT
    },
    'Hospital Management System API is healthy and operational'
  );
});

// ============================================
// Application Modules & API Routes
// ============================================

// Register Authentication Module Routes (supports both /api/v1/auth and /api/auth)
app.use('/api/v1/auth', authRoutes);
app.use('/api/auth', authRoutes);

// Register Doctor Module Routes (supports both /api/v1/doctors and /api/doctors)
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/doctors', doctorRoutes);

// Register Appointment Module Routes (supports both /api/v1/appointments and /api/appointments)
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/appointments', appointmentRoutes);

// Register Patient Module Routes (supports both /api/v1/patients and /api/patients)
app.use('/api/v1/patients', patientRoutes);
app.use('/api/patients', patientRoutes);

// Register Medical Reports Module Routes (supports both /api/v1/reports and /api/reports)
app.use('/api/v1/reports', reportRoutes);
app.use('/api/reports', reportRoutes);

// Register Prescription Module Routes (supports both /api/v1/prescriptions and /api/prescriptions)
app.use('/api/v1/prescriptions', prescriptionRoutes);
app.use('/api/prescriptions', prescriptionRoutes);

// Register Admin Dashboard Module Routes (supports both /api/v1/admin and /api/admin)
app.use('/api/v1/admin', adminRoutes);
app.use('/api/admin', adminRoutes);

// Register Billing & Payments Module Routes (supports both /api/v1/billing and /api/billing)
app.use('/api/v1/billing', billingRoutes);
app.use('/api/billing', billingRoutes);

// Register Receptionist Dashboard Module Routes (supports both /api/v1/receptionist and /api/receptionist)
app.use('/api/v1/receptionist', receptionistRoutes);
app.use('/api/receptionist', receptionistRoutes);

// Register Notification Module Routes (supports both /api/v1/notifications and /api/notifications)
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/notifications', notificationRoutes);

// ============================================
// 404 Catch-All & Global Error Handling
// ============================================

// Handle undefined routes
app.use('*', (req, res, next) => {
  next(ApiError.notFound(`Cannot ${req.method} ${req.originalUrl} - Route not found on this server.`));
});

// Global Centralized Error Handler (must be registered last)
app.use(errorHandler);

export { app };
export default app;
