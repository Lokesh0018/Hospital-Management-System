import http from 'http';
import { app } from '../src/app.js';
import prisma from '../src/database/prisma.js';
import { ROLES } from '../src/constants/roles.js';

let server;
let baseUrl;

const runTests = async () => {
  console.log('🧪 Starting Prescription Module Automated Integration Tests...\n');

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
  let patient1Id = '';
  let patient2Token = '';
  let appointmentId = '';
  let reportId = '';
  let prescriptionId = '';
  const cleanupUserIds = [];

  try {
    // 1. Metadata check
    console.log('Test 1: GET /api/v1/prescriptions/metadata');
    const metaRes = await fetch(`${baseUrl}/api/v1/prescriptions/metadata`);
    const metaJson = await metaRes.json();
    if (metaRes.status !== 200) {
      throw new Error(`Metadata fetch failed: ${JSON.stringify(metaJson)}`);
    }
    const expectedStatuses = ['ACTIVE', 'COMPLETED', 'CANCELLED'];
    for (const s of expectedStatuses) {
      if (!metaJson.data.statuses.includes(s)) {
        throw new Error(`Missing expected status: ${s}`);
      }
    }
    console.log(`  ✅ Returned all 3 statuses: ${metaJson.data.statuses.join(', ')}`);

    // 2. Setup Accounts: Admin, Doctor, and 2 Patients
    console.log('Test 2: Setup Admin, Doctor, and Patient accounts');
    const timestamp = Date.now();

    // Admin
    const adminRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Chief Admin',
        email: `admin_${timestamp}@hospital.test`,
        password: 'AdminPassword123',
        role: ROLES.ADMIN
      })
    });
    const adminJson = await adminRes.json();
    adminToken = adminJson.data.tokens.accessToken;
    cleanupUserIds.push(adminJson.data.user.id);

    // Doctor
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
        department: 'Neurology'
      })
    });
    const docJson = await docRes.json();
    doctorId = docJson.data.id;
    cleanupUserIds.push(doctorId);

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
        name: 'Sarah Connor',
        email: `sarah_${timestamp}@hospital.test`,
        password: 'PatientPassword123',
        role: ROLES.PATIENT
      })
    });
    const p1Json = await p1Res.json();
    patient1Token = p1Json.data.tokens.accessToken;
    patient1Id = p1Json.data.user.id;
    cleanupUserIds.push(patient1Id);

    // Patient 2
    const p2Res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kyle Reese',
        email: `kyle_${timestamp}@hospital.test`,
        password: 'PatientPassword123',
        role: ROLES.PATIENT
      })
    });
    const p2Json = await p2Res.json();
    patient2Token = p2Json.data.tokens.accessToken;
    cleanupUserIds.push(p2Json.data.user.id);

    console.log('  ✅ Admin, Doctor, and Patients initialized successfully');

    // 3. Create optional Appointment and Medical Report for linkage
    console.log('Test 3: Setup optional Appointment and Medical Report for prescription linkage');
    const aptRes = await fetch(`${baseUrl}/api/v1/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`
      },
      body: JSON.stringify({
        doctorId,
        appointmentDate: '2026-10-15',
        timeSlot: 'Morning',
        reason: 'Severe recurring headaches'
      })
    });
    const aptJson = await aptRes.json();
    appointmentId = aptJson.data.id;

    const repRes = await fetch(`${baseUrl}/api/v1/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Brain MRI Report',
        reportType: 'MRI',
        patientId: patient1Id,
        doctorId
      })
    });
    const repJson = await repRes.json();
    reportId = repJson.data.id;

    console.log(`  ✅ Linked Appointment ID: ${appointmentId}`);
    console.log(`  ✅ Linked Report ID: ${reportId}`);

    // 4. Doctor creates prescription for Patient 1
    console.log('Test 4: Doctor creates prescription with multiple medicines and linkages');
    const rxRes = await fetch(`${baseUrl}/api/v1/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        patientId: patient1Id,
        appointmentId,
        reportId,
        diagnosis: 'Acute Migraine with Aura & Cervicalgia',
        instructions: 'Avoid bright screens during attacks. Stay hydrated and get adequate rest.',
        medicines: [
          {
            medicineName: 'Sumatriptan',
            dosage: '50mg',
            frequency: 'At onset of headache',
            duration: 'As needed (max 2 tabs/day)',
            instructions: 'Take with a full glass of water'
          },
          {
            medicineName: 'Naproxen Sodium',
            dosage: '500mg',
            frequency: 'Twice daily',
            duration: '5 days',
            instructions: 'Take immediately after meals'
          },
          {
            medicineName: 'Magnesium Glycinate',
            dosage: '400mg',
            frequency: 'Once daily before sleep',
            duration: '30 days',
            instructions: 'Nightly supplement'
          }
        ]
      })
    });
    const rxJson = await rxRes.json();
    if (rxRes.status !== 201) {
      throw new Error(`Create prescription failed: ${JSON.stringify(rxJson)}`);
    }
    prescriptionId = rxJson.data.id;
    if (
      rxJson.data.status !== 'ACTIVE' ||
      rxJson.data.medicines.length !== 3 ||
      !rxJson.data.patient ||
      !rxJson.data.doctor ||
      !rxJson.data.appointment ||
      !rxJson.data.report
    ) {
      throw new Error(`Prescription attributes mismatch: ${JSON.stringify(rxJson.data)}`);
    }
    console.log(`  ✅ Prescription created successfully with ID: ${prescriptionId}`);
    console.log(`     Diagnosis: "${rxJson.data.diagnosis}"`);
    console.log(`     Status: ${rxJson.data.status}`);
    console.log(`     Patient: ${rxJson.data.patient.name}`);
    console.log(`     Prescribing Doctor: ${rxJson.data.doctor.name}`);
    console.log(`     Medicines Count: ${rxJson.data.medicines.length}`);
    rxJson.data.medicines.forEach((m, idx) => {
      console.log(`       ${idx + 1}. ${m.medicineName} ${m.dosage} - ${m.frequency} for ${m.duration} (${m.instructions})`);
    });

    // 5. Patient views own prescriptions
    console.log('Test 5: Patient views own prescriptions (GET /api/v1/prescriptions/my-prescriptions)');
    const p1RxRes = await fetch(`${baseUrl}/api/v1/prescriptions/my-prescriptions`, {
      headers: { Authorization: `Bearer ${patient1Token}` }
    });
    const p1RxJson = await p1RxRes.json();
    if (p1RxRes.status !== 200 || p1RxJson.data.prescriptions.length !== 1) {
      throw new Error(`Patient my-prescriptions failed: ${JSON.stringify(p1RxJson)}`);
    }
    console.log(`  ✅ Patient fetched their own prescription successfully (1 record)`);

    // 6. Doctor views prescriptions created by them
    console.log('Test 6: Doctor views prescriptions created by them (GET /api/v1/prescriptions/created-by-me)');
    const docRxRes = await fetch(`${baseUrl}/api/v1/prescriptions/created-by-me`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    const docRxJson = await docRxRes.json();
    if (docRxRes.status !== 200 || docRxJson.data.prescriptions.length !== 1) {
      throw new Error(`Doctor created-by-me failed: ${JSON.stringify(docRxJson)}`);
    }
    console.log(`  ✅ Doctor fetched prescriptions created by them (1 record)`);

    // 7. Admin views all prescriptions
    console.log('Test 7: Admin views all prescriptions (GET /api/v1/prescriptions)');
    const adminRxRes = await fetch(`${baseUrl}/api/v1/prescriptions`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminRxJson = await adminRxRes.json();
    if (adminRxRes.status !== 200 || adminRxJson.data.prescriptions.length < 1) {
      throw new Error(`Admin prescriptions fetch failed: ${JSON.stringify(adminRxJson)}`);
    }
    console.log(`  ✅ Admin viewed all hospital prescriptions successfully`);

    // 8. Search and Filter
    console.log('Test 8: Search and Filter Prescriptions');
    const searchRes = await fetch(`${baseUrl}/api/v1/prescriptions?search=Sumatriptan`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const searchJson = await searchRes.json();
    if (searchJson.data.prescriptions.length === 0 || !searchJson.data.prescriptions[0].medicines.some(m => m.medicineName.includes('Sumatriptan'))) {
      throw new Error(`Search by medicine failed: ${JSON.stringify(searchJson)}`);
    }
    console.log(`  ✅ Search by medicine name ('Sumatriptan'): found prescription`);

    // Filter by status ACTIVE
    const filterStatusRes = await fetch(`${baseUrl}/api/v1/prescriptions?status=ACTIVE`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const filterStatusJson = await filterStatusRes.json();
    if (filterStatusJson.data.prescriptions.length === 0) {
      throw new Error(`Filter by status ACTIVE failed`);
    }
    console.log(`  ✅ Filter by status (ACTIVE): found ${filterStatusJson.data.prescriptions.length} prescription(s)`);

    // 9. Doctor updates status to COMPLETED
    console.log('Test 9: Doctor updates prescription status to COMPLETED');
    const statusRes = await fetch(`${baseUrl}/api/v1/prescriptions/${prescriptionId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({ status: 'COMPLETED' })
    });
    const statusJson = await statusRes.json();
    if (statusRes.status !== 200 || statusJson.data.status !== 'COMPLETED') {
      throw new Error(`Status update failed: ${JSON.stringify(statusJson)}`);
    }
    console.log(`  ✅ Prescription status successfully updated to: ${statusJson.data.status}`);

    // 10. Doctor updates prescription details & medicines
    console.log('Test 10: Doctor updates prescription details');
    const updateRes = await fetch(`${baseUrl}/api/v1/prescriptions/${prescriptionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        diagnosis: 'Resolved Migraine - Maintenance Therapy',
        status: 'ACTIVE'
      })
    });
    const updateJson = await updateRes.json();
    if (updateRes.status !== 200 || updateJson.data.diagnosis !== 'Resolved Migraine - Maintenance Therapy') {
      throw new Error(`Update failed: ${JSON.stringify(updateJson)}`);
    }
    console.log(`  ✅ Prescription diagnosis and status updated successfully`);

    // 11. RBAC security enforcement
    console.log('Test 11: RBAC enforcement against unauthorized access');
    // Patient cannot create prescriptions
    const unauthCreateRes = await fetch(`${baseUrl}/api/v1/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`
      },
      body: JSON.stringify({
        patientId: patient1Id,
        diagnosis: 'Self-diagnosed',
        medicines: [{ medicineName: 'Aspirin', dosage: '100mg', frequency: 'Daily', duration: '7d' }]
      })
    });
    if (unauthCreateRes.status !== 403) {
      throw new Error(`Expected 403 for patient creating prescription, got ${unauthCreateRes.status}`);
    }
    console.log('  ✅ Patient blocked from creating prescriptions (403 Forbidden)');

    // Patient 2 cannot view Patient 1's prescription
    const unauthViewRes = await fetch(`${baseUrl}/api/v1/prescriptions/${prescriptionId}`, {
      headers: { Authorization: `Bearer ${patient2Token}` }
    });
    if (unauthViewRes.status !== 403) {
      throw new Error(`Expected 403 for viewing another patient prescription, got ${unauthViewRes.status}`);
    }
    console.log('  ✅ Patient blocked from viewing another patient prescription (403 Forbidden)');

    // 12. Admin deletes prescription
    console.log('Test 12: Admin deletes prescription');
    const deleteRes = await fetch(`${baseUrl}/api/v1/prescriptions/${prescriptionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const deleteJson = await deleteRes.json();
    if (deleteRes.status !== 200) {
      throw new Error(`Delete prescription failed: ${JSON.stringify(deleteJson)}`);
    }
    console.log(`  ✅ Prescription deleted successfully`);

    const notFoundRes = await fetch(`${baseUrl}/api/v1/prescriptions/${prescriptionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (notFoundRes.status !== 404) {
      throw new Error(`Expected 404 for deleted prescription, got ${notFoundRes.status}`);
    }
    console.log(`  ✅ Verified deleted prescription returns 404 Not Found`);

    console.log('\n🎉 ALL 12 PRESCRIPTION TEST SUITES PASSED SUCCESSFULLY!');
  } finally {
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
  console.error('\n❌ Prescription Test Suite Failed with Error:');
  console.error(err);
  process.exit(1);
});
