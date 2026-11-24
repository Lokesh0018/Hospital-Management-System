import http from 'http';
import { app } from '../src/app.js';
import prisma from '../src/database/prisma.js';
import { ROLES } from '../src/constants/roles.js';

let server;
let baseUrl;

const runTests = async () => {
  console.log('🧪 Starting Receptionist Module Automated Integration Tests...\n');

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
  let doctorToken = '';
  let doctorId = '';
  let receptionistToken = '';
  let patientToken = '';
  let patientId = '';
  let newPatientProfileId = '';
  let appointmentId = '';
  let invoiceId = '';
  const cleanupUserIds = [];

  try {
    const timestamp = Date.now();

    // -------------------------------------------------------------------
    // Test 1: Setup Accounts (Admin, Doctor, Receptionist, Patient)
    // -------------------------------------------------------------------
    console.log('Test 1: Setup Admin, Doctor, Receptionist, and Patient accounts');

    // Admin
    const adminRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Chief Admin',
        email: `admin_rec_${timestamp}@hospital.test`,
        password: 'AdminPassword123',
        role: ROLES.ADMIN
      })
    });
    const adminData = await adminRes.json();
    adminToken = adminData.data.tokens.accessToken;
    cleanupUserIds.push(adminData.data.user.id);

    // Doctor (Created by Admin)
    const docRes = await fetch(`${baseUrl}/api/v1/doctors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Dr. John Watson',
        email: `watson_${timestamp}@hospital.test`,
        password: 'DoctorPassword123',
        specialization: 'General Physician',
        department: 'Primary Care'
      })
    });
    const docData = await docRes.json();
    doctorId = docData.data.id;
    const docUserId = docData.data.userId || docData.data.user?.id;
    if (docUserId) cleanupUserIds.push(docUserId);

    const docLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `watson_${timestamp}@hospital.test`,
        password: 'DoctorPassword123'
      })
    });
    const docLoginData = await docLogin.json();
    doctorToken = docLoginData.data.tokens.accessToken;

    // Receptionist
    const recRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Clara Frontdesk',
        email: `clara_${timestamp}@hospital.test`,
        password: 'ReceptionistPassword123',
        role: ROLES.RECEPTIONIST
      })
    });
    const recData = await recRes.json();
    receptionistToken = recData.data.tokens.accessToken;
    cleanupUserIds.push(recData.data.user.id);

    // Patient
    const patRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Martin Eden',
        email: `martin_${timestamp}@hospital.test`,
        password: 'PatientPassword123',
        role: ROLES.PATIENT
      })
    });
    const patData = await patRes.json();
    patientToken = patData.data.tokens.accessToken;
    patientId = patData.data.user.id;
    cleanupUserIds.push(patientId);

    console.log('  ✅ Admin, Doctor, Receptionist, and Patient initialized successfully');

    // -------------------------------------------------------------------
    // Test 2: RBAC Security on Receptionist Dashboard
    // -------------------------------------------------------------------
    console.log('\nTest 2: RBAC Security verification');

    // 2a. Unauthenticated -> 401
    const unauthRes = await fetch(`${baseUrl}/api/v1/receptionist/dashboard`);
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated dashboard access, got: ${unauthRes.status}`);
    }
    console.log('  ✅ Unauthenticated access correctly blocked (401 Unauthorized)');

    // 2b. Patient -> 403
    const patBlockRes = await fetch(`${baseUrl}/api/v1/receptionist/dashboard`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    if (patBlockRes.status !== 403) {
      throw new Error(`Expected 403 for Patient access, got: ${patBlockRes.status}`);
    }
    console.log('  ✅ Patient access correctly blocked (403 Forbidden)');

    // 2c. Doctor -> 403
    const docBlockRes = await fetch(`${baseUrl}/api/v1/receptionist/dashboard`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    if (docBlockRes.status !== 403) {
      throw new Error(`Expected 403 for Doctor access, got: ${docBlockRes.status}`);
    }
    console.log('  ✅ Doctor access correctly blocked (403 Forbidden)');

    // 2d. Receptionist -> 200
    const recAllowRes = await fetch(`${baseUrl}/api/v1/receptionist/dashboard`, {
      headers: { Authorization: `Bearer ${receptionistToken}` }
    });
    if (recAllowRes.status !== 200) {
      throw new Error(`Expected 200 for Receptionist access, got: ${recAllowRes.status}`);
    }
    console.log('  ✅ Receptionist authorized (200 OK)');

    // 2e. Admin -> 200
    const adminAllowRes = await fetch(`${baseUrl}/api/v1/receptionist/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (adminAllowRes.status !== 200) {
      throw new Error(`Expected 200 for Admin access, got: ${adminAllowRes.status}`);
    }
    console.log('  ✅ Admin authorized on Receptionist route (200 OK)');

    // -------------------------------------------------------------------
    // Test 3: Dashboard Overview Payload Verification
    // -------------------------------------------------------------------
    console.log('\nTest 3: Verify Dashboard Overview Payload Structure');
    const dashRes = await fetch(`${baseUrl}/api/v1/receptionist/dashboard`, {
      headers: { Authorization: `Bearer ${receptionistToken}` }
    });
    const dashJson = await dashRes.json();
    const overview = dashJson.data;

    if (!overview.statistics || !overview.todayAppointments || !overview.recentPatients || !overview.pendingBills) {
      throw new Error(`Invalid dashboard structure: ${JSON.stringify(overview)}`);
    }
    console.log(`  ✅ Overview successfully returned metrics:`);
    console.log(`     Total Patients: ${overview.statistics.patients.total}`);
    console.log(`     Today's Appointments Total: ${overview.statistics.todayAppointments.total}`);
    console.log(`     Doctors on Duty: ${overview.statistics.doctors.availableOnDuty}`);

    // -------------------------------------------------------------------
    // Test 4: Receptionist Registers a New Patient
    // -------------------------------------------------------------------
    console.log('\nTest 4: Receptionist registers a new patient (POST /api/v1/patients)');
    const registerPatientRes = await fetch(`${baseUrl}/api/v1/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionistToken}`
      },
      body: JSON.stringify({
        name: 'Arthur Dent',
        email: `arthur_frontdesk_${timestamp}@hospital.test`,
        password: 'TempPassword123',
        phone: '+1-555-4242',
        gender: 'MALE',
        bloodGroup: 'A+',
        emergencyContact: 'Trillian (+1-555-9999)',
        address: '42 Country Road, Somerset'
      })
    });
    const regJson = await registerPatientRes.json();
    if (registerPatientRes.status !== 201 || !regJson.data?.id) {
      throw new Error(`Receptionist patient registration failed: ${JSON.stringify(regJson)}`);
    }
    newPatientProfileId = regJson.data.id;
    if (regJson.data.userId) cleanupUserIds.push(regJson.data.userId);
    console.log(`  ✅ New patient registered: ${regJson.data.name} (Blood: ${regJson.data.bloodGroup})`);

    // -------------------------------------------------------------------
    // Test 5: Receptionist Updates Patient Details
    // -------------------------------------------------------------------
    console.log('\nTest 5: Receptionist updates patient details (PUT /api/v1/patients/:id)');
    const updatePatRes = await fetch(`${baseUrl}/api/v1/patients/${newPatientProfileId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionistToken}`
      },
      body: JSON.stringify({
        phone: '+1-555-8888',
        bloodGroup: 'AB+',
        address: 'Updated 42 Galaxy Lane'
      })
    });
    const updatePatJson = await updatePatRes.json();
    const updatedBloodGroup = updatePatJson.data?.profile?.bloodGroup || updatePatJson.data?.bloodGroup;
    if (updatePatRes.status !== 200 || updatedBloodGroup !== 'AB+') {
      throw new Error(`Patient update failed: ${JSON.stringify(updatePatJson)}`);
    }
    console.log('  ✅ Patient details updated successfully (Blood group updated to AB+)');

    // -------------------------------------------------------------------
    // Test 6: Receptionist Checks Doctor Slot Availability
    // -------------------------------------------------------------------
    console.log('\nTest 6: Check doctor slot availability');
    const todayStr = new Date().toISOString().split('T')[0];
    const availRes = await fetch(
      `${baseUrl}/api/v1/appointments/doctor-availability/${doctorId}?date=${todayStr}`,
      { headers: { Authorization: `Bearer ${receptionistToken}` } }
    );
    const availJson = await availRes.json();
    if (availRes.status !== 200 || !availJson.data?.slots) {
      throw new Error(`Availability check failed: ${JSON.stringify(availJson)}`);
    }
    console.log(`  ✅ Doctor availability checked for ${todayStr}. Available slots:`, availJson.data.slots);

    // -------------------------------------------------------------------
    // Test 7: Receptionist Books Appointment for Patient
    // -------------------------------------------------------------------
    console.log('\nTest 7: Receptionist books appointment for patient');
    const bookRes = await fetch(`${baseUrl}/api/v1/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionistToken}`
      },
      body: JSON.stringify({
        patientId: newPatientProfileId,
        doctorId: doctorId,
        appointmentDate: todayStr,
        timeSlot: 'MORNING',
        reason: 'Routine front-desk physical examination'
      })
    });
    const bookJson = await bookRes.json();
    if (bookRes.status !== 201 || !bookJson.data?.id) {
      throw new Error(`Appointment booking failed: ${JSON.stringify(bookJson)}`);
    }
    appointmentId = bookJson.data.id;
    console.log(`  ✅ Appointment booked successfully: ID ${appointmentId} (Status: ${bookJson.data.status})`);

    // -------------------------------------------------------------------
    // Test 8: Receptionist Checks-In / Confirms Appointment
    // -------------------------------------------------------------------
    console.log('\nTest 8: Receptionist confirms appointment check-in (status -> CONFIRMED)');
    const checkinRes = await fetch(`${baseUrl}/api/v1/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionistToken}`
      },
      body: JSON.stringify({ status: 'CONFIRMED' })
    });
    const checkinJson = await checkinRes.json();
    if (checkinRes.status !== 200 || checkinJson.data?.status !== 'CONFIRMED') {
      throw new Error(`Check-in status update failed: ${JSON.stringify(checkinJson)}`);
    }
    console.log(`  ✅ Appointment marked as CONFIRMED (Patient checked in at front desk)`);

    // -------------------------------------------------------------------
    // Test 9: Receptionist Reschedules Appointment
    // -------------------------------------------------------------------
    console.log('\nTest 9: Receptionist reschedules appointment to AFTERNOON slot');
    const rescheduleRes = await fetch(`${baseUrl}/api/v1/appointments/${appointmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionistToken}`
      },
      body: JSON.stringify({
        appointmentDate: todayStr,
        timeSlot: 'AFTERNOON'
      })
    });
    const rescheduleJson = await rescheduleRes.json();
    if (rescheduleRes.status !== 200 || rescheduleJson.data?.timeSlot !== 'AFTERNOON') {
      throw new Error(`Reschedule failed: ${JSON.stringify(rescheduleJson)}`);
    }
    console.log(`  ✅ Appointment rescheduled to slot: ${rescheduleJson.data.timeSlot}`);

    // -------------------------------------------------------------------
    // Test 10: Receptionist Cancels Appointment
    // -------------------------------------------------------------------
    console.log('\nTest 10: Receptionist cancels appointment with note');
    const cancelApptRes = await fetch(`${baseUrl}/api/v1/appointments/${appointmentId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionistToken}`
      },
      body: JSON.stringify({
        cancellationReason: 'Patient had an emergency schedule conflict'
      })
    });
    const cancelApptJson = await cancelApptRes.json();
    if (cancelApptRes.status !== 200 || cancelApptJson.data?.status !== 'CANCELLED') {
      throw new Error(`Appointment cancellation failed: ${JSON.stringify(cancelApptJson)}`);
    }
    console.log(`  ✅ Appointment cancelled successfully: Status: ${cancelApptJson.data.status}`);

    // -------------------------------------------------------------------
    // Test 11: Receptionist Generates Invoice for Patient
    // -------------------------------------------------------------------
    console.log('\nTest 11: Receptionist issues invoice for patient');
    const invoiceRes = await fetch(`${baseUrl}/api/v1/billing/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionistToken}`
      },
      body: JSON.stringify({
        patientId: newPatientProfileId,
        doctorId: doctorId,
        notes: 'Walk-in registration fee and diagnostic screening',
        items: [
          {
            itemType: 'CONSULTATION',
            description: 'Primary Care Consultation',
            quantity: 1,
            unitPrice: 100.0
          },
          {
            itemType: 'LAB_TEST',
            description: 'Rapid Blood Glucose Screening',
            quantity: 1,
            unitPrice: 25.0
          }
        ]
      })
    });
    const invJson = await invoiceRes.json();
    if (invoiceRes.status !== 201 || !invJson.data?.id) {
      throw new Error(`Invoice generation failed: ${JSON.stringify(invJson)}`);
    }
    invoiceId = invJson.data.id;
    console.log(`  ✅ Invoice generated: #${invJson.data.invoiceNumber} (Total: $${invJson.data.totalAmount})`);

    // -------------------------------------------------------------------
    // Test 12: Receptionist Collects Payment at Front Desk
    // -------------------------------------------------------------------
    console.log('\nTest 12: Receptionist marks payment as collected (Cash)');
    const payRes = await fetch(`${baseUrl}/api/v1/billing/invoices/${invoiceId}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionistToken}`
      },
      body: JSON.stringify({
        amount: 125.0,
        paymentMethod: 'CASH',
        notes: 'Collected in full at reception counter'
      })
    });
    const payJson = await payRes.json();
    if (payRes.status !== 200 || payJson.data?.status !== 'PAID') {
      throw new Error(`Payment collection failed: ${JSON.stringify(payJson)}`);
    }
    console.log(`  ✅ Payment collected at front desk: Paid: $${payJson.data.paidAmount} | Status: ${payJson.data.status}`);

    // -------------------------------------------------------------------
    // Test 13: Receptionist Queries Daily Schedule
    // -------------------------------------------------------------------
    console.log('\nTest 13: Receptionist queries daily schedule timeline');
    const schedRes = await fetch(`${baseUrl}/api/v1/receptionist/schedule?date=${todayStr}`, {
      headers: { Authorization: `Bearer ${receptionistToken}` }
    });
    const schedJson = await schedRes.json();
    if (schedRes.status !== 200 || !schedJson.data?.scheduleBySlot) {
      throw new Error(`Schedule timeline query failed: ${JSON.stringify(schedJson)}`);
    }
    console.log(`  ✅ Schedule timeline successfully retrieved for ${schedJson.data.date}:`);
    console.log(`     Morning Slots: ${schedJson.data.scheduleBySlot.MORNING.length}`);
    console.log(`     Afternoon Slots: ${schedJson.data.scheduleBySlot.AFTERNOON.length}`);
    console.log(`     Evening Slots: ${schedJson.data.scheduleBySlot.EVENING.length}`);

    console.log('\n======================================================');
    console.log('🎉 ALL 13 RECEPTIONIST TEST SUITES PASSED SUCCESSFULLY!');
    console.log('======================================================\n');
  } finally {
    // Teardown test accounts
    if (cleanupUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: cleanupUserIds } }
      });
      console.log('[Test Teardown] Cleaned up temporary test accounts.');
    }
    server.close();
    console.log('[Test Teardown] Test server closed cleanly.');
  }
};

runTests().catch((err) => {
  console.error('\n❌ RECEPTIONIST TEST FAILED:', err);
  if (server) server.close();
  process.exit(1);
});
