import http from 'http';
import { app } from '../src/app.js';
import prisma from '../src/database/prisma.js';
import { ROLES } from '../src/constants/roles.js';

let server;
let baseUrl;

// Helper to find a future date matching specific days of week
function getFutureDateForDays(allowedDays = ['Monday', 'Wednesday', 'Friday']) {
  const dayMap = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6
  };

  const targetDayNums = allowedDays.map((d) => dayMap[d]);
  const date = new Date();
  date.setDate(date.getDate() + 1); // Start from tomorrow

  for (let i = 0; i < 14; i++) {
    if (targetDayNums.includes(date.getDay())) {
      return date.toISOString().split('T')[0];
    }
    date.setDate(date.getDate() + 1);
  }
  return date.toISOString().split('T')[0];
}

// Helper to find a future date that is NOT in allowed days
function getFutureDateExcludingDays(disallowedDays = ['Monday', 'Wednesday', 'Friday']) {
  const dayMap = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6
  };

  const disallowedNums = disallowedDays.map((d) => dayMap[d]);
  const date = new Date();
  date.setDate(date.getDate() + 1);

  for (let i = 0; i < 14; i++) {
    if (!disallowedNums.includes(date.getDay())) {
      return date.toISOString().split('T')[0];
    }
    date.setDate(date.getDate() + 1);
  }
  return date.toISOString().split('T')[0];
}

const runTests = async () => {
  console.log('🧪 Starting Appointment Module Automated Integration Tests...\n');

  // Start temporary server
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
  let patient1Token = '';
  let patient2Token = '';
  let appointment1Id = '';
  let appointment2Id = '';

  const cleanupUserIds = [];

  try {
    // 1. Metadata check
    console.log('Test 1: GET /api/v1/appointments/metadata');
    const metaRes = await fetch(`${baseUrl}/api/v1/appointments/metadata`);
    const metaJson = await metaRes.json();
    if (metaRes.status !== 200) {
      throw new Error(`Metadata fetch failed: ${JSON.stringify(metaJson)}`);
    }

    const expectedStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    const expectedSlots = ['MORNING', 'AFTERNOON', 'EVENING'];

    for (const st of expectedStatuses) {
      if (!metaJson.data.statuses.includes(st)) {
        throw new Error(`Missing expected status: ${st}`);
      }
    }
    for (const sl of expectedSlots) {
      if (!metaJson.data.timeSlots.includes(sl)) {
        throw new Error(`Missing expected time slot: ${sl}`);
      }
    }
    console.log(`  ✅ Returned all 4 statuses: ${metaJson.data.statuses.join(', ')}`);
    console.log(`  ✅ Returned all 3 time slots: ${metaJson.data.timeSlots.join(', ')}`);

    // 2. Setup Test Accounts: Admin, Doctor, and 2 Patients
    console.log('Test 2: Setup Admin, Doctor, and Patient accounts');
    const timestamp = Date.now();

    // Admin
    const adminRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'System Admin',
        email: `admin_${timestamp}@hospital.test`,
        password: 'AdminPassword123',
        role: ROLES.ADMIN
      })
    });
    const adminJson = await adminRes.json();
    adminToken = adminJson.data.tokens.accessToken;
    cleanupUserIds.push(adminJson.data.user.id);

    // Doctor (Dr. Gregory House, Neurologist, working Mon,Wed,Fri)
    const docRes = await fetch(`${baseUrl}/api/v1/doctors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Dr. Gregory House',
        email: `dr.house_${timestamp}@hospital.test`,
        password: 'DoctorPassword123',
        specialization: 'Neurologist',
        department: 'Neurology',
        availableDays: 'Monday,Wednesday,Friday',
        availabilityStatus: 'AVAILABLE',
        consultationFee: 250.0
      })
    });
    const docJson = await docRes.json();
    doctorId = docJson.data.id;
    cleanupUserIds.push(doctorId);

    // Doctor login for auth token
    const docLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `dr.house_${timestamp}@hospital.test`,
        password: 'DoctorPassword123'
      })
    });
    const docLoginJson = await docLoginRes.json();
    doctorToken = docLoginJson.data.tokens.accessToken;

    // Patient 1
    const p1Res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice Walker',
        email: `alice_${timestamp}@hospital.test`,
        password: 'PatientPassword123',
        role: ROLES.PATIENT
      })
    });
    const p1Json = await p1Res.json();
    patient1Token = p1Json.data.tokens.accessToken;
    cleanupUserIds.push(p1Json.data.user.id);

    // Patient 2
    const p2Res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob Builder',
        email: `bob_${timestamp}@hospital.test`,
        password: 'PatientPassword123',
        role: ROLES.PATIENT
      })
    });
    const p2Json = await p2Res.json();
    patient2Token = p2Json.data.tokens.accessToken;
    cleanupUserIds.push(p2Json.data.user.id);

    console.log('  ✅ Admin, Doctor, and 2 Patients created successfully');

    // Determine target dates
    const validFutureDate = getFutureDateForDays(['Monday', 'Wednesday', 'Friday']);
    const invalidWorkingDate = getFutureDateExcludingDays(['Monday', 'Wednesday', 'Friday']);
    console.log(`  📅 Valid booking date (Mon/Wed/Fri): ${validFutureDate}`);
    console.log(`  📅 Invalid booking date (Off day): ${invalidWorkingDate}`);

    // 3. Check doctor slot availability
    console.log('Test 3: GET /api/v1/appointments/doctor-availability/:doctorId');
    const availRes = await fetch(
      `${baseUrl}/api/v1/appointments/doctor-availability/${doctorId}?date=${validFutureDate}`
    );
    const availJson = await availRes.json();
    if (availRes.status !== 200 || !availJson.data.isDayAvailable) {
      throw new Error(`Doctor availability check failed: ${JSON.stringify(availJson)}`);
    }
    const allSlotsOpen = availJson.data.slots.every((s) => s.isAvailable === true);
    if (!allSlotsOpen) {
      throw new Error(`Expected all slots open initially: ${JSON.stringify(availJson.data.slots)}`);
    }
    console.log(`  ✅ Doctor slot availability confirmed: all 3 slots (Morning, Afternoon, Evening) are OPEN`);

    // 4. Patient 1 Books MORNING slot
    console.log('Test 4: Patient 1 books MORNING slot');
    const bookRes1 = await fetch(`${baseUrl}/api/v1/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`
      },
      body: JSON.stringify({
        doctorId,
        appointmentDate: validFutureDate,
        timeSlot: 'Morning',
        reason: 'Severe chronic headaches and migraines'
      })
    });
    const bookJson1 = await bookRes1.json();
    if (bookRes1.status !== 201) {
      throw new Error(`Book appointment failed: ${JSON.stringify(bookJson1)}`);
    }
    appointment1Id = bookJson1.data.id;
    if (bookJson1.data.status !== 'PENDING' || bookJson1.data.timeSlot !== 'MORNING') {
      throw new Error(`Appointment attributes mismatch: ${JSON.stringify(bookJson1.data)}`);
    }
    console.log(`  ✅ Appointment 1 booked: ID ${appointment1Id}, Status: ${bookJson1.data.status}, Slot: ${bookJson1.data.timeSlot}`);

    // 5. Prevent Double Booking
    console.log('Test 5: Prevent double booking of same doctor and same slot');
    const doubleBookRes = await fetch(`${baseUrl}/api/v1/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient2Token}`
      },
      body: JSON.stringify({
        doctorId,
        appointmentDate: validFutureDate,
        timeSlot: 'MORNING', // Already booked by Patient 1
        reason: 'Neck pain consultation'
      })
    });
    const doubleBookJson = await doubleBookRes.json();
    if (doubleBookRes.status !== 409) {
      throw new Error(`Expected 409 Conflict for double booking, got ${doubleBookRes.status}: ${JSON.stringify(doubleBookJson)}`);
    }
    console.log(`  ✅ Double booking prevented: 409 Conflict - ${doubleBookJson.message}`);

    // 6. Patient 2 books a DIFFERENT available slot (AFTERNOON)
    console.log('Test 6: Patient 2 books available AFTERNOON slot');
    const bookRes2 = await fetch(`${baseUrl}/api/v1/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient2Token}`
      },
      body: JSON.stringify({
        doctorId,
        appointmentDate: validFutureDate,
        timeSlot: 'Afternoon',
        reason: 'Routine nerve checkup'
      })
    });
    const bookJson2 = await bookRes2.json();
    if (bookRes2.status !== 201) {
      throw new Error(`Book appointment 2 failed: ${JSON.stringify(bookJson2)}`);
    }
    appointment2Id = bookJson2.data.id;
    console.log(`  ✅ Appointment 2 booked: ID ${appointment2Id}, Slot: ${bookJson2.data.timeSlot}`);

    // 7. Reject booking when doctor is ON_LEAVE
    console.log('Test 7: Doctor availability check (ON_LEAVE)');
    // Set doctor status to ON_LEAVE
    await fetch(`${baseUrl}/api/v1/doctors/${doctorId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ availabilityStatus: 'ON_LEAVE' })
    });

    const leaveBookRes = await fetch(`${baseUrl}/api/v1/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`
      },
      body: JSON.stringify({
        doctorId,
        appointmentDate: validFutureDate,
        timeSlot: 'EVENING',
        reason: 'Should fail'
      })
    });
    const leaveBookJson = await leaveBookRes.json();
    if (leaveBookRes.status !== 400) {
      throw new Error(`Expected 400 when doctor ON_LEAVE, got ${leaveBookRes.status}`);
    }
    console.log(`  ✅ Booking rejected when doctor is ON_LEAVE (400 Bad Request)`);

    // Restore doctor status to AVAILABLE
    await fetch(`${baseUrl}/api/v1/doctors/${doctorId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ availabilityStatus: 'AVAILABLE' })
    });
    console.log(`  ✅ Doctor status restored to AVAILABLE`);

    // 8. Reject booking on non-working day
    console.log('Test 8: Reject booking on doctor off-day');
    const offDayRes = await fetch(`${baseUrl}/api/v1/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`
      },
      body: JSON.stringify({
        doctorId,
        appointmentDate: invalidWorkingDate,
        timeSlot: 'MORNING',
        reason: 'Should fail'
      })
    });
    const offDayJson = await offDayRes.json();
    if (offDayRes.status !== 400) {
      throw new Error(`Expected 400 for doctor off day, got ${offDayRes.status}`);
    }
    console.log(`  ✅ Booking rejected on non-working day (400 Bad Request)`);

    // 9. View Appointments with RBAC
    console.log('Test 9: View appointments (RBAC filtered)');
    // Patient 1 sees only their appointment
    const p1ListRes = await fetch(`${baseUrl}/api/v1/appointments`, {
      headers: { Authorization: `Bearer ${patient1Token}` }
    });
    const p1ListJson = await p1ListRes.json();
    if (p1ListJson.data.appointments.length !== 1 || p1ListJson.data.appointments[0].id !== appointment1Id) {
      throw new Error(`Patient 1 view leak: ${JSON.stringify(p1ListJson)}`);
    }
    console.log(`  ✅ Patient 1 views their own appointments only (1 record)`);

    // Doctor sees appointments assigned to them
    const docListRes = await fetch(`${baseUrl}/api/v1/appointments`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    const docListJson = await docListRes.json();
    if (docListJson.data.appointments.length !== 2) {
      throw new Error(`Doctor should see both assigned appointments, got ${docListJson.data.appointments.length}`);
    }
    console.log(`  ✅ Doctor views all appointments assigned to them (2 records)`);

    // Admin sees all
    const adminListRes = await fetch(`${baseUrl}/api/v1/appointments`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminListJson = await adminListRes.json();
    if (adminListJson.data.appointments.length < 2) {
      throw new Error(`Admin should see all appointments`);
    }
    console.log(`  ✅ Admin views all appointments across the hospital`);

    // 10. Doctor Confirms Appointment & Adds Notes
    console.log('Test 10: Doctor confirms appointment and adds clinical notes');
    const confirmRes = await fetch(`${baseUrl}/api/v1/appointments/${appointment1Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        status: 'CONFIRMED',
        notes: 'Confirmed. Patient to bring previous MRI reports.'
      })
    });
    const confirmJson = await confirmRes.json();
    if (confirmRes.status !== 200 || confirmJson.data.status !== 'CONFIRMED') {
      throw new Error(`Doctor confirm failed: ${JSON.stringify(confirmJson)}`);
    }
    console.log(`  ✅ Doctor confirmed appointment: Status: ${confirmJson.data.status}`);

    // 11. Reschedule Appointment
    console.log('Test 11: Patient 2 reschedules appointment to EVENING');
    const reschedRes = await fetch(`${baseUrl}/api/v1/appointments/${appointment2Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient2Token}`
      },
      body: JSON.stringify({
        timeSlot: 'Evening'
      })
    });
    const reschedJson = await reschedRes.json();
    if (reschedRes.status !== 200 || reschedJson.data.timeSlot !== 'EVENING') {
      throw new Error(`Reschedule failed: ${JSON.stringify(reschedJson)}`);
    }
    console.log(`  ✅ Appointment 2 successfully rescheduled to ${reschedJson.data.timeSlot}`);

    // 12. Cancel Appointment
    console.log('Test 12: Patient 1 cancels appointment 1');
    const cancelRes = await fetch(`${baseUrl}/api/v1/appointments/${appointment1Id}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`
      },
      body: JSON.stringify({
        cancellationReason: 'Work conflict on that morning'
      })
    });
    const cancelJson = await cancelRes.json();
    if (cancelRes.status !== 200 || cancelJson.data.status !== 'CANCELLED') {
      throw new Error(`Cancel failed: ${JSON.stringify(cancelJson)}`);
    }
    console.log(`  ✅ Appointment 1 cancelled successfully: Status: ${cancelJson.data.status}`);

    // 13. Re-booking the freed MORNING slot
    console.log('Test 13: Re-book the newly freed MORNING slot');
    const rebookRes = await fetch(`${baseUrl}/api/v1/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient2Token}`
      },
      body: JSON.stringify({
        doctorId,
        appointmentDate: validFutureDate,
        timeSlot: 'MORNING', // Was previously booked, now cancelled!
        reason: 'Taking the opened morning slot'
      })
    });
    const rebookJson = await rebookRes.json();
    if (rebookRes.status !== 201) {
      throw new Error(`Re-booking freed slot failed: ${JSON.stringify(rebookJson)}`);
    }
    console.log(`  ✅ Cancelled slot successfully freed and re-booked by Patient 2: ID ${rebookJson.data.id}`);

    // 14. Doctor Marks Appointment as COMPLETED
    console.log('Test 14: Doctor marks appointment as COMPLETED');
    const completeRes = await fetch(`${baseUrl}/api/v1/appointments/${appointment2Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        status: 'COMPLETED',
        notes: 'Consultation completed. Prescribed sumatriptan and lifestyle changes.'
      })
    });
    const completeJson = await completeRes.json();
    if (completeRes.status !== 200 || completeJson.data.status !== 'COMPLETED') {
      throw new Error(`Complete appointment failed: ${JSON.stringify(completeJson)}`);
    }
    console.log(`  ✅ Appointment marked as COMPLETED`);

    // 15. RBAC security: Patient cannot mark appointment COMPLETED or view unauthorized appointments
    console.log('Test 15: RBAC security verification');
    // Patient attempts to mark appointment COMPLETED
    const patientCompleteRes = await fetch(`${baseUrl}/api/v1/appointments/${appointment2Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`
      },
      body: JSON.stringify({ status: 'COMPLETED' })
    });
    if (patientCompleteRes.status !== 403) {
      throw new Error(`Expected 403 for patient calling status update, got ${patientCompleteRes.status}`);
    }
    console.log('  ✅ Patient blocked from changing appointment status (403 Forbidden)');

    // Patient 1 attempts to view Patient 2's appointment details
    const unauthorizedViewRes = await fetch(`${baseUrl}/api/v1/appointments/${appointment2Id}`, {
      headers: { Authorization: `Bearer ${patient1Token}` }
    });
    if (unauthorizedViewRes.status !== 403) {
      throw new Error(`Expected 403 for viewing another patient's appointment, got ${unauthorizedViewRes.status}`);
    }
    console.log('  ✅ Patient blocked from accessing another patient appointment (403 Forbidden)');

    console.log('\n🎉 ALL 15 APPOINTMENT TEST SUITES PASSED SUCCESSFULLY!');
  } finally {
    // Cleanup created test records
    try {
      if (cleanupUserIds.length > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: cleanupUserIds } }
        });
      }
    } catch (_) {}

    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log('[Test Teardown] Server closed cleanly.');
    }
    await prisma.$disconnect();
  }
};

runTests().catch((err) => {
  console.error('\n❌ Appointment Test Suite Failed with Error:');
  console.error(err);
  process.exit(1);
});
