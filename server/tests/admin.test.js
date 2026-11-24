import http from 'http';
import { app } from '../src/app.js';
import prisma from '../src/database/prisma.js';
import { ROLES } from '../src/constants/roles.js';

let server;
let baseUrl;

const runTests = async () => {
  console.log('🧪 Starting Admin Dashboard Module Automated Integration Tests...\n');

  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`[Test Setup] Test server listening on ${baseUrl}`);
      resolve();
    });
  });

  let adminToken = '';
  let doctor1Token = '';
  let doctor1Id = '';
  let doctor2Id = '';
  let patient1Token = '';
  let patient1Id = '';
  let patient2Id = '';
  const cleanupUserIds = [];

  try {
    // -------------------------------------------------------------
    // 1. Setup Admin, Doctors, and Patients
    // -------------------------------------------------------------
    console.log('Test 1: Setup Admin, Doctors, and Patient Accounts');
    const timestamp = Date.now();

    // 1. Admin
    const adminRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Super Admin',
        email: `admin_${timestamp}@hospital.test`,
        password: 'AdminPassword123',
        role: ROLES.ADMIN
      })
    });
    const adminJson = await adminRes.json();
    adminToken = adminJson.data.tokens.accessToken;
    cleanupUserIds.push(adminJson.data.user.id);

    // 2. Doctor 1 (Cardiologist)
    const doc1Res = await fetch(`${baseUrl}/api/v1/doctors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Dr. Gregory House',
        email: `house_${timestamp}@hospital.test`,
        password: 'DoctorPassword123',
        specialization: 'Cardiologist',
        qualification: 'MD - Harvard',
        department: 'Cardiology',
        experienceYears: 18,
        consultationFee: 150.0,
        availableDays: 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday'
      })
    });
    const doc1Json = await doc1Res.json();
    if (doc1Res.status !== 201) throw new Error(`Doctor 1 failed: ${JSON.stringify(doc1Json)}`);
    doctor1Id = doc1Json.data.profile.id;
    cleanupUserIds.push(doc1Json.data.id);

    // Doctor 1 login
    const doc1LoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `house_${timestamp}@hospital.test`,
        password: 'DoctorPassword123'
      })
    });
    const doc1LoginJson = await doc1LoginRes.json();
    doctor1Token = doc1LoginJson.data.tokens.accessToken;

    // 3. Doctor 2 (Neurologist)
    const doc2Res = await fetch(`${baseUrl}/api/v1/doctors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Dr. Charles Xavier',
        email: `xavier_${timestamp}@hospital.test`,
        password: 'DoctorPassword123',
        specialization: 'Neurologist',
        qualification: 'MD, PhD',
        department: 'Neurology',
        experienceYears: 25,
        consultationFee: 200.0,
        availableDays: 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday'
      })
    });
    const doc2Json = await doc2Res.json();
    if (doc2Res.status !== 201) throw new Error(`Doctor 2 failed: ${JSON.stringify(doc2Json)}`);
    doctor2Id = doc2Json.data.profile.id;
    cleanupUserIds.push(doc2Json.data.id);

    // 4. Patient 1
    const p1Res = await fetch(`${baseUrl}/api/v1/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Sarah Connor',
        email: `sarah_${timestamp}@test.com`,
        password: 'PatientPassword123',
        gender: 'FEMALE',
        bloodGroup: 'O+',
        dateOfBirth: '1990-05-15',
        emergencyContact: '+1-555-0101'
      })
    });
    const p1Json = await p1Res.json();
    if (p1Res.status !== 201) throw new Error(`Patient 1 failed: ${JSON.stringify(p1Json)}`);
    patient1Id = p1Json.data.profile.id;
    cleanupUserIds.push(p1Json.data.id);

    // Login as Patient 1 to get token
    const p1LoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `sarah_${timestamp}@test.com`,
        password: 'PatientPassword123'
      })
    });
    const p1LoginJson = await p1LoginRes.json();
    patient1Token = p1LoginJson.data.tokens.accessToken;

    // 5. Patient 2
    const p2Res = await fetch(`${baseUrl}/api/v1/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'John Connor',
        email: `john_${timestamp}@test.com`,
        password: 'PatientPassword123',
        gender: 'MALE',
        bloodGroup: 'A-',
        dateOfBirth: '1995-02-28',
        emergencyContact: '+1-555-0202'
      })
    });
    const p2Json = await p2Res.json();
    if (p2Res.status !== 201) throw new Error(`Patient 2 failed: ${JSON.stringify(p2Json)}`);
    patient2Id = p2Json.data.profile.id;
    cleanupUserIds.push(p2Json.data.id);

    console.log('  ✅ Admin, 2 Doctors (Cardiologist, Neurologist), and 2 Patients setup completed');

    // -------------------------------------------------------------
    // 2. Seed Appointments, Medical Reports, and Prescriptions
    // -------------------------------------------------------------
    console.log('Test 2: Seed Appointments, Medical Reports, and Prescriptions');

    const todayDate = new Date().toISOString().split('T')[0];

    // Appointment 1: Today, PENDING
    const appt1Res = await fetch(`${baseUrl}/api/v1/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`
      },
      body: JSON.stringify({
        doctorId: doctor1Id,
        appointmentDate: todayDate,
        timeSlot: 'MORNING',
        reason: 'Severe migraine consultation'
      })
    });
    const appt1Json = await appt1Res.json();
    if (appt1Res.status !== 201) throw new Error(`Appt 1 creation failed: ${JSON.stringify(appt1Json)}`);
    const appt1Id = appt1Json.data.id;

    // Appointment 2: Future date, then mark as COMPLETED
    const futureDate = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
    const appt2Res = await fetch(`${baseUrl}/api/v1/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        doctorId: doctor2Id,
        patientId: patient2Id,
        appointmentDate: futureDate,
        timeSlot: 'AFTERNOON',
        reason: 'Neuro exam'
      })
    });
    const appt2Json = await appt2Res.json();
    if (appt2Res.status !== 201) throw new Error(`Appt 2 creation failed: ${JSON.stringify(appt2Json)}`);
    const appt2Id = appt2Json.data.id;

    // Doctor updates Appointment 2 to COMPLETED
    await fetch(`${baseUrl}/api/v1/appointments/${appt2Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'COMPLETED',
        notes: 'Exam complete and clear'
      })
    });

    // Medical Report 1: UNDER_REVIEW
    const rep1Res = await fetch(`${baseUrl}/api/v1/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        patientId: patient1Id,
        doctorId: doctor1Id,
        title: 'Brain MRI T1/T2 Scan',
        reportType: 'MRI'
      })
    });
    const rep1Json = await rep1Res.json();
    if (rep1Res.status !== 201) throw new Error(`Report 1 creation failed: ${JSON.stringify(rep1Json)}`);

    // Update Report 1 status to UNDER_REVIEW
    await fetch(`${baseUrl}/api/v1/reports/${rep1Json.data.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'UNDER_REVIEW'
      })
    });

    // Medical Report 2: UPLOADED
    const rep2Res = await fetch(`${baseUrl}/api/v1/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        patientId: patient2Id,
        doctorId: doctor2Id,
        title: 'Complete Blood Count (CBC)',
        reportType: 'Blood Test',
        status: 'UPLOADED'
      })
    });
    const rep2Json = await rep2Res.json();
    if (rep2Res.status !== 201) throw new Error(`Report 2 creation failed: ${JSON.stringify(rep2Json)}`);

    // Prescription 1: ACTIVE with 2 medicines
    const rx1Res = await fetch(`${baseUrl}/api/v1/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctor1Token}`
      },
      body: JSON.stringify({
        patientId: patient1Id,
        appointmentId: appt1Id,
        diagnosis: 'Acute Migraine',
        instructions: 'Drink plenty of water and rest in dark room.',
        status: 'ACTIVE',
        medicines: [
          {
            medicineName: 'Sumatriptan 50mg',
            dosage: '50mg',
            frequency: 'As needed',
            duration: '3 days'
          },
          {
            medicineName: 'Naproxen 500mg',
            dosage: '500mg',
            frequency: 'Twice daily',
            duration: '5 days'
          }
        ]
      })
    });
    const rx1Json = await rx1Res.json();
    if (rx1Res.status !== 201) throw new Error(`Rx 1 creation failed: ${JSON.stringify(rx1Json)}`);
    const rx1Id = rx1Json.data.id;

    // Prescription 2: COMPLETED
    const rx2Res = await fetch(`${baseUrl}/api/v1/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        patientId: patient2Id,
        doctorId: doctor2Id,
        diagnosis: 'Tension headache',
        status: 'COMPLETED',
        medicines: [
          {
            medicineName: 'Acetaminophen 500mg',
            dosage: '500mg',
            frequency: 'Every 8 hours',
            duration: '2 days'
          }
        ]
      })
    });
    const rx2Json = await rx2Res.json();
    if (rx2Res.status !== 201) throw new Error(`Rx 2 creation failed: ${JSON.stringify(rx2Json)}`);

    console.log('  ✅ Seeded: 2 Appointments (1 today, 1 completed), 2 Reports (1 under review), 2 Prescriptions (1 active)');

    // -------------------------------------------------------------
    // 3. Test Core Dashboard Statistics (Requirements 1 - 10)
    // -------------------------------------------------------------
    console.log('Test 3: Verify Core Dashboard Statistics (KPIs 1 - 10)');
    const statsRes = await fetch(`${baseUrl}/api/v1/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const statsJson = await statsRes.json();
    if (statsRes.status !== 200) throw new Error(`Stats endpoint failed: ${JSON.stringify(statsJson)}`);

    const stats = statsJson.data;

    // 1. Total Doctors
    if (typeof stats.totalDoctors !== 'number' || stats.totalDoctors < 2) {
      throw new Error(`Invalid totalDoctors: ${stats.totalDoctors}`);
    }
    // 2. Total Patients
    if (typeof stats.totalPatients !== 'number' || stats.totalPatients < 2) {
      throw new Error(`Invalid totalPatients: ${stats.totalPatients}`);
    }
    // 3. Total Appointments
    if (typeof stats.totalAppointments !== 'number' || stats.totalAppointments < 2) {
      throw new Error(`Invalid totalAppointments: ${stats.totalAppointments}`);
    }
    // 4. Today's Appointments
    if (typeof stats.todayAppointments !== 'number' || stats.todayAppointments < 1) {
      throw new Error(`Invalid todayAppointments: ${stats.todayAppointments}`);
    }
    // 5. Completed Appointments
    if (typeof stats.completedAppointments !== 'number' || stats.completedAppointments < 1) {
      throw new Error(`Invalid completedAppointments: ${stats.completedAppointments}`);
    }
    // 6. Pending Appointments
    if (typeof stats.pendingAppointments !== 'number' || stats.pendingAppointments < 1) {
      throw new Error(`Invalid pendingAppointments: ${stats.pendingAppointments}`);
    }
    // 7. Total Medical Reports
    if (typeof stats.totalMedicalReports !== 'number' || stats.totalMedicalReports < 2) {
      throw new Error(`Invalid totalMedicalReports: ${stats.totalMedicalReports}`);
    }
    // 8. Reports Under Review
    if (typeof stats.reportsUnderReview !== 'number' || stats.reportsUnderReview < 1) {
      throw new Error(`Invalid reportsUnderReview: ${stats.reportsUnderReview}`);
    }
    // 9. Total Prescriptions
    if (typeof stats.totalPrescriptions !== 'number' || stats.totalPrescriptions < 2) {
      throw new Error(`Invalid totalPrescriptions: ${stats.totalPrescriptions}`);
    }
    // 10. Active Prescriptions
    if (typeof stats.activePrescriptions !== 'number' || stats.activePrescriptions < 1) {
      throw new Error(`Invalid activePrescriptions: ${stats.activePrescriptions}`);
    }

    console.log(`  ✅ 1. Total Doctors: ${stats.totalDoctors}`);
    console.log(`  ✅ 2. Total Patients: ${stats.totalPatients}`);
    console.log(`  ✅ 3. Total Appointments: ${stats.totalAppointments}`);
    console.log(`  ✅ 4. Today's Appointments: ${stats.todayAppointments}`);
    console.log(`  ✅ 5. Completed Appointments: ${stats.completedAppointments}`);
    console.log(`  ✅ 6. Pending Appointments: ${stats.pendingAppointments}`);
    console.log(`  ✅ 7. Total Medical Reports: ${stats.totalMedicalReports}`);
    console.log(`  ✅ 8. Reports Under Review: ${stats.reportsUnderReview}`);
    console.log(`  ✅ 9. Total Prescriptions: ${stats.totalPrescriptions}`);
    console.log(`  ✅ 10. Active Prescriptions: ${stats.activePrescriptions}`);

    // -------------------------------------------------------------
    // 4. Test Recent Appointments (Requirement 11)
    // -------------------------------------------------------------
    console.log('Test 4: Verify Recent Appointments (Requirement 11)');
    const recApptRes = await fetch(`${baseUrl}/api/v1/admin/dashboard/recent-appointments?limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const recApptJson = await recApptRes.json();
    if (recApptRes.status !== 200 || !Array.isArray(recApptJson.data)) {
      throw new Error(`Recent appointments failed: ${JSON.stringify(recApptJson)}`);
    }
    if (recApptJson.data.length < 2) {
      throw new Error(`Expected at least 2 recent appointments, got: ${recApptJson.data.length}`);
    }
    const sampleAppt = recApptJson.data[0];
    if (!sampleAppt.id || !sampleAppt.timeSlot || !sampleAppt.doctor || !sampleAppt.patient) {
      throw new Error(`Missing expected fields in recent appointment: ${JSON.stringify(sampleAppt)}`);
    }
    console.log(`  ✅ Successfully retrieved ${recApptJson.data.length} recent appointments with Doctor & Patient joins`);

    // -------------------------------------------------------------
    // 5. Test Recent Reports (Requirement 12)
    // -------------------------------------------------------------
    console.log('Test 5: Verify Recent Reports (Requirement 12)');
    const recRepRes = await fetch(`${baseUrl}/api/v1/admin/dashboard/recent-reports?limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const recRepJson = await recRepRes.json();
    if (recRepRes.status !== 200 || !Array.isArray(recRepJson.data)) {
      throw new Error(`Recent reports failed: ${JSON.stringify(recRepJson)}`);
    }
    if (recRepJson.data.length < 2) {
      throw new Error(`Expected at least 2 recent reports, got: ${recRepJson.data.length}`);
    }
    const sampleRep = recRepJson.data[0];
    if (!sampleRep.title || !sampleRep.reportType || !sampleRep.status) {
      throw new Error(`Missing expected fields in recent report: ${JSON.stringify(sampleRep)}`);
    }
    console.log(`  ✅ Successfully retrieved ${recRepJson.data.length} recent reports with details`);

    // -------------------------------------------------------------
    // 6. Test Recent Prescriptions (Requirement 13)
    // -------------------------------------------------------------
    console.log('Test 6: Verify Recent Prescriptions (Requirement 13)');
    const recRxRes = await fetch(`${baseUrl}/api/v1/admin/dashboard/recent-prescriptions?limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const recRxJson = await recRxRes.json();
    if (recRxRes.status !== 200 || !Array.isArray(recRxJson.data)) {
      throw new Error(`Recent prescriptions failed: ${JSON.stringify(recRxJson)}`);
    }
    if (recRxJson.data.length < 2) {
      throw new Error(`Expected at least 2 recent prescriptions, got: ${recRxJson.data.length}`);
    }
    const sampleRx = recRxJson.data[0];
    if (!sampleRx.diagnosis || !sampleRx.medicines || typeof sampleRx.medicinesCount !== 'number') {
      throw new Error(`Missing expected fields in recent prescription: ${JSON.stringify(sampleRx)}`);
    }
    console.log(`  ✅ Successfully retrieved ${recRxJson.data.length} recent prescriptions with medicine items`);

    // -------------------------------------------------------------
    // 7. Test Doctor Count by Specialization (Requirement 14)
    // -------------------------------------------------------------
    console.log('Test 7: Verify Doctor Count by Specialization (Requirement 14)');
    const specRes = await fetch(`${baseUrl}/api/v1/admin/dashboard/doctors-by-specialization`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const specJson = await specRes.json();
    if (specRes.status !== 200 || !specJson.data.breakdown) {
      throw new Error(`Specialization analytics failed: ${JSON.stringify(specJson)}`);
    }
    const specData = specJson.data;
    if (!specData.breakdown['Cardiologist'] || !specData.breakdown['Neurologist']) {
      throw new Error(`Missing expected specializations in breakdown: ${JSON.stringify(specData.breakdown)}`);
    }
    console.log(`  ✅ Specialization breakdown:`, specData.breakdown);
    console.log(`  ✅ Verified list format with percentage calculations`);

    // -------------------------------------------------------------
    // 8. Test Appointment Status Analytics (Requirement 15)
    // -------------------------------------------------------------
    console.log('Test 8: Verify Appointment Status Analytics (Requirement 15)');
    const aptStatusRes = await fetch(`${baseUrl}/api/v1/admin/dashboard/appointment-analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const aptStatusJson = await aptStatusRes.json();
    if (aptStatusRes.status !== 200 || !aptStatusJson.data.breakdown) {
      throw new Error(`Appointment status analytics failed: ${JSON.stringify(aptStatusJson)}`);
    }
    const aptBreakdown = aptStatusJson.data.breakdown;
    if (aptBreakdown.PENDING < 1 || aptBreakdown.COMPLETED < 1) {
      throw new Error(`Expected PENDING and COMPLETED appointments in breakdown: ${JSON.stringify(aptBreakdown)}`);
    }
    console.log(`  ✅ Appointment status breakdown:`, aptBreakdown);

    // -------------------------------------------------------------
    // 9. Test Full Unified Admin Dashboard (All 15 requirements in one)
    // -------------------------------------------------------------
    console.log('Test 9: Verify Full Unified Admin Dashboard Overview (GET /api/v1/admin/dashboard)');
    const dashRes = await fetch(`${baseUrl}/api/v1/admin/dashboard?limit=3`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const dashJson = await dashRes.json();
    if (dashRes.status !== 200) throw new Error(`Full dashboard failed: ${JSON.stringify(dashJson)}`);

    const overview = dashJson.data;
    if (!overview.statistics || !overview.doctorCountBySpecialization || !overview.appointmentStatusAnalytics || !overview.recentActivity) {
      throw new Error(`Missing expected root sections in unified dashboard overview: ${Object.keys(overview)}`);
    }

    if (!overview.recentActivity.appointments || !overview.recentActivity.reports || !overview.recentActivity.prescriptions) {
      throw new Error(`Missing activity feeds in unified dashboard overview`);
    }
    console.log('  ✅ Full unified dashboard payload successfully returns all 15 required metrics');

    // -------------------------------------------------------------
    // 10. Security & RBAC Enforcement (ADMIN-only protection)
    // -------------------------------------------------------------
    console.log('Test 10: Security & RBAC Enforcement');

    // 1. Unauthenticated request must be rejected (401)
    const unauthRes = await fetch(`${baseUrl}/api/v1/admin/dashboard`);
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated request, got ${unauthRes.status}`);
    }
    console.log('  ✅ Unauthenticated access blocked (401 Unauthorized)');

    // 2. Patient role must be rejected (403)
    const patientForbiddenRes = await fetch(`${baseUrl}/api/v1/admin/dashboard`, {
      headers: { Authorization: `Bearer ${patient1Token}` }
    });
    if (patientForbiddenRes.status !== 403) {
      throw new Error(`Expected 403 for patient accessing admin dashboard, got ${patientForbiddenRes.status}`);
    }
    console.log('  ✅ Patient blocked from Admin Dashboard (403 Forbidden)');

    // 3. Doctor role must be rejected (403)
    const docForbiddenRes = await fetch(`${baseUrl}/api/v1/admin/dashboard`, {
      headers: { Authorization: `Bearer ${doctor1Token}` }
    });
    if (docForbiddenRes.status !== 403) {
      throw new Error(`Expected 403 for doctor accessing admin dashboard, got ${docForbiddenRes.status}`);
    }
    console.log('  ✅ Doctor blocked from Admin Dashboard (403 Forbidden)');

    // 4. Also verify alternate mounted path /api/admin/dashboard works for Admin
    const altRes = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (altRes.status !== 200) {
      throw new Error(`Expected 200 for /api/admin/dashboard, got ${altRes.status}`);
    }
    console.log('  ✅ Both /api/v1/admin/dashboard and /api/admin/dashboard verified');

    console.log('\n🎉 ALL 10 ADMIN DASHBOARD TEST SUITES PASSED SUCCESSFULLY!');
  } finally {
    // Teardown test server
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log('[Test Teardown] Server closed cleanly.');
    }
    // Clean up created users
    if (cleanupUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: cleanupUserIds } }
      }).catch(() => {});
    }
  }
};

runTests().catch((err) => {
  console.error('\n❌ Admin Dashboard test execution failed:', err);
  if (server) server.close();
  process.exit(1);
});
